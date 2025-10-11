import { createSlice } from "@reduxjs/toolkit";
const initialState = {
  department: [],
};
export const commonSlice = createSlice({
  name: "common",
  initialState,
  reducers: {
    department: (state, action) => ({
      ...state,
      department: action.payload,
    }),
  },
});

export const { department } = commonSlice.actions;
export default commonSlice.reducer;
