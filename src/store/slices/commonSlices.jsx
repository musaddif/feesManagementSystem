import { createSlice } from "@reduxjs/toolkit";
const initialState = {
  department: [],
  fees: [],
  fee_submission: [],
  addStudentList: [],
  getAllStudent: [],
  getFee: [],
  interDepartments: [],
  getAllInterStudent: [],
  financeReport: [],
  reportData: [],
  loading: false,
  error: null,
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
    getInterStudentList: (state, action) => ({
      ...state,
      getAllInterStudent: action.payload,
    }),
    getFeeSlice: (state, action) => ({
      ...state,
      getFee: action.payload,
    }),
    interDeprt: (state, action) => ({
      ...state,
      interDepartments: action.payload,
    }),
    report: (state, action) => ({
      ...state,
      financeReport: action.payload,
    }),
    setReportData: (state, action) => ({
      ...state,
      reportData: action.payload,
    }),
    setLoading: (state, action) => ({
      ...state,
      loading: action.payload,
    }),
    setError: (state, action) => ({
      ...state,
      error: action.payload,
    }),
  },
});

export const {
  department,
  report,
  feeSlice,
  getInterStudentList,
  feeSubmissionSlice,
  addStudents,
  getstudentList,
  getFeeSlice,
  interDeprt,
  setReportData,
  setLoading,
  setError,
} = commonSlice.actions;
export default commonSlice.reducer;
