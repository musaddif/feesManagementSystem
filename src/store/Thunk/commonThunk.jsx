import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { supabase } from "../../supabaseClient";
import {
  department,
  feeSlice,
  feeSubmissionSlice,
  addStudents,
  getstudentList,
} from "../slices/commonSlices";
import { feesTypes } from "../../constant/lists";

export const allDepartments = createAsyncThunk(
  "allDepartments",
  async (_request, { dispatch }) => {
    try {
      const { data, error } = await supabase.from("department").select("*");
      dispatch(department(data));
    } catch (err) {
      console.log("error", err);
    }
  }
);

export const getFees = createAsyncThunk(
  "getFees",
  async (_request, { dispatch }) => {
    // console.log("request", _request.id);

    try {
      const { data, error } = await supabase
        .from("fees")
        .select("*")
        .eq("department_id", _request.id);
      if (error) throw error;
      dispatch(feeSlice(data));
    } catch (err) {
      console.log("error", err);
    }
  }
);

export const submitFees = createAsyncThunk(
  "submitFees",
  async (feeData, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from("feeSubmission")
        .insert([
          {
            amount: feeData?.totalFee,
            fee_type: feeData?.checkedItems,
          },
        ])
        .select();

      if (error) {
        console.error("Insertion error:", error);
        throw error;
      }
      return {
        success: true,
        data: data[0],
        message: "Fees submitted successfully",
      };
    } catch (err) {
      console.error("Error in submitFees:", err);
      return rejectWithValue({
        success: false,
        error: err.message,
        message: "Failed to submit fees",
      });
    }
  }
);

export const studentList = createAsyncThunk(
  "studentList",
  async (list, { dispatch, rejectWithValue }) => {
    try {
      // console.log("list", list);

      const { data, error } = await supabase
        .from("student")
        .insert(
          list.map((item) => ({
            first_name: item.first_name,
            last_name: item.last_name,
            semester: item.semester,
            student_rollno: item.Rollno,
            department_id: item.department_id,
          }))
        )
        .select();

      if (error) {
        return rejectWithValue(error.message);
      }
      dispatch(addStudents(data));
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);
export const getAllStudents = createAsyncThunk(
  "getAllStudents",
  async (_request, { dispatch }) => {
    try {
      const { data, error } = await supabase
        .from("student")
        .select(
          "first_name,last_name, semester,student_rollno,created_at,department_id,department(department_name)"
        )
        .eq("department_id", _request.id);

      if (error) {
        return rejectWithValue(error.message);
      }
      dispatch(getstudentList(data));
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
    //
  }
);
