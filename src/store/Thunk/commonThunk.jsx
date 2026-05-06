import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { supabase } from "../../supabaseClient";
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
} from "../slices/commonSlices";
import { feesTypes, semester } from "../../constant/lists";

export const allDepartments = createAsyncThunk(
  "allDepartments",
  async (_request, { dispatch }) => {
    try {
      const { data, error } = await supabase.from("department").select("*");
      dispatch(department(data));
    } catch (err) {
      console.log("error", err);
    }
  },
);

export const getFees = createAsyncThunk(
  "getFees",
  async (_request, { dispatch }) => {
    try {
      const { data, error } = await supabase
        .from("fees")
        .select("*")
        .eq("department_name", _request?.department_name);
      if (error) throw error;
      dispatch(feeSlice(data));
    } catch (err) {
      console.log("error", err);
    }
  },
);
export const getIntermadiateFees = createAsyncThunk(
  "getFees",
  async (_request, { dispatch }) => {
    // console.log("request", _request?.department_name);

    try {
      const { data, error } = await supabase
        .from("fees")
        .select("*")
        .eq("class_name", _request?.class_name);
      if (error) throw error;
      dispatch(feeSlice(data));
      // dispatch(interFeeSlice(data));
    } catch (err) {
      console.log("error", err);
    }
  },
);
export const submitFees = createAsyncThunk(
  "submitFees",

  async (feeData, { rejectWithValue }) => {
    // console.log("submitFees", feeData);
    try {
      const { data, error } = await supabase
        .from("feeSubmission")
        .insert([
          {
            registration_number: feeData?.registrationNumber,
            amount: feeData?.totalFee,
            fee_type: feeData?.checkedItems,
            semester: feeData?.studentSemester,
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
  },
);

export const interSubmitFees = createAsyncThunk(
  "submitFees",

  async (feeData, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from("feeSubmission")
        .insert([
          {
            inter_student_registration: feeData?.registrationNumber,
            amount: feeData?.totalFee,
            fee_type: feeData?.checkedItems,
            semester: feeData?.interClass,
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
  },
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
        return rejectWithValue(error.message);
      }
      dispatch(addStudents(data));
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);
export const interStudentList = createAsyncThunk(
  "studentList",
  async (list, { dispatch, rejectWithValue }) => {
    try {
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
        return rejectWithValue(error.message);
      }
      dispatch(addStudents(data));
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);
export const getAllStudents = createAsyncThunk(
  "getAllStudents",
  async (_request = {}, { dispatch, rejectWithValue }) => {
    // console.log("_request = ", _request);

    try {
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
        return rejectWithValue(error.message);
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
      return rejectWithValue(err.message);
    }
  },
);

export const getSemesterStudents = createAsyncThunk(
  "getSemesterStudents",

  async (_request, { dispatch }) => {
    try {
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

      dispatch(getstudentList(transformed));

      return transformed;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

export const getInterClassStudents = createAsyncThunk(
  "getInterClassStudents ",
  async (_request, { dispatch }) => {
    //
    try {
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
      dispatch(getInterStudentList(transformed));

      return transformed;
    } catch (err) {
      return rejectWithValue(err.message);
    }
    //
  },
);

export const getAllInterStudents = createAsyncThunk(
  "getAllInterStudents",
  async (_request, { dispatch }) => {
    // console.log("_re", _request?.deprt);
    try {
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
      dispatch(getInterStudentList(transformed));

      return transformed;
    } catch (err) {
      return rejectWithValue(err.message);
    }
    //
  },
);

export const setFee = createAsyncThunk(
  "setFee",
  async (_request, { dispatch }) => {
    // console.log("_request", _request);

    try {
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
      throw err;
    }
  },
);

export const getFScdeprt = createAsyncThunk(
  "getFScdeprt",
  async (_request, { dispatch }) => {
    try {
      const { data, error } = await supabase.from("inter").select();
      if (error) throw error;
      dispatch(interDeprt(data));
    } catch (error) {
      console.error("Error inserting fee:", error.message);
      throw error;
    }
  },
);

export const getReport = createAsyncThunk(
  "getReport",
  async (_request, { dispatch, rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from("feeSubmission")
        .select(
          `inter_student_registration,registration_number,amount,fee_type,student(department),interStudent(department)`,
        );
      if (error) throw error;
      dispatch(report(data));
    } catch (error) {
      console.error("Error inserting fee:", error.message);
      throw error;
    }
  },
);

export const getInterStudent = createAsyncThunk(
  "getInterStudent",
  async (_request, { dispatch }) => {
    try {
      const { data, error } = await supabase
        .from("interStudent")
        .select(`feeSubmission(*)`)
        .eq("inter_student_registration", _request?.registrationNumber)
        .eq("feeSubmission.semester", _request?.interClass);

      if (error) {
        return rejectWithValue(error.message);
      }
      // console.log("feeSubmission = ", data?.[0]?.feeSubmission);

      return data?.[0]?.feeSubmission;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

export const getStudent = createAsyncThunk(
  "getStudent",
  async (_request, { dispatch }) => {
    try {
      const { data, error } = await supabase
        .from("student")
        .select(`feeSubmission(*)`)
        .eq("registration_number", _request?.registrationNumber)
        .eq("feeSubmission.semester", _request?.studentSemester);

      if (error) {
        return rejectWithValue(error.message);
      }
      // console.log("feeSubmission = ", data?.[0]?.feeSubmission);

      return data?.[0]?.feeSubmission;
    } catch (err) {
      return rejectWithValue(err.message);
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
  async (_request, { rejectWithValue }) => {
    try {
      const { registrationNumber, checkedItems, totalFee, studentSemester } =
        _request;

      const { data: existing, error: fetchError } = await supabase
        .from("feeSubmission")
        .select("fee_type")
        .eq("registration_number", registrationNumber)
        .eq("semester", studentSemester)
        .single();
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

      // If you want to completely remove keys that are false (even if they weren't in existing)
      // This will also remove any keys that might have been added from newTrueFees but are false
      Object.entries(checkedItems).forEach(([key, value]) => {
        if (value === false && mergedFeeType.hasOwnProperty(key)) {
          delete mergedFeeType[key];
        }
      });

      let result;

      if (existing) {
        // Update existing record
        const { data, error } = await supabase
          .from("feeSubmission")
          .update({
            amount: totalFee,
            fee_type: mergedFeeType,
          })
          .eq("registration_number", registrationNumber)
          .eq("semester", studentSemester)
          .select();

        if (error) throw error;
        result = data?.[0] || null;
      } else {
        // Insert new record if doesn't exist
        const { data, error } = await supabase
          .from("feeSubmission")
          .insert([
            {
              registration_number: registrationNumber,
              semester: studentSemester,
              amount: totalFee,
              fee_type: newTrueFees, // Only insert true values for new records
            },
          ])
          .select();

        if (error) throw error;
        result = data?.[0] || null;
      }

      return {
        success: true,
        message: existing
          ? "Fee updated successfully"
          : "Fee submitted successfully",
        data: result,
      };
    } catch (err) {
      console.error("Error updating fee:", err);
      return rejectWithValue(err.message);
    }
  },
);
export const updateInterFee = createAsyncThunk(
  "fees/updateFee",
  async (_request, { rejectWithValue }) => {
    try {
      const {
        registrationNumber,
        checkedItems,
        totalFee,
        studentSemester,
        interClass,
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
      // 2️⃣ keep only NEW true values
      const newTrueFees = Object.fromEntries(
        Object.entries(checkedItems).filter(([_, v]) => v === true),
      );

      // 3️⃣ merge WITHOUT removing old
      const mergedFeeType = {
        ...existingFeeType,
        ...newTrueFees,
      };

      // 4️⃣ update
      const { data, error } = await supabase
        .from("feeSubmission")
        .update({
          amount: totalFee,
          fee_type: mergedFeeType,
        })
        .eq("inter_student_registration", registrationNumber)
        .select();

      if (error) throw error;

      return {
        success: true,
        message: "Fee updated successfully",
        data: data?.[0] || null,
      };
    } catch (err) {
      console.error("Error updating fee:", err);
      return rejectWithValue(err.message);
    }
  },
);

export const getInterStudents = createAsyncThunk(
  "getInterClassStudents",
  async (_request = {}, { rejectWithValue }) => {
    try {
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
        return rejectWithValue(error.message);
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
      return rejectWithValue(err.message);
    }
  },
);

export const getBSStudents = createAsyncThunk(
  "getAllStudents",
  async (_request = {}, { rejectWithValue }) => {
    try {
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
        return rejectWithValue(error.message);
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
      return rejectWithValue(err.message);
    }
  },
);

export const getReportData = createAsyncThunk(
  "getReportData ",
  async (_request, { dispatch }) => {
    try {
      const { data, error } = await supabase
        .from("student")
        .select(
          `batch,
         
        feeSubmission(*)`,
        )
        .eq("department", _request?.deprt)
      // .eq("batch", _request?.batchValue);

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
