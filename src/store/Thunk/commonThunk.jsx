import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { supabase } from "../../supabaseClient";
import { department, feeSlice } from "../slices/commonSlices";

export const allDepartments = createAsyncThunk(
  "allDepartments",
  async (_request, { dispatch }) => {
    try {
      //   const response = await axios.get("/room");
      const { data, error } = await supabase.from("department").select("*");
      // console.log("BE data = ", data);
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
