import { createSlice } from "@reduxjs/toolkit";
const initialState = {
  department: [],
  fees: [],
};
export const commonSlice = createSlice({
  name: "common",
  initialState,
  reducers: {
    department: (state, action) => ({
      ...state,
      department: action.payload,
    }),
    feeSlice: (state, action) => ({
      ...state,
      fees: action.payload,
    }),
  },
});

export const { department, feeSlice } = commonSlice.actions;
export default commonSlice.reducer;
