import { createSlice } from "@reduxjs/toolkit";
const initialState = {
  department: [],
  fees: [],
  fee_submission: [],
  addStudentList: [],
  getAllStudent: [],
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
    feeSubmissionSlice: (state, action) => ({
      ...state,
      fee_submission: action.payload,
    }),
    addStudents: (state, action) => ({
      ...state,
      addStudentList: action.payload,
    }),
    getstudentList: (state, action) => ({
      ...state,
      getAllStudent: action.payload,
    }),
  },
});

export const {
  department,
  feeSlice,
  feeSubmissionSlice,
  addStudents,
  getstudentList,
} = commonSlice.actions;
export default commonSlice.reducer;
