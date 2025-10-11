import { createSlice } from "@reduxjs/toolkit";
const initialState = {};
export const authSlice = createSlice({
  name: "authUser",
  initialState,
  reducers: {
    getLogIn: (state, action) => ({}),
  },
});

export const { getLogIn } = authSlice.actions;
export default authSlice.reducer;
