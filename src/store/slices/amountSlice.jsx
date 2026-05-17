import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  totalAmount: 0,
  cashInHand: 0,
  transactions: [],
  loading: false,
  error: null,
};

export const amountSlice = createSlice({
  name: "amount",
  initialState,
  reducers: {
    setTotalAmount: (state, action) => {
      state.totalAmount = action.payload;
    },
    setCashInHand: (state, action) => {
      state.cashInHand = action.payload;
    },
    setTransactions: (state, action) => {
      state.transactions = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const { setTotalAmount, setCashInHand, setTransactions, setLoading, setError } = amountSlice.actions;
export default amountSlice.reducer;
