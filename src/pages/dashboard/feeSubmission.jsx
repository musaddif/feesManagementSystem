import { useLocation, useNavigate, useNavigation } from "react-router-dom";
import "../style/department.css";
import "../style/feeSubmission.css";
import "../../constant/applicationStyle.css";
import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllStudents,
  getFees,
  submitFees,
  updateFee,
  getIntermadiateFees,
  getAllInterStudents,
  interSubmitFees,
  getStudent,
} from "../../store/Thunk/commonThunk";
import Button from "../../component/button/button";
import ExcelFileReader from "./excelFileReader";
import SideBar from "../../component/sideBar";
import { semester } from "../../constant/lists";

const FeeSubmission = () => {
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [checkedItems, setCheckedItems] = useState({});
  const [totalFee, setTotalFee] = useState(0);
  const [message, setMessage] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [studentList, setStudentList] = useState([]);
  const [batchValue, setBatchValue] = useState("2021");
  const [studentSemester, setStudentSemester] = useState("");
  const [getStudentData, setGetStudentData] = useState([]);

  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  const studentRecord = location.state?.student;
  useEffect(() => {
    dispatch(
      getStudent({
        registrationNumber: registrationNumber,
        studentSemester: studentSemester,
      }),
    )
      .unwrap()
      .then((res) => {
        const row = res?.[0];

        const feeTypeObj =
          typeof row?.fee_type === "string"
            ? JSON.parse(row.fee_type)
            : row?.fee_type || {};

        const onlyTrueFeeType = Object.fromEntries(
          Object.entries(feeTypeObj).filter(([_, v]) => v),
        );

        setGetStudentData(onlyTrueFeeType);
      })
      .catch(console.error);
  }, [registrationNumber, studentSemester]);

  useEffect(() => {
    if (studentRecord && Object.keys(studentRecord).length > 0) {
      setRegistrationNumber(
        studentRecord?.registration_number ||
          studentRecord?.inter_student_registration,
      );
      setBatchValue(studentRecord?.batch);
      const feeTypeString = studentRecord.feeSubmission[0].fee_type;
      const initialCheckedItems = JSON.parse(feeTypeString);
      setCheckedItems(initialCheckedItems);
      setTotalFee(studentRecord.feeSubmission[0].amount);
    }
  }, [studentRecord, updateFee]);

  const storedDepartment = localStorage.getItem("selectedDepartment");
  const selectedDeprt = storedDepartment ? JSON.parse(storedDepartment) : null;
  const feesList = useSelector((state) => state.common.fees);

  let getstudentList;
  {
    selectedDeprt?.study_level === "BS"
      ? (getstudentList = useSelector((state) => state.common.getAllStudent))
      : (getstudentList = useSelector(
          (state) => state.common.getAllInterStudent,
        ));
  }

  useEffect(() => {
    setSelectedDepartment(selectedDeprt);
    if (selectedDeprt?.study_level === "BS") {
      dispatch(getFees({ department_name: selectedDeprt.department_name }));
      dispatch(getAllStudents({ deprt: selectedDeprt.department_name }));
    } else if (selectedDeprt?.study_level === "FSc") {
      dispatch(getIntermadiateFees({ class_name: selectedDeprt.class_name }));
      dispatch(getAllInterStudents({ deprt: selectedDeprt.class_name }));
    }
  }, []);

  const handleCheckBoxes = (e) => {
    const { name, checked } = e.target;
    setCheckedItems((prev) => {
      const updated = { ...prev, [name]: checked };

      let newTotal = 0;
      Object.keys(feesList[0]).forEach((key) => {
        if (updated[key]) {
          newTotal += Number(feesList[0][key]);
        }
      });
      setTotalFee(newTotal);
      return updated;
    });
  };
  const feeKeys =
    Array.isArray(feesList) && feesList.length > 0
      ? Object.keys(feesList[0]).filter(
          (key) =>
            key !== "department_id" &&
            key !== "id" &&
            key !== "amount" &&
            key !== "department_name" &&
            key !== "modify_by" &&
            key !== "created_at" &&
            key !== "class_name",
        )
      : [];

  const feeSubmit = () => {
    if (
      !registrationNumber ||
      Object.keys(checkedItems).length === 0 ||
      !studentSemester
    ) {
      setMessage("check roll no, semester or fee type");
      return;
    }
    const formData = {
      checkedItems,
      totalFee,
      registrationNumber,
      studentSemester,
    };
    // console.log("formData", formData);
    if (selectedDeprt?.study_level == "BS") {
      dispatch(submitFees(formData))
        .then((result) => {
          if (result.payload?.success) {
            setTotalFee(0);
            setCheckedItems({});
            setRegistrationNumber("");
            setStudentSemester("");
            setMessage("Data insertion successful!");
          } else {
            setMessage(result.payload?.message || "Data insertion failed");
          }
        })
        .catch((error) => {
          setMessage(error.message || "Data insertion failed");
        });
    } else {
      dispatch(interSubmitFees(formData))
        .then((result) => {
          if (result.payload?.success) {
            setTotalFee(0);
            setCheckedItems({});
            setRegistrationNumber("");
            setMessage("Data insertion successful!");
          } else {
            setMessage(result.payload?.message || "Data insertion failed");
          }
        })
        .catch((error) => {
          setMessage(error.message || "Data insertion failed");
        });
    }
  };

  const updateRecord = () => {
    if (
      !registrationNumber ||
      Object.keys(checkedItems).length === 0 ||
      !studentSemester
    ) {
      setMessage("pick roll no, semester or fee type");
      return;
    }
    const formData = {
      checkedItems,
      totalFee,
      registrationNumber,
      studentSemester,
    };

    dispatch(updateFee(formData))
      .then((result) => {
        if (result.payload?.success) {
          setMessage("update successful!");
        } else {
          setMessage(result.payload?.message || "Data insertion failed");
        }
      })
      .catch((error) => {
        setMessage(error.message || "Data insertion failed");
      });
  };

  const filterOnBatchValue = useCallback(() => {
    if (!Array.isArray(getstudentList)) return;

    const result = getstudentList.filter((studentData) => {
      const studentBatch = (studentData.batch || "").toLowerCase().trim();
      return studentBatch.includes(batchValue.toLowerCase().trim());
    });

    setStudentList(result);
  }, [batchValue, getstudentList]);

  useEffect(() => {
    filterOnBatchValue();
  }, [batchValue, filterOnBatchValue]);

  useEffect(() => {
    filterOnBatchValue();
  }, []);

  const handleBatch = (e) => {
    setBatchValue(e.target.value);
  };

  return (
    <div className="flex flex-row bg-gradient-to-br from-gray-800 via-gray-900 to-black">
      <div className=" shadow-2xl rounded-2xl z-10">
        <SideBar />
      </div>
      <div className="backgroundStyle flex-1 !h-full ">
        <div className="FormContainer">
          <h1 className="text-2xl font-bold">Fee Submission Form</h1>
          <h2 className="font-semibold">
            Deparment :
            {selectedDepartment?.department_name ||
              selectedDepartment?.class_name}
          </h2>

          <div className="flex flex-row gap-2 w-full items-center justify-center">
            <label className="">Student Registration No:</label>
            <select
              className="dropDown mr-6"
              onChange={(e) => setRegistrationNumber(e.target.value)}
              value={registrationNumber}
            >
              <option value="" disabled>
                Select a Reg.No:
              </option>
              {studentList.map((item, index) => (
                <option
                  key={index}
                  value={
                    selectedDeprt?.study_level === "BS"
                      ? item.registration_number
                      : item.inter_student_registration
                  }
                >
                  {selectedDeprt?.study_level === "BS"
                    ? item.registration_number
                    : item.inter_student_registration}
                </option>
              ))}
            </select>

            <label>Batch</label>
            <select
              className="dropDown"
              onChange={handleBatch}
              value={batchValue}
            >
              {[...new Set(getstudentList.map((item) => item.batch))].map(
                (batch) => (
                  <option key={batch} value={batch}>
                    {batch}
                  </option>
                ),
              )}
            </select>
            <label className="">Semester:</label>
            <select
              className="dropDown mr-6"
              onChange={(e) => setStudentSemester(e.target.value)}
              value={studentSemester}
            >
              <option value="" disabled>
                Semester
              </option>
              {semester.map((item, index) => (
                <option
                  key={index}
                  value={
                    item
                    // selectedDeprt?.study_level === "BS"
                    //   ? item
                    //   : item.inter_student_registration
                  }
                >
                  {item}
                  {/* {selectedDeprt?.study_level === "BS"
                    ? item
                    : item.inter_student_registration} */}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-4 justify-center items-center w-full mb-4">
            {feeKeys.map(
              (key) =>
                !getStudentData?.[key] && (
                  <div key={key} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={key}
                      name={key}
                      checked={!!checkedItems[key]}
                      onChange={handleCheckBoxes}
                    />
                    <label htmlFor={key} className="capitalize">
                      {key.replace(/_/g, " ")}
                    </label>
                  </div>
                ),
            )}
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
            {/* <Button onClick={feeSubmit}>
              Submit Fee</Button> */}
            {(studentRecord && Object.keys(studentRecord).length > 0) ||
            Object.keys(getStudentData || {}).length > 0 ? (
              <Button onClick={updateRecord}>Update Fee</Button>
            ) : (
              <Button onClick={feeSubmit}>Submit Fee</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default FeeSubmission;
