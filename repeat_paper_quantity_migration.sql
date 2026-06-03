-- Migration to upgrade Repeat Paper Fee to quantity-based
-- 1. Add repeat_paper_count column
ALTER TABLE "feeSubmission" ADD COLUMN IF NOT EXISTS repeat_paper_count INTEGER DEFAULT 0;

-- 2. Update repeat_paper_fee column type from BOOLEAN to NUMERIC if needed
-- Note: In PostgreSQL, changing BOOLEAN to NUMERIC requires an explicit cast.
-- We'll also ensure it stores the actual calculated amount.
-- However, existing data might be 'true'/'false'. We'll migrate them to 0 or base fee.
DO $$ 
BEGIN 
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'feeSubmission' AND column_name = 'repeat_paper_fee' AND data_type = 'boolean'
    ) THEN
        -- Drop default first to prevent cast error during type change
        ALTER TABLE "feeSubmission" ALTER COLUMN repeat_paper_fee DROP DEFAULT;
        ALTER TABLE "feeSubmission" ALTER COLUMN repeat_paper_fee TYPE NUMERIC USING (CASE WHEN repeat_paper_fee IS TRUE THEN 1 ELSE 0 END);
        ALTER TABLE "feeSubmission" ALTER COLUMN repeat_paper_fee SET DEFAULT 0;
    END IF;
END $$;

-- 3. Update RPC: submit_fee_transaction
CREATE OR REPLACE FUNCTION submit_fee_transaction(
  p_registration_number TEXT DEFAULT NULL,
  p_inter_student_registration TEXT DEFAULT NULL,
  p_amount NUMERIC DEFAULT 0,
  p_fee_type JSONB DEFAULT '{}'::jsonb,
  p_semester TEXT DEFAULT NULL,
  p_eligible_amount NUMERIC DEFAULT 0,
  p_cash_in_hand_amount NUMERIC DEFAULT 0,
  p_repeat_paper_count INTEGER DEFAULT 0
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
    posted_cash_amount,
    repeat_paper_count,
    repeat_paper_fee
  ) VALUES (
    p_registration_number,
    p_inter_student_registration,
    p_amount,
    p_fee_type,
    p_semester,
    CASE WHEN COALESCE(p_eligible_amount, 0) > 0 THEN TRUE ELSE FALSE END,
    COALESCE(p_eligible_amount, 0),
    COALESCE(p_cash_in_hand_amount, 0),
    p_repeat_paper_count,
    COALESCE((p_fee_type->>'repeat_paper_fee')::NUMERIC, 0)
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
    INSERT INTO amount_transactions (title, type, amount, payment_method, fee_submission_id)
    VALUES ('Fee Credit (Cash) - Reg: ' || v_reg_label, 'income', p_cash_in_hand_amount, 'Cash', v_fee_id);

    UPDATE amount_summary 
    SET cash_in_hand = COALESCE(cash_in_hand, 0) + p_cash_in_hand_amount 
    WHERE id = (SELECT id FROM amount_summary LIMIT 1);
  END IF;

  RETURN jsonb_build_object(
    'success', TRUE,
    'fee_id', v_fee_id,
    'message', 'Fee submitted successfully'
  );

EXCEPTION WHEN OTHERS THEN
  RAISE;
END;
$$;

-- 4. Update RPC: update_fee_transaction
CREATE OR REPLACE FUNCTION update_fee_transaction(
  p_registration_number TEXT DEFAULT NULL,
  p_inter_student_registration TEXT DEFAULT NULL,
  p_amount NUMERIC DEFAULT 0,
  p_fee_type JSONB DEFAULT '{}'::jsonb,
  p_semester TEXT DEFAULT NULL,
  p_new_eligible_amount NUMERIC DEFAULT 0,
  p_new_cash_in_hand_amount NUMERIC DEFAULT 0,
  p_repeat_paper_count INTEGER DEFAULT 0
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
    repeat_paper_count = p_repeat_paper_count,
    repeat_paper_fee = COALESCE((p_fee_type->>'repeat_paper_fee')::NUMERIC, 0),
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

  RETURN jsonb_build_object('success', TRUE, 'message', 'Fee updated successfully');
END;
$$;
