import { useDispatch, useSelector } from "react-redux";
import SideBar from "../../component/sideBar";
import {
  getAllStudents,
  getAllInterStudents,
  getInterClassStudents,
} from "../../store/Thunk/commonThunk";
import { useEffect, useState, useMemo } from "react";
import "../../constant/applicationStyle.css";
import "../style/excelFileReader.css";
import { useNavigate } from "react-router-dom";
import { semester, inter_class } from "../../constant/lists";
import Header from "../../component/Header"

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

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const storedDepartment = localStorage.getItem("selectedDepartment");
  const selectedDeprt = storedDepartment ? JSON.parse(storedDepartment) : null;
  const bsStudents = useSelector((state) => state.common.getAllStudent);
  const interStudents = useSelector((state) => state.common.getAllInterStudent);
  useEffect(() => {
    const loadBatches = async () => {
      try {
        const cachedBatches = localStorage.getItem("cachedBatches");

        if (cachedBatches) {
          // Use cached data
          setBatchArr(JSON.parse(cachedBatches));
          setInitialLoadDone(true);
        } else {
          const batches = [...new Set(bsStudents.map((item) => item.batch))];

          // Save to state and cache
          setBatchArr(batches);
          localStorage.setItem("cachedBatches", JSON.stringify(batches));
          setInitialLoadDone(true);
        }
      } catch (error) {
        console.error("Error loading batches:", error);
      }
    };

    loadBatches();
  }, []);

  useEffect(() => {
    if (selectedDeprt?.study_level === "BS") {
      setStudentRecord(bsStudents);
    } else {
      setStudentRecord(interStudents);
    }
  }, [selectedDeprt, bsStudents, interStudents, interClass]);

  useEffect(() => {
    if (!studentRecord) {
      setStudents([]);
      return;
    }

    if (interClass === "") {
      // Show all students when no semester selected
      setStudents(studentRecord);
    } else {
      // Filter students for the selected semester
      const filteredStudents = studentRecord.filter((student) => {
        // If student has no fee submissions, they won't be shown when filtering
        return student?.feeSubmission?.some((fs) => fs.semester === interClass);
      });

      setStudents(filteredStudents);
    }
  }, [studentRecord, interClass]);

  useEffect(() => {
    if (
      studentSemester === "All" ||
      !studentRecord?.feeSubmission?.length > 0
    ) {
      setStudents(studentRecord);
    } else {
      const filteredStudents = studentRecord.filter((student) =>
        student?.feeSubmission
          ?.map((fs) => fs.semester)
          .includes(studentSemester),
      );

      setStudents(filteredStudents);
    }
  }, [studentRecord, studentSemester]);

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
          deprt: selectedDeprt.department_name,
          batchValue: openBatch,
          currentSemester: studentSemester,
        }),
      );
    } else {
      dispatch(
        getInterClassStudents({
          deprt: selectedDeprt.class_name,
          batchValue: openBatch,
          interClass: interClass,
        }),
      );
    }
  }, [openBatch, studentSemester, interClass]);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        <div className="">
          <SideBar />
        </div>



        <div className="flex-1 px-6 py-4 overflow-y-auto">
          <h1 className="text-2xl font-bold mb-6 text-center">
            Department of{" "}
            {selectedDeprt?.department_name || selectedDeprt?.class_name}
          </h1>
          <div className="max-w-3xl mx-auto">
            {batchArr
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
                            <label>Semester: </label>

                            <select
                              className="dropDown"
                              onChange={(e) => setStudentSemester(e.target.value)}
                              value={studentSemester}
                            >
                              <option value="" disabled>
                                Select Semester
                              </option>

                              {semester.map((item, index) => (
                                <option key={index} value={item}>
                                  {item}
                                </option>
                              ))}
                            </select>
                          </>
                        ) : (
                          <>
                            <label>Class : </label>

                            <select
                              className="dropDown w-28"
                              onChange={(e) => setInterClass(e.target.value)}
                              value={interClass}
                            >
                              <option value="" disabled>
                                Part
                              </option>

                              {inter_class.map((item, index) => (
                                <option key={index} value={item}>
                                  {item}
                                </option>
                              ))}
                            </select>
                          </>
                        )}

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
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      </div>  </div>
  );
};

export default Students;
