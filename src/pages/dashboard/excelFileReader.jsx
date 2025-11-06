import React, { useState } from "react";
import * as XLSX from "xlsx";
import "../../constant/applicationStyle.css";
import "../style/excelFileReader.css";
import Button from "../../component/button/button";
import { studentList, interStudentList } from "../../store/Thunk/commonThunk";
import { useDispatch, useSelector } from "react-redux";
import SideBar from "../../component/sideBar";

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
  // console.log("log", data);

  const storedDepartment = localStorage.getItem("selectedDepartment");
  const selectedDeprt = storedDepartment ? JSON.parse(storedDepartment) : null;
  // console.log("feesList", selectedDeprt);

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

  return (
    <div className="flex flex-row gap-2">
      <div className="">
        <SideBar />
      </div>
      <div className="">
        {data && data.length > 0 ? (
          <div className="flex flex-col">
            <table>
              <thead>
                <tr className="tableRow">
                  {Object.keys(data[0]).map((item, index) => (
                    <th key={index} className="tableCell">
                      {item}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, ind) => (
                  <tr key={ind} className="tableRow">
                    {Object.values(row).map((value, index) => (
                      <td key={index} className="tableCell">
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <Button
              className="w-2/4 bg-[#b8860b] rounded-lg py-2 mt-4 text-white font-semibold "
              onClick={submitStudentList}
            >
              Submit
            </Button>
          </div>
        ) : (
          <div className="excelInput">
            <label>
              <input
                type="file"
                accept=".xlsx,xls"
                onChange={handleFileUpload}
              />
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
export default ExcelFileReader;
