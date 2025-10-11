import { Routes, Route } from "react-router-dom";
import { useState } from "react";
import Login from "../pages/auth/login";
import Dashboard from "../pages/dashboard/dashboard";
import Department from "../pages/dashboard/department";
import FeeSubmission from "../pages/dashboard/feeSubmission";
import NotFound from "../pages/auth/notFound";

const Layout = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/department" element={<Department />} />
      <Route path="/feeSubmission" element={<FeeSubmission />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
export default Layout;
