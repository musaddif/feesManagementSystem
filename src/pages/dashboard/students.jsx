import { useDispatch, useSelector } from "react-redux";
import SideBar from "../../component/sideBar";
import {
  getAllStudents,
  getAllInterStudents,
  getInterClassStudents,
  allDepartments,
  getFScdeprt,
} from "../../store/Thunk/commonThunk";
import { useEffect, useState, useMemo } from "react";
import "../../constant/applicationStyle.css";
import "../style/excelFileReader.css";
import { useNavigate } from "react-router-dom";
import { semester, inter_class } from "../../constant/lists";
import { Skeleton } from "../../component/loader/skeleton";
import Header from "../../component/header";
const Students = () => {
  const [studentSemester, setStudentSemester] = useState("All");
  const [openBatch, setOpenBatch] = useState(null);
  const [submittedFeesCount, setSubmittedFeesCount] = useState([]);
  const [pendingFeeTypeCounts, setPendingFeeTypeCounts] = useState({});
  const [feeTypeCounts, setFeeTypeCounts] = useState({});
  const [students, setStudents] = useState([]);
  const [studentRecord, setStudentRecord] = useState([]);
  const [batchArr, setBatchArr] = useState([]);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [interClass, setInterClass] = useState("");

  const selectedDeprt = useMemo(() => {
    const stored = localStorage.getItem("selectedDepartment");
    return stored ? JSON.parse(stored) : null;
  }, []);

  const [deptFilter, setDeptFilter] = useState(selectedDeprt?.department_name || selectedDeprt?.class_name || "");

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const bsStudents = useSelector((state) => state.common.getAllStudent);
  const interStudents = useSelector((state) => state.common.getAllInterStudent);
  const globalLoading = useSelector((state) => state.common.loading);
  const bsDepartments = useSelector((state) => state.common.department);
  const interDepartments = useSelector((state) => state.common.interDepartments);

  useEffect(() => {
    dispatch(allDepartments());
    dispatch(getFScdeprt());
  }, []);

  useEffect(() => {
    const loadBatches = () => {
      try {
        const currentStudents = selectedDeprt?.study_level === "BS" ? bsStudents : interStudents;
        if (currentStudents && currentStudents.length > 0) {
          const batches = [...new Set(currentStudents.map((item) => item.batch))];
          setBatchArr((prev) => batches.length > 0 ? batches : prev);
          setInitialLoadDone(true);
        } else if (globalLoading === false) {
          // If loading finished and still no students, we are done loading
          setInitialLoadDone(true);
        }
      } catch (error) {
        console.error("Error loading batches:", error);
      }
    };

    loadBatches();
  }, [bsStudents, interStudents, selectedDeprt, globalLoading]);

  useEffect(() => {
    if (selectedDeprt?.study_level === "BS") {
      setStudentRecord(bsStudents);
    } else {
      setStudentRecord(interStudents);
    }
  }, [selectedDeprt, bsStudents, interStudents]);

  useEffect(() => {
    if (!studentRecord) {
      setStudents([]);
      return;
    }

    let filtered = studentRecord;

    if (selectedDeprt?.study_level === "BS") {
      if (studentSemester !== "All") {
        filtered = filtered.filter((student) =>
          student?.feeSubmission
            ?.map((fs) => fs.semester)
            .includes(studentSemester),
        );
      }
    } else {
      if (interClass !== "") {
        filtered = filtered.filter((student) =>
          student?.feeSubmission?.some((fs) => fs.semester === interClass),
        );
      }
    }

    setStudents(filtered);
  }, [studentRecord, studentSemester, interClass, selectedDeprt]);

  useEffect(() => {
    if (!openBatch) {
      setSubmittedFeesCount(0);
      setFeeTypeCounts({});
      setPendingFeeTypeCounts({});
      return;
    }

    const studentsInBatch = students.filter(
      (student) => student.batch === openBatch,
    );

    const isBS = selectedDeprt?.study_level === "BS";
    const targetSem = isBS ? studentSemester : interClass;

    let submittedStudentCount = 0;
    const feeCounts = {};
    studentsInBatch.forEach((student) => {
      if (student?.feeSubmission && student.feeSubmission.length > 0) {
        const submission = (targetSem && targetSem !== "All" && targetSem !== "")
          ? student.feeSubmission.find((fs) => fs.semester === targetSem)
          : student.feeSubmission[0];

        if (submission) {
          const ft = submission.fee_type || {};
          const isPaidAll =
            ft.college_fee &&
            ft.exam_fee &&
            ft.registration_fee &&
            ft.CRF &&
            ft.admission_fee &&
            (isBS
              ? ["2nd", "4th", "6th", "8th", "10th"].includes(submission.semester) || ft.id_card_fee
              : ft.id_card_fee);

          if (isPaidAll) {
            submittedStudentCount += 1;
          }
        }

        student.feeSubmission.forEach((sub) => {
          if (targetSem && targetSem !== "All" && targetSem !== "" && sub.semester !== targetSem) return;
          if (!sub?.fee_type) return;

          Object.entries(sub?.fee_type).forEach(
            ([feeType, isSubmitted]) => {
              if (isSubmitted) {
                feeCounts[feeType] = (feeCounts[feeType] || 0) + 1;
              }
            },
          );
        });
      }
    });

    const pendingCounts = {};
    const allFeeTypes = [
      "registration_fee",
      "id_card_fee",
      "admission_fee",
      "college_fee",
      "exam_fee",
      "CRF",
    ];

    allFeeTypes.forEach((type) => {
      pendingCounts[type] = studentsInBatch.length - (feeCounts[type] || 0);
    });

    setSubmittedFeesCount(submittedStudentCount);
    setFeeTypeCounts(feeCounts);
    setPendingFeeTypeCounts(pendingCounts);
  }, [students, openBatch, studentSemester, interClass, selectedDeprt]);
  useEffect(() => {
    if (!selectedDeprt) return;

    if (selectedDeprt.study_level === "BS") {
      dispatch(
        getAllStudents({
          deprt: deptFilter,
          batchValue: openBatch,
          currentSemester: studentSemester === "All" ? "" : studentSemester,
        }),
      );
    } else {
      dispatch(
        getInterClassStudents({
          deprt: deptFilter,
          batchValue: openBatch,
          interClass: interClass,
        }),
      );
    }
  }, [openBatch, studentSemester, interClass, deptFilter]);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-shrink-0 h-full">
          <SideBar />
        </div>

        <div className="flex-1 px-3 py-4 sm:px-6 overflow-y-auto">

          <div className="max-w-3xl mx-auto">
            {globalLoading && batchArr.length === 0 ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full mb-3" />
              ))
            ) : !globalLoading && initialLoadDone && batchArr.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-lg font-semibold text-gray-600 mb-1">No Students Found</h3>
                <p className="text-sm text-gray-400">No students match the selected filters. Try adjusting or clearing your filters.</p>
              </div>
            ) : (
              batchArr
                .sort((a, b) => Number(b) - Number(a))
                .map((batch) => {
                  const studentsInBatch = students.filter(
                    (student) => student.batch === batch,
                  );

                  return (
                    <div key={batch} className="border rounded-lg mb-3 shadow-sm">
                      <button
                        className="w-full flex justify-between items-center p-4 font-semibold bg-gray-100"
                        onClick={() =>
                          setOpenBatch(openBatch === batch ? null : batch)
                        }
                      >
                        <span>Batch {batch}</span>
                        <span>{openBatch === batch ? "▲" : "▼"}</span>
                      </button>

                      {openBatch === batch && (
                        <div className="p-3 sm:p-4 m-2 sm:m-3 bg-white">
                          {/* Filters */}
                          <div className="flex flex-wrap gap-3 mb-4">
                            {selectedDeprt?.study_level === "BS" ? (
                              <>
                                <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
                                  <label className="text-xs font-semibold text-gray-600 uppercase">Department</label>
                                  <select
                                    className="dropDown w-full"
                                    onChange={(e) => setDeptFilter(e.target.value)}
                                    value={deptFilter}
                                  >
                                    <option value="">All Departments</option>
                                    {bsDepartments?.map((dept, index) => (
                                      <option key={index} value={dept.department_name}>
                                        {dept.department_name}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
                                  <label className="text-xs font-semibold text-gray-600 uppercase">Semester</label>
                                  <select
                                    className="dropDown w-full"
                                    onChange={(e) => setStudentSemester(e.target.value)}
                                    value={studentSemester}
                                  >
                                    <option value="All">All Semesters</option>
                                    {semester.map((item, index) => (
                                      <option key={index} value={item}>
                                        {item} Semester
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </>
                            ) : (
                              <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
                                <label className="text-xs font-semibold text-gray-600 uppercase">Department</label>
                                <select
                                  className="dropDown w-full"
                                  onChange={(e) => setDeptFilter(e.target.value)}
                                  value={deptFilter}
                                >
                                  <option value="">All Departments</option>
                                  {interDepartments?.map((dept, index) => (
                                    <option key={index} value={dept.class_name}>
                                      {dept.class_name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </div>

                          <div className="space-y-6 mt-4">
                            {/* Student Statistics */}
                            <div>
                              <h2 className="text-base sm:text-lg font-semibold mb-2">
                                Student Statistics
                              </h2>
                              <div className="overflow-x-auto w-full">
                                <table className="min-w-[320px] w-full border border-gray-400 border-collapse">
                                  <thead className="bg-gray-100">
                                    <tr>
                                      <th className="border border-gray-400 px-3 py-2 text-sm whitespace-nowrap">
                                        Total Students
                                      </th>
                                      <th className="border border-gray-400 px-3 py-2 text-sm whitespace-nowrap">
                                        Submitted Fees
                                      </th>
                                      <th className="border border-gray-400 px-3 py-2 text-sm whitespace-nowrap">
                                        Pending Fees
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr>
                                      <td className="border border-gray-400 px-3 py-2 text-center">
                                        {studentsInBatch.length}
                                      </td>
                                      <td className="border border-gray-400 px-3 py-2 text-center text-green-700 font-semibold">
                                        {submittedFeesCount}
                                      </td>
                                      <td className="border border-gray-400 px-3 py-2 text-center text-red-700">
                                        {studentsInBatch.length - submittedFeesCount}
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            {/* Fee Type Submitted */}
                            <div>
                              <h2 className="text-base sm:text-lg font-semibold mb-2">
                                Fee Type Submitted
                              </h2>
                              <div className="overflow-x-auto w-full">
                                <table className="min-w-[480px] w-full border border-gray-400 border-collapse">
                                  <thead className="bg-gray-100">
                                    <tr>
                                      <th className="border px-3 py-2 text-xs whitespace-nowrap">Reg Fee</th>
                                      <th className="border px-3 py-2 text-xs whitespace-nowrap">ID Card</th>
                                      <th className="border px-3 py-2 text-xs whitespace-nowrap">Admission</th>
                                      <th className="border px-3 py-2 text-xs whitespace-nowrap">College</th>
                                      <th className="border px-3 py-2 text-xs whitespace-nowrap">Exam</th>
                                      <th className="border px-3 py-2 text-xs whitespace-nowrap">CRF</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr>
                                      <td className="border px-3 py-2 text-center">{feeTypeCounts.registration_fee || 0}</td>
                                      <td className="border px-3 py-2 text-center">{feeTypeCounts.id_card_fee || 0}</td>
                                      <td className="border px-3 py-2 text-center">{feeTypeCounts.admission_fee || 0}</td>
                                      <td className="border px-3 py-2 text-center">{feeTypeCounts.college_fee || 0}</td>
                                      <td className="border px-3 py-2 text-center">{feeTypeCounts.exam_fee || 0}</td>
                                      <td className="border px-3 py-2 text-center">{feeTypeCounts.CRF || 0}</td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            {/* Fee Type Pending */}
                            <div>
                              <h2 className="text-base sm:text-lg font-semibold mb-2">
                                Fee Type Pending
                              </h2>
                              <div className="overflow-x-auto w-full">
                                <table className="min-w-[480px] w-full border border-gray-400 border-collapse">
                                  <thead className="bg-gray-100">
                                    <tr>
                                      <th className="border px-3 py-2 text-xs whitespace-nowrap">Reg Fee</th>
                                      <th className="border px-3 py-2 text-xs whitespace-nowrap">ID Card</th>
                                      <th className="border px-3 py-2 text-xs whitespace-nowrap">Admission</th>
                                      <th className="border px-3 py-2 text-xs whitespace-nowrap">College</th>
                                      <th className="border px-3 py-2 text-xs whitespace-nowrap">Exam</th>
                                      <th className="border px-3 py-2 text-xs whitespace-nowrap">CRF</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr>
                                      <td className="border px-3 py-2 text-center">{pendingFeeTypeCounts.registration_fee || 0}</td>
                                      <td className="border px-3 py-2 text-center">{pendingFeeTypeCounts.id_card_fee || 0}</td>
                                      <td className="border px-3 py-2 text-center">{pendingFeeTypeCounts.admission_fee || 0}</td>
                                      <td className="border px-3 py-2 text-center">{pendingFeeTypeCounts.college_fee || 0}</td>
                                      <td className="border px-3 py-2 text-center">{pendingFeeTypeCounts.exam_fee || 0}</td>
                                      <td className="border px-3 py-2 text-center">{pendingFeeTypeCounts.CRF || 0}</td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Students;
