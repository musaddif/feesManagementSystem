import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { supabase } from "../../supabaseClient";
import { department } from "../slices/commonSlices";

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
