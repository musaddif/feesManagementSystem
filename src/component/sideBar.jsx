import {
  FaMoneyBillWave,
  FaUserPlus,
  FaListUl,
  FaClipboardList,
  FaSignOutAlt,
  FaWallet,
  FaCog,
  FaTimes,
} from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { unwrapResult } from "@reduxjs/toolkit";
import { auth_logout } from "../store/Thunk/authThunk";
import { useSidebar } from "../context/SidebarContext";

const NAV_LINKS = [
  { to: "/students", icon: <FaClipboardList size={20} />, label: "Students" },
  { to: "/excelReader", icon: <FaUserPlus size={20} />, label: "Add Students" },
  { to: "/feeSubmission", icon: <FaMoneyBillWave size={20} />, label: "Fee Form" },
  { to: "/studentList", icon: <FaListUl size={20} />, label: "Report" },
  { to: "/amountManagement", icon: <FaWallet size={20} />, label: "Finance" },
  { to: "/admin/adminDashboard", icon: <FaCog size={20} />, label: "Setting" },
];

const SideBar = () => {
  const location = useLocation();
  const path = location.pathname;
  const dispatch = useDispatch();
  const { isSidebarOpen, closeSidebar } = useSidebar();

  const handleLogOut = async () => {
    const confirmLogout = window.confirm("Are you sure you want to logout?");
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

  const handleLinkClick = () => {
    // Close drawer on mobile after navigation
    closeSidebar();
  };

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-40
          flex flex-col
          h-full min-w-[200px] w-52
          bg-[#b8860b] rounded-e-lg
          transition-transform duration-300 ease-in-out
          md:translate-x-0 md:flex
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Close button — mobile only */}
        <div className="flex justify-end p-4 md:hidden">
          <button
            onClick={closeSidebar}
            className="text-white/80 hover:text-white transition-colors p-1"
            aria-label="Close sidebar"
          >
            <FaTimes size={22} />
          </button>
        </div>

        <nav className="flex-1 px-6 pb-6">
          <ul className="text-white space-y-6 mt-4 md:mt-14">
            {NAV_LINKS.map(({ to, icon, label }) => (
              <li
                key={to}
                className={`${path.includes(to) ? "text-black" : ""}`}
              >
                <Link
                  to={to}
                  className="flex gap-2 font-semibold items-center hover:text-black/70 transition-colors"
                  onClick={handleLinkClick}
                >
                  {icon}
                  {label}
                </Link>
              </li>
            ))}

            <li className="flex gap-2 font-semibold cursor-pointer text-white hover:text-black/70 transition-colors items-center">
              <FaSignOutAlt size={20} />
              <button onClick={handleLogOut}>Logout</button>
            </li>
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default SideBar;