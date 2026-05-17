import { createAsyncThunk } from "@reduxjs/toolkit";
import { supabase } from "../../supabaseClient";
import { setTotalAmount, setCashInHand, setTransactions, setLoading, setError } from "../slices/amountSlice";

export const fetchTotalAmount = createAsyncThunk(
  "amount/fetchTotalAmount",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));

      // 1. Fetch fee submissions dynamically
      const { data: fees, error: feesError } = await supabase
        .from("feeSubmission")
        .select("posted_amount, posted_cash_amount")
        .is("reversed_at", null);

      if (feesError) throw feesError;

      // 2. Fetch all manual transactions dynamically
      const { data: txs, error: txError } = await supabase
        .from("amount_transactions")
        .select("type, amount, title")
        .is("fee_submission_id", null);

      if (txError) throw txError;

      let calculatedTotalBalance = 0;
      let calculatedCashInHand = 0;

      // Add Fees
      fees.forEach(fee => {
        calculatedTotalBalance += (Number(fee.posted_amount) || 0);
        calculatedCashInHand += (Number(fee.posted_cash_amount) || 0);
      });

      // Add Manual Transactions
      txs.forEach(tx => {
        const amt = Number(tx.amount) || 0;
        if (tx.type === "income") {
          // Manual income increases Total Balance (Add Money)
          calculatedTotalBalance += amt;
        } else if (tx.type === "expense") {
          // Identify Withdrawals (Deposit Cash to University Account) vs normal Expenses
          if (tx.title.startsWith("[WITHDRAW_CASH]")) {
            calculatedCashInHand -= amt;
          } else if (tx.title.startsWith("[EXPENSE]")) {
            calculatedTotalBalance -= amt;
          } else {
            // Fallback for old expense records (if any)
            calculatedTotalBalance -= amt;
          }
        }
      });

      dispatch(setTotalAmount(calculatedTotalBalance));
      dispatch(setCashInHand(calculatedCashInHand));
      return { total_amount: calculatedTotalBalance, cash_in_hand: calculatedCashInHand };
    } catch (err) {
      dispatch(setError(err.message));
      return rejectWithValue(err.message);
    } finally {
      dispatch(setLoading(false));
    }
  }
);

export const fetchTransactions = createAsyncThunk(
  "amount/fetchTransactions",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));
      const { data, error } = await supabase
        .from("amount_transactions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      dispatch(setTransactions(data));
      return data;
    } catch (err) {
      dispatch(setError(err.message));
      return rejectWithValue(err.message);
    } finally {
      dispatch(setLoading(false));
    }
  }
);

export const addMoneyThunk = createAsyncThunk(
  "amount/addMoney",
  async (amountData, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));
      const { error } = await supabase.from("amount_transactions").insert({
        title: amountData.title,
        type: "income",
        amount: amountData.amount,
        payment_method: amountData.paymentMethod,
        cheque_number: amountData.chequeNumber || null,
        wallet_name: amountData.walletName || null,
        wallet_number: amountData.walletNumber || null,
      });

      if (error) throw error;

      dispatch(fetchTotalAmount());
      dispatch(fetchTransactions());
      return { success: true };
    } catch (err) {
      dispatch(setError(err.message));
      return rejectWithValue(err.message);
    } finally {
      dispatch(setLoading(false));
    }
  }
);

export const addExpenseThunk = createAsyncThunk(
  "amount/addExpense",
  async (amountData, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));
      const { error } = await supabase.from("amount_transactions").insert({
        title: "" + amountData.title,
        type: "expense",
        amount: amountData.amount,
        payment_method: amountData.paymentMethod,
        cheque_number: amountData.chequeNumber || null,
        wallet_name: amountData.walletName || null,
        wallet_number: amountData.walletNumber || null,
      });

      if (error) throw error;

      dispatch(fetchTotalAmount());
      dispatch(fetchTransactions());
      return { success: true };
    } catch (err) {
      dispatch(setError(err.message));
      return rejectWithValue(err.message);
    } finally {
      dispatch(setLoading(false));
    }
  }
);

export const withdrawCashThunk = createAsyncThunk(
  "amount/withdrawCash",
  async ({ amount, description }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));
      const { error } = await supabase.from("amount_transactions").insert({
        title: "" + description,
        type: "expense",
        amount: amount,
        payment_method: "Cash",
      });

      if (error) throw error;

      dispatch(fetchTotalAmount());
      dispatch(fetchTransactions());
      return { success: true };
    } catch (err) {
      dispatch(setError(err.message));
      return rejectWithValue(err.message);
    } finally {
      dispatch(setLoading(false));
    }
  }
);
