import { useLocation } from "react-router-dom";
import "../style/department.css";
import "../style/feeSubmissionForm.css";
import { useState } from "react";

const FeeSubmissionForm = () => {
  const [rollNo, setRollNo] = useState("");

  const location = useLocation();
  const selectedDepartment = location.state?.selectedDepartment;
  //   console.log("selectedDepartment", selectedDepartment);

  return (
    <div className="containerBackground">
      <div className="feeFormContainer">
        <h1 className="text-2xl font-bold">Fee Submission Form</h1>
        <div className="flex flex-row gap-6 w-full items-center justify-center  ">
          <label className="">Student Roll No:</label>
          <input
            type="text"
            value={rollNo}
            onChange={(e) => setRollNo(e.target.value)}
            placeholder="Enter student Roll No"
            className="rollnoInput"
          />
        </div>
        <div className="checkBoxWrapper">
          <div className="checkBox">
            <input type="checkbox" />
            <label className="label">Admission Fee</label>
          </div>
          <div className="checkBox">
            <input type="checkbox" />
            <label className="label">Registeration Fee</label>
          </div>
          <div className="checkBox">
            <input type="checkbox" />
            <label className="label">Exam Fee</label>
          </div>
          <div className="checkBox">
            <input type="checkbox" />
            <label className="label">College Fee</label>
          </div>
          <div className="checkBox">
            <input type="checkbox" />
            <label className="label">CRF Fee</label>
          </div>
        </div>

        <div className="flex flex-row gap-6 w-full items-center justify-center  ">
          <label className="">Total Fee:</label>
          <input
            type="text"
            value={""}
            disabled={true}
            className="rollnoInput"
          />
        </div>
      </div>
    </div>
  );
};
export default FeeSubmissionForm;
