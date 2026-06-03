-- ============================================================
-- Amount Module V2: Cash in Hand & Updated Balance Logic (Robust Version)
-- ============================================================

-- 1. Update amount_summary table
ALTER TABLE amount_summary
  ADD COLUMN IF NOT EXISTS cash_in_hand NUMERIC DEFAULT 0;

-- Initialize existing NULL values to 0
UPDATE amount_summary SET cash_in_hand = 0 WHERE cash_in_hand IS NULL;

-- 2. Update feeSubmission table to track cash-in-hand posting
ALTER TABLE "feeSubmission"
  ADD COLUMN IF NOT EXISTS posted_cash_amount NUMERIC DEFAULT 0;

-- ============================================================
-- 3. UPDATED RPC: submit_fee_transaction
-- ============================================================
-- Drop old version to avoid overloading ambiguity
DROP FUNCTION IF EXISTS submit_fee_transaction(TEXT, TEXT, NUMERIC, JSONB, TEXT, NUMERIC);

CREATE OR REPLACE FUNCTION submit_fee_transaction(
  p_registration_number TEXT DEFAULT NULL,
  p_inter_student_registration TEXT DEFAULT NULL,
  p_amount NUMERIC DEFAULT 0,
  p_fee_type JSONB DEFAULT '{}'::jsonb,
  p_semester TEXT DEFAULT NULL,
  p_eligible_amount NUMERIC DEFAULT 0,
  p_cash_in_hand_amount NUMERIC DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_fee_id BIGINT;
  v_txn_id UUID;
  v_reg_label TEXT;
BEGIN
  v_reg_label := COALESCE(p_registration_number, p_inter_student_registration, 'Unknown');

  -- Insert fee submission record
  INSERT INTO "feeSubmission" (
    registration_number,
    inter_student_registration,
    amount,
    fee_type,
    semester,
    posted_to_account,
    posted_amount,
    posted_cash_amount
  ) VALUES (
    p_registration_number,
    p_inter_student_registration,
    p_amount,
    p_fee_type,
    p_semester,
    CASE WHEN COALESCE(p_eligible_amount, 0) > 0 THEN TRUE ELSE FALSE END,
    COALESCE(p_eligible_amount, 0),
    COALESCE(p_cash_in_hand_amount, 0)
  )
  RETURNING id INTO v_fee_id;

  -- 1. Handle Total Balance Credit
  IF COALESCE(p_eligible_amount, 0) > 0 THEN
    INSERT INTO amount_transactions (title, type, amount, payment_method, fee_submission_id)
    VALUES ('Fee Credit (Balance) - Reg: ' || v_reg_label, 'income', p_eligible_amount, 'Cash', v_fee_id)
    RETURNING id INTO v_txn_id;

    UPDATE "feeSubmission" SET account_transaction_id = v_txn_id WHERE id = v_fee_id;

    UPDATE amount_summary 
    SET total_amount = COALESCE(total_amount, 0) + p_eligible_amount 
    WHERE id = (SELECT id FROM amount_summary LIMIT 1);
  END IF;

  -- 2. Handle Cash in Hand Credit
  IF COALESCE(p_cash_in_hand_amount, 0) > 0 THEN
    -- Record a transaction for visibility
    INSERT INTO amount_transactions (title, type, amount, payment_method, fee_submission_id)
    VALUES ('Fee Credit (Cash) - Reg: ' || v_reg_label, 'income', p_cash_in_hand_amount, 'Cash', v_fee_id);

    UPDATE amount_summary 
    SET cash_in_hand = COALESCE(cash_in_hand, 0) + p_cash_in_hand_amount 
    WHERE id = (SELECT id FROM amount_summary LIMIT 1);
  END IF;

  RETURN jsonb_build_object(
    'success', TRUE,
    'fee_id', v_fee_id,
    'posted_amount', p_eligible_amount,
    'posted_cash_amount', p_cash_in_hand_amount,
    'message', 'Fee submitted successfully'
  );

EXCEPTION WHEN OTHERS THEN
  RAISE;
END;
$$;


-- ============================================================
-- 4. UPDATED RPC: update_fee_transaction
-- ============================================================
-- Drop old version to avoid overloading ambiguity
DROP FUNCTION IF EXISTS update_fee_transaction(TEXT, TEXT, NUMERIC, JSONB, TEXT, NUMERIC);

CREATE OR REPLACE FUNCTION update_fee_transaction(
  p_registration_number TEXT DEFAULT NULL,
  p_inter_student_registration TEXT DEFAULT NULL,
  p_amount NUMERIC DEFAULT 0,
  p_fee_type JSONB DEFAULT '{}'::jsonb,
  p_semester TEXT DEFAULT NULL,
  p_new_eligible_amount NUMERIC DEFAULT 0,
  p_new_cash_in_hand_amount NUMERIC DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_fee_record RECORD;
  v_old_posted NUMERIC;
  v_old_cash_posted NUMERIC;
  v_delta NUMERIC;
  v_cash_delta NUMERIC;
  v_txn_id UUID;
  v_reg_label TEXT;
BEGIN
  v_reg_label := COALESCE(p_registration_number, p_inter_student_registration, 'Unknown');

  -- Find record
  IF p_registration_number IS NOT NULL THEN
    SELECT id, posted_amount, posted_cash_amount FROM "feeSubmission"
    WHERE registration_number = p_registration_number AND semester = p_semester AND reversed_at IS NULL
    ORDER BY created_at DESC LIMIT 1 INTO v_fee_record;
  ELSE
    SELECT id, posted_amount, posted_cash_amount FROM "feeSubmission"
    WHERE inter_student_registration = p_inter_student_registration AND semester = p_semester AND reversed_at IS NULL
    ORDER BY created_at DESC LIMIT 1 INTO v_fee_record;
  END IF;

  IF v_fee_record IS NULL THEN
    RETURN jsonb_build_object('success', FALSE, 'message', 'No fee record found');
  END IF;

  v_old_posted := COALESCE(v_fee_record.posted_amount, 0);
  v_old_cash_posted := COALESCE(v_fee_record.posted_cash_amount, 0);
  
  v_delta := COALESCE(p_new_eligible_amount, 0) - v_old_posted;
  v_cash_delta := COALESCE(p_new_cash_in_hand_amount, 0) - v_old_cash_posted;

  -- Update record
  UPDATE "feeSubmission" SET
    amount = p_amount,
    fee_type = p_fee_type,
    posted_amount = COALESCE(p_new_eligible_amount, 0),
    posted_cash_amount = COALESCE(p_new_cash_in_hand_amount, 0),
    posted_to_account = CASE WHEN COALESCE(p_new_eligible_amount, 0) > 0 THEN TRUE ELSE FALSE END
  WHERE id = v_fee_record.id;

  -- Adjust Total Balance
  IF v_delta != 0 THEN
    INSERT INTO amount_transactions (title, type, amount, payment_method, fee_submission_id)
    VALUES ('Fee Update (Balance) - Reg: ' || v_reg_label, CASE WHEN v_delta > 0 THEN 'income' ELSE 'expense' END, ABS(v_delta), 'Cash', v_fee_record.id)
    RETURNING id INTO v_txn_id;

    UPDATE amount_summary 
    SET total_amount = COALESCE(total_amount, 0) + v_delta 
    WHERE id = (SELECT id FROM amount_summary LIMIT 1);
    
    UPDATE "feeSubmission" SET account_transaction_id = v_txn_id WHERE id = v_fee_record.id;
  END IF;

  -- Adjust Cash in Hand
  IF v_cash_delta != 0 THEN
    INSERT INTO amount_transactions (title, type, amount, payment_method, fee_submission_id)
    VALUES ('Fee Update (Cash) - Reg: ' || v_reg_label, CASE WHEN v_cash_delta > 0 THEN 'income' ELSE 'expense' END, ABS(v_cash_delta), 'Cash', v_fee_record.id);

    UPDATE amount_summary 
    SET cash_in_hand = COALESCE(cash_in_hand, 0) + v_cash_delta 
    WHERE id = (SELECT id FROM amount_summary LIMIT 1);
  END IF;

  RETURN jsonb_build_object(
    'success', TRUE,
    'delta', v_delta,
    'cash_delta', v_cash_delta,
    'message', 'Fee updated successfully'
  );
END;
$$;


-- ============================================================
-- 5. UPDATED RPC: unsubmit_fee_transaction
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
  v_cash_posted NUMERIC;
  v_reg_label TEXT;
BEGIN
  v_reg_label := COALESCE(p_registration_number, p_inter_student_registration, 'Unknown');

  -- Find record
  IF p_registration_number IS NOT NULL THEN
    SELECT id, posted_amount, posted_cash_amount FROM "feeSubmission"
    WHERE registration_number = p_registration_number AND semester = p_semester AND reversed_at IS NULL
    ORDER BY created_at DESC LIMIT 1 INTO v_fee_record;
  ELSE
    SELECT id, posted_amount, posted_cash_amount FROM "feeSubmission"
    WHERE inter_student_registration = p_inter_student_registration AND semester = p_semester AND reversed_at IS NULL
    ORDER BY created_at DESC LIMIT 1 INTO v_fee_record;
  END IF;

  IF v_fee_record IS NULL THEN
    RETURN jsonb_build_object('success', FALSE, 'message', 'No fee record found');
  END IF;

  v_posted := COALESCE(v_fee_record.posted_amount, 0);
  v_cash_posted := COALESCE(v_fee_record.posted_cash_amount, 0);

  -- Reverse Total Balance
  IF v_posted > 0 THEN
    INSERT INTO amount_transactions (title, type, amount, payment_method, fee_submission_id)
    VALUES ('Fee Reverse (Balance) - Reg: ' || v_reg_label, 'expense', v_posted, 'Cash', v_fee_record.id);
    
    UPDATE amount_summary SET total_amount = COALESCE(total_amount, 0) - v_posted WHERE id = (SELECT id FROM amount_summary LIMIT 1);
  END IF;

  -- Reverse Cash in Hand
  IF v_cash_posted > 0 THEN
    INSERT INTO amount_transactions (title, type, amount, payment_method, fee_submission_id)
    VALUES ('Fee Reverse (Cash) - Reg: ' || v_reg_label, 'expense', v_cash_posted, 'Cash', v_fee_record.id);

    UPDATE amount_summary SET cash_in_hand = COALESCE(cash_in_hand, 0) - v_cash_posted WHERE id = (SELECT id FROM amount_summary LIMIT 1);
  END IF;

  -- Update fee record to mark as unsubmitted/reversed (Restoring original project logic)
  UPDATE "feeSubmission"
  SET 
    posted_to_account = FALSE,
    reversed_at = NOW(),
    account_transaction_id = NULL
  WHERE id = v_fee_record.id;

  RETURN jsonb_build_object('success', TRUE, 'message', 'Fee unsubmitted and both balances reversed');
END;
$$;
