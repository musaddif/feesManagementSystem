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

function ExcelFileReader() {
  const dispatch = useDispatch();

  const [data, setData] = useState([]);

  const handleFileUpload = (e) => {
    const reader = new FileReader();
    reader.readAsBinaryString(e.target.files[0]);
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
          filteredRow[key] = row[key];
        });
        return filteredRow;
      });
      setData(filteredData);
    };
  };
  // console.log("data = ", data);

  const storedDepartment = localStorage.getItem("selectedDepartment");
  const selectedDeprt = storedDepartment ? JSON.parse(storedDepartment) : null;

  const submitStudentList = async () => {
    try {
      const invalid = data.filter(
        (row) =>
          !row["Name"]?.trim() ||
          !row["Registration No"]?.toString().trim() ||
          !row["Department"]?.toString().trim() ||
          !row["Batch"]?.toString().trim()
      );

      if (invalid.length > 0) {
        alert(
          "Some rows are missing required fields (Name,RollNo,Batch or Department)."
        );
        return; // Stop submission if invalid
      }

      let result = 0;

      if (selectedDeprt?.study_level == "BS") {
        result = await dispatch(studentList(data)).unwrap();
      } else {
        result = await dispatch(interStudentList(data)).unwrap();
      }
      setData([]);
      alert("Student list submitted successfully!");
    } catch (err) {
      console.error("Insert failed:", err);
      alert("Student list submitted failed");
      setData([]);
    }
  };


  const downloadTemplate = () => {
    const headers = [
      "Name",
      "Father Name",
      "Batch",
      "Registration No",
      "Department",
      "RollNo",
    ];

    // Create a worksheet with only headers
    const ws = XLSX.utils.aoa_to_sheet([headers]);

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");

    // Generate buffer
    const excelBuffer = XLSX.write(wb, {
      bookType: "xlsx",
      type: "array",
    });

    // Create blob
    const data = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });

    // Download file
    saveAs(data, "student_template.xlsx");
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">

      <Header />


      <div className="flex flex-1 overflow-hidden">

        {/* Fixed Sidebar */}
        <div className="shrink-0 h-full overflow-hidden">
          <SideBar />
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-auto p-4 bg-gray-50">
          {data && data.length > 0 ? (
            <div className="min-w-max">
              <table className="w-full border-collapse bg-white shadow-md rounded-lg overflow-hidden">
                <thead className="sticky top-0 bg-blue-600 text-white z-10">
                  <tr>
                    {Object.keys(data[0]).map((item, index) => (
                      <th
                        key={index}
                        className="px-4 py-3 border text-left font-semibold"
                      >
                        {item}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {data.map((row, ind) => (
                    <tr
                      key={ind}
                      className="hover:bg-gray-100 border-b transition"
                    >
                      {Object.values(row).map((value, index) => (
                        <td key={index} className="px-4 py-2 border">
                          {value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>

              <Button
                className="w-2/4 bg-[#b8860b] rounded-lg py-2 mt-4 text-white font-semibold"
                onClick={submitStudentList}
              >
                Submit
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full flex-col">
              <div className="w-full max-w-md">

                {/* Upload Card */}
                <label className="bg-white shadow-md p-6 rounded-lg cursor-pointer block">
                  <input
                    type="file"
                    accept=".xlsx,xls"
                    onChange={handleFileUpload}
                  />
                </label>

                {/* Bottom Right Text */}
                <div className="flex justify-end mt-2">
                  <h1
                    onClick={downloadTemplate}
                    className="text-blue-600 underline cursor-pointer hover:text-blue-800 transition"
                  >
                    Need Excel Template?
                  </h1>
                </div>

              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default ExcelFileReader;
