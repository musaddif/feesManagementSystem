import { useLocation, useNavigate, useNavigation } from "react-router-dom";
import "../style/department.css";
import "../style/feeSubmission.css";
import "../../constant/applicationStyle.css";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getFees, submitFees } from "../../store/Thunk/commonThunk";
import Button from "../../component/button/button";
import ExcelFileReader from "./excelFileReader";
import SideBar from "../../component/sideBar";

const FeeSubmission = () => {
  const [rollNo, setRollNo] = useState("");
  const [checkedItems, setCheckedItems] = useState({});
  const [totalFee, setTotalFee] = useState(0);
  const [message, setMessage] = useState("");

  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  const feesList = useSelector((state) => state.common.fees);
  //json.parse() is converting string in to js object
  useEffect(() => {
    const storedDepartment = localStorage.getItem("selectedDepartment");
    const selectedDepartment = storedDepartment
      ? JSON.parse(storedDepartment)
      : null;
    // console.log("local", selectedDepartment);
    dispatch(getFees({ id: selectedDepartment?.department_id }));
  }, [dispatch]);

  const handleCheckBoxes = (e) => {
    const { name, checked } = e.target;
    setCheckedItems((prev) => {
      const updated = { ...prev, [name]: checked };
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
  // console.log("Checked items:", checkedItems);

  const feeSubmit = () => {
    if (!rollNo || Object.keys(checkedItems).length === 0) {
      setMessage("Choose roll no or fee type");
      return;
    }
    const formData = {
      checkedItems,
      totalFee,
      rollNo,
    };

    dispatch(submitFees(formData))
      .then((result) => {
        if (result.payload?.success) {
          setTotalFee(0);
          setCheckedItems({});
          setRollNo("");
          setMessage("Data insertion successful!");
        } else {
          // Handle case where action succeeded but operation failed
          setMessage(result.payload?.message || "Data insertion failed");
        }
      })
      .catch((error) => {
        setMessage(error.message || "Data insertion failed");
      });
  };
  return (
    <div className="flex flex-row bg-gradient-to-br from-gray-800 via-gray-900 to-black">
      <div className="w-1/6 shadow-2xl rounded-2xl z-10">
        <SideBar />
      </div>
      <div className="backgroundStyle flex-1">
        <div className="FormContainer">
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
          {message && (
            <p
              style={{
                margin: "20px",
                color: message.includes("successful") ? "green" : "red",
                textAlign: "center",
              }}
            >
              {message}
            </p>
          )}
          <div className="flex flex-row gap-3">
            <Button onClick={feeSubmit}>Submit Fee</Button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default FeeSubmission;
