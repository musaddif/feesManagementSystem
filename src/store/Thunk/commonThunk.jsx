import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { supabase } from "../../supabaseClient";
import { fetchTotalAmount, fetchTransactions } from "./amountThunk";
import {
  department,
  feeSlice,
  feeSubmissionSlice,
  addStudents,
  getstudentList,
  getFeeSlice,
  interDeprt,
  getInterStudentList,
  report,
  setReportData,
  setLoading,
  setError,
} from "../slices/commonSlices";
import { feesTypes, semester } from "../../constant/lists";

export const allDepartments = createAsyncThunk(
  "allDepartments",
  async (_request, { dispatch }) => {
    try {
      dispatch(setLoading(true));
      const { data, error } = await supabase.from("department").select("*");
      if (error) throw error;
      dispatch(department(data));
    } catch (err) {
      console.log("error", err);
      dispatch(setError(err.message));
    } finally {
      dispatch(setLoading(false));
    }
  },
);

export const getFees = createAsyncThunk(
  "getFees",
  async (_request, { dispatch }) => {
    try {
      dispatch(setLoading(true));
      const { data, error } = await supabase
        .from("fees")
        .select("*")
        .eq("department_name", _request?.department_name);
      if (error) throw error;
      dispatch(feeSlice(data));
    } catch (err) {
      console.log("error", err);
      dispatch(setError(err.message));
    } finally {
      dispatch(setLoading(false));
    }
  },
);
export const getIntermadiateFees = createAsyncThunk(
  "getFees",
  async (_request, { dispatch }) => {
    // console.log("request", _request?.department_name);

    try {
      dispatch(setLoading(true));
      const { data, error } = await supabase
        .from("fees")
        .select("*")
        .eq("class_name", _request?.class_name);
      if (error) throw error;
      dispatch(feeSlice(data));
      // dispatch(interFeeSlice(data));
    } catch (err) {
      console.log("error", err);
      dispatch(setError(err.message));
    } finally {
      dispatch(setLoading(false));
    }
  },
);
export const submitFees = createAsyncThunk(
  "submitFees",

  async (feeData, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));
      const { data, error } = await supabase.rpc("submit_fee_transaction", {
        p_registration_number: feeData?.registrationNumber,
        p_inter_student_registration: null,
        p_amount: feeData?.totalFee,
        p_fee_type: feeData?.checkedItems,
        p_semester: feeData?.studentSemester,
        p_eligible_amount: feeData?.eligibleAmount || 0,
        p_cash_in_hand_amount: feeData?.cashInHandAmount || 0,
      });

      if (error) {
        console.error("RPC error:", error);
        throw error;
      }

      // Refresh amount module data
      dispatch(fetchTotalAmount());
      dispatch(fetchTransactions());

      return {
        success: true,
        data: data,
        message: "Fees submitted successfully",
      };
    } catch (err) {
      console.error("Error in submitFees:", err);
      dispatch(setError(err.message));
      return rejectWithValue({
        success: false,
        error: err.message,
        message: "Failed to submit fees",
      });
    } finally {
      dispatch(setLoading(false));
    }
  },
);

export const interSubmitFees = createAsyncThunk(
  "interSubmitFees",

  async (feeData, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));
      const { data, error } = await supabase.rpc("submit_fee_transaction", {
        p_registration_number: null,
        p_inter_student_registration: feeData?.registrationNumber,
        p_amount: feeData?.totalFee,
        p_fee_type: feeData?.checkedItems,
        p_semester: feeData?.interClass,
        p_eligible_amount: feeData?.eligibleAmount || 0,
        p_cash_in_hand_amount: feeData?.cashInHandAmount || 0,
      });

      if (error) {
        console.error("RPC error:", error);
        throw error;
      }

      // Refresh amount module data
      dispatch(fetchTotalAmount());
      dispatch(fetchTransactions());

      return {
        success: true,
        data: data,
        message: "Fees submitted successfully",
      };
    } catch (err) {
      console.error("Error in interSubmitFees:", err);
      dispatch(setError(err.message));
      return rejectWithValue({
        success: false,
        error: err.message,
        message: "Failed to submit fees",
      });
    } finally {
      dispatch(setLoading(false));
    }
  },
);

export const studentList = createAsyncThunk(
  "studentList",
  async (list, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));
      // console.log("list", list);
      const { data, error } = await supabase
        .from("student")
        .insert(
          list.map((item) => ({
            name: item.Name,
            father_name: item["Father Name"],
            batch: item.Batch,
            registration_number: item["Registration No"],
            department: item.Department,
            rollno: item.RollNo,
          })),
        )
        .select();

      if (error) {
        throw error;
      }
      dispatch(addStudents(data));
      return data;
    } catch (err) {
      dispatch(setError(err.message));
      return rejectWithValue(err.message);
    } finally {
      dispatch(setLoading(false));
    }
  },
);
export const interStudentList = createAsyncThunk(
  "studentList",
  async (list, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));
      // console.log("list", list);
      const { data, error } = await supabase
        .from("interStudent")
        .insert(
          list.map((item) => ({
            name: item.Name,
            father_name: item["Father Name"],
            batch: item.Batch,
            inter_student_registration: item["Registration No"],
            department: item.Department,
            rollno: item.RollNo,
          })),
        )
        .select();

      if (error) {
        throw error;
      }
      dispatch(addStudents(data));
      return data;
    } catch (err) {
      dispatch(setError(err.message));
      return rejectWithValue(err.message);
    } finally {
      dispatch(setLoading(false));
    }
  },
);
export const getAllStudents = createAsyncThunk(
  "getAllStudents",
  async (_request = {}, { dispatch, rejectWithValue }) => {
    // console.log("_request = ", _request);

    try {
      dispatch(setLoading(true));
      let query = supabase.from("student").select(
        `name,
           father_name,
           batch,
           registration_number,
           created_at,
           rollno,
           department (department_name),
           feeSubmission (registration_number, fee_type, amount, semester)`,
      );

      // 🔹 Optional filters
      if (_request?.deprt) {
        query = query.eq("department", _request.deprt);
      }

      if (_request?.batchValue) {
        query = query.eq("batch", _request.batchValue);
      }

      if (_request?.currentSemester) {
        query = query.eq("feeSubmission.semester", _request.currentSemester);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // 🔹 Safe transformation
      const transformed =
        data?.map((student) => ({
          ...student,
          feeSubmission:
            student.feeSubmission?.map((item) => ({
              ...item,
              fee_type:
                typeof item.fee_type === "string"
                  ? JSON.parse(item.fee_type)
                  : item.fee_type,
            })) || [],
        })) || [];
      // console.log("transformed = ", transformed);

      dispatch(getstudentList(transformed));

      return transformed;
    } catch (err) {
      dispatch(setError(err.message));
      return rejectWithValue(err.message);
    } finally {
      dispatch(setLoading(false));
    }
  },
);

export const getSemesterStudents = createAsyncThunk(
  "getSemesterStudents",

  async (_request, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));
      const { data, error } = await supabase
        .from("student")
        .select(
          `name,
            father_name,
            batch,
            registration_number,
            created_at,
            rollno,
            department (department_name),
            feeSubmission (registration_number,fee_type,amount,semester)`,
        )
        .eq("department", _request?.deprt)
        .eq("batch", _request?.batchValue)
        .eq("feeSubmission.semester", _request?.currentSemester);
      if (error) {
        throw error;
      }
      const transformed = data.map((student) => ({
        ...student,
        feeSubmission: student.feeSubmission?.map((item) => ({
          ...item,
          fee_type:
            typeof item.fee_type === "string"
              ? JSON.parse(item.fee_type)
              : item.fee_type,
        })),
      }));

      dispatch(getstudentList(transformed));

      return transformed;
    } catch (err) {
      dispatch(setError(err.message));
      return rejectWithValue(err.message);
    } finally {
      dispatch(setLoading(false));
    }
  },
);

export const getInterClassStudents = createAsyncThunk(
  "getInterClassStudents ",
  async (_request, { dispatch, rejectWithValue }) => {
    //
    try {
      dispatch(setLoading(true));
      const { data, error } = await supabase
        .from("interStudent")
        .select(
          `name,
         father_name,
         batch,
         inter_student_registration,
        created_at,
        rollno,
         inter(class_name),
        feeSubmission(*)`,
        )
        .eq("department", _request?.deprt)
        .eq("batch", _request?.batchValue)
        .eq("feeSubmission.semester", _request?.interClass);
      if (error) {
        throw error;
      }
      const transformed = data.map((student) => ({
        ...student,
        feeSubmission: student.feeSubmission?.map((item) => ({
          ...item,
          fee_type:
            typeof item.fee_type === "string"
              ? JSON.parse(item.fee_type)
              : item.fee_type,
        })),
      }));
      dispatch(getInterStudentList(transformed));

      return transformed;
    } catch (err) {
      dispatch(setError(err.message));
      return rejectWithValue(err.message);
    } finally {
      dispatch(setLoading(false));
    }
    //
  },
);

export const getAllInterStudents = createAsyncThunk(
  "getAllInterStudents",
  async (_request, { dispatch, rejectWithValue }) => {
    // console.log("_re", _request?.deprt);
    try {
      dispatch(setLoading(true));
      const { data, error } = await supabase
        .from("interStudent")
        .select(
          `name,
         father_name,
         batch,
         inter_student_registration,
             created_at,
          rollno,
           inter(class_name),
             feeSubmission(*)`,
        )
        .eq("department", _request?.deprt);

      if (error) {
        throw error;
      }
      const transformed = data.map((student) => ({
        ...student,
        feeSubmission: student.feeSubmission?.map((item) => ({
          ...item,
          fee_type:
            typeof item.fee_type === "string"
              ? JSON.parse(item.fee_type)
              : item.fee_type,
        })),
      }));
      dispatch(getInterStudentList(transformed));

      return transformed;
    } catch (err) {
      dispatch(setError(err.message));
      return rejectWithValue(err.message);
    } finally {
      dispatch(setLoading(false));
    }
    //
  },
);

export const setFee = createAsyncThunk(
  "setFee",
  async (_request, { dispatch, rejectWithValue }) => {
    // console.log("_request", _request);

    try {
      dispatch(setLoading(true));
      const { data, error } = await supabase.from("fees").insert([
        {
          admission_fee: _request?.fees["Admission Fee"],
          college_fee: _request?.fees["College Fee"],
          CRF: _request?.fees?.CRF,
          registration_fee: _request?.fees["Registration Fee"],
          exam_fee: _request?.fees["Exam Fee"],
          id_card_fee: _request?.fees["ID Card Fee"],
          department_id: _request?.deprt?.id,
          department_name: _request?.deprt?.name,
          // amount: _request.totalAmount,
        },
      ]);

      if (error) throw error;
      // console.log("data res", data);
      dispatch(getFeeSlice(data));
      return data;
    } catch (err) {
      console.error("Error inserting fee:", err.message);
      dispatch(setError(err.message));
      return rejectWithValue(err.message);
    } finally {
      dispatch(setLoading(false));
    }
  },
);

export const getFScdeprt = createAsyncThunk(
  "getFScdeprt",
  async (_request, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));
      const { data, error } = await supabase.from("inter").select();
      if (error) throw error;
      dispatch(interDeprt(data));
    } catch (error) {
      console.error("Error inserting fee:", error.message);
      dispatch(setError(error.message));
      return rejectWithValue(error.message);
    } finally {
      dispatch(setLoading(false));
    }
  },
);

export const getReport = createAsyncThunk(
  "getReport",
  async (_request, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));
      const { data, error } = await supabase
        .from("feeSubmission")
        .select(
          `inter_student_registration,registration_number,amount,fee_type,student(department),interStudent(department)`,
        );
      if (error) throw error;
      dispatch(report(data));
    } catch (error) {
      console.error("Error inserting fee:", error.message);
      dispatch(setError(error.message));
      return rejectWithValue(error.message);
    } finally {
      dispatch(setLoading(false));
    }
  },
);

export const getInterStudent = createAsyncThunk(
  "getInterStudent",
  async (_request, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));
      const { data, error } = await supabase
        .from("interStudent")
        .select(`feeSubmission(*)`)
        .eq("inter_student_registration", _request?.registrationNumber)
        .eq("feeSubmission.semester", _request?.interClass);

      if (error) {
        throw error;
      }
      // console.log("feeSubmission = ", data?.[0]?.feeSubmission);

      return data?.[0]?.feeSubmission;
    } catch (err) {
      dispatch(setError(err.message));
      return rejectWithValue(err.message);
    } finally {
      dispatch(setLoading(false));
    }
  },
);

export const getStudent = createAsyncThunk(
  "getStudent",
  async (_request, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));
      const { data, error } = await supabase
        .from("student")
        .select(`feeSubmission(*)`)
        .eq("registration_number", _request?.registrationNumber)
        .eq("feeSubmission.semester", _request?.studentSemester);

      if (error) {
        throw error;
      }
      // console.log("feeSubmission = ", data?.[0]?.feeSubmission);

      return data?.[0]?.feeSubmission;
    } catch (err) {
      dispatch(setError(err.message));
      return rejectWithValue(err.message);
    } finally {
      dispatch(setLoading(false));
    }
  },
);
// export const updateFee = createAsyncThunk(
//   "fees/updateFee",
//   async (_request, { rejectWithValue }) => {
//     try {
//       const { registrationNumber, checkedItems, totalFee, studentSemester } =
//         _request;

//       const { data: existing, error: fetchError } = await supabase
//         .from("feeSubmission")
//         .select("fee_type")
//         .eq("registration_number", registrationNumber)
//         .eq("semester", studentSemester)
//         .single();

//       if (fetchError) throw fetchError;

//       const existingFeeType =
//         typeof existing?.fee_type === "string"
//           ? JSON.parse(existing.fee_type)
//           : existing?.fee_type || {};
//       const newTrueFees = Object.fromEntries(
//         Object.entries(checkedItems).filter(([_, v]) => v === true),
//       );
//       const mergedFeeType = {
//         ...existingFeeType,
//         ...newTrueFees,
//       };

//       // 4️⃣ update
//       const { data, error } = await supabase
//         .from("feeSubmission")
//         .update({
//           amount: totalFee,
//           fee_type: mergedFeeType,
//         })
//         .eq("registration_number", registrationNumber)
//         .select();

//       if (error) throw error;

//       return {
//         success: true,
//         message: "Fee updated successfully",
//         data: data?.[0] || null,
//       };
//     } catch (err) {
//       console.error("Error updating fee:", err);
//       return rejectWithValue(err.message);
//     }
//   },
// );

export const updateFee = createAsyncThunk(
  "fees/updateFee",
  async (_request, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));
      const { registrationNumber, checkedItems, totalFee, studentSemester, eligibleAmount, cashInHandAmount } =
        _request;

      const { data: existing, error: fetchError } = await supabase
        .from("feeSubmission")
        .select("fee_type")
        .eq("registration_number", registrationNumber)
        .eq("semester", studentSemester)
        .maybeSingle();
      if (fetchError) throw fetchError;

      // Parse existing fee_type
      const existingFeeType =
        typeof existing?.fee_type === "string"
          ? JSON.parse(existing.fee_type)
          : existing?.fee_type || {};

      // Get only true values from checkedItems
      const newTrueFees = Object.fromEntries(
        Object.entries(checkedItems).filter(([_, v]) => v === true),
      );

      // Find keys that exist in database but are false in checkedItems (need to be removed)
      const keysToRemove = Object.keys(existingFeeType).filter(
        (key) => checkedItems[key] === false,
      );

      // Create mergedFeeType starting with existing
      let mergedFeeType = { ...existingFeeType };

      // Add new true fees
      mergedFeeType = {
        ...mergedFeeType,
        ...newTrueFees,
      };

      // Remove keys that are false in checkedItems
      keysToRemove.forEach((key) => {
        delete mergedFeeType[key];
      });

      // Remove any keys that are false
      Object.entries(checkedItems).forEach(([key, value]) => {
        if (value === false && mergedFeeType.hasOwnProperty(key)) {
          delete mergedFeeType[key];
        }
      });

      let result;

      if (existing) {
        // Use atomic RPC to update fee + sync balance
        const { data, error } = await supabase.rpc("update_fee_transaction", {
          p_registration_number: registrationNumber,
          p_inter_student_registration: null,
          p_amount: totalFee,
          p_fee_type: mergedFeeType,
          p_semester: studentSemester,
          p_new_eligible_amount: eligibleAmount || 0,
          p_new_cash_in_hand_amount: cashInHandAmount || 0,
        });

        if (error) throw error;
        result = data;
      } else {
        // No existing record — use submit RPC
        const { data, error } = await supabase.rpc("submit_fee_transaction", {
          p_registration_number: registrationNumber,
          p_inter_student_registration: null,
          p_amount: totalFee,
          p_fee_type: newTrueFees,
          p_semester: studentSemester,
          p_eligible_amount: eligibleAmount || 0,
          p_cash_in_hand_amount: cashInHandAmount || 0,
        });

        if (error) throw error;
        result = data;
      }

      // Refresh amount module data
      dispatch(fetchTotalAmount());
      dispatch(fetchTransactions());

      return {
        success: true,
        message: existing
          ? "Fee updated successfully"
          : "Fee submitted successfully",
        data: result,
      };
    } catch (err) {
      console.error("Error updating fee:", err);
      dispatch(setError(err.message));
      return rejectWithValue(err.message);
    } finally {
      dispatch(setLoading(false));
    }
  },
);
export const updateInterFee = createAsyncThunk(
  "fees/updateInterFee",
  async (_request, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));
      const {
        registrationNumber,
        checkedItems,
        totalFee,
        interClass,
        eligibleAmount,
        cashInHandAmount,
      } = _request;

      const { data: existing, error: fetchError } = await supabase
        .from("feeSubmission")
        .select("fee_type")
        .eq("inter_student_registration", registrationNumber)
        .eq("semester", interClass)
        .maybeSingle();

      if (fetchError) throw fetchError;

      const existingFeeType =
        typeof existing?.fee_type === "string"
          ? JSON.parse(existing.fee_type)
          : existing?.fee_type || {};

      const newTrueFees = Object.fromEntries(
        Object.entries(checkedItems).filter(([_, v]) => v === true),
      );

      const mergedFeeType = {
        ...existingFeeType,
        ...newTrueFees,
      };

      let result;

      if (existing) {
        // Use atomic RPC to update fee + sync balance
        const { data, error } = await supabase.rpc("update_fee_transaction", {
          p_registration_number: null,
          p_inter_student_registration: registrationNumber,
          p_amount: totalFee,
          p_fee_type: mergedFeeType,
          p_semester: interClass,
          p_new_eligible_amount: eligibleAmount || 0,
          p_new_cash_in_hand_amount: cashInHandAmount || 0,
        });

        if (error) throw error;
        result = data;
      } else {
        // No existing record — use submit RPC
        const { data, error } = await supabase.rpc("submit_fee_transaction", {
          p_registration_number: null,
          p_inter_student_registration: registrationNumber,
          p_amount: totalFee,
          p_fee_type: newTrueFees,
          p_semester: interClass,
          p_eligible_amount: eligibleAmount || 0,
          p_cash_in_hand_amount: cashInHandAmount || 0,
        });

        if (error) throw error;
        result = data;
      }

      // Refresh amount module data
      dispatch(fetchTotalAmount());
      dispatch(fetchTransactions());

      return {
        success: true,
        message: "Fee updated successfully",
        data: result,
      };
    } catch (err) {
      console.error("Error updating inter fee:", err);
      dispatch(setError(err.message));
      return rejectWithValue(err.message);
    } finally {
      dispatch(setLoading(false));
    }
  },
);

// Unsubmit fee for BS students
export const unsubmitFee = createAsyncThunk(
  "fees/unsubmitFee",
  async (_request, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));
      const { registrationNumber, studentSemester } = _request;

      const { data, error } = await supabase.rpc("unsubmit_fee_transaction", {
        p_registration_number: registrationNumber,
        p_inter_student_registration: null,
        p_semester: studentSemester,
      });

      if (error) throw error;

      if (data?.success === false) {
        throw new Error(data.message);
      }

      // Refresh amount module data
      dispatch(fetchTotalAmount());
      dispatch(fetchTransactions());

      return {
        success: true,
        message: data?.message || "Fee unsubmitted successfully",
        data: data,
      };
    } catch (err) {
      console.error("Error unsubmitting fee:", err);
      dispatch(setError(err.message));
      return rejectWithValue(err.message);
    } finally {
      dispatch(setLoading(false));
    }
  },
);

// Unsubmit fee for Inter students
export const unsubmitInterFee = createAsyncThunk(
  "fees/unsubmitInterFee",
  async (_request, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));
      const { registrationNumber, interClass } = _request;

      const { data, error } = await supabase.rpc("unsubmit_fee_transaction", {
        p_registration_number: null,
        p_inter_student_registration: registrationNumber,
        p_semester: interClass,
      });

      if (error) throw error;

      if (data?.success === false) {
        throw new Error(data.message);
      }

      // Refresh amount module data
      dispatch(fetchTotalAmount());
      dispatch(fetchTransactions());

      return {
        success: true,
        message: data?.message || "Fee unsubmitted successfully",
        data: data,
      };
    } catch (err) {
      console.error("Error unsubmitting inter fee:", err);
      dispatch(setError(err.message));
      return rejectWithValue(err.message);
    } finally {
      dispatch(setLoading(false));
    }
  },
);

export const getInterStudents = createAsyncThunk(
  "getInterClassStudents",
  async (_request = {}, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));
      let query = supabase.from("interStudent").select(
        `name,
           father_name,
           batch,
           inter_student_registration,
           created_at,
           rollno,
           feeSubmission (registration_number, fee_type, amount, semester)`,
      );
      if (_request?.deprt) {
        query = query.eq("department", _request.deprt);
      }

      if (_request?.batchValue) {
        query = query.eq("batch", _request.batchValue);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      const transformed =
        data?.map((student) => ({
          ...student,
          feeSubmission: student.feeSubmission?.map((item) => ({
            ...item,
            fee_type:
              typeof item.fee_type === "string"
                ? JSON.parse(item.fee_type)
                : item.fee_type,
          })),
        })) || [];
      return transformed;
    } catch (err) {
      dispatch(setError(err.message));
      return rejectWithValue(err.message);
    } finally {
      dispatch(setLoading(false));
    }
  },
);

export const getBSStudents = createAsyncThunk(
  "getAllStudents",
  async (_request = {}, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));
      let query = supabase.from("student").select(
        `name,
         father_name,
         batch,
         registration_number,
         created_at,
         rollno,
         department (department_name),
         feeSubmission (registration_number, fee_type, amount, semester)`,
      );

      // 🔹 Apply filters
      if (_request?.deprt) {
        query = query.eq("department", _request.deprt);
      }

      if (_request?.batchValue) {
        query = query.eq("batch", _request.batchValue);
      }

      // Note: currentSemester filter is removed as per your requirement

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // 🔹 Safe transformation
      const transformed =
        data?.map((student) => ({
          ...student,
          feeSubmission:
            student.feeSubmission?.map((item) => ({
              ...item,
              fee_type:
                typeof item.fee_type === "string"
                  ? JSON.parse(item.fee_type)
                  : item.fee_type,
            })) || [],
        })) || [];

      return transformed; // Just return data without dispatching to slice
    } catch (err) {
      dispatch(setError(err.message));
      return rejectWithValue(err.message);
    } finally {
      dispatch(setLoading(false));
    }
  },
);

export const getReportData = createAsyncThunk(
  "getReportData ",
  async (_request, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));
      const { data, error } = await supabase
        .from("student")
        .select(
          `batch,
         
        feeSubmission(*)`,
        )
        .eq("department", _request?.deprt)
      // .eq("batch", _request?.batchValue);

      if (error) {
        throw error;
      }
      const transformed = data.map((student) => ({
        ...student,
        feeSubmission: student.feeSubmission?.map((item) => ({
          ...item,
          fee_type:
            typeof item.fee_type === "string"
              ? JSON.parse(item.fee_type)
              : item.fee_type,
        })),
      }));

      dispatch(setReportData(transformed));

      return transformed;
    } catch (err) {
      dispatch(setError(err.message));
      return rejectWithValue(err.message);
    } finally {
      dispatch(setLoading(false));
    }
  },
);

export const getInterReportData = createAsyncThunk(
  "getReportData ",
  async (_request, { dispatch }) => {
    try {
      const { data, error } = await supabase
        .from("interStudent")
        .select(
          `batch,
                 feeSubmission(*)`,
        )
        .eq("department", _request?.deprt)
        .eq("batch", _request?.batchValue);

      if (error) {
        return rejectWithValue(error.message);
      }
      const transformed = data.map((student) => ({
        ...student,
        feeSubmission: student.feeSubmission?.map((item) => ({
          ...item,
          fee_type:
            typeof item.fee_type === "string"
              ? JSON.parse(item.fee_type)
              : item.fee_type,
        })),
      }));

      dispatch(setReportData(transformed));

      return transformed;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);
