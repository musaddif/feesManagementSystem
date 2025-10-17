import { FaMoneyBillWave, FaUserPlus, FaListUl } from "react-icons/fa";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Button from "./button/button";
import { IoArrowBack } from "react-icons/io5";

const SideBar = () => {
  const location = useLocation();
  const path = location.pathname;
  const navigate = useNavigate();

  return (
    <div className="h-screen  fixed bg-[#b8860b]  rounded-lg   items-center p-8 flex-col">
      {/* <h1 className="text-white text-xl font-bold mb-6">Manage fee</h1> */}
      <Button
        onClick={() => navigate("/dashboard")}
        className="text-white mt-2 flex flex-row gap-2"
      >
        <IoArrowBack size={20} /> Back
      </Button>
      <ul className="text-white space-y-8 mt-14">
        <li
          className={`hover:text-gray-300 cursor-pointer font-semibold ${
            path.includes("/feeSubmission") ? "text-black" : ""
          }`}
        >
          <Link to="/feeSubmission" className="flex flex-row gap-4">
            <FaMoneyBillWave size={20} />
            Fee From
          </Link>
        </li>
        <li
          className={`hover:text-gray-300 cursor-pointer font-semibold ${
            path.includes("/excelReader") ? "text-black" : ""
          }`}
        >
          <Link to="/excelReader" className="flex flex-row gap-4">
            <FaUserPlus size={20} />
            Add Stdudents
          </Link>
        </li>
        <li
          className={` hover:text-gray-300 cursor-pointer font-semibold flex flex-row gap-4 ${
            path.includes("/studentList") ? "text-black" : ""
          }`}
        >
          <Link to="/studentList" className="flex flex-row gap-4">
            <FaListUl size={20} />
            List Students
          </Link>
        </li>
      </ul>
    </div>
  );
};
export default SideBar;
