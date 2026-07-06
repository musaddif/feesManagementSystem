import { Routes, Route } from "react-router-dom";
import { useState } from "react";
import Login from "../pages/auth/login";
// import Dashboard from "../pages/dashboard/dashboard";
import Department from "../pages/dashboard/department";
import FeeSubmission from "../pages/dashboard/feeSubmission";
import NotFound from "../pages/auth/notFound";
import ExcelFileReader from "../pages/dashboard/excelFileReader";
import StudentList from "../pages/dashboard/studentList";
import ProtectedRoute from "./ProtectedRoute";
import Setting from "../pages/admin/Setting";
import Report from "../pages/dashboard/report";
import Students from "../pages/dashboard/students";
import AmountManagement from "../pages/dashboard/amountManagement";


const Layout = () => {
  return (
    <Routes>
      <Route path="/" element={
        <Login />
      } />
      {/* <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      /> */}
      <Route
        path="/department"
        element={
          <ProtectedRoute>
            <Department />
          </ProtectedRoute>
        }
      />
      <Route
        path="/feeSubmission"
        element={
          <ProtectedRoute>
            <FeeSubmission />
          </ProtectedRoute>
        }
      />
      <Route
        path="/excelReader"
        element={
          <ProtectedRoute>
            <ExcelFileReader />
          </ProtectedRoute>
        }
      />
      <Route
        path="/studentList"
        element={
          <ProtectedRoute>
            <StudentList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/adminDashboard"
        element={
          <ProtectedRoute>
            <Setting />
          </ProtectedRoute>
        }
      />
      <Route
        path="/report"
        element={
          <ProtectedRoute>
            <Report />
          </ProtectedRoute>
        }
      />
      <Route
        path="/students"
        element={
          <ProtectedRoute>
            <Students />
          </ProtectedRoute>
        }
      />
      <Route
        path="/amountManagement"
        element={
          <ProtectedRoute>
            <AmountManagement />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
export default Layout;
