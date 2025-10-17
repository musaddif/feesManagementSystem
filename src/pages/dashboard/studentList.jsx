import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllStudents } from "../../store/Thunk/commonThunk";
import SideBar from "../../component/sideBar";
import "../../constant/applicationStyle.css";
import "../style/excelFileReader.css";
import { FaSearch } from "react-icons/fa";
import { useLocation } from "react-router-dom";
const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [originalData, setOriginalData] = useState([]);
  const [isSearch, setIsSearch] = useState("");
  const dispatch = useDispatch();

  const student = useSelector((state) => state.common.getAllStudent);
  useEffect(() => {
    const storeDeparment = localStorage.getItem("selectedDepartment");
    const selectedDepartment = storeDeparment
      ? JSON.parse(storeDeparment)
      : null;
    //getting list by department id
    dispatch(getAllStudents({ id: selectedDepartment?.department_id }));
  }, []);

  useEffect(() => {
    setStudents(student);
    setOriginalData(student);
  }, [student]);

  const searchHandler = useCallback(
    (searchData) => {
      const trim = searchData.trim().toLowerCase();
      if (!trim) return setStudents(originalData);

      const result = originalData.filter((data) => {
        const first_name = (data.first_name || "").toLowerCase();
        const last_name = (data.last_name || "").toLowerCase();
        const student_rollno = (data.student_rollno || "").toLowerCase();
        const semester = (data.semester || "").toLowerCase();
        const created_at = (data.created_at || "").toLowerCase();
        const department_name = (
          data.department?.department_name || ""
        ).toLowerCase();

        return (
          first_name.includes(trim) ||
          last_name.includes(trim) ||
          student_rollno.includes(trim) ||
          semester.includes(trim) ||
          created_at.includes(trim) ||
          department_name.includes(trim)
        );
      });

      setStudents(result);
    },
    [originalData]
  );

  const location = useLocation();
  // const selectedDepartment = location.state?.selectedDepartment;
  // console.log("dataaa", selectedDepartment);

  useEffect(() => {
    searchHandler(isSearch);
  }, [isSearch]);

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
        <h1 className="font-bold mt-10 mb-6">All Student List</h1>
        <table className="">
          <thead>
            <tr className="tableRow border-t border-gray-300">
              <td className="tableData font-semibold"> First Name</td>
              <td className="tableData  font-semibold">Last Name</td>
              <td className="tableData  font-semibold">Semester</td>
              <td className="tableData  font-semibold">RollNo</td>
              <td className="tableData  font-semibold">department Name</td>
              <td className="tableData  font-semibold">department Id</td>
              <td className="tableData  font-semibold">created At</td>
              <td className="tableData  font-semibold">Status</td>
            </tr>
          </thead>

          <tbody>
            {students.length > 0 ? (
              students.map((student, index) => (
                <tr className="tableRow" key={index}>
                  <td className="tableData">{student?.first_name}</td>
                  <td className="tableData">{student?.last_name}</td>
                  <td className="tableData">{student?.semester}</td>
                  <td className="tableData">{student?.student_rollno}</td>
                  <td className="tableData">
                    {student?.department?.department_name}
                  </td>
                  <td className="tableData">{student?.department_id}</td>
                  <td className="tableData">
                    {new Date(student.created_at).toLocaleDateString("es-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="4"
                  className="text-center py-6 text-gray-400 italic"
                >
                  No students found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default StudentList;
