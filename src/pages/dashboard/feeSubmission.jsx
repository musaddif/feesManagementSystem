import { useLocation } from "react-router-dom";
import "../style/department.css";
import "../style/feeSubmission.css";
import "../../constant/applicationStyle.css";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getFees } from "../../store/Thunk/commonThunk";

const FeeSubmission = () => {
  const [rollNo, setRollNo] = useState("");
  const [checkedItems, setCheckedItems] = useState({});
  const [totalFee, setTotalFee] = useState(0);

  const dispatch = useDispatch();
  const location = useLocation();
  const selectedDepartment = location.state?.selectedDepartment;
  const feesList = useSelector((state) => state.common.fees);
  console.log("feeslist: ", feesList);

  useEffect(() => {
    dispatch(getFees({ id: selectedDepartment?.deparment_id }));
  }, [dispatch, selectedDepartment]);

  const handleCheckBoxes = (e) => {
    const { name, checked } = e.target;

    setCheckedItems((prev) => {
      const updated = { ...prev, [name]: checked };

      // Calculate total fee based on checked items
      let newTotal = 0;
      feesList.forEach((fee) => {
        if (updated[fee.fees_name]) {
          newTotal = newTotal + Number(fee.amount);
        }
      });

      setTotalFee(newTotal);
      return updated;
    });
  };
  console.log("Checked items:", checkedItems);

  // console.log("check box", checkedItems);

  return (
    <div className="backgroundStyle">
      <div className="feeFormContainer">
        <h1 className="text-2xl font-bold">Fee Submission Form</h1>

        {/* Student Roll No input */}
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

        {/* Fee Types checkboxes */}
        {/* <div className="flex flex-wrap gap-4 justify-center items-center w-full">
          {feesTypes.map((feeType, index) => (
            <div className="flex  flex-wrap gap-x-1 gap-y-3" key={index}>
              <input
                type="checkbox"
                id={feeType.toLowerCase()}
                name={feeType}
                checked={!!checkedItems[feeType]}
                onChange={handleCheckBoxes}
              />
              <label htmlFor={feeType.toLowerCase()} className="label">
                {feeType}
              </label>
            </div>
          ))}
        </div> */}

        {/* Fee Types checkboxes (from DB) */}
        <div className="flex flex-wrap gap-4 justify-center items-center w-full mb-4">
          {feesList.map((fee) => (
            <div className="flex items-center gap-2" key={fee.id}>
              <input
                type="checkbox"
                id={fee.fees_name}
                name={fee.fees_name}
                checked={!!checkedItems[fee.fees_name]}
                onChange={handleCheckBoxes}
              />
              <label htmlFor={fee.fees_name} className="label capitalize">
                {fee.fees_name.replace(/_/g, " ")}
              </label>
            </div>
          ))}
        </div>

        {/* Total Fee Display */}
        <div className="flex flex-row gap-6 w-full items-center justify-center  ">
          <label className="">Total Fee:</label>
          <input
            type="text"
            value={totalFee.toLocaleString()}
            disabled={true}
            className="rollnoInput"
          />
        </div>
      </div>
    </div>
  );
};
export default FeeSubmission;
