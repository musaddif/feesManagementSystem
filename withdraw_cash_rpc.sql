-- RPC: withdraw_cash
-- Atomically records an expense and subtracts it from Cash in Hand balance
CREATE OR REPLACE FUNCTION withdraw_cash(
  p_amount NUMERIC,
  p_description TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_current_cash NUMERIC;
  v_summary_id BIGINT;
BEGIN
  -- 1. Get current cash and summary ID
  SELECT id, cash_in_hand INTO v_summary_id, v_current_cash 
  FROM amount_summary 
  LIMIT 1;

  -- 2. Validation
  IF v_summary_id IS NULL THEN
    RETURN jsonb_build_object('success', FALSE, 'message', 'Finance summary record not found.');
  END IF;

  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('success', FALSE, 'message', 'Withdrawal amount must be greater than zero.');
  END IF;

  IF p_amount > v_current_cash THEN
    RETURN jsonb_build_object('success', FALSE, 'message', 'Expense amount cannot exceed Cash In Hand.');
  END IF;

  -- 3. Record the transaction
  INSERT INTO amount_transactions (
    title,
    type,
    amount,
    payment_method,
    created_at
  ) VALUES (
    p_description,
    'expense',
    p_amount,
    'Cash',
    NOW()
  );

  -- 4. Update the summary balances
  UPDATE amount_summary
  SET 
    cash_in_hand = cash_in_hand - p_amount,
    total_amount = total_amount - p_amount
  WHERE id = v_summary_id;

  RETURN jsonb_build_object(
    'success', TRUE,
    'message', 'Expense added successfully.',
    'new_cash_in_hand', (v_current_cash - p_amount)
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', FALSE, 'message', SQLERRM);
END;
$$;
