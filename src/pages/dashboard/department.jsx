import { useLocation, useNavigate } from "react-router-dom";
import "../style/department.css";
import "../../constant/applicationStyle.css";
import Button from "../../component/button/button";
import { departmentList } from "../../constant/lists";
import { intermediateList } from "../../constant/lists";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { allDepartments } from "../../store/Thunk/commonThunk";

const Department = () => {
  const location = useLocation();
  const selectedType = location.state?.selectedType || "None";
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const allDepartment = useSelector((state) => state.common.department);
  // console.log("allDepartment = ", allDepartment);

  const handleNavigation = (type) => {
    // Navigate to the fee submission form with the selected department type
    localStorage.setItem("selectedDepartment", JSON.stringify(type));
    navigate("/feeSubmission");
  };

  useEffect(() => {
    dispatch(allDepartments());
  }, []);

  return (
    <div className="backgroundStyle">
      {selectedType == "BS" ? (
        <div className="container">
          <h1 className="text-2xl font-bold">Department</h1>
          <div className="flex flex-wrap flex-row gap-4 justify-center">
            {/* {departmentList.map((dept, index) => ( */}
            {allDepartment?.map((dept, index) => (
              <Button
                key={index}
                onClick={() => handleNavigation(dept)}
                className=""
              >
                {dept?.department_name}
              </Button>
            ))}
          </div>
        </div>
      ) : (
        // intermediate Department Buttons list
        <div className="container">
          <h1 className="text-2xl font-bold">Intermediate</h1>
          <div className="flex flex-wrap flex-row gap-4 justify-center">
            {intermediateList.map((inter, index) => (
              <Button
                key={index}
                onClick={() => handleNavigation(inter)}
                className=""
              >
                {inter}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
export default Department;
