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
  async (_, { rejectWithValue, dispatch }) => {
    try {
      // Method 1: Clear persisted store (Recommended)
      dispatch({ type: 'persist/PERSIST', payload: null });

      // Method 2: Manually clear localStorage/sessionStorage
      localStorage.removeItem('persist:auth');  // Removes persisted auth data


      // Method 3: Purge all persisted state (if you want complete reset)
      // await persistor.purge(); // You'll need access to persistor

      // Clear any other auth data
      sessionStorage.clear();

      return { success: true, message: "Logged out successfully" };
    } catch (err) {
      return rejectWithValue(
        err.message || "An unknown error occurred during logout."
      );
    }
  }
);
