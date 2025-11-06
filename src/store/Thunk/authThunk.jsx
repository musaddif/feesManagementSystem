import { createAsyncThunk } from "@reduxjs/toolkit";

import { supabase } from "../../supabaseClient";
import { getLogIn, logout } from "../slices/authSlices";

export const login = createAsyncThunk(
  "login",
  async ({ email, password }, { dispatch, rejectWithValue }) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return rejectWithValue(error.message);
      }

      dispatch(getLogIn(data));

      return data.session;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);
export const auth_logout = createAsyncThunk(
  "auth_logout",
  async (_, { rejectWithValue }) => {
    try {
      return true;
    } catch (err) {
      return rejectWithValue(
        err.message || "An unknown error occurred during logout."
      );
    }
  }
);
