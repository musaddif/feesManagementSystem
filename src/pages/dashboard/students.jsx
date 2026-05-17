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
import Header from "../../component/Header"
import { Skeleton } from "../../component/loader/skeleton";

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
          setBatchArr(batches);
          setInitialLoadDone(true);
        } else if (globalLoading === false) {
          // If loading finished and still no students, we are done loading
          setBatchArr([]);
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

    let submittedStudentCount = 0;
    const feeCounts = {};
    studentsInBatch.forEach((student) => {
      if (student?.feeSubmission.length > 0) {
        if (
          student?.feeSubmission?.[0]?.fee_type?.college_fee &&
          student?.feeSubmission?.[0]?.fee_type?.id_card_fee &&
          student?.feeSubmission?.[0]?.fee_type?.exam_fee &&
          student?.feeSubmission?.[0]?.fee_type?.registration_fee &&
          student?.feeSubmission?.[0]?.fee_type?.CRF &&
          student?.feeSubmission?.[0]?.fee_type?.admission_fee
        ) {
          submittedStudentCount += 1;
        }

        student.feeSubmission.forEach((submission) => {
          if (!submission?.fee_type) return;

          Object.entries(submission?.fee_type).forEach(
            ([feeType, isSubmitted]) => {
              if (isSubmitted) {
                feeCounts[feeType] = (feeCounts[feeType] || 0) + 1;
              }
            },
          );
        });
      }
    });

    // Calculate pending fees per type
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
  }, [students, openBatch, studentSemester]);
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
        <div className="">
          <SideBar />
        </div>



        <div className="flex-1 px-6 py-4 overflow-y-auto">

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
                        <div className="p-4 m-3 bg-white">
                          {selectedDeprt?.study_level === "BS" ? (
                            <>
                              <label>Department: </label>
                              <select
                                className="dropDown mr-4"
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

                              <label>Semester: </label>
                              <select
                                className="dropDown"
                                onChange={(e) => setStudentSemester(e.target.value)}
                                value={studentSemester}
                              >
                                <option value="All">All Semesters</option>
                                {semester.map((item, index) => (
                                  <option key={index} value={item}>
                                    {item}
                                  </option>
                                ))}
                              </select>
                            </>
                          ) : (
                            <>
                              <label>Department: </label>
                              <select
                                className="dropDown mr-4"
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

                              <label>Class : </label>
                              <select
                                className="dropDown w-28"
                                onChange={(e) => setInterClass(e.target.value)}
                                value={interClass}
                              >
                                <option value="">All Parts</option>
                                {inter_class.map((item, index) => (
                                  <option key={index} value={item}>
                                    {item}
                                  </option>
                                ))}
                              </select>
                            </>
                          )}

                          {studentsInBatch.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 mt-4 rounded-lg bg-gray-50 border border-dashed border-gray-300">
                              <div className="text-4xl mb-3">📭</div>
                              <p className="text-base font-semibold text-gray-500">No students found for selected filters</p>
                              <p className="text-xs text-gray-400 mt-1">Try changing the semester, class, or department filter.</p>
                            </div>
                          ) : (
                          <div className="space-y-6 mt-4">
                            <div>
                              <h2 className="text-lg font-semibold mb-2">
                                Student Statistics
                              </h2>

                              <table className="w-full border border-gray-400 border-collapse">
                                <thead className="bg-gray-100">
                                  <tr>
                                    <th className="border border-gray-400 px-4 py-2">
                                      Total Students
                                    </th>
                                    <th className="border border-gray-400 px-4 py-2">
                                      Submitted Fees
                                    </th>
                                    <th className="border border-gray-400 px-4 py-2">
                                      Pending Fees
                                    </th>
                                  </tr>
                                </thead>

                                <tbody>
                                  <tr>
                                    <td className="border border-gray-400 px-4 py-2">
                                      {studentsInBatch.length}
                                    </td>

                                    <td className="border border-gray-400 px-4 py-2 text-green-700 font-semibold">
                                      {submittedFeesCount}
                                    </td>

                                    <td className="border border-gray-400 px-4 py-2 text-red-700">
                                      {studentsInBatch.length - submittedFeesCount}
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>

                            {/* Fee Type Submitted */}

                            <div>
                              <h2 className="text-lg font-semibold mb-2">
                                Fee Type Submitted
                              </h2>

                              <table className="w-full border border-gray-400 border-collapse">
                                <thead className="bg-gray-100">
                                  <tr>
                                    <th className="border px-4 py-2">
                                      Registration Fee
                                    </th>
                                    <th className="border px-4 py-2">
                                      ID Card Fee
                                    </th>
                                    <th className="border px-4 py-2">
                                      Admission Fee
                                    </th>
                                    <th className="border px-4 py-2">
                                      College Fee
                                    </th>
                                    <th className="border px-4 py-2">Exam Fee</th>
                                    <th className="border px-4 py-2">CRF Fee</th>
                                  </tr>
                                </thead>

                                <tbody>
                                  <tr>
                                    <td className="border px-4 py-2">
                                      {feeTypeCounts.registration_fee || 0}
                                    </td>
                                    <td className="border px-4 py-2">
                                      {feeTypeCounts.id_card_fee || 0}
                                    </td>
                                    <td className="border px-4 py-2">
                                      {feeTypeCounts.admission_fee || 0}
                                    </td>
                                    <td className="border px-4 py-2">
                                      {feeTypeCounts.college_fee || 0}
                                    </td>
                                    <td className="border px-4 py-2">
                                      {feeTypeCounts.exam_fee || 0}
                                    </td>
                                    <td className="border px-4 py-2">
                                      {feeTypeCounts.CRF || 0}
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>

                            {/* Fee Type Pending */}

                            <div>
                              <h2 className="text-lg font-semibold mb-2">
                                Fee Type Pending
                              </h2>

                              <table className="w-full border border-gray-400 border-collapse">
                                <thead className="bg-gray-100">
                                  <tr>
                                    <th className="border px-4 py-2">
                                      Registration Fee
                                    </th>
                                    <th className="border px-4 py-2">
                                      ID Card Fee
                                    </th>
                                    <th className="border px-4 py-2">
                                      Admission Fee
                                    </th>
                                    <th className="border px-4 py-2">
                                      College Fee
                                    </th>
                                    <th className="border px-4 py-2">Exam Fee</th>
                                    <th className="border px-4 py-2">CRF Fee</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr>
                                    <td className="border px-4 py-2">
                                      {pendingFeeTypeCounts.registration_fee || 0}
                                    </td>
                                    <td className="border px-4 py-2">
                                      {pendingFeeTypeCounts.id_card_fee || 0}
                                    </td>
                                    <td className="border px-4 py-2">
                                      {pendingFeeTypeCounts.admission_fee || 0}
                                    </td>
                                    <td className="border px-4 py-2">
                                      {pendingFeeTypeCounts.college_fee || 0}
                                    </td>
                                    <td className="border px-4 py-2">
                                      {pendingFeeTypeCounts.exam_fee || 0}
                                    </td>
                                    <td className="border px-4 py-2">
                                      {pendingFeeTypeCounts.CRF || 0}
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </div>  </div>
  );
};

export default Students;
