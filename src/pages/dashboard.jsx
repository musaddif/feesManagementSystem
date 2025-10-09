import { useNavigate } from "react-router-dom";
import "./style/dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const handleNavigation = (type) => {
    navigate("/department", { state: { selectedType: type } });
  };
  return (
    <div className="pageStyle">
      <div className="modal">
        <button className="btn" onClick={() => handleNavigation("BS")}>
          BS
        </button>
        <button className="btn" onClick={() => handleNavigation("Inter")}>
          Inter
        </button>
        <button className="btn" onClick={() => handleNavigation("Art")}>
          Art
        </button>
      </div>
    </div>
  );
};
export default Dashboard;
