import { useDispatch, useSelector } from "react-redux";
import SideBar from "../../component/sideBar";
import {
  getReport,
  getIntermadiateFees,
  getFees,
} from "../../store/Thunk/commonThunk";
import { useEffect, useState } from "react";
import "../../constant/applicationStyle.css";
import "../style/excelFileReader.css";

const Report = () => {
  // const [allStudentList, setAllStudentList] = useState([]);
  const dispatch = useDispatch();
  const financeReport = useSelector((state) => state.common.financeReport);
  const storedDepartment = localStorage.getItem("selectedDepartment");
  const selectedDeprt = storedDepartment ? JSON.parse(storedDepartment) : null;
  // console.log("feesList", feesList);
  // console.log("financeReport", financeReport);
  const feesList = useSelector((state) => state.common.fees);
  const [totals, setTotals] = useState({
    admission: 0,
    college: 0,
    exam: 0,
    registration: 0,
    crf: 0,
    idCard: 0,
  });

  useEffect(() => {
    if (!financeReport?.length || !feesList) return;

    const allFees = Array.isArray(feesList)
      ? feesList.reduce((acc, item) => ({ ...acc, ...item }), {})
      : feesList;

    let admission = 0;
    let college = 0;
    let exam = 0;
    let registration = 0;
    let crf = 0;
    let idCard = 0;

    financeReport.forEach((report) => {
      const feeType = JSON.parse(report.fee_type);

      if (feeType.admission_fee)
        admission += Number(allFees?.admission_fee || 0);
      if (feeType.college_fee) college += Number(allFees?.college_fee || 0);
      if (feeType.exam_fee) exam += Number(allFees?.exam_fee || 0);
      if (feeType.CRF) crf += Number(allFees?.CRF || 0);
      if (feeType.registration_fee)
        registration += Number(allFees?.registration_fee || 0);
      if (feeType.id_card_fee) idCard += Number(allFees?.id_card_fee || 0);
    });

    setTotals({ admission, college, exam, registration, crf, idCard });
  }, [financeReport, feesList]);

  // console.log("Totals:", totals);

  useEffect(() => {
    if (selectedDeprt?.study_level === "BS") {
      dispatch(getFees({ department_name: selectedDeprt.department_name }));
    } else if (selectedDeprt?.study_level === "FSc") {
      dispatch(getIntermadiateFees({ class_name: selectedDeprt.class_name }));
    }
    dispatch(getReport());
  }, []);

  return (
    <div className="flex flex-row ">
      <div className=" shadow-2xl rounded-2xl z-10">
        <SideBar />
      </div>
      <div className="flex flex-1 flex-col justify-center items-center">
        <table>
          <thead>
            <tr className="tableRow border-t border-gray-300">
              <td className="tableData font-semibold">Admission Fee</td>
              <td className="tableData font-semibold">College Fee</td>
              <td className="tableData font-semibold">Exam Fee</td>
              <td className="tableData font-semibold">CR Fee</td>
              <td className="tableData font-semibold">Registration Fee</td>
              <td className="tableData font-semibold">ID Card Fee</td>
            </tr>
          </thead>
          <tbody>
            <tr className="tableRow">
              <td className="tableData">{totals.admission}</td>
              <td className="tableData">{totals.college}</td>
              <td className="tableData">{totals.exam}</td>
              <td className="tableData">{totals.crf}</td>
              <td className="tableData">{totals.registration}</td>
              <td className="tableData">{totals.idCard}</td>
            </tr>
          </tbody>
        </table>

        {/* <table>
          <thead>
            <tr className="tableRow border-t border-gray-300">
              <td className="tableData font-semibold">Department</td>
              <td className="tableData font-semibold">Total</td>
            </tr>
          </thead>
          <tbody>
            {financeReport &&
              Object.entries(
                financeReport.reduce((acc, report) => {
                  const department =
                    report?.interStudent?.department ||
                    report?.student?.department;
                  if (!acc[department]) {
                    acc[department] = 0;
                  }
                  acc[department] += Number(report?.amount || 0);

                  return acc;
                }, {})
              ).map(([department, total], index) => (
                <tr className="tableRow" key={index}>
                  <td className="tableData">{department}</td>
                  <td className="tableData">{total}</td>
                </tr>
              ))}
          </tbody>
        </table> */}
        {/* {financeReport && (
          <h1>
            Total Amount =
            {financeReport.reduce(
              (total, item) => total + Number(item?.amount || 0),
              0
            )}
          </h1>
        )} */}
        {/* {feesList&& Object.entries(

)} */}
      </div>
    </div>
  );
};
export default Report;
