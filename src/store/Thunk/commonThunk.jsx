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
  setAllFees,
  interDeprt,
  getInterStudentList,
  report,
  setReportData,
  setLoading,
  setError,
} from "../slices/commonSlices";
import { feesTypes, semester, ELIGIBLE_FEE_KEYS, CASH_IN_HAND_KEYS } from "../../constant/lists";

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
      let query = supabase.from("fees").select("*").eq("department_name", _request?.department_name);

      if (_request?.semester) {
        query = query.eq("semester", _request.semester);
      }

      const { data, error } = await query;
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
  "getIntermadiateFees",
  async (_request, { dispatch }) => {
    try {
      dispatch(setLoading(true));
      let query = supabase.from("fees").select("*");

      if (_request?.inter_class) {
        query = query.eq("inter_class", _request.inter_class);
      } else if (_request?.class_name) {
        // Fallback for existing logic
        query = query.eq("class_name", _request.class_name);
      }

      const { data, error } = await query;
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
export const submitFees = createAsyncThunk(
  "submitFees",
  async (feeData, { dispatch, getState, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));

      // 1. Check for existing record
      const { data: existing, error: fetchError } = await supabase
        .from("feeSubmission")
        .select("id, fee_type, amount, posted_amount, posted_cash_amount")
        .eq("registration_number", feeData?.registrationNumber)
        .eq("semester", feeData?.studentSemester)
        .is("reversed_at", null)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existing) {
        const existingFeeType = typeof existing.fee_type === "string" ? JSON.parse(existing.fee_type) : existing.fee_type;
        
        // Detect already paid fees among selected ones
        const alreadyPaid = Object.keys(feeData.checkedItems).filter(
          (key) => feeData.checkedItems[key] === true && existingFeeType[key] === true
        );

        if (alreadyPaid.length > 0) {
          const feeNames = alreadyPaid.map(k => k.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())).join(", ");
          return rejectWithValue({
            success: false,
            message: `${feeNames} already submitted for this student in ${feeData?.studentSemester} semester.`,
          });
        }

        // Merge fee_type
        const mergedFeeType = { ...existingFeeType, ...feeData.checkedItems };

        const { data, error } = await supabase.rpc("update_fee_transaction", {
          p_registration_number: feeData?.registrationNumber,
          p_inter_student_registration: null,
          p_amount: (existing.amount || 0) + feeData?.totalFee,
          p_fee_type: mergedFeeType,
          p_semester: feeData?.studentSemester,
          p_new_eligible_amount: (existing.posted_amount || 0) + (feeData?.eligibleAmount || 0),
          p_new_cash_in_hand_amount: (existing.posted_cash_amount || 0) + (feeData?.cashInHandAmount || 0),
          p_repeat_paper_count: (existing.repeat_paper_count || 0) + (feeData?.repeatPaperCount || 0),
        });

        if (error) throw error;

        dispatch(fetchTotalAmount());
        dispatch(fetchTransactions());

        return {
          success: true,
          data: data,
          message: "Fees updated successfully",
        };
      }

      // No existing record - perform standard insert
      const { data, error } = await supabase.rpc("submit_fee_transaction", {
        p_registration_number: feeData?.registrationNumber,
        p_inter_student_registration: null,
        p_amount: feeData?.totalFee,
        p_fee_type: feeData?.checkedItems,
        p_semester: feeData?.studentSemester,
        p_eligible_amount: feeData?.eligibleAmount || 0,
        p_cash_in_hand_amount: feeData?.cashInHandAmount || 0,
        p_repeat_paper_count: feeData?.repeatPaperCount || 0,
      });

      if (error) throw error;

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
  async (feeData, { dispatch, getState, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));

      // 1. Check for existing record
      const { data: existing, error: fetchError } = await supabase
        .from("feeSubmission")
        .select("id, fee_type, amount, posted_amount, posted_cash_amount")
        .eq("inter_student_registration", feeData?.registrationNumber)
        .eq("semester", feeData?.interClass)
        .is("reversed_at", null)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existing) {
        const existingFeeType = typeof existing.fee_type === "string" ? JSON.parse(existing.fee_type) : existing.fee_type;
        
        const alreadyPaid = Object.keys(feeData.checkedItems).filter(
          (key) => feeData.checkedItems[key] === true && existingFeeType[key] === true
        );

        if (alreadyPaid.length > 0) {
          const feeNames = alreadyPaid.map(k => k.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())).join(", ");
          return rejectWithValue({
            success: false,
            message: `${feeNames} already submitted for this student in ${feeData?.interClass} class.`,
          });
        }

        const mergedFeeType = { ...existingFeeType, ...feeData.checkedItems };

        const { data, error } = await supabase.rpc("update_fee_transaction", {
          p_registration_number: null,
          p_inter_student_registration: feeData?.registrationNumber,
          p_amount: (existing.amount || 0) + feeData?.totalFee,
          p_fee_type: mergedFeeType,
          p_semester: feeData?.interClass,
          p_new_eligible_amount: (existing.posted_amount || 0) + (feeData?.eligibleAmount || 0),
          p_new_cash_in_hand_amount: (existing.posted_cash_amount || 0) + (feeData?.cashInHandAmount || 0),
          p_repeat_paper_count: (existing.repeat_paper_count || 0) + (feeData?.repeatPaperCount || 0),
        });

        if (error) throw error;

        dispatch(fetchTotalAmount());
        dispatch(fetchTransactions());

        return {
          success: true,
          data: data,
          message: "Fees updated successfully",
        };
      }

      const { data, error } = await supabase.rpc("submit_fee_transaction", {
        p_registration_number: null,
        p_inter_student_registration: feeData?.registrationNumber,
        p_amount: feeData?.totalFee,
        p_fee_type: feeData?.checkedItems,
        p_semester: feeData?.interClass,
        p_eligible_amount: feeData?.eligibleAmount || 0,
        p_cash_in_hand_amount: feeData?.cashInHandAmount || 0,
        p_repeat_paper_count: feeData?.repeatPaperCount || 0,
      });

      if (error) throw error;

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

export const bulkSubmitFees = createAsyncThunk(
  "bulkSubmitFees",
  async (payload, { dispatch, getState, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));
      const { selectedStudents, feeData, isInter } = payload;
      const {
        checkedItems,
        totalFee,
        eligibleAmount,
        cashInHandAmount,
        semester,
        repeatPaperCount,
      } = feeData;

      // 1. Check for duplicates
      const regNumbers = selectedStudents.map((s) =>
        isInter ? s.inter_student_registration : s.registration_number
      );
      const regColumn = isInter
        ? "inter_student_registration"
        : "registration_number";

      const { data: existingRecords, error: checkError } = await supabase
        .from("feeSubmission")
        .select(`id, ${regColumn}, fee_type, amount, posted_amount, posted_cash_amount`)
        .in(regColumn, regNumbers)
        .eq("semester", semester)
        .is("reversed_at", null);

      if (checkError) throw checkError;

      // 2. Fetch fee structure for amount recalculation
      const state = getState();
      const feesList = state.common.fees;
      const baseFees = Array.isArray(feesList) && feesList.length > 0 ? feesList[0] : null;

      // 3. STRICT VALIDATION: Check for ANY duplicate before proceeding
      const duplicateErrors = [];

      selectedStudents.forEach((student) => {
        const regNo = isInter ? student.inter_student_registration : student.registration_number;
        const existing = existingRecords?.find((r) => r[regColumn] === regNo);

        if (existing) {
          const existingFeeType = typeof existing.fee_type === "string" ? JSON.parse(existing.fee_type) : existing.fee_type;
          
          const alreadyPaid = Object.keys(checkedItems).filter(
            (key) => checkedItems[key] === true && existingFeeType[key] === true
          );

          if (alreadyPaid.length > 0) {
            const feeNames = alreadyPaid.map(k => k.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())).join(", ");
            duplicateErrors.push(`${feeNames} already submitted for ${student.name} (${regNo})`);
          }
        }
      });

      if (duplicateErrors.length > 0) {
        // Return only the first few errors if there are many, to keep UI clean
        const displayError = duplicateErrors.length > 3 
          ? duplicateErrors.slice(0, 3).join("; ") + " and others."
          : duplicateErrors.join("; ");

        return rejectWithValue({
          success: false,
          message: displayError,
        });
      }

      // 4. Submit for all students (no duplicates guaranteed here)
      const promises = selectedStudents.map(async (student) => {
        const regNo = isInter ? student.inter_student_registration : student.registration_number;
        const existing = existingRecords?.find((r) => r[regColumn] === regNo);

        if (existing) {
          const existingFeeType = typeof existing.fee_type === "string" ? JSON.parse(existing.fee_type) : existing.fee_type;
          
          // Merge fee_type
          const mergedFeeType = { ...existingFeeType, ...checkedItems };

          return supabase.rpc("update_fee_transaction", {
            p_registration_number: isInter ? null : regNo,
            p_inter_student_registration: isInter ? regNo : null,
            p_amount: (existing.amount || 0) + totalFee,
            p_fee_type: mergedFeeType,
            p_semester: semester,
            p_new_eligible_amount: (existing.posted_amount || 0) + eligibleAmount,
            p_new_cash_in_hand_amount: (existing.posted_cash_amount || 0) + cashInHandAmount,
            p_repeat_paper_count: (existing.repeat_paper_count || 0) + (repeatPaperCount || 0),
          });
        }

        // No existing record - perform standard insert
        return supabase.rpc("submit_fee_transaction", {
          p_registration_number: isInter ? null : student.registration_number,
          p_inter_student_registration: isInter ? student.inter_student_registration : null,
          p_amount: totalFee,
          p_fee_type: checkedItems,
          p_semester: semester,
          p_eligible_amount: eligibleAmount || 0,
          p_cash_in_hand_amount: cashInHandAmount || 0,
          p_repeat_paper_count: repeatPaperCount || 0,
        });
      });

      const results = await Promise.all(promises);

      const failed = results.filter((r) => r.error);

      if (failed.length > 0) {
        console.error("Some submissions failed:", failed);
        throw new Error("Failed to submit fees for some students");
      }

      dispatch(fetchTotalAmount());
      dispatch(fetchTransactions());

      return {
        success: true,
        message: `Successfully submitted fees for ${selectedStudents.length} students.`,
      };
    } catch (err) {
      console.error("Error in bulkSubmitFees:", err);
      dispatch(setError(err.message));
      return rejectWithValue({
        success: false,
        error: err.message,
        message: err.message || "Failed to submit bulk fees",
      });
    } finally {
      dispatch(setLoading(false));
    }
  }
);

export const studentList = createAsyncThunk(
  "studentList",
  async (list, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));

      // 1. Fetch all valid department names from DB
      const { data: deptData, error: deptError } = await supabase
        .from("department")
        .select("department_name");
      if (deptError) throw deptError;

      const validDepts = deptData.map((d) => d.department_name);

      // 2. Map each row's Department to an exact DB name (case-insensitive)
      const unmatchedDepts = [];
      const mappedList = list.map((item) => {
        const excelDept = (item.Department || "").trim();
        const matched = validDepts.find(
          (d) => d.toLowerCase() === excelDept.toLowerCase()
        );
        if (!matched) unmatchedDepts.push(excelDept || "(empty)");
        return {
          name: item.Name,
          father_name: item["Father Name"],
          batch: item.Batch,
          registration_number: item["Registration No"],
          department: matched || excelDept, // fallback keeps original so error is visible
          rollno: item.RollNo,
        };
      });

      // 3. Reject early if any department names are invalid
      if (unmatchedDepts.length > 0) {
        const unique = [...new Set(unmatchedDepts)];
        return rejectWithValue(
          `Unknown department(s) in Excel: "${unique.join('", "')}". ` +
          `Valid names are: ${validDepts.join(", ")}.`
        );
      }

      // 4. Insert with validated department names
      const { data, error } = await supabase
        .from("student")
        .insert(mappedList)
        .select();

      if (error) throw error;

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
  "interStudentList",
  async (list, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));

      // 1. Fetch all valid inter department/class names from DB
      const { data: interData, error: interError } = await supabase
        .from("inter")
        .select("class_name");
      if (interError) throw interError;

      const validClasses = interData.map((d) => d.class_name);

      // 2. Map each row's Department to an exact DB class_name (case-insensitive)
      const unmatchedDepts = [];
      const mappedList = list.map((item) => {
        const excelDept = (item.Department || "").trim();
        const matched = validClasses.find(
          (c) => c.toLowerCase() === excelDept.toLowerCase()
        );
        if (!matched) unmatchedDepts.push(excelDept || "(empty)");
        return {
          name: item.Name,
          father_name: item["Father Name"],
          batch: item.Batch,
          inter_student_registration: item["Registration No"],
          department: matched || excelDept,
          rollno: item.RollNo,
        };
      });

      // 3. Reject early if any department names are invalid
      if (unmatchedDepts.length > 0) {
        const unique = [...new Set(unmatchedDepts)];
        return rejectWithValue(
          `Unknown class(es) in Excel: "${unique.join('", "')}". ` +
          `Valid names are: ${validClasses.join(", ")}.`
        );
      }

      // 4. Insert with validated class names
      const { data, error } = await supabase
        .from("interStudent")
        .insert(mappedList)
        .select();

      if (error) throw error;

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
      let query = supabase
        .from("student")
        .select(
          `name,
            father_name,
            batch,
            registration_number,
            created_at,
            rollno,
            department (department_name),
            feeSubmission (registration_number,fee_type,amount,semester)`
        )
        .eq("department", _request?.deprt);

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
      let query = supabase
        .from("interStudent")
        .select(
          `name,
         father_name,
         batch,
         inter_student_registration,
        created_at,
        rollno,
         inter(class_name),
        feeSubmission(*)`
        )
        .eq("department", _request?.deprt);

      if (_request?.batchValue) {
        query = query.eq("batch", _request.batchValue);
      }

      if (_request?.interClass) {
        query = query.eq("feeSubmission.semester", _request.interClass);
      }

      const { data, error } = await query;
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
    try {
      dispatch(setLoading(true));
      let query = supabase
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
        );

      // All filters are optional — supports "All Departments" when deprt is omitted
      if (_request?.deprt) {
        query = query.eq("department", _request.deprt);
      }
      if (_request?.batchValue) {
        query = query.eq("batch", _request.batchValue);
      }
      if (_request?.interClass) {
        query = query.eq("feeSubmission.semester", _request.interClass);
      }

      const { data, error } = await query;
      if (error) throw error;

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
  },
);

export const getFeeSetting = createAsyncThunk(
  "getFeeSetting",
  async ({ department_name, semester, inter_class, study_level }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));
      let query = supabase.from("fees").select("*");

      if (study_level === "BS") {
        if (department_name) query = query.eq("department_name", department_name);
        if (semester) query = query.eq("semester", semester);
      } else {
        if (inter_class) query = query.eq("inter_class", inter_class);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data && data.length > 0 ? data[0] : null;
    } catch (err) {
      console.error("Error fetching fee setting:", err.message);
      dispatch(setError(err.message));
      return rejectWithValue(err.message);
    } finally {
      dispatch(setLoading(false));
    }
  }
);

export const setFee = createAsyncThunk(
  "setFee",
  async (_request, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));
      const payload = {
        admission_fee: _request?.fees["Admission Fee"] || 0,
        college_fee: _request?.fees["College Fee"] || 0,
        CRF: _request?.fees["CRF"] || 0,
        registration_fee: _request?.fees["Registration Fee"] || 0,
        exam_fee: _request?.fees["Exam Fee"] || 0,
        id_card_fee: _request?.fees["ID Card Fee"] || 0,
        repeat_paper_fee: _request?.fees["Repeat Paper Fee"] || 0,
        department_id: _request?.deprt?.id || null,
        department_name: _request?.deprt?.name || null,
        semester: _request?.semester || null,
        inter_class: _request?.inter_class || null,
      };

      let query = supabase.from("fees");
      if (_request.id) {
        query = query.update(payload).eq("id", _request.id).select();
      } else {
        query = query.insert([payload]).select();
      }

      const { data, error } = await query;
      if (error) throw error;

      dispatch(getFeeSlice(data));
      return data && data.length > 0 ? data[0] : data;
    } catch (err) {
      console.error("Error inserting/updating fee:", err.message);
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

      if (_request?.interClass) {
        query = query.eq("feeSubmission.semester", _request.interClass);
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

export const getAllFeesData = createAsyncThunk(
  "fees/getAllFeesData",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));
      const { data, error } = await supabase.from("fees").select("*");
      if (error) throw error;
      dispatch(setAllFees(data));
      return data;
    } catch (err) {
      console.error("Error fetching all fees:", err.message);
      dispatch(setError(err.message));
      return rejectWithValue(err.message);
    } finally {
      dispatch(setLoading(false));
    }
  }
);
