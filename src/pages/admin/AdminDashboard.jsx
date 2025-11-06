import React, { useEffect, useState } from "react";
import "../../constant/applicationStyle.css";
import { useDispatch, useSelector } from "react-redux";
import { allDepartments, setFee } from "../../store/Thunk/commonThunk";
import "./style.css";
import Button from "../../component/button/button";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const FeeType = [
    "Admission Fee",
    "College Fee",
    "CRF",
    "Registration Fee",
    "Exam Fee",
    "ID Card Fee",
  ];

  const [department, setDepartment] = useState({});
  const [fees, SetFees] = useState(
    FeeType.reduce((acc, type) => ({ ...acc, [type]: 0 }), {})
  );

  const handleFeeChange = (feeType, value) => {
    SetFees((prevFee) => ({
      ...prevFee,
      [feeType]: value,
    }));
  };
  //   console.log("check = ", department);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(allDepartments());
  }, []);
  const allDepartment = useSelector((state) => state.common.department);
  //   console.log("deprt", allDepartment);

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      deprt: department,
      fees: fees,
    };
    // console.log("data", data);
    dispatch(setFee(data));
  };

  return (
    <div className="backgroundStyle">
      <form className="formStyle" onSubmit={handleSubmit}>
        <h1 className="m-4 font-semibold">Set Fee</h1>

        <select
          value={department ? JSON.stringify(department) : ""}
          className="dropdown"
          onChange={(e) => {
            const selected = JSON.parse(e.target.value);
            setDepartment(selected);
          }}
        >
          <option>select department</option>
          {allDepartment.map((deprt, index) => (
            // <option key={index}>{deprt?.department_name}</option>
            <option
              key={index}
              value={JSON.stringify({
                id: deprt.department_id,
                name: deprt.department_name,
              })}
            >
              {deprt?.department_name}
            </option>
          ))}
        </select>

        <h2 className="m-2 font-semibold">Fees Types</h2>
        <div className="gap-2 flex flex-wrap  ">
          {FeeType.map((fee, index) => (
            <div key={index} className="flex gap-4">
              <label className="">{fee}:</label>
              <input
                type="number"
                className="feeTypeInput"
                value={fees[fee]}
                onChange={(e) => handleFeeChange(fee, e.target.value)}
              />
            </div>
          ))}
        </div>
        <div className="gap-2 flex">
          <Button>Submit</Button>
          <button
            onClick={() => navigate("/dashboard")}
            className="text-gray-500"
          >
            Skip
          </button>
        </div>
      </form>
    </div>
  );
};
export default AdminDashboard;
