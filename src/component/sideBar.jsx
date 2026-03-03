import {
  FaMoneyBillWave,
  FaUserPlus,
  FaListUl,
  FaClipboardList,
  FaSignOutAlt,
} from "react-icons/fa";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Button from "./button/button";
import { IoArrowBack } from "react-icons/io5";
// import { logout } from "../store/slices/authSlices";
import { useDispatch, useSelector } from "react-redux";
import { unwrapResult } from "@reduxjs/toolkit";
import { auth_logout } from "../store/Thunk/authThunk";

const SideBar = () => {
  const location = useLocation();
  const path = location.pathname;
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogOut = async () => {
    try {
      const resultAction = await dispatch(auth_logout());
      unwrapResult(resultAction);

      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error.message || error);
    }
  };

  return (
    <div className="h-full min-h-screen min-w-32 bg-[#b8860b]  rounded-e-lg   items-center p-8 flex-col">
      {/* <h1 className="text-white text-xl font-bold mb-6">Manage fee</h1> */}
      <Button
        onClick={() => navigate("/dashboard")}
        className="text-white mt-2 flex flex-row gap-2"
      >
        <IoArrowBack size={20} /> Back
      </Button>
      <ul className="text-white space-y-8 mt-14">
        <li
          className={`hover:text-gray-300 cursor-pointer font-semibold flex flex-row gap-2
        ${path.includes("/students") ? "text-black" : ""}
        `}
        >
          <Link to="/students" className="flex flex-row gap-2">
            <FaClipboardList size={20} />
            Students
          </Link>
        </li>
        <li
          className={`hover:text-gray-300 cursor-pointer font-semibold ${
            path.includes("/excelReader") ? "text-black" : ""
          }`}
        >
          <Link to="/excelReader" className="flex flex-row gap-2">
            <FaUserPlus size={20} />
            Add Stdudents
          </Link>
        </li>
        <li
          className={`hover:text-gray-300 cursor-pointer font-semibold ${
            path.includes("/feeSubmission") ? "text-black" : ""
          }`}
        >
          <Link to="/feeSubmission" className="flex flex-row gap-2">
            <FaMoneyBillWave size={20} />
            Fee From
          </Link>
        </li>

        <li
          className={` hover:text-gray-300 cursor-pointer font-semibold flex flex-row gap-2 ${
            path.includes("/studentList") ? "text-black" : ""
          }`}
        >
          <Link to="/studentList" className="flex flex-row gap-2">
            <FaListUl size={20} />
            List Students
          </Link>
        </li>
        <li
          className={`hover:text-gray-300 cursor-pointer font-semibold flex flex-row gap-2
        ${path.includes("/report") ? "text-black" : ""}
        `}
        >
          <Link to="/report" className="flex flex-row gap-2">
            <FaClipboardList size={20} />
            Report
          </Link>
        </li>

        <li className="hover:text-gray-300 cursor-pointer font-semibold flex flex-row gap-2  ">
          <FaSignOutAlt size={20} />
          <button onClick={handleLogOut}>logout</button>
        </li>
      </ul>
    </div>
  );
};
export default SideBar;
