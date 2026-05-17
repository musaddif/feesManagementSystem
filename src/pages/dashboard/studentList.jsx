import { useCallback, useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllStudents,
  getAllInterStudents,
  allDepartments,
  getFScdeprt,
  getAllFeesData,
} from "../../store/Thunk/commonThunk";
import { getstudentList, getInterStudentList } from "../../store/slices/commonSlices";
import SideBar from "../../component/sideBar";
import "../../constant/applicationStyle.css";
import "../style/studentList.css";
import { FaSearch, FaDownload } from "react-icons/fa";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import Button from "../../component/button/button";
import { semester, inter_class } from "../../constant/lists";
import Header from "../../component/header";
import { TableSkeleton } from "../../component/loader/skeleton";

// ── Constants ────────────────────────────────────────────────────────────────
const FEE_COLUMNS = [
  { label: "Registration Fee", shortLabel: "Reg Fee", field: "registration_fee" },
  { label: "Admission Fee", shortLabel: "Admission", field: "admission_fee" },
  { label: "College Fee", shortLabel: "College", field: "college_fee" },
  { label: "Exam Fee", shortLabel: "Exam", field: "exam_fee" },
  { label: "CRF", shortLabel: "CRF", field: "CRF" },
  { label: "ID Card Fee", shortLabel: "ID Card", field: "id_card_fee" },
  { label: "Repeat Paper Fee", shortLabel: "Repeat", field: "repeat_paper_fee" },
];

const FEE_TYPE_OPTIONS = ["All", ...FEE_COLUMNS.map(c => c.label)];

// Maps display label → feeSubmission.fee_type key
const FEE_FIELD_MAP = FEE_COLUMNS.reduce((acc, col) => {
  acc[col.label] = col.field;
  return acc;
}, {});

// ── Component ────────────────────────────────────────────────────────────────
const StudentList = () => {
  // study_level is set globally in Settings → localStorage
  const studyLevel = useMemo(() => {
    try {
      const stored = localStorage.getItem("selectedDepartment");
      if (stored) return JSON.parse(stored)?.study_level || "";
    } catch { /* ignore */ }
    return "";
  }, []);

  const isBS = studyLevel === "BS";

  // ── Filter state ──────────────────────────────────────────────────────────
  const [selectedDept, setSelectedDept] = useState(null);
  const [batchArr, setBatchArr] = useState([]);
  const [batchValue, setBatchValue] = useState("");
  const [currentSemester, setCurrentSemester] = useState("");
  const [interClass, setInterClass] = useState("");
  const [feeStatus, setFeeStatus] = useState("All");
  const [selectedFeeTypes, setSelectedFeeTypes] = useState(["All"]);
  const [isSearch, setIsSearch] = useState("");

  // ── Local data state ──────────────────────────────────────────────────────
  const [students, setStudents] = useState([]);
  const [originalData, setOriginalData] = useState([]);

  const dispatch = useDispatch();

  // ── Redux state ───────────────────────────────────────────────────────────
  const bsDepartments = useSelector((s) => s.common.department);
  const interDepts = useSelector((s) => s.common.interDepartments);
  const student = useSelector((s) => s.common.getAllStudent);
  const interStudent = useSelector((s) => s.common.getAllInterStudent);
  const allFeesData = useSelector((s) => s.common.allFees);
  const globalLoading = useSelector((s) => s.common.loading);
  console.log("interDepts=", interDepts);

  // ── Load department lists on mount ────────────────────────────────────────
  useEffect(() => {
    dispatch(allDepartments());
    dispatch(getFScdeprt());
    dispatch(getAllFeesData());
  }, [dispatch]);

  // ── Department options driven by study_level ──────────────────────────────
  const departmentOptions = useMemo(() => {
    if (isBS) return bsDepartments;
    if (studyLevel === "Intermediate") return interDepts;
    return [];
  }, [isBS, studyLevel, bsDepartments, interDepts]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  /** Department change — when switching to "All Depts" keep semester/batch; when switching to a new specific dept reset them */
  const handleDeptChange = (e) => {
    const val = e.target.value;
    if (!val) {
      // "All Departments" selected — keep semester/batch, just clear stale data
      setSelectedDept(null);
      setStudents([]);
      setOriginalData([]);
      dispatch(getstudentList([]));
      dispatch(getInterStudentList([]));
      return;
    }
    const deptObj = isBS
      ? bsDepartments.find((d) => String(d.id) === val || d.department_name === val)
      : interDepts.find((d) => String(d.id) === val || d.class_name === val);

    setSelectedDept(deptObj || null);
    // Reset batch (dept-specific) but keep semester/class filter
    setBatchValue("");
    setBatchArr([]);
    setStudents([]);
    setOriginalData([]);
    dispatch(getstudentList([]));
    dispatch(getInterStudentList([]));
  };

  /** When Fee Type changes, reset Fee Status to a safe default */
  /** Toggles a fee type checkbox with specific All vs Individual rules */
  const handleFeeTypeToggle = (type) => {
    setSelectedFeeTypes((prev) => {
      if (type === "All") return ["All"];

      let next = prev.filter((t) => t !== "All");
      if (next.includes(type)) {
        next = next.filter((t) => t !== type);
      } else {
        next.push(type);
      }

      return next.length === 0 ? ["All"] : next;
    });
    setFeeStatus("All");
  };

  // ── Main data fetch ───────────────────────────────────────────────────────
  // Runs whenever any filter changes. Works with or without selectedDept.
  useEffect(() => {
    if (!studyLevel) return;

    const deprtKey = isBS
      ? selectedDept?.department_name || null
      : selectedDept?.id ?? selectedDept?.class_name ?? null;

    if (isBS) {
      dispatch(getAllStudents({
        deprt: deprtKey,
        batchValue,
        currentSemester,
      }));
    } else {
      dispatch(getAllInterStudents({
        deprt: deprtKey,
        batchValue,
        interClass,
      }));
    }
  }, [studyLevel, isBS, selectedDept, batchValue, currentSemester, interClass, dispatch]);

  // ── Sync Redux → local state ──────────────────────────────────────────────
  useEffect(() => {
    const data = isBS ? student : interStudent;
    const safe = Array.isArray(data) ? data : [];
    setStudents(safe);
    setOriginalData(safe);
  }, [student, interStudent, isBS]);

  // ── Build batch list from returned data ───────────────────────────────────
  useEffect(() => {
    if (!studyLevel) return;
    const data = isBS ? student : interStudent;
    if (!Array.isArray(data) || data.length === 0) return;
    const batches = [...new Set(data.map((s) => s.batch).filter(Boolean))].sort();
    setBatchArr(batches);
  }, [student, interStudent, isBS, studyLevel]);

  // ── Status helper ─────────────────────────────────────────────────────────
  /**
   * Returns the display status for a student row.
   * If a specific feeType is selected, status reflects only that fee.
   * Otherwise uses overall Clear/Pending logic.
   */
  const getStudentStatus = useCallback(
    (s, selectedTypes = ["All"]) => {
      const target = isBS ? currentSemester : interClass;
      const submission = target
        ? s?.feeSubmission?.find((fs) => fs.semester === target)
        : s?.feeSubmission?.[0];

      const ft = submission?.fee_type || {};

      // If specific types are selected, status is relative to those
      if (!selectedTypes.includes("All")) {
        const allPaid = selectedTypes.every((type) => {
          const field = FEE_FIELD_MAP[type];
          return field ? !!ft[field] : false;
        });
        return allPaid
          ? { text: "Paid", className: "status-paid" }
          : { text: "Pending", className: "status-pending" };
      }

      // Overall status logic for "All"
      if (!submission) return { text: "Pending", className: "status-pending" };
      const isClear =
        ft.CRF &&
        ft.exam_fee &&
        ft.admission_fee &&
        ft.college_fee &&
        ft.registration_fee &&
        (isBS
          ? ["2nd", "4th", "6th", "8th", "10th"].includes(currentSemester) || ft.id_card_fee
          : ft.id_card_fee);

      return isClear
        ? { text: "Clear", className: "status-clear" }
        : { text: "Pending", className: "status-pending" };
    },
    [isBS, currentSemester, interClass]
  );

  const renderFeeStatus = (isPaid, extraInfo = "") => (
    <span className={`status-badge ${isPaid ? "status-paid" : "status-pending"}`}>
      {isPaid ? (extraInfo ? `Paid (${extraInfo})` : "Paid") : "-"}
    </span>
  );

  // ── Client-side filtering (search + fee status + fee type) ────────────────
  const applyFilters = useCallback(
    (searchValue, statusFilter, selectedTypes) => {
      let result = [...originalData];

      // 1. Text search
      const trim = searchValue.trim().toLowerCase();
      if (trim) {
        result = result.filter((d) => {
          const name = (d.name || "").toLowerCase();
          const reg = (d.registration_number || d.inter_student_registration || "").toLowerCase();
          const roll = (d.rollno?.toString() || "").toLowerCase();
          return name.includes(trim) || reg.includes(trim) || roll.includes(trim);
        });
      }

      // 2. Fee Status filter
      if (statusFilter !== "All") {
        result = result.filter((s) => {
          const status = getStudentStatus(s, selectedTypes);
          return status.text === statusFilter;
        });
      }

      setStudents(result);
    },
    [originalData, getStudentStatus]
  );

  useEffect(() => {
    applyFilters(isSearch, feeStatus, selectedFeeTypes);
  }, [isSearch, feeStatus, selectedFeeTypes, applyFilters]);

  // ── Fee Status dropdown options (change based on Fee Type) ────────────────
  const feeStatusOptions = selectedFeeTypes.includes("All")
    ? [
      { value: "All", label: "All Status" },
      { value: "Clear", label: "Clear" },
      { value: "Pending", label: "Pending" },
    ]
    : [
      { value: "All", label: "All" },
      { value: "Paid", label: "Paid" },
      { value: "Pending", label: "Pending" },
    ];

  // ── Total Collected Calculation ───────────────────────────────────────────
  const totalAmountCollected = useMemo(() => {
    if (!students.length || !allFeesData.length) return 0;

    return students.reduce((grandTotal, s) => {
      const target = isBS ? currentSemester : interClass;
      const submission = target
        ? s?.feeSubmission?.find((fs) => fs.semester === target)
        : s?.feeSubmission?.[0];

      if (!submission) return grandTotal;

      const ft = submission.fee_type || {};
      
      // Find matching fee structure for this student
      const deptName = isBS 
        ? s.department?.department_name 
        : s?.inter?.class_name;
      
      const feeStructure = allFeesData.find(f => {
        if (isBS) {
          return f.department_name === deptName && f.semester === submission.semester;
        } else {
          return f.inter_class === submission.semester;
        }
      });

      if (!feeStructure) return grandTotal;

      let studentPaidSum = 0;
      const selectedTypes = selectedFeeTypes.includes("All") 
        ? FEE_COLUMNS.map(c => c.label) 
        : selectedFeeTypes;

      selectedTypes.forEach(typeLabel => {
        const field = FEE_FIELD_MAP[typeLabel];
        if (field && ft[field]) {
          let feeAmount = Number(feeStructure[field]) || 0;
          if (field === "repeat_paper_fee") {
            feeAmount = feeAmount * (submission.repeat_paper_count || 1);
          }
          studentPaidSum += feeAmount;
        }
      });

      return grandTotal + studentPaidSum;
    }, 0);
  }, [students, selectedFeeTypes, allFeesData, isBS, currentSemester, interClass]);

  // ── Excel download ────────────────────────────────────────────────────────
  const downloadReport = () => {
    const visibleCols = selectedFeeTypes.includes("All")
      ? FEE_COLUMNS
      : FEE_COLUMNS.filter(c => selectedFeeTypes.includes(c.label));

    const formattedData = students.map((s) => {
      const target = isBS ? currentSemester : interClass;
      const submission = target
        ? s?.feeSubmission?.find((fs) => fs.semester === target)
        : s?.feeSubmission?.[0];
      const ft = submission?.fee_type || {};

      const row = {
        Name: s.name,
        "Father Name": s.father_name,
        Batch: s.batch,
        RollNo: s.rollno,
        "Registration No": s.registration_number || s.inter_student_registration,
        Department: s.department?.department_name || s?.inter?.class_name,
        Semester: currentSemester || interClass,
      };

      // Dynamic fee columns
      visibleCols.forEach(col => {
        if (ft[col.field]) {
          if (col.field === "repeat_paper_fee" && submission.repeat_paper_count > 0) {
            row[col.label] = `Paid (${submission.repeat_paper_count})`;
          } else {
            row[col.label] = "Paid";
          }
        } else {
          row[col.label] = "Pending";
        }
      });

      row.Status = getStudentStatus(s, selectedFeeTypes).text;
      return row;
    });

    const deptLabel = selectedDept?.department_name || selectedDept?.class_name || "All";
    const fileName = `${deptLabel}_${currentSemester || interClass || "All"}_Report.xlsx`;
    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
    const buf = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
      fileName
    );
  };

  // ── Derived page title ────────────────────────────────────────────────────
  const pageTitle = selectedDept
    ? selectedDept.department_name || selectedDept.class_name
    : `All Departments${studyLevel ? ` — ${studyLevel}` : ""}`;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="student-list-container">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-shrink-0 h-full">
          <SideBar />
        </div>
        <main className="student-list-content">

          {/* Page Header */}
          <header className="page-header">
            <h1 className="page-title">{pageTitle}</h1>
            <p className="page-subtitle">
              {studyLevel
                ? `${studyLevel} · Departmental Student Management`
                : "Departmental Student Management System"}
            </p>
          </header>

          {/* Filters */}
          <section className="controls-card">
            {!studyLevel && (
              <div className="sl-prompt" style={{ marginBottom: "1rem" }}>
                ⚠️ No study level configured. Please set it in <strong>Settings</strong> first.
              </div>
            )}

            <div className="controls-grid">
              {/* Search */}
              <div className="search-wrapper">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search by name, roll no, or registration…"
                  value={isSearch}
                  onChange={(e) => setIsSearch(e.target.value)}
                />
              </div>

              <div className="filter-group">
                {/* 1. Department */}
                <div className="filter-item">
                  <label className="filter-label">{isBS ? "Department" : "Class"}</label>
                  <select
                    id="department-select"
                    className="filter-select"
                    value={
                      selectedDept
                        ? String(selectedDept.id ?? selectedDept.department_name ?? selectedDept.class_name)
                        : ""
                    }
                    onChange={handleDeptChange}
                    disabled={!studyLevel || departmentOptions.length === 0}
                  >
                    <option value="">
                      {!studyLevel ? "— Configure Settings First —" : "All Departments"}
                    </option>
                    {departmentOptions.map((d) => {
                      const val = String(d.id ?? d.department_name ?? d.class_name);
                      const label = d.department_name || d.class_name;
                      return <option key={val} value={val}>{label}</option>;
                    })}
                  </select>
                </div>
                {/* 2. Semester / Class — always enabled when study level known */}
                {isBS ? (
                  <div className="filter-item">
                    <label className="filter-label">Semester</label>
                    <select
                      id="semester-select"
                      className="filter-select"
                      value={currentSemester}
                      onChange={(e) => setCurrentSemester(e.target.value)}
                      disabled={!studyLevel}
                    >
                      <option value="">All Semesters</option>
                      {semester.filter((s) => s !== "All").map((item, i) => (
                        <option key={i} value={item}>{item} Semester</option>
                      ))}
                    </select>
                  </div>
                ) : studyLevel === "Intermediate" ? (
                  <div className="filter-item">
                    <label className="filter-label">Part</label>
                    <select
                      id="inter-class-select"
                      className="filter-select"
                      value={interClass}
                      onChange={(e) => setInterClass(e.target.value)}
                      disabled={!studyLevel}
                    >
                      <option value="">All Parts</option>
                      {inter_class.map((item, i) => (
                        <option key={i} value={item}>{item}</option>
                      ))}
                    </select>
                  </div>
                ) : null}

                {/* 3. Batch — always enabled when study level known */}
                <div className="filter-item">
                  <label className="filter-label">Batch</label>
                  <select
                    id="batch-select"
                    className="filter-select"
                    value={batchValue}
                    onChange={(e) => setBatchValue(e.target.value)}
                    disabled={!studyLevel}
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
                    id="fee-status-select"
                    className="filter-select"
                    value={feeStatus}
                    onChange={(e) => setFeeStatus(e.target.value)}
                  >
                    {feeStatusOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 4. Fee Type Multi-Select */}
              <div className="fee-type-section">
                <label className="filter-label">Fee Type Selection</label>
                <div className="fee-checkbox-group">
                  {FEE_TYPE_OPTIONS.map((opt) => (
                    <label key={opt} className={`fee-checkbox-item ${selectedFeeTypes.includes(opt) ? "active" : ""}`}>
                      <input
                        type="checkbox"
                        checked={selectedFeeTypes.includes(opt)}
                        onChange={() => handleFeeTypeToggle(opt)}
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="filter-group">

              </div>
            </div>
          </section>

          {/* Table */}
          <section className="table-container">
            <div className="custom-table-wrapper">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Student Info</th>
                    <th>Roll No</th>
                    {(selectedFeeTypes.includes("All") ? FEE_COLUMNS : FEE_COLUMNS.filter(c => selectedFeeTypes.includes(c.label))).map(col => (
                      <th key={col.field}>{col.shortLabel}</th>
                    ))}
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {globalLoading ? (
                    <tr className="loading-row">
                      <td colSpan="10">
                        <TableSkeleton rows={8} cols={10} />
                      </td>
                    </tr>
                  ) : students.length > 0 ? (
                    students.map((s, index) => {
                      const status = getStudentStatus(s, selectedFeeTypes);
                      const target = isBS ? currentSemester : interClass;
                      const submission = target
                        ? s?.feeSubmission?.find((fs) => fs.semester === target)
                        : s?.feeSubmission?.[0];
                      const ft = submission?.fee_type || {};
                      const regNo = isBS
                        ? s.registration_number
                        : s.inter_student_registration;

                      const visibleCols = selectedFeeTypes.includes("All")
                        ? FEE_COLUMNS
                        : FEE_COLUMNS.filter(c => selectedFeeTypes.includes(c.label));

                      return (
                        <tr key={s.id || index}>
                          <td>
                            <div className="font-bold">{s.name}</div>
                            <div className="text-xs text-gray-500">{s.father_name}</div>
                            <div className="text-xs text-blue-500">Batch: {s.batch}</div>
                          </td>
                          <td>{regNo}</td>
                          {visibleCols.map(col => (
                            <td key={col.field}>
                              {col.field === "id_card_fee" && isBS && ["2nd", "4th", "6th", "8th", "10th"].includes(currentSemester)
                                ? <span className="text-gray-400">N/A</span>
                                : renderFeeStatus(ft[col.field], col.field === "repeat_paper_fee" && submission?.repeat_paper_count > 0 ? submission.repeat_paper_count : "")}
                            </td>
                          ))}
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
                      <td colSpan="10" className="empty-state">
                        <div className="empty-state-text">
                          {!studyLevel
                            ? "Study level not configured. Please update Settings."
                            : globalLoading
                              ? "Loading…"
                              : "No students found for current selection."}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Summary Section */}
          <section className="total-summary-card">
            <div className="total-content">
              <span className="total-label">Total Amount Collected</span>
              <div className="total-value">
                <span className="currency">Rs.</span>
                <span className="amount">{totalAmountCollected.toLocaleString()}</span>
              </div>
            </div>
            <p className="total-helper-text">
              Based on {students.length} filtered records and selected fee types
            </p>
          </section>

          {/* Footer */}
          <footer className="list-footer">
            <div className="download-btn-wrapper w-full sm:w-auto">
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
