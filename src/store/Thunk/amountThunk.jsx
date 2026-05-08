import { createAsyncThunk } from "@reduxjs/toolkit";
import { supabase } from "../../supabaseClient";
import { setTotalAmount, setTransactions, setLoading, setError } from "../slices/amountSlice";

export const fetchTotalAmount = createAsyncThunk(
  "amount/fetchTotalAmount",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));
      const { data, error } = await supabase
        .from("amount_summary")
        .select("total_amount")
        .single();

      if (error) throw error;
      dispatch(setTotalAmount(data.total_amount));
      return data.total_amount;
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
      const { error } = await supabase.rpc("add_money", {
        p_title: amountData.title,
        p_amount: amountData.amount,
        p_payment_method: amountData.paymentMethod,
        p_cheque_number: amountData.chequeNumber || null,
        p_wallet_name: amountData.walletName || null,
        p_wallet_number: amountData.walletNumber || null,
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
      const { error } = await supabase.rpc("add_expense", {
        p_title: amountData.title,
        p_amount: amountData.amount,
        p_payment_method: amountData.paymentMethod,
        p_cheque_number: amountData.chequeNumber || null,
        p_wallet_name: amountData.walletName || null,
        p_wallet_number: amountData.walletNumber || null,
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
