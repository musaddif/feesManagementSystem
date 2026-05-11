import {
  FaMoneyBillWave,
  FaUserPlus,
  FaListUl,
  FaClipboardList,
  FaSignOutAlt,
  FaWallet,
  FaCog,
} from "react-icons/fa";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Button from "./button/button";
import { IoArrowBack } from "react-icons/io5";
import { useDispatch } from "react-redux";
import { unwrapResult } from "@reduxjs/toolkit";
import { auth_logout } from "../store/Thunk/authThunk";

const SideBar = () => {
  const location = useLocation();
  const path = location.pathname;
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogOut = async () => {
    // Popup confirmation before logout
    const confirmLogout = window.confirm(
      "Are you sure you want to logout?"
    );

    if (!confirmLogout) return;

    try {
      const resultAction = await dispatch(auth_logout());
      unwrapResult(resultAction);

      localStorage.removeItem("authToken");
      sessionStorage.clear();

      window.location.replace("/");
    } catch (error) {
      console.error("Logout failed:", error.message || error);
    }
  };

  return (
    <div className="h-full min-w-32 bg-[#b8860b] rounded-e-lg items-center p-8 flex flex-col">
      <ul className="text-white space-y-8 mt-14">

        <li className={`${path.includes("/students") ? "text-black" : ""}`}>
          <Link to="/students" className="flex gap-2 font-semibold">
            <FaClipboardList size={20} />
            Students
          </Link>
        </li>

        <li className={`${path.includes("/excelReader") ? "text-black" : ""}`}>
          <Link to="/excelReader" className="flex gap-2 font-semibold">
            <FaUserPlus size={20} />
            Add Students
          </Link>
        </li>

        <li className={`${path.includes("/feeSubmission") ? "text-black" : ""}`}>
          <Link to="/feeSubmission" className="flex gap-2 font-semibold">
            <FaMoneyBillWave size={20} />
            Fee Form
          </Link>
        </li>

        <li className={`${path.includes("/studentList") ? "text-black" : ""}`}>
          <Link to="/studentList" className="flex gap-2 font-semibold">
            <FaListUl size={20} />
            Report
          </Link>
        </li>

        <li className={`${path.includes("/amountManagement") ? "text-black" : ""}`}>
          <Link to="/amountManagement" className="flex gap-2 font-semibold">
            <FaWallet size={20} />
            Finance
          </Link>
        </li>

        <li className={`${path.includes("/admin/adminDashboard") ? "text-black" : ""}`}>
          <Link to="/admin/adminDashboard" className="flex gap-2 font-semibold">
            <FaCog size={20} />
            Setting
          </Link>
        </li>

        <li className="flex gap-2 font-semibold cursor-pointer">
          <FaSignOutAlt size={20} />
          <button onClick={handleLogOut}>Logout</button>
        </li>

      </ul>
    </div>
  );
};

export default SideBar;