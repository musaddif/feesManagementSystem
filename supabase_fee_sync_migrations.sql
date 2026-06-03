-- ============================================================
-- Fee Submission ↔ Amount Management Sync Migrations
-- Run this entire file in your Supabase SQL Editor
-- ============================================================

-- 1. Add tracking columns to feeSubmission table
-- These columns track what has been posted to the account
ALTER TABLE "feeSubmission"
  ADD COLUMN IF NOT EXISTS posted_to_account BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS posted_amount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS account_transaction_id UUID DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS reversed_at TIMESTAMPTZ DEFAULT NULL;


-- ============================================================
-- 2. RPC: submit_fee_transaction
--    Atomically inserts a fee record + credits eligible amount
-- ============================================================
CREATE OR REPLACE FUNCTION submit_fee_transaction(
  p_registration_number TEXT DEFAULT NULL,
  p_inter_student_registration TEXT DEFAULT NULL,
  p_amount NUMERIC DEFAULT 0,
  p_fee_type JSONB DEFAULT '{}'::jsonb,
  p_semester TEXT DEFAULT NULL,
  p_eligible_amount NUMERIC DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_fee_id BIGINT;
  v_txn_id UUID;
  v_reg_label TEXT;
BEGIN
  -- Determine label for transaction log
  v_reg_label := COALESCE(p_registration_number, p_inter_student_registration, 'Unknown');

  -- Insert fee submission record
  INSERT INTO "feeSubmission" (
    registration_number,
    inter_student_registration,
    amount,
    fee_type,
    semester,
    posted_to_account,
    posted_amount
  ) VALUES (
    p_registration_number,
    p_inter_student_registration,
    p_amount,
    p_fee_type,
    p_semester,
    CASE WHEN p_eligible_amount > 0 THEN TRUE ELSE FALSE END,
    p_eligible_amount
  )
  RETURNING id INTO v_fee_id;

  -- If there is an eligible amount, credit the account
  IF p_eligible_amount > 0 THEN
    -- Insert income transaction
    INSERT INTO amount_transactions (
      title,
      type,
      amount,
      payment_method,
      fee_submission_id
    ) VALUES (
      'Fee Submission Credit - Reg: ' || v_reg_label,
      'income',
      p_eligible_amount,
      'Cash',
      v_fee_id
    )
    RETURNING id INTO v_txn_id;

    -- Update the fee record with the transaction reference
    UPDATE "feeSubmission"
    SET account_transaction_id = v_txn_id
    WHERE id = v_fee_id;

    -- Increase total balance
    UPDATE amount_summary
    SET total_amount = total_amount + p_eligible_amount
    WHERE id = (SELECT id FROM amount_summary LIMIT 1);
  END IF;

  RETURN jsonb_build_object(
    'success', TRUE,
    'fee_id', v_fee_id,
    'posted_amount', p_eligible_amount,
    'message', 'Fee submitted successfully'
  );

EXCEPTION WHEN OTHERS THEN
  RAISE;
END;
$$;


-- ============================================================
-- 3. RPC: update_fee_transaction
--    Atomically updates fee record + adjusts balance by delta
-- ============================================================
CREATE OR REPLACE FUNCTION update_fee_transaction(
  p_registration_number TEXT DEFAULT NULL,
  p_inter_student_registration TEXT DEFAULT NULL,
  p_amount NUMERIC DEFAULT 0,
  p_fee_type JSONB DEFAULT '{}'::jsonb,
  p_semester TEXT DEFAULT NULL,
  p_new_eligible_amount NUMERIC DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_fee_record RECORD;
  v_old_posted NUMERIC;
  v_delta NUMERIC;
  v_txn_id UUID;
  v_reg_label TEXT;
  v_txn_title TEXT;
  v_txn_type TEXT;
BEGIN
  v_reg_label := COALESCE(p_registration_number, p_inter_student_registration, 'Unknown');

  -- Find the existing fee record
  IF p_registration_number IS NOT NULL THEN
    SELECT id, posted_amount, posted_to_account
    INTO v_fee_record
    FROM "feeSubmission"
    WHERE registration_number = p_registration_number
      AND semester = p_semester
      AND reversed_at IS NULL
    ORDER BY created_at DESC
    LIMIT 1;
  ELSE
    SELECT id, posted_amount, posted_to_account
    INTO v_fee_record
    FROM "feeSubmission"
    WHERE inter_student_registration = p_inter_student_registration
      AND semester = p_semester
      AND reversed_at IS NULL
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;

  IF v_fee_record IS NULL THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'message', 'No fee record found to update'
    );
  END IF;

  -- Calculate delta
  v_old_posted := COALESCE(v_fee_record.posted_amount, 0);
  v_delta := p_new_eligible_amount - v_old_posted;

  -- Update the fee record
  UPDATE "feeSubmission"
  SET
    amount = p_amount,
    fee_type = p_fee_type,
    posted_amount = p_new_eligible_amount,
    posted_to_account = CASE WHEN p_new_eligible_amount > 0 THEN TRUE ELSE FALSE END
  WHERE id = v_fee_record.id;

  -- If there's a delta, adjust the balance
  IF v_delta != 0 THEN
    IF v_delta > 0 THEN
      v_txn_title := 'Fee Update Credit - Reg: ' || v_reg_label;
      v_txn_type := 'income';
    ELSE
      v_txn_title := 'Fee Update Adjustment - Reg: ' || v_reg_label;
      v_txn_type := 'expense';
    END IF;

    INSERT INTO amount_transactions (
      title,
      type,
      amount,
      payment_method,
      fee_submission_id
    ) VALUES (
      v_txn_title,
      v_txn_type,
      ABS(v_delta),
      'Cash',
      v_fee_record.id
    )
    RETURNING id INTO v_txn_id;

    -- Update balance
    UPDATE amount_summary
    SET total_amount = total_amount + v_delta
    WHERE id = (SELECT id FROM amount_summary LIMIT 1);

    -- Update fee record with latest transaction id
    UPDATE "feeSubmission"
    SET account_transaction_id = v_txn_id
    WHERE id = v_fee_record.id;
  END IF;

  RETURN jsonb_build_object(
    'success', TRUE,
    'fee_id', v_fee_record.id,
    'delta', v_delta,
    'new_posted_amount', p_new_eligible_amount,
    'message', 'Fee updated successfully'
  );

EXCEPTION WHEN OTHERS THEN
  RAISE;
END;
$$;


-- ============================================================
-- 4. RPC: unsubmit_fee_transaction
--    Atomically marks fee as unsubmitted + reverses balance
-- ============================================================
CREATE OR REPLACE FUNCTION unsubmit_fee_transaction(
  p_registration_number TEXT DEFAULT NULL,
  p_inter_student_registration TEXT DEFAULT NULL,
  p_semester TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_fee_record RECORD;
  v_posted NUMERIC;
  v_txn_id UUID;
  v_reg_label TEXT;
BEGIN
  v_reg_label := COALESCE(p_registration_number, p_inter_student_registration, 'Unknown');

  -- Find the existing fee record
  IF p_registration_number IS NOT NULL THEN
    SELECT id, posted_amount, posted_to_account, reversed_at
    INTO v_fee_record
    FROM "feeSubmission"
    WHERE registration_number = p_registration_number
      AND semester = p_semester
      AND reversed_at IS NULL
    ORDER BY created_at DESC
    LIMIT 1;
  ELSE
    SELECT id, posted_amount, posted_to_account, reversed_at
    INTO v_fee_record
    FROM "feeSubmission"
    WHERE inter_student_registration = p_inter_student_registration
      AND semester = p_semester
      AND reversed_at IS NULL
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;

  IF v_fee_record IS NULL THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'message', 'No fee record found or already reversed'
    );
  END IF;

  -- Prevent duplicate reversal
  IF v_fee_record.reversed_at IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'message', 'Fee already reversed / unsubmitted'
    );
  END IF;

  v_posted := COALESCE(v_fee_record.posted_amount, 0);

  -- If amount was posted, reverse it
  IF v_posted > 0 THEN
    INSERT INTO amount_transactions (
      title,
      type,
      amount,
      payment_method,
      fee_submission_id
    ) VALUES (
      'Fee Reversal / Unsubmit - Reg: ' || v_reg_label,
      'expense',
      v_posted,
      'Cash',
      v_fee_record.id
    )
    RETURNING id INTO v_txn_id;

    -- Subtract from balance
    UPDATE amount_summary
    SET total_amount = total_amount - v_posted
    WHERE id = (SELECT id FROM amount_summary LIMIT 1);
  END IF;

  -- Mark fee as unsubmitted / reversed
  DELETE FROM "feeSubmission" WHERE id = v_fee_record.id;

  RETURN jsonb_build_object(
    'success', TRUE,
    'fee_id', v_fee_record.id,
    'reversed_amount', v_posted,
    'message', 'Fee unsubmitted and balance reversed successfully'
  );

EXCEPTION WHEN OTHERS THEN
  RAISE;
END;
$$;


-- ============================================================
-- 5. Add fee_submission_id column to amount_transactions
--    for referencing back to the fee record
-- ============================================================
ALTER TABLE amount_transactions
  ADD COLUMN IF NOT EXISTS fee_submission_id BIGINT DEFAULT NULL;
