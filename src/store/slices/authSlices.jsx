import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  session: null,
  loading: false,
  error: null,
};

export const authSlice = createSlice({
  name: "authUser",
  initialState,
  reducers: {
    getLogIn: (state, action) => {
      state.session = action.payload;
      state.error = null;
    },

    logout: (state) => {
      state.session = null;
      state.error = null;
    },

    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const { getLogIn, logout, setError } = authSlice.actions;
export default authSlice.reducer;
