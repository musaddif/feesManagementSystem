import { useLocation, useNavigate } from "react-router-dom";
import "../style/department.css";
import "../style/feeSubmission.css";
import "../../constant/applicationStyle.css";
import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllStudents,
  getFees,
  getIntermadiateFees,
  getAllInterStudents,
  bulkSubmitFees,
} from "../../store/Thunk/commonThunk";
import Button from "../../component/button/button";
import SideBar from "../../component/sideBar";
import { semester, inter_class, departmentList, intermediateClasses, ELIGIBLE_FEE_KEYS, CASH_IN_HAND_KEYS } from "../../constant/lists";
import Header from "../../component/header";
import { Skeleton } from "../../component/loader/skeleton";

// Constants imported from lists.jsx

const FeeSubmission = () => {
  const [checkedItems, setCheckedItems] = useState({});
  const [totalFee, setTotalFee] = useState(0);
  const [eligibleAmount, setEligibleAmount] = useState(0);
  const [cashInHandAmount, setCashInHandAmount] = useState(0);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // "success" or "error"
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingSubmitPayload, setPendingSubmitPayload] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedBSDepartment, setSelectedBSDepartment] = useState("");

  const [studentList, setStudentList] = useState([]); // Filtered students
  const [selectedStudents, setSelectedStudents] = useState([]); // Currently selected for bulk

  const [batchValue, setBatchValue] = useState("");
  const [studentSemester, setStudentSemester] = useState("");
  const [interClass, setInterClass] = useState("");
  const [repeatPaperCount, setRepeatPaperCount] = useState("");

  const dispatch = useDispatch();

  const storedDepartment = localStorage.getItem("selectedDepartment");
  const selectedDeprt = storedDepartment ? JSON.parse(storedDepartment) : null;
  const isInter = selectedDeprt?.study_level !== "BS" && selectedDeprt?.study_level !== undefined; // Add safety for undefined

  const feesList = useSelector((state) => state.common.fees);
  const globalLoading = useSelector((state) => state.common.loading);

  const getstudentList = useSelector((state) =>
    isInter ? state.common.getAllInterStudent : state.common.getAllStudent
  );

  useEffect(() => {
    setSelectedDepartment(selectedDeprt);
    if (!isInter) {
      if (selectedDeprt?.department_name) {
        setSelectedBSDepartment(selectedDeprt.department_name);
        dispatch(getAllStudents({ deprt: selectedDeprt.department_name }));
      }
    } else {
      if (selectedDeprt?.class_name) {
        // Fallback or initial fetch
        const initialClass = selectedDeprt.class_name;
        dispatch(getAllInterStudents({ deprt: initialClass }));
      }
    }
  }, []);

  // Dynamic Fee Fetching for BS
  useEffect(() => {
    if (!isInter && selectedBSDepartment && studentSemester) {
      dispatch(getFees({ department_name: selectedBSDepartment, semester: studentSemester }));
    }
  }, [isInter, selectedBSDepartment, studentSemester, dispatch]);

  // Dynamic Fee Fetching for Intermediate
  useEffect(() => {
    if (isInter && interClass) {
      dispatch(getIntermadiateFees({ inter_class: interClass }));
    }
  }, [isInter, interClass, dispatch]);

  // Refetch students if BS department changes
  useEffect(() => {
    if (!isInter && selectedBSDepartment) {
      dispatch(getAllStudents({ deprt: selectedBSDepartment }));
    }
  }, [isInter, selectedBSDepartment, dispatch]);

  // Refetch Inter students if class changes - REMOVED to prevent Batch dropdown reset
  // The student list remains based on the initial program selected in the dashboard.
  // Target Class is now strictly for Fee Selection as per requirements.
  /*
  useEffect(() => {
    if (isInter && interClass) {
      const program = interClass.replace(/\s+I{1,2}$/, "").trim();
      dispatch(getAllInterStudents({ deprt: program }));
    }
  }, [isInter, interClass, dispatch]);
  */

  // Filter students based on Batch AND Semester/Class
  const filterStudents = useCallback(() => {
    if (!Array.isArray(getstudentList)) return;

    const result = getstudentList.filter((studentData) => {
      const studentBatch = (studentData.batch || "").toLowerCase().trim();
      const matchBatch = batchValue ? studentBatch.includes(batchValue.toLowerCase().trim()) : true;
      return matchBatch;
    });

    setStudentList(result);
    // Keep only those that are still in the filtered list
    setSelectedStudents((prev) => prev.filter(s =>
      result.some(r => (isInter ? r.inter_student_registration === s.inter_student_registration : r.registration_number === s.registration_number))
    ));
  }, [batchValue, getstudentList, isInter]);

  useEffect(() => {
    filterStudents();
  }, [batchValue, filterStudents]);

  // Recalculate amounts
  useEffect(() => {
    if (!feesList || feesList.length === 0) return;

    let loadedEligible = 0;
    let loadedCash = 0;
    let loadedTotal = 0;

    Object.keys(feesList[0]).forEach((key) => {
      if (checkedItems[key]) {
        let amount = Number(feesList[0][key]) || 0;
        if (key === "repeat_paper_fee") {
          const count = parseInt(repeatPaperCount) || 1;
          amount = amount * count;
        }
        loadedTotal += amount;
        if (ELIGIBLE_FEE_KEYS.includes(key)) loadedEligible += amount;
        if (CASH_IN_HAND_KEYS.includes(key)) loadedCash += amount;
      }
    });

    setEligibleAmount(loadedEligible);
    setCashInHandAmount(loadedCash);
    setTotalFee(loadedTotal);
  }, [feesList, checkedItems, repeatPaperCount]);

  const handleCheckBoxes = (e) => {
    const { name, checked } = e.target;
    setCheckedItems((prev) => ({ ...prev, [name]: checked }));
    if (name === "repeat_paper_fee" && !checked) {
      setRepeatPaperCount("");
    }
  };

  const feeKeys =
    Array.isArray(feesList) && feesList.length > 0
      ? Object.keys(feesList[0]).filter(
        (key) =>
          ![
            "department_id",
            "id",
            "amount",
            "department_name",
            "modify_by",
            "created_at",
            "class_name",
            "semester",
            "inter_class",
          ].includes(key)
      )
      : [];

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedStudents(studentList);
    } else {
      setSelectedStudents([]);
    }
  };

  const handleSelectStudent = (student, isChecked) => {
    if (isChecked) {
      setSelectedStudents((prev) => [...prev, student]);
    } else {
      setSelectedStudents((prev) =>
        prev.filter((s) =>
          (isInter ? s.inter_student_registration !== student.inter_student_registration : s.registration_number !== student.registration_number)
        )
      );
    }
  };

  const isStudentSelected = (student) => {
    return selectedStudents.some((s) =>
      isInter
        ? s.inter_student_registration === student.inter_student_registration
        : s.registration_number === student.registration_number
    );
  };

  const bulkSubmit = () => {
    const currentSem = isInter ? interClass : studentSemester;

    const missing = [
      selectedStudents.length === 0 && "at least one student",
      !Object.keys(checkedItems).some(k => checkedItems[k]) && "at least one fee type",
      !currentSem && "semester/class",
    ].filter(Boolean);

    if (missing.length) {
      setMessage(`Please select ${missing.join(", ")}`);
      setMessageType("error");
      return;
    }

    if (checkedItems["repeat_paper_fee"]) {
      if (!repeatPaperCount) {
        setMessage("Please enter number of repeat papers.");
        setMessageType("error");
        return;
      }
      const count = parseInt(repeatPaperCount);
      if (isNaN(count) || count <= 0) {
        setMessage("Repeat papers must be a valid whole number.");
        setMessageType("error");
        return;
      }
    }

    const payload = {
      selectedStudents,
      isInter,
      feeData: {
        checkedItems: Object.keys(checkedItems).reduce((acc, key) => {
          if (checkedItems[key]) {
            if (key === "repeat_paper_fee") {
              acc[key] = (feesList[0][key] || 0) * (parseInt(repeatPaperCount) || 1);
            } else {
              acc[key] = true;
            }
          }
          return acc;
        }, {}),
        totalFee,
        eligibleAmount,
        cashInHandAmount,
        semester: currentSem,
        repeatPaperCount: checkedItems["repeat_paper_fee"] ? parseInt(repeatPaperCount) : 0,
      }
    };

    setPendingSubmitPayload(payload);
    setShowConfirmModal(true);
  };

  const executeSubmit = () => {
    setShowConfirmModal(false);
    if (!pendingSubmitPayload) return;

    dispatch(bulkSubmitFees(pendingSubmitPayload))
      .then((result) => {
        if (result.payload?.success) {
          setCheckedItems({});
          setSelectedStudents([]);
          setRepeatPaperCount("");
          setMessage(result.payload.message || "Fees submitted successfully!");
          setMessageType("success");
        } else {
          setMessage(result.payload?.message || "Data insertion failed");
          setMessageType("error");
        }
      })
      .catch((error) => {
        setMessage(error.message || "Data insertion failed");
        setMessageType("error");
      });
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="flex-shrink-0 h-full z-10">
          <SideBar />
        </div>
        <div className=" flex-1 overflow-y-auto p-4 md:p-8">
          <div className="w-full shadow-xl p-6 md:p-8 rounded-xl bg-white/80 backdrop-blur-sm min-h-[80vh]">
            <div className="border-b pb-4 mb-6">
              <h1 className="text-3xl font-bold text-gray-800">Bulk Fee Submission</h1>
              <h2 className="text-lg text-gray-600 mt-1">
                {!isInter ? `Department of ${selectedBSDepartment || "..."}` : `Class: ${interClass || selectedDeprt?.class_name || "..."}`}
              </h2>
            </div>

            <div className="space-y-8">
              {/* Filters Section (Always Visible) */}
              <div className="bg-gray-50 p-4 rounded-lg shadow-inner flex flex-wrap gap-6 items-center">
                {!isInter && (
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-gray-700">Department</label>
                    <select
                      className="dropDown min-w-[200px]"
                      onChange={(e) => setSelectedBSDepartment(e.target.value)}
                      value={selectedBSDepartment}
                    >
                      <option value="" disabled>Select Department...</option>
                      {departmentList.map((dept, index) => (
                        <option key={index} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700">Batch Filter</label>
                  <select
                    className="dropDown min-w-[200px]"
                    onChange={(e) => setBatchValue(e.target.value)}
                    value={batchValue}
                  >
                    <option value="">Select Batch...</option>
                    {[...new Set(getstudentList?.map((item) => item.batch))].filter(Boolean).map((batch) => (
                      <option key={batch} value={batch}>
                        {batch}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700">
                    {!isInter ? "Target Semester" : "Target Class"}
                  </label>
                  <select
                    className="dropDown min-w-[200px]"
                    onChange={(e) => !isInter ? setStudentSemester(e.target.value) : setInterClass(e.target.value)}
                    value={!isInter ? studentSemester : interClass}
                  >
                    <option value="" disabled>Select...</option>
                    {(!isInter ? semester : intermediateClasses).map((item, index) => (
                      <option key={index} value={item}>{item}</option>
                    ))}
                  </select>
                </div>
              </div>

            </div>

            <div className="space-y-8">

              {/* Fee Type Selection */}
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">Select Fee Types</h3>
                <div className="flex flex-wrap gap-6 items-center">
                  {feeKeys.map((key) => {
                    const hideIdCard = key === "id_card_fee" && studentSemester && ["2nd", "4th", "6th", "8th", "10th"].includes(studentSemester);
                    if (hideIdCard) return null;

                    return (
                      <div key={key} className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors">
                          <input
                            type="checkbox"
                            id={key}
                            name={key}
                            checked={!!checkedItems[key]}
                            onChange={handleCheckBoxes}
                            className="w-4 h-4 text-[#b8860b] focus:ring-[#b8860b] rounded border-gray-300"
                          />
                          <label htmlFor={key} className="capitalize text-gray-700 cursor-pointer font-medium">
                            {key.replace(/_/g, " ")}
                          </label>
                        </div>
                        {key === "repeat_paper_fee" && checkedItems[key] && (
                          <div className="ml-8 flex flex-col gap-1 border-l-2 border-[#b8860b]/20 pl-3 py-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">No. of Papers</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="1"
                                step="1"
                                value={repeatPaperCount}
                                onChange={(e) => setRepeatPaperCount(e.target.value)}
                                onKeyDown={(e) => {
                                  if (["e", "E", "+", "-", "."].includes(e.key)) e.preventDefault();
                                }}
                                className="w-20 h-9 px-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#b8860b]/50 focus:border-[#b8860b] outline-none transition-all font-semibold text-gray-700"
                                placeholder="Qty"
                              />
                              <span className="text-xs text-gray-400 font-medium italic">
                                &times; Rs. {(feesList[0][key] || 0).toLocaleString()}
                              </span>
                            </div>
                            {repeatPaperCount > 0 && (
                              <p className="text-[11px] text-[#b8860b] font-bold">
                                Total: Rs. {(feesList[0][key] * repeatPaperCount).toLocaleString()}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                </div>
              </div>

              {/* Summary & Submit Action */}
              <div className="bg-[#fdf9f1] p-4 rounded-lg border border-[#e6d09a] flex flex-wrap gap-6 items-center justify-between">
                <div className="flex gap-8">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Selected Students</p>
                    <p className="text-2xl font-bold text-[#b8860b]">{selectedStudents.length}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Total Per Student</p>
                    <p className="text-2xl font-bold text-green-600">Rs. {totalFee.toLocaleString()}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Grand Total</p>
                    <p className="text-2xl font-bold text-blue-600">Rs. {(totalFee * selectedStudents.length).toLocaleString()}</p>
                  </div>
                </div>
                <Button
                  onClick={bulkSubmit}
                  loading={globalLoading}
                  loadingText="Processing..."
                  className="!px-8 !py-3 !text-lg shadow-md hover:shadow-lg"
                  disabled={selectedStudents.length === 0 || totalFee === 0}
                >
                  Submit Bulk Fees
                </Button>
              </div>

              {message && (
                <div className={`p-4 rounded-lg ${messageType === "success" ? "bg-green-100 text-green-800 border border-green-200" : "bg-red-100 text-red-800 border border-red-200"} font-medium flex items-center justify-between`}>
                  <span>{message}</span>
                  <button onClick={() => setMessage("")} className="text-xl font-bold opacity-70 hover:opacity-100">&times;</button>
                </div>
              )}

              {/* Student List Table */}
              {batchValue && (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mt-6">
                  <div className="overflow-x-auto max-h-[500px]">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-gray-100 sticky top-0 z-10 shadow-sm">
                        <tr>
                          <th className="p-4 border-b w-16 text-center">
                            <input
                              type="checkbox"
                              className="w-5 h-5 rounded border-gray-300 text-[#b8860b] focus:ring-[#b8860b]"
                              checked={studentList.length > 0 && selectedStudents.length === studentList.length}
                              onChange={handleSelectAll}
                            />
                          </th>
                          <th className="p-4 border-b font-semibold text-gray-700">Name</th>
                          <th className="p-4 border-b font-semibold text-gray-700">Roll No</th>
                          <th className="p-4 border-b font-semibold text-gray-700">Registration No</th>
                          <th className="p-4 border-b font-semibold text-gray-700">Batch</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentList.length > 0 ? (
                          studentList.map((student, idx) => {
                            const reg = isInter ? student.inter_student_registration : student.registration_number;
                            return (
                              <tr key={idx} className="hover:bg-gray-50 border-b transition-colors">
                                <td className="p-4 text-center">
                                  <input
                                    type="checkbox"
                                    className="w-5 h-5 rounded border-gray-300 text-[#b8860b] focus:ring-[#b8860b]"
                                    checked={isStudentSelected(student)}
                                    onChange={(e) => handleSelectStudent(student, e.target.checked)}
                                  />
                                </td>
                                <td className="p-4 text-gray-800 font-medium">{student.name}</td>
                                <td className="p-4 text-gray-600">{student.rollno}</td>
                                <td className="p-4 text-gray-600">{reg}</td>
                                <td className="p-4 text-gray-600">{student.batch}</td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan="5" className="p-8 text-center text-gray-500">
                              No students found for this batch.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Custom Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full animate-in fade-in zoom-in duration-200">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Confirm Submission</h3>
            <div className="bg-yellow-50 border-l-4 border-[#b8860b] p-4 mb-6">
              <p className="text-gray-700 font-medium">
                Are you absolutely sure you want to submit fees for <span className="font-bold text-gray-900">{selectedStudents.length}</span> students?
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Once posted to the database, this bulk transaction <span className="font-bold text-red-600">CANNOT</span> be undone automatically.
              </p>
            </div>
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-6 py-2 rounded-lg text-gray-600 hover:bg-gray-100 font-medium transition-colors"
                disabled={globalLoading}
              >
                Cancel
              </button>
              <button
                onClick={executeSubmit}
                className="px-6 py-2 rounded-lg bg-[#b8860b] text-white hover:bg-[#8b6508] font-bold shadow-md transition-all disabled:opacity-50"
                disabled={globalLoading}
              >
                {globalLoading ? "Processing..." : "Yes, Submit Fees"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default FeeSubmission;
