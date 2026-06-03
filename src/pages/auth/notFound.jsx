import React from "react";

import { useNavigate } from "react-router-dom";
// import Button from "../../component/Button/Button";

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div className="grid h-[calc(100vh_-_150px)] place-content-center px-4">
      <div className="text-center">
        <h1 className="text-9xl font-black text-gray-200">404</h1>

        <p className="mt-4 text-gray-500">We can't find that page.</p>

        <button
          onClick={() => navigate("/")}
          className="btn btn-gradient mx-auto mt-5"
        >
          Back To Login
        </button>
      </div>
    </div>
  );
};

export default NotFound;
