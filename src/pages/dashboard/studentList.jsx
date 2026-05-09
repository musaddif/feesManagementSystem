import { useCallback, useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllStudents,
  getAllInterStudents,
  getSemesterStudents,
  getInterClassStudents,
  unsubmitFee,
  unsubmitInterFee,
} from "../../store/Thunk/commonThunk";
import SideBar from "../../component/sideBar";
import "../../constant/applicationStyle.css";
// import "./studentList.css"; // New dedicated CSS
import "../style/studentList.css"
import { FaSearch, FaDownload, FaEdit, FaUndo } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import Button from "../../component/button/button";
import { semester, inter_class, intermediateClasses } from "../../constant/lists";
import Header from "../../component/header";
import { TableSkeleton } from "../../component/loader/skeleton";

const StudentList = () => {
  const [batchArr, setBatchArr] = useState([]);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [students, setStudents] = useState([]);
  const [originalData, setOriginalData] = useState([]);
  const [isSearch, setIsSearch] = useState("");
  const [currentSemester, setCurrentSemester] = useState("");
  const [interClass, setInterClass] = useState("");
  const [batchValue, setBatchValue] = useState("");
  const [feeStatus, setFeeStatus] = useState("All");

  const dispatch = useDispatch();
  const student = useSelector((state) => state.common.getAllStudent);
  const interStudent = useSelector((state) => state.common.getAllInterStudent);
  const storedDepartment = localStorage.getItem("selectedDepartment");
  const selectedDepartment = useMemo(() =>
    storedDepartment ? JSON.parse(storedDepartment) : null,
    [storedDepartment]
  );
  const selectedDeprt = selectedDepartment;
  const globalLoading = useSelector((state) => state.common.loading);
  const loginSession = useSelector((state) => state.auth.session);

  const renderFeeStatus = (isPaid) => (
    <span className={`status-badge ${isPaid ? "status-paid" : "status-pending"}`}>
      {isPaid ? "Paid" : "-"}
    </span>
  );

  const getStudentStatus = (student) => {
    const isBS = selectedDepartment?.study_level === "BS";
    const target = isBS ? currentSemester : interClass;

    // Find submission matching the current filter, or fallback to the first one
    const submission = target
      ? student?.feeSubmission?.find(fs => fs.semester === target)
      : student?.feeSubmission?.[0];

    if (!submission) return { text: "Pending", className: "status-pending" };

    const feeType = submission.fee_type || {};

    const isClear =
      feeType.CRF &&
      feeType.exam_fee &&
      feeType.admission_fee &&
      feeType.college_fee &&
      feeType.registration_fee &&
      (isBS ?
        (["2nd", "4th", "6th", "8th", "10th"].includes(currentSemester) ? true : feeType.id_card_fee) :
        feeType.id_card_fee);

    return isClear
      ? { text: "Clear", className: "status-clear" }
      : { text: "Pending", className: "status-pending" };
  };

  useEffect(() => {
    if (selectedDepartment?.study_level === "BS") {
      dispatch(
        getSemesterStudents({
          deprt: selectedDepartment?.department_name,
          currentSemester: currentSemester,
          batchValue: batchValue,
        })
      );
    } else {
      dispatch(
        getInterClassStudents({
          deprt: selectedDepartment?.class_name,
          interClass: interClass,
          batchValue: batchValue,
        })
      );
    }
  }, [currentSemester, interClass, batchValue, dispatch]);

  useEffect(() => {
    if (selectedDepartment?.study_level === "BS") {
      dispatch(
        getAllStudents({
          deprt: selectedDepartment?.department_name,
          currentSemester: currentSemester,
          batchValue: batchValue,
        })
      );
    } else {
      dispatch(
        getAllInterStudents({
          deprt: selectedDepartment?.class_name,
        })
      );
    }
  }, [dispatch]);

  useEffect(() => {
    const data = selectedDepartment?.study_level === "BS" ? student : interStudent;
    setStudents(data);
    setOriginalData(data);
  }, [student, interStudent, selectedDepartment]);

  useEffect(() => {
    const loadBatches = () => {
      try {
        const cachedBatches = localStorage.getItem(`batches_${selectedDepartment?.department_name || selectedDepartment?.class_name}`);
        if (cachedBatches) {
          setBatchArr(JSON.parse(cachedBatches));
        } else if (student.length > 0) {
          const batches = [...new Set(student.map((item) => item.batch))].filter(Boolean).sort();
          setBatchArr(batches);
          localStorage.setItem(`batches_${selectedDepartment?.department_name || selectedDepartment?.class_name}`, JSON.stringify(batches));
        }
      } catch (error) {
        console.error("Error loading batches:", error);
      }
    };
    loadBatches();
  }, [student, selectedDepartment]);

  const applyFilters = useCallback(
    (searchValue, statusFilter) => {
      let result = [...originalData];

      // Apply Search Filter
      const trim = searchValue.trim().toLowerCase();
      if (trim) {
        result = result.filter((data) => {
          const name = (data.name || "").toLowerCase();
          const reg_no = (data.registration_number || data.inter_student_registration || "").toLowerCase();
          const rollno = data.rollno?.toString().toLowerCase() || "";
          return name.includes(trim) || reg_no.includes(trim) || rollno.includes(trim);
        });
      }

      // Apply Fee Status Filter
      if (statusFilter !== "All") {
        result = result.filter((student) => {
          const status = getStudentStatus(student);
          return status.text === statusFilter;
        });
      }

      setStudents(result);
    },
    [originalData, currentSemester, interClass, selectedDepartment]
  );

  useEffect(() => {
    applyFilters(isSearch, feeStatus);
  }, [isSearch, feeStatus, applyFilters]);

  const navigate = useNavigate();

  const downloadReport = () => {
    const dataToExport = students;
    const formattedData = dataToExport.map((student) => {
      const isBS = selectedDepartment?.study_level === "BS";
      const target = isBS ? currentSemester : interClass;
      const submission = target
        ? student?.feeSubmission?.find(fs => fs.semester === target)
        : student?.feeSubmission?.[0];

      const ft = submission?.fee_type || {};

      return {
        Name: student.name,
        "Father Name": student.father_name,
        Batch: student.batch,
        RollNo: student.rollno,
        "Registration No": student?.registration_number || student?.inter_student_registration,
        Department: student.department?.department_name || student?.inter?.class_name,
        Semester: currentSemester || interClass,
        "CRF": ft.CRF ? "Paid" : "Pending",
        "Admission Fee": ft.admission_fee ? "Paid" : "Pending",
        "Exam Fee": ft.exam_fee ? "Paid" : "Pending",
        "College Fee": ft.college_fee ? "Paid" : "Pending",
        "Registration Fee": ft.registration_fee ? "Paid" : "Pending",
        "ID Card Fee": ft.id_card_fee ? "Paid" : "Pending",
        "Status": getStudentStatus(student).text
      };
    });

    const departmentName = selectedDepartment?.department_name || selectedDepartment?.class_name;
    const fileName = `${departmentName}_${currentSemester || interClass || "All"}_Report.xlsx`;

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(data, fileName);
  };

  return (
    <div className="student-list-container">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <SideBar />
        <main className="student-list-content">
          <header className="page-header">
            <h1 className="page-title">
              {selectedDeprt?.department_name || selectedDeprt?.class_name}
            </h1>
            <p className="page-subtitle">Departmental Student Management System</p>
          </header>

          <section className="controls-card">
            <div className="controls-grid">
              <div className="search-wrapper">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search by name, roll no, or registration..."
                  value={isSearch}
                  onChange={(e) => setIsSearch(e.target.value)}
                />
              </div>

              <div className="filter-group">
                {selectedDepartment?.study_level === "BS" ? (
                  <div className="filter-item">
                    <label className="filter-label">Semester</label>
                    <select
                      className="filter-select"
                      onChange={(e) => setCurrentSemester(e.target.value)}
                      value={currentSemester}
                    >
                      <option value="">All Semesters</option>
                      {semester.map((item, index) => (
                        <option key={index} value={item}>{item}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="filter-item">
                    <label className="filter-label">Class</label>
                    <select
                      className="filter-select"
                      onChange={(e) => setInterClass(e.target.value)}
                      value={interClass}
                    >
                      <option value="">All Classes</option>
                      {intermediateClasses.map((item, index) => (
                        <option key={index} value={item}>{item}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="filter-item">
                  <label className="filter-label">Batch</label>
                  <select
                    className="filter-select"
                    onChange={(e) => setBatchValue(e.target.value)}
                    value={batchValue}
                  >
                    <option value="">All Batches</option>
                    {batchArr.map((batch) => (
                      <option key={batch} value={batch}>{batch}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-item">
                  <label className="filter-label">Fee Status</label>
                  <select
                    className="filter-select"
                    onChange={(e) => setFeeStatus(e.target.value)}
                    value={feeStatus}
                  >
                    <option value="All">All Status</option>
                    <option value="Clear">Clear</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          <section className="table-container">
            <div className="custom-table-wrapper">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Student Info</th>
                    <th>Roll No</th>
                    <th>Reg No</th>
                    <th>ID Card</th>
                    <th>Reg Fee</th>
                    <th>College</th>
                    <th>Admission</th>
                    <th>Exam</th>
                    <th>CRF</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {globalLoading && students.length === 0 ? (
                    <tr className="loading-row">
                      <td colSpan="11">
                        <TableSkeleton rows={8} cols={11} />
                      </td>
                    </tr>
                  ) : students.length > 0 ? (
                    students.map((student, index) => {
                      const status = getStudentStatus(student);
                      const isBS = selectedDepartment?.study_level === "BS";
                      const target = isBS ? currentSemester : interClass;

                      // Find submission matching the current filter, or fallback to the first one
                      const submission = target
                        ? student?.feeSubmission?.find(fs => fs.semester === target)
                        : student?.feeSubmission?.[0];

                      const feeType = submission?.fee_type || {};
                      const regNo = isBS ? student.registration_number : student.inter_student_registration;

                      return (
                        <tr key={student.id || index}>
                          <td>
                            <div className="font-bold">{student.name}</div>
                            <div className="text-xs text-gray-500">{student.father_name}</div>
                            <div className="text-xs text-blue-500">Batch: {student.batch}</div>
                          </td>
                          <td>{student.rollno}</td>
                          <td>{regNo}</td>
                          <td>
                            {isBS && ["2nd", "4th", "6th", "8th", "10th"].includes(currentSemester)
                              ? <span className="text-gray-400">N/A</span>
                              : renderFeeStatus(feeType.id_card_fee)}
                          </td>
                          <td>{renderFeeStatus(feeType.registration_fee)}</td>
                          <td>{renderFeeStatus(feeType.college_fee)}</td>
                          <td>{renderFeeStatus(feeType.admission_fee)}</td>
                          <td>{renderFeeStatus(feeType.exam_fee)}</td>
                          <td>{renderFeeStatus(feeType.CRF)}</td>
                          <td>
                            <span className={`status-badge ${status.className}`}>
                              {status.text}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="11" className="empty-state">
                        <div className="empty-state-text">No students found for current selection</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <footer className="list-footer">
            <div className="download-btn-wrapper">
              <Button
                className="w-full flex items-center justify-center gap-2"
                onClick={downloadReport}
                disabled={students.length === 0}
              >
                <FaDownload /> Download Excel Report
              </Button>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default StudentList;
