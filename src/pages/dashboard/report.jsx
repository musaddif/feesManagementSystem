// import { useDispatch, useSelector } from "react-redux";
// import SideBar from "../../component/sideBar";
// import {
//   getReport,
//   getIntermadiateFees,
//   getFees,
//   getInterStudents,
//   getBSStudents,
//   getReportData,
//   getInterReportData,
// } from "../../store/Thunk/commonThunk";
// import { useEffect, useState, useCallback, useRef } from "react";
// import "../../constant/applicationStyle.css";
// import "../style/excelFileReader.css";
// import Header from "../../component/header";
// import { TableSkeleton } from "../../component/loader/skeleton";


// const Report = () => {
//   const [batchArr, setBatchArr] = useState([]);
//   const [batch, setBatch] = useState("");
//   const [students, setStudents] = useState([]); // Store fetched students locally
//   const [isLoading, setIsLoading] = useState(false);
//   const initialFetchDone = useRef(false);
//   const batchFetchDone = useRef(false);

//   const dispatch = useDispatch();
//   const financeReport = useSelector((state) => state.common.financeReport);
//   const storedDepartment = localStorage.getItem("selectedDepartment");
//   const selectedDeprt = storedDepartment ? JSON.parse(storedDepartment) : null;
//   const feesList = useSelector((state) => state.common.fees);
//   const reportData = useSelector((state) => state.common.reportData);
//   // console.log("report data", reportData);

//   const [totals, setTotals] = useState([]);

//   useEffect(() => {
//     if (selectedDeprt.study_level === "BS") {
//       dispatch(
//         getReportData({
//           deprt: selectedDeprt?.department_name,
//           // batchValue: batch,
//         }),
//       );
//     } else {
//       dispatch(
//         getInterReportData({
//           deprt: selectedDeprt?.class_name,
//           batchValue: batch,
//         }),
//       );
//     }
//   }, [batch]);

//   useEffect(() => {
//     if (!reportData?.length) {
//       setTotals([]);
//       return;
//     }

//     const groupedTotals = reportData.reduce((acc, report) => {
//       const batch = String(report?.batch || "N/A").trim();

//       // feeSubmission is array
//       const feeSubmissions = Array.isArray(report?.feeSubmission)
//         ? report.feeSubmission
//         : [];

//       if (!acc[batch]) {
//         acc[batch] = {
//           batch,
//           admission: 0,
//           college: 0,
//           exam: 0,
//           registration: 0,
//           crf: 0,
//           idCard: 0,
//         };
//       }

//       feeSubmissions.forEach((item) => {
//         const feeType = item?.fee_type || {};
//         const amount = Number(item?.amount || 0);


//         if (feeType?.admission_fee) {
//           acc[batch].admission += feesList?.[1]?.admission_fee;
//         }

//         if (feeType?.college_fee) {
//           acc[batch].college += feesList?.[1]?.college_fee;
//         }

//         if (feeType?.exam_fee) {
//           acc[batch].exam += feesList?.[1]?.exam_fee;
//         }

//         if (feeType?.CRF) {
//           acc[batch].crf += feesList?.[1]?.CRF;
//         }

//         if (feeType?.registration_fee) {
//           acc[batch].registration += feesList?.[1]?.registration_fee;
//         }

//         if (feeType?.id_card_fee) {
//           acc[batch].idCard += feesList?.[1]?.id_card_fee

//         }
//       });

//       return acc;
//     }, {});

//     setTotals(Object.values(groupedTotals));
//   }, [financeReport, feesList, reportData]);


//   useEffect(() => {
//     const fetchStudents = async () => {
//       if (!selectedDeprt) return;

//       setIsLoading(true);

//       try {
//         let result;

//         if (selectedDeprt.study_level === "BS") {
//           result = await dispatch(
//             getBSStudents({
//               deprt: selectedDeprt.department_name,
//               batchValue: batch,
//             }),
//           ).unwrap();
//         } else {
//           result = await dispatch(
//             getInterStudents({
//               deprt: selectedDeprt?.class_name,
//               batchValue: batch,
//             }),
//           ).unwrap();
//         }

//         setStudents(result);

//         // Extract unique batches from the fetched students
//         const uniqueBatches = [...new Set(result.map((item) => item.batch))];
//         setBatchArr(uniqueBatches);

//         // Optionally cache the batches
//         if (uniqueBatches.length > 0) {
//           localStorage.setItem("cachedBatches", JSON.stringify(uniqueBatches));
//         }
//       } catch (error) {
//         console.error("Failed to fetch students:", error);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     fetchStudents();
//   }, []);

//   useEffect(() => {
//     const loadCachedBatches = () => {
//       try {
//         const cachedBatches = localStorage.getItem("cachedBatches");
//         if (cachedBatches && batchArr.length === 0) {
//           setBatchArr(JSON.parse(cachedBatches));
//         }
//       } catch (error) {
//         console.error("Error loading cached batches:", error);
//       }
//     };

//     loadCachedBatches();
//   }, []);

//   useEffect(() => {
//     if (selectedDeprt?.study_level === "BS") {
//       dispatch(getFees({ department_name: selectedDeprt.department_name }));
//     } else if (selectedDeprt?.study_level === "FSc") {
//       dispatch(getIntermadiateFees({ class_name: selectedDeprt.class_name }));
//     }
//     dispatch(getReport());
//   }, [batchArr]);

//   const handleBatchChange = (selectedBatch) => {
//     setBatch(selectedBatch);
//   };

//   return (
//     <div className="flex flex-col h-screen overflow-hidden">
//       <Header />

//       <div className="flex flex-1 overflow-hidden">
//         <div className="">
//           <SideBar />
//         </div>


//         <div className="flex flex-1 flex-col p-6 overflow-auto bg-gray-100">
//           <h1 className="text-2xl font-bold mb-4 mt-8 text-center">
//             Department of{" "}
//             {selectedDeprt?.department_name || selectedDeprt?.class_name}
//           </h1>
//           <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
//             <div className="px-6 py-4 border-b ">
//               <h2 className="text-xl font-bold text-black">Fee Report</h2>
//             </div>

//             {/* Scrollable Table */}
//             <div className="overflow-x-auto">
//               <table className="w-full text-sm text-left border-collapse">
//                 <thead className="bg-gray-800 text-white sticky top-0 z-10">
//                   <tr>
//                     <th className="px-5 py-3 font-semibold">Batch</th>
//                     <th className="px-5 py-3 font-semibold">Admission</th>
//                     <th className="px-5 py-3 font-semibold">College</th>
//                     <th className="px-5 py-3 font-semibold">Exam</th>
//                     <th className="px-5 py-3 font-semibold">CRF</th>
//                     <th className="px-5 py-3 font-semibold">Registration</th>
//                     <th className="px-5 py-3 font-semibold">ID Card</th>
//                   </tr>
//                 </thead>

//                 <tbody>
//                   {isLoading && totals.length === 0 ? (
//                     <tr>
//                       <td colSpan="7" className="p-4">
//                         <TableSkeleton rows={5} cols={7} />
//                       </td>
//                     </tr>
//                   ) : totals.length > 0 ? (
//                     totals.map((item, index) => (
//                       <tr
//                         key={index}
//                         className={`border-b hover:bg-blue-50 transition duration-150 ${index % 2 === 0 ? "bg-white" : "bg-gray-50"
//                           }`}
//                       >
//                         <td className="px-5 py-3 font-medium text-gray-800">
//                           {item.batch}
//                         </td>
//                         <td className="px-5 py-3 font-semibold">
//                           {item.admission}
//                         </td>
//                         <td className="px-5 py-3 font-semibold">{item.college}</td>
//                         <td className="px-5 py-3 font-semibold">{item.exam}</td>
//                         <td className="px-5 py-3 font-semibold">{item.crf}</td>
//                         <td className="px-5 py-3 font-semibold">{item.registration}</td>
//                         <td className="px-5 py-3 font-semibold">{item.idCard}</td>
//                       </tr>
//                     ))
//                   ) : (
//                     <tr>
//                       <td
//                         colSpan="7"
//                         className="text-center py-8 text-gray-500 font-medium"
//                       >
//                         No Data Found
//                       </td>
//                     </tr>
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Report;
const Report = () => {
  return (
    <>
      {/* <h1>Report</h1> */}
    </>
  )
}
export default Report;