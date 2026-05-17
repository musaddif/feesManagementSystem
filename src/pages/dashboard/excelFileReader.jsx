import React, { useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import "../../constant/applicationStyle.css";
import "../style/excelFileReader.css";
import Button from "../../component/button/button";
import { studentList, interStudentList } from "../../store/Thunk/commonThunk";
import { useDispatch, useSelector } from "react-redux";
import SideBar from "../../component/sideBar";
import Header from "../../component/header";

import { FaCloudUploadAlt, FaTrash, FaFileExcel, FaInfoCircle } from "react-icons/fa";
import Loader from "../../component/loader/loader";

function ExcelFileReader() {
  const dispatch = useDispatch();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsBinaryString(file);
    reader.onload = (e) => {
      const data = e.target.result;
      const workbook = XLSX.read(data, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const parseData = XLSX.utils.sheet_to_json(sheet);

      const requiredColumns = [
        "Name",
        "Father Name",
        "Batch",
        "Registration No",
        "Department",
        "RollNo",
      ];

      const filteredData = parseData.map((row) => {
        const filteredRow = {};
        requiredColumns.forEach((key) => {
          filteredRow[key] = row[key] || "";
        });
        return filteredRow;
      });
      setData(filteredData);
    };
    // Reset input so the same file can be uploaded again if cleared
    e.target.value = "";
  };

  const storedDepartment = localStorage.getItem("selectedDepartment");
  const selectedDeprt = storedDepartment ? JSON.parse(storedDepartment) : null;

  const submitStudentList = async () => {
    if (data.length === 0) return;

    setLoading(true);

    try {
      const invalid = data.filter(
        (row) =>
          !row["Name"]?.trim() ||
          !row["Registration No"]?.toString().trim() ||
          !row["Department"]?.toString().trim() ||
          !row["Batch"]?.toString().trim()
      );

      if (invalid.length > 0) {
        alert("Some rows are missing required fields (Name, Registration No, Batch, or Department).");
        setLoading(false);
        return;
      }

      if (selectedDeprt?.study_level === "BS") {
        await dispatch(studentList(data)).unwrap();
      } else {
        await dispatch(interStudentList(data)).unwrap();
      }

      setData([]);
      alert("Student list submitted successfully!");
    } catch (err) {
      console.error("Insert failed:", err);
      alert("Submission failed. Please check the data format.");
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const headers = ["Name", "Father Name", "Batch", "Registration No", "Department", "RollNo"];
    const ws = XLSX.utils.aoa_to_sheet([headers]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, "student_template.xlsx");
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <SideBar />
        <div className="flex-1 overflow-y-auto excel-reader-container">
          <div className="max-w-6xl mx-auto">
            {/* Page Header */}
            <div className="border-b border-gray-200 pb-6 mb-8 flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Bulk Student Import</h1>
                <p className="text-gray-500 mt-2">Upload student data efficiently using Excel spreadsheets.</p>
              </div>
            </div>

            {data && data.length > 0 ? (
              <div className="preview-container">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <FaFileExcel className="text-green-600" /> Preview Data ({data.length} rows)
                  </h2>
                  <button
                    onClick={() => setData([])}
                    className="flex items-center gap-1 text-red-600 hover:text-red-800 transition font-medium"
                  >
                    <FaTrash /> Clear All
                  </button>
                </div>

                <div className="overflow-x-auto max-h-[500px] border rounded-lg">
                  <table className="preview-table">
                    <thead className="sticky top-0 z-10">
                      <tr>
                        {Object.keys(data[0]).map((header, index) => (
                          <th key={index}>{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {Object.values(row).map((value, colIndex) => (
                            <td key={colIndex}>{value}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col items-center justify-center mt-8 gap-4">
                  {loading && (
                    <div className="flex justify-center items-center py-4">
                      {/* <Loader />/ */}
                    </div>
                  )}
                  <Button onClick={submitStudentList} className="px-20 py-4 text-lg" disabled={loading}>
                    {loading ? "Submitting..." : "Submit Student List"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

                  {/* Left: Upload Area */}
                  <div className="space-y-6">
                    <label className="upload-area h-64">
                      <input
                        type="file"
                        className="hidden"
                        accept=".xlsx,xls"
                        onChange={handleFileUpload}
                      />
                      <FaCloudUploadAlt className="upload-icon" />
                      <span className="upload-text">Click to upload or drag and drop</span>
                      <span className="upload-subtext">Supported formats: .xlsx, .xls</span>
                    </label>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-800">Need the format?</h3>
                          <p className="text-sm text-gray-500">Use our pre-formatted Excel template.</p>
                        </div>
                        <button
                          onClick={downloadTemplate}
                          className="template-link flex items-center gap-2"
                        >
                          <FaFileExcel /> Download Template
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right: Instructions */}
                  <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800">
                      <FaInfoCircle className="text-blue-500" /> Important Instructions
                    </h2>
                    <ul className="space-y-4 text-gray-600">
                      <li className="flex items-start gap-3">
                        <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center shrink-0 text-xs font-bold mt-1">1</span>
                        <span>Download and use the excel template from below <strong>"Download Template"</strong>.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center shrink-0 text-xs font-bold mt-1">2</span>
                        <span>Do not change template headers (not even lower or upper case letters).</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center shrink-0 text-xs font-bold mt-1">3</span>
                        <span>Fill all the columns before uploading the excel file.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center shrink-0 text-xs font-bold mt-1">4</span>
                        <span>Upload the <strong>whole batch at once</strong>, not in separate parts.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center shrink-0 text-xs font-bold mt-1">5</span>
                        <span>Review student data in the preview table before final submission.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExcelFileReader;
