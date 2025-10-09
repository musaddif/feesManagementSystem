import { useState } from "react";
import "./App.css";
import Login from "./auth/login";
import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/dashboard";
import Department from "./pages/department";
import FeeSubmissionForm from "./pages/feeSubmissionFrom";

function App() {
  // const [count, setCount] = useState(0);

  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/department" element={<Department />} />
      <Route path="/feeSubmissionForm" element={<FeeSubmissionForm />} />
    </Routes>
  );
}

export default App;
