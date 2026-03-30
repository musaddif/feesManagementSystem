import { useDispatch, useSelector } from "react-redux";
import SideBar from "../../component/sideBar";
import {
  getReport,
  getIntermadiateFees,
  getFees,
  getInterStudents,
  getBSStudents,
  getReportData,
  getInterReportData,
} from "../../store/Thunk/commonThunk";
import { useEffect, useState, useCallback, useRef } from "react";
import "../../constant/applicationStyle.css";
import "../style/excelFileReader.css";

const Report = () => {
  const [batchArr, setBatchArr] = useState([]);
  const [batch, setBatch] = useState("");
  const [students, setStudents] = useState([]); // Store fetched students locally
  const [isLoading, setIsLoading] = useState(false);
  const initialFetchDone = useRef(false);
  const batchFetchDone = useRef(false);

  const dispatch = useDispatch();
  const financeReport = useSelector((state) => state.common.financeReport);
  const storedDepartment = localStorage.getItem("selectedDepartment");
  const selectedDeprt = storedDepartment ? JSON.parse(storedDepartment) : null;
  const feesList = useSelector((state) => state.common.fees);
  const reportData = useSelector((state) => state.common.reportData);
  const [totals, setTotals] = useState({
    admission: 0,
    college: 0,
    exam: 0,
    registration: 0,
    crf: 0,
    idCard: 0,
  });
  useEffect(() => {
    if (selectedDeprt.study_level === "BS") {
      dispatch(
        getReportData({
          deprt: selectedDeprt?.department_name,
          batchValue: batch,
        }),
      );
    } else {
      dispatch(
        getInterReportData({
          deprt: selectedDeprt?.class_name,
          batchValue: batch,
        }),
      );
    }
  }, [batch]);

  useEffect(() => {
    if (!reportData?.length || !feesList) return;
    const allFees = Array.isArray(feesList)
      ? feesList.reduce((acc, item) => ({ ...acc, ...item }), {})
      : feesList;

    let admission = 0;
    let college = 0;
    let exam = 0;
    let registration = 0;
    let crf = 0;
    let idCard = 0;

    reportData?.[0]?.feeSubmission?.forEach((report) => {
      const feeType = report?.fee_type;

      if (feeType?.admission_fee)
        admission += Number(allFees?.admission_fee || 0);
      if (feeType.college_fee) college += Number(allFees?.college_fee || 0);
      if (feeType.exam_fee) exam += Number(allFees?.exam_fee || 0);
      if (feeType.CRF) crf += Number(allFees?.CRF || 0);
      if (feeType.registration_fee)
        registration += Number(allFees?.registration_fee || 0);
      if (feeType.id_card_fee) idCard += Number(allFees?.id_card_fee || 0);
    });

    setTotals({ admission, college, exam, registration, crf, idCard });
  }, [financeReport, feesList, reportData]);
  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedDeprt) return;

      setIsLoading(true);

      try {
        let result;

        if (selectedDeprt.study_level === "BS") {
          result = await dispatch(
            getBSStudents({
              deprt: selectedDeprt.department_name,
              batchValue: batch,
            }),
          ).unwrap();
        } else {
          result = await dispatch(
            getInterStudents({
              deprt: selectedDeprt?.class_name,
              batchValue: batch,
            }),
          ).unwrap();
        }

        setStudents(result);

        // Extract unique batches from the fetched students
        const uniqueBatches = [...new Set(result.map((item) => item.batch))];
        setBatchArr(uniqueBatches);

        // Optionally cache the batches
        if (uniqueBatches.length > 0) {
          localStorage.setItem("cachedBatches", JSON.stringify(uniqueBatches));
        }
      } catch (error) {
        console.error("Failed to fetch students:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudents();
  }, []);

  useEffect(() => {
    const loadCachedBatches = () => {
      try {
        const cachedBatches = localStorage.getItem("cachedBatches");
        if (cachedBatches && batchArr.length === 0) {
          setBatchArr(JSON.parse(cachedBatches));
        }
      } catch (error) {
        console.error("Error loading cached batches:", error);
      }
    };

    loadCachedBatches();
  }, []);

  useEffect(() => {
    if (selectedDeprt?.study_level === "BS") {
      dispatch(getFees({ department_name: selectedDeprt.department_name }));
    } else if (selectedDeprt?.study_level === "FSc") {
      dispatch(getIntermadiateFees({ class_name: selectedDeprt.class_name }));
    }
    dispatch(getReport());
  }, [batchArr]);

  const handleBatchChange = (selectedBatch) => {
    setBatch(selectedBatch);
  };

  return (
    <div className="flex flex-row ">
      <div className="shadow-2xl rounded-2xl z-10">
        <SideBar />
      </div>
      <div className="flex flex-1 flex-col p-4">
        {batchArr.length > 0 && (
          <div className=" m-6  ">
            <label className="font-bold ">Select Batch </label>
            <select
              value={batch}
              onChange={(e) => handleBatchChange(e.target.value)}
              className="p-2 border rounded"
            >
              <option value="">Select Batch</option>
              {batchArr.map((batchOption) => (
                <option key={batchOption} value={batchOption}>
                  {batchOption}
                </option>
              ))}
            </select>
          </div>
        )}

        {isLoading && <div>Loading...</div>}

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
      </div>
    </div>
  );
};

export default Report;
