import { useDispatch, useSelector } from "react-redux";
import SideBar from "../../component/sideBar";
import {
  getAllStudents,
  getAllInterStudents,
} from "../../store/Thunk/commonThunk";
import { useEffect, useState, useMemo } from "react";
import "../../constant/applicationStyle.css";
import "../style/excelFileReader.css";
import { useNavigate } from "react-router-dom";
import { semester } from "../../constant/lists";

const Students = () => {
  const [studentSemester, setStudentSemester] = useState("All");
  const [openBatch, setOpenBatch] = useState(null);
  const [submittedFeesCount, setSubmittedFeesCount] = useState([]);
  const [pendingFeeTypeCounts, setPendingFeeTypeCounts] = useState({});
  const [feeTypeCounts, setFeeTypeCounts] = useState({});
  const [students, setStudents] = useState([]);
  const [studentRecord, setStudentRecord] = useState([]);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const storedDepartment = localStorage.getItem("selectedDepartment");
  const selectedDeprt = storedDepartment ? JSON.parse(storedDepartment) : null;
  const bsStudents = useSelector((state) => state.common.getAllStudent);
  const interStudents = useSelector((state) => state.common.getAllInterStudent);

  useEffect(() => {
    if (selectedDeprt?.study_level === "BS") {
      setStudentRecord(bsStudents);
    } else {
      setStudentRecord(interStudents);
    }
  }, [selectedDeprt, bsStudents, interStudents]);

  useEffect(() => {
    if (studentSemester === "All") {
      setStudents(studentRecord);
    } else {
      const filteredStudents = studentRecord.filter((student) =>
        student?.feeSubmission
          .map((fs) => fs.semester)
          .includes(studentSemester),
      );
      setStudents(filteredStudents);
    }
  }, [selectedDeprt, bsStudents, interStudents]);
  useEffect(() => {
    if (!openBatch) {
      setSubmittedFeesCount(0);
      setFeeTypeCounts({});
      setPendingFeeTypeCounts({});
      setStudents([]);
      return;
    }

    const studentsInBatch = students.filter(
      (student) => student.batch === openBatch,
    );

    let submittedStudentCount = 0;
    const feeCounts = {};
    studentsInBatch.forEach((student) => {
      if (student?.feeSubmission?.length > 0) {
        submittedStudentCount += 1;

        student.feeSubmission.forEach((submission) => {
          if (!submission?.fee_type) return;

          let parsedFeeTypes;
          try {
            parsedFeeTypes = JSON.parse(submission.fee_type);
          } catch {
            return;
          }

          Object.entries(parsedFeeTypes).forEach(([feeType, isSubmitted]) => {
            if (isSubmitted) {
              feeCounts[feeType] = (feeCounts[feeType] || 0) + 1;
            }
          });
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
  }, [studentSemester, openBatch, studentSemester]);

  useEffect(() => {
    if (!selectedDeprt) return;

    if (selectedDeprt.study_level === "BS") {
      dispatch(
        getAllStudents({
          deprt: selectedDeprt.department_name,
        }),
      );
    } else {
      dispatch(
        getAllInterStudents({
          deprt: selectedDeprt.class_name,
        }),
      );
    }
  }, [dispatch]);

  const batchGroups = useMemo(() => {
    if (!students?.length) return {};

    return students.reduce((acc, student) => {
      const batch = student.batch;
      if (!acc[batch]) acc[batch] = [];
      acc[batch].push(student);

      return acc;
    }, {});
  }, [studentRecord]);

  return (
    <div className="flex min-h-screen">
      <div className="shadow-2xl rounded-2xl z-10">
        <SideBar />
      </div>

      <div className="flex-1 px-8 py-6">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Department of {selectedDeprt?.department_name}
        </h1>

        <div className="max-w-3xl mx-auto">
          {Object.entries(batchGroups)
            .sort((a, b) => Number(b[0]) - Number(a[0]))
            .map(([batch, students]) => (
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
                    <label className="">Semester: </label>
                    <select
                      className="dropDown "
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
                    {/* {students.map((student) => (
                      <div
                        key={student.registration_number}
                      >
                   
                      </div>
                    ))} */}
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-lg font-semibold mb-2">
                          Student Statistics
                        </h2>

                        <table className="w-full border border-gray-400 border-collapse">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="border border-gray-400 px-4 py-2 text-left">
                                Total Students
                              </th>
                              <th className="border border-gray-400 px-4 py-2 text-left">
                                Submitted Fees
                              </th>
                              <th className="border border-gray-400 px-4 py-2 text-left">
                                Pending Fees
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border border-gray-400 px-4 py-2">
                                {
                                  students.filter((s) => s.batch === openBatch)
                                    .length
                                }
                              </td>
                              <td className="border border-gray-400 px-4 py-2 text-green-700 font-semibold">
                                {submittedFeesCount}
                              </td>
                              <td className="border border-gray-400 px-4 py-2 text-red-700">
                                {students.filter((s) => s.batch === openBatch)
                                  .length - submittedFeesCount}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <div>
                        <h2 className="text-lg font-semibold mb-2">
                          Fee Type Submitted
                        </h2>

                        <div className="overflow-x-auto">
                          <table className="w-full border border-gray-400 border-collapse">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="border border-gray-400 px-4 py-2">
                                  Registration Fee
                                </th>
                                <th className="border border-gray-400 px-4 py-2">
                                  ID Card Fee
                                </th>
                                <th className="border border-gray-400 px-4 py-2">
                                  Admission Fee
                                </th>
                                <th className="border border-gray-400 px-4 py-2">
                                  College Fee
                                </th>
                                <th className="border border-gray-400 px-4 py-2">
                                  Exam Fee
                                </th>
                                <th className="border border-gray-400 px-4 py-2">
                                  CRF Fee
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td className="border border-gray-400 px-4 py-2">
                                  {feeTypeCounts.registration_fee || 0}
                                </td>
                                <td className="border border-gray-400 px-4 py-2">
                                  {feeTypeCounts.id_card_fee || 0}
                                </td>
                                <td className="border border-gray-400 px-4 py-2">
                                  {feeTypeCounts.admission_fee || 0}
                                </td>
                                <td className="border border-gray-400 px-4 py-2">
                                  {feeTypeCounts.college_fee || 0}
                                </td>
                                <td className="border border-gray-400 px-4 py-2">
                                  {feeTypeCounts.exam_fee || 0}
                                </td>
                                <td className="border border-gray-400 px-4 py-2">
                                  {feeTypeCounts.CRF || 0}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* 3️⃣ Fee Type Pending */}
                      <div>
                        <h2 className="text-lg font-semibold mb-2">
                          Fee Type Pending
                        </h2>

                        <div className="overflow-x-auto">
                          <table className="w-full border border-gray-400 border-collapse">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="border border-gray-400 px-4 py-2">
                                  Registration Fee
                                </th>
                                <th className="border border-gray-400 px-4 py-2">
                                  ID Card Fee
                                </th>
                                <th className="border border-gray-400 px-4 py-2">
                                  Admission Fee
                                </th>
                                <th className="border border-gray-400 px-4 py-2">
                                  College Fee
                                </th>
                                <th className="border border-gray-400 px-4 py-2">
                                  Exam Fee
                                </th>
                                <th className="border border-gray-400 px-4 py-2">
                                  CRF Fee
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td className="border border-gray-400 px-4 py-2">
                                  {pendingFeeTypeCounts.registration_fee || 0}
                                </td>
                                <td className="border border-gray-400 px-4 py-2">
                                  {pendingFeeTypeCounts.id_card_fee || 0}
                                </td>
                                <td className="border border-gray-400 px-4 py-2">
                                  {pendingFeeTypeCounts.admission_fee || 0}
                                </td>
                                <td className="border border-gray-400 px-4 py-2">
                                  {pendingFeeTypeCounts.college_fee || 0}
                                </td>
                                <td className="border border-gray-400 px-4 py-2">
                                  {pendingFeeTypeCounts.exam_fee || 0}
                                </td>
                                <td className="border border-gray-400 px-4 py-2">
                                  {pendingFeeTypeCounts.CRF || 0}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Students;
