import { useNavigate } from "react-router-dom";
import "../style/dashboard.css";
import "../../constant/applicationStyle.css";
import Button from "../../component/button/button";

const Dashboard = () => {
  const navigate = useNavigate();
  const handleNavigation = (type) => {
    navigate("/department", { state: { selectedType: type } });
  };
  return (
    <div className="backgroundStyle">
      <div className="modal">
        <Button onClick={() => handleNavigation("BS")}>BS</Button>
        <Button onClick={() => handleNavigation("Inter")}>Inter</Button>
        <Button onClick={() => handleNavigation("Art")}>Art</Button>
      </div>
    </div>
  );
};
export default Dashboard;
