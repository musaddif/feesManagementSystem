import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllStudents,
  getAllInterStudents,
  getSemesterStudents,
} from "../../store/Thunk/commonThunk";
import SideBar from "../../component/sideBar";
import "../../constant/applicationStyle.css";
import "../style/excelFileReader.css";
import { FaSearch } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import Button from "../../component/button/button";
import { semester } from "../../constant/lists";

const StudentList = () => {
  const [batchArr, setBatchArr] = useState([]);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [students, setStudents] = useState([]);
  const [originalData, setOriginalData] = useState([]);
  const [isSearch, setIsSearch] = useState("");
  const [currentSemester, setCurrentSemester] = useState("");
  const [batchValue, setBatchValue] = useState("2021");

  const dispatch = useDispatch();

  const student = useSelector((state) => state.common.getAllStudent);
  const interStudent = useSelector((state) => state.common.getAllInterStudent);

  useEffect(() => {
    const storeDeparment = localStorage.getItem("selectedDepartment");
    const selectedDepartment = storeDeparment
      ? JSON.parse(storeDeparment)
      : null;

    if (selectedDepartment?.study_level == "BS") {
      dispatch(
        getSemesterStudents({
          deprt: selectedDepartment?.department_name,
          currentSemester: currentSemester,
          batchValue: batchValue,
        }),
      );
    } else {
      dispatch(getAllInterStudents({ deprt: selectedDepartment?.class_name }));
    }
  }, [currentSemester, batchValue]);
  useEffect(() => {
    const storeDeparment = localStorage.getItem("selectedDepartment");
    const selectedDepartment = storeDeparment
      ? JSON.parse(storeDeparment)
      : null;

    if (selectedDepartment?.study_level == "BS") {
      dispatch(
        getAllStudents({
          deprt: selectedDepartment?.department_name,
          currentSemester: currentSemester,
          batchValue: batchValue,
        }),
      );
    } else {
      dispatch(getAllInterStudents({ deprt: selectedDepartment?.class_name }));
    }
  }, []);

  useEffect(() => {
    setStudents(student);
    setOriginalData(student);
  }, [student]);

  useEffect(() => {
    const loadBatches = async () => {
      try {
        const cachedBatches = localStorage.getItem("cachedBatches");

        if (cachedBatches) {
          // Use cached data
          setBatchArr(JSON.parse(cachedBatches));
          setInitialLoadDone(true);
        } else {
          const batches = [...new Set(student.map((item) => item.batch))];

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

  const searchHandler = useCallback(
    (searchData) => {
      const trim = searchData.trim().toLowerCase();
      if (!trim) return setStudents(originalData);

      const result = originalData.filter((data) => {
        const name = (data.name || "").toLowerCase();
        const father_name = (data.father_name || "").toLowerCase();
        const student_rollno = (data.student_rollno || "").toLowerCase();
        const batch = (data.batch || "").toLowerCase();
        const created_at = (data.created_at || "").toLowerCase();
        const department_name = (
          data.department?.department_name || ""
        ).toLowerCase();

        return (
          name.includes(trim) ||
          father_name.includes(trim) ||
          student_rollno.includes(trim) ||
          batch.includes(trim) ||
          created_at.includes(trim) ||
          department_name.includes(trim)
        );
      });

      setStudents(result);
    },
    [originalData],
  );

  const location = useLocation();
  const navigate = useNavigate();
  const loginSession = useSelector((state) => state.auth.session);

  useEffect(() => {
    searchHandler(isSearch);
  }, [isSearch]);

  const download = (student) => {
    const formattedData = student.map((student) => ({
      Name: student.name,
      "Father Name": student.father_name,
      Batch: student.batch,
      RollNo: student.rollno,
      "Registration No":
        student?.registration_number || student?.inter_student_registration,
      Department:
        student.department?.department_name || student?.inter?.class_name,
      "Created At": new Date(student.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      "Fee Submission":
        student.feeSubmission?.[0]?.registration_number ||
        student.feeSubmission?.[0]?.inter_student_registration
          ? "Submitted"
          : "Not Submitted",
    }));

    const departmentName =
      student[0]?.department?.department_name || student[0]?.inter?.class_name;
    const batch = student[0]?.batch || "Batch";

    const fileName = `${departmentName}_${batch}_Students.xlsx`;

    const workbook = XLSX.utils.book_new(); //Create a new workbook
    const worksheet = XLSX.utils.json_to_sheet(formattedData); //Convert data (JSON) to a worksheet
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students"); //  Append worksheet to workbook
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, fileName);
  };
  const handleBatch = (e) => {
    setBatchValue(e.target.value);
  };
  console.log("data = ", students);

  return (
    <div className="flex flex-row">
      <div className="w-1/6">
        <SideBar />
      </div>

      <div className="m-9">
        <div className="relative w-1/5 mb-6 ">
          <FaSearch className="absolute left-3 top-2.5 text-gray-300" />
          <input
            type="text"
            className="border rounded-md h-8 pl-9 pr-3 w-full p-2 focus:outline-none focus:border-gray-500"
            placeholder="Search..."
            onChange={(e) => setIsSearch(e.target.value)}
          />
        </div>
        <div className=" flex flex-row gap-2 mb-6 mt-10">
          <h1 className="font-bold mr-6">All Student List</h1>
          <label className="">Semester:</label>
          <select
            className="dropDown "
            onChange={(e) => setCurrentSemester(e.target.value)}
            value={currentSemester}
          >
            <option value="" disabled>
              Semester
            </option>
            {semester.map((item, index) => (
              <option key={index} value={item}>
                {item}
              </option>
            ))}
          </select>
          <label>Batch</label>
          <select
            className="dropDown"
            onChange={handleBatch}
            value={batchValue}
          >
            {batchArr.map((batch) => (
              <option key={batch} value={batch}>
                {batch}
              </option>
            ))}
          </select>
        </div>
        <table className="mb-10">
          <thead>
            <tr className="tableRow border-t border-gray-300">
              <td className="tableData font-semibold"> Name</td>
              <td className="tableData  font-semibold">Father Name</td>
              <td className="tableData  font-semibold">Batch</td>
              <td className="tableData  font-semibold">RollNo</td>
              <td className="tableData  font-semibold">Reg No</td>
              <td className="tableData  font-semibold">department Name</td>
              <td className="tableData  font-semibold">Id Card</td>
              <td className="tableData  font-semibold">Registration Fee</td>
              <td className="tableData  font-semibold">College Fee</td>
              <td className="tableData  font-semibold">Admission Fee</td>
              <td className="tableData  font-semibold">Exam Fee</td>
              <td className="tableData  font-semibold">CRF</td>
              <td className="tableData  font-semibold">Status</td>
              {loginSession?.user?.user_metadata?.role == "Admin" ? (
                <td>Edit</td>
              ) : (
                ""
              )}
            </tr>
          </thead>

          <tbody>
            {/* For BS students */}
            {students?.length > 0 ? (
              students.map((student, index) => (
                <tr className="tableRow" key={index}>
                  <td className="tableData">{student?.name}</td>
                  <td className="tableData">{student?.father_name}</td>
                  <td className="tableData">{student?.batch}</td>
                  <td className="tableData">{student?.rollno}</td>
                  <td className="tableData">{student?.registration_number}</td>
                  <td className="tableData">
                    {student?.department?.department_name}
                  </td>
                  <td className="tableData ">
                    {student?.feeSubmission?.[0]?.fee_type?.id_card_fee
                      ? "Paid"
                      : "-"}
                  </td>
                  <td className="tableData  ">
                    {student?.feeSubmission?.[0]?.fee_type?.registration_fee
                      ? "Paid"
                      : "-"}
                  </td>
                  <td className="tableData  ">
                    {student?.feeSubmission?.[0]?.fee_type?.college_fee
                      ? "Paid"
                      : "-"}
                  </td>
                  <td className="tableData">
                    {student?.feeSubmission?.[0]?.fee_type?.admission_fee
                      ? "Paid"
                      : "-"}
                  </td>
                  <td className="tableData  ">
                    {student?.feeSubmission?.[0]?.fee_type?.exam_fee
                      ? "Paid"
                      : "-"}
                  </td>
                  <td className="tableData  ">
                    {student?.feeSubmission?.[0]?.fee_type?.CRF ? "Paid" : "-"}
                  </td>
                  <td
                    className={`tableData ${(() => {
                      const submission = student?.feeSubmission?.[0];

                      if (!submission) {
                        return "text-red-700 font-semibold";
                      }

                      const feeType = submission.fee_type || {};

                      const isClear =
                        feeType.CRF &&
                        feeType.exam_fee &&
                        feeType.admission_fee &&
                        feeType.college_fee &&
                        feeType.registration_fee &&
                        feeType.id_card_fee;

                      return isClear
                        ? "text-green-800 font-semibold"
                        : "text-red-700 font-semibold";
                    })()}`}
                  >
                    {(() => {
                      const submission = student?.feeSubmission?.[0];

                      if (!submission) return "Pending";

                      const feeType = submission.fee_type || {};
                      const isClear =
                        feeType.CRF &&
                        feeType.exam_fee &&
                        feeType.admission_fee &&
                        feeType.college_fee &&
                        feeType.registration_fee &&
                        feeType.id_card_fee;

                      return isClear ? "Clear" : "Pending";
                    })()}
                  </td>

                  {loginSession?.user?.user_metadata?.role === "Admin" &&
                    student.feeSubmission?.[0]?.registration_number && (
                      <td>
                        <button
                          onClick={() =>
                            navigate("/feeSubmission", {
                              state: { student },
                            })
                          }
                          className="text-black underline px-3 py-1 rounded-md hover:text-sky-700 transition"
                        >
                          Edit
                        </button>
                      </td>
                    )}
                </tr>
              ))
            ) : interStudent?.length > 0 ? (
              interStudent.map((student, index) => (
                // console.log(student),
                <tr className="tableRow" key={index}>
                  <td className="tableData">{student?.name}</td>
                  <td className="tableData">{student?.father_name}</td>
                  <td className="tableData">{student?.batch}</td>
                  <td className="tableData">{student?.rollno}</td>
                  <td className="tableData">
                    {student?.inter_student_registration}
                  </td>
                  <td className="tableData">{student.inter.class_name}</td>
                  <td className="tableData">
                    {new Date(student.created_at).toLocaleDateString("es-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td
                    className={`tableData ${
                      student.feeSubmission?.[0]?.inter_student_registration
                        ? "text-green-800 font-semibold"
                        : "text-red-700 font-semibold"
                    }`}
                  >
                    {student.feeSubmission?.[0]?.inter_student_registration
                      ? "Submitted"
                      : "Not Submitted"}
                  </td>

                  {loginSession?.user?.user_metadata?.role === "Admin" &&
                    student.feeSubmission?.[0]?.inter_student_registration && (
                      <td>
                        <button
                          onClick={() =>
                            navigate("/feeSubmission", {
                              state: { student },
                            })
                          }
                          className="text-black underline px-3 py-1 rounded-md hover:text-sky-700 transition"
                        >
                          Edit
                        </button>
                      </td>
                    )}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="9"
                  className="text-center py-6 text-gray-400 italic"
                >
                  No students found
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <Button
          onClick={() =>
            download(students?.length > 0 ? students : interStudent)
          }
        >
          Download Report
        </Button>
      </div>
    </div>
  );
};
export default StudentList;
