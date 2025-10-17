import React, { useState } from "react";
import * as XLSX from "xlsx";
import "../../constant/applicationStyle.css";
import "../style/excelFileReader.css";
import Button from "../../component/button/button";
import { studentList } from "../../store/Thunk/commonThunk";
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
        "first_name",
        "last_name",
        "semester",
        "Rollno",
        "department_id",
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

  const submitStudentList = async () => {
    try {
      const invalid = data.filter(
        (row) =>
          !row["first_name"]?.trim() ||
          !row["Rollno"]?.toString().trim() ||
          !row["department_id"]?.toString().trim()
      );

      if (invalid.length > 0) {
        alert(
          "Some rows are missing required fields (first_name,RollNo, or department_id)."
        );
        return; // Stop submission if invalid
      }

      const result = await dispatch(studentList(data)).unwrap();
      setData([]);
      alert("Student list submitted successfully!");
    } catch (err) {
      console.error("Insert failed:", err);
    }
  };

  return (
    <div className="flex flex-row gap-2">
      <div className="w-1/5">
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
