import React from "react";

import collegeLogo from "../../assets/collegeLogo.png";
import "./loader.css";

const Loader = () => {
  return (
    <div className="loaderContainer">
      <img src={collegeLogo} alt="College Logo" className="loaderLogo " />

      <h1 className="flex font-bold text-white">
        Loading<span className="dots">...</span>
      </h1>
    </div>
  );
};

export default Loader;
