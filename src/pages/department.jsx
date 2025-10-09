import { useLocation, useNavigate } from "react-router-dom";
import "./style/department.css";
const Department = () => {
  const location = useLocation();
  const selectedType = location.state?.selectedType || "None";
  const navigate = useNavigate();

  const handleNavigation = (type) => {
    // Navigate to the fee submission form with the selected department type
    navigate("/feeSubmissionForm", { state: { selectedDepartment: type } });
  };

  return (
    <div className="containerBackground">
      {selectedType == "BS" ? (
        <div className="container">
          <h1 className="text-2xl font-bold">Department</h1>
          <div className="flex flex-wrap flex-row gap-4 justify-center">
            <button
              className="departmentBtn"
              onClick={() => {
                handleNavigation("Botany");
              }}
            >
              Botany
            </button>
            <button
              className="departmentBtn"
              onClick={() => {
                handleNavigation("Chemistry");
              }}
            >
              Chemistry
            </button>
            <button
              className="departmentBtn"
              onClick={() => {
                handleNavigation("Computer Science");
              }}
            >
              Computer Science
            </button>
            <button
              className="departmentBtn"
              onClick={() => {
                handleNavigation("Economics");
              }}
            >
              Economics
            </button>
            <button
              className="departmentBtn"
              onClick={() => {
                handleNavigation("English");
              }}
            >
              English
            </button>
            <button
              className="departmentBtn"
              onClick={() => {
                handleNavigation("Geography");
              }}
            >
              Geography
            </button>
            <button
              className="departmentBtn"
              onClick={() => {
                handleNavigation("Mathematics");
              }}
            >
              Mathematics
            </button>
            <button
              className="departmentBtn"
              onClick={() => {
                handleNavigation("Physics");
              }}
            >
              Physics
            </button>
            <button
              className="departmentBtn"
              onClick={() => {
                handleNavigation("Political Science");
              }}
            >
              Political Science
            </button>
            <button
              className="departmentBtn"
              onClick={() => {
                handleNavigation("Statistic");
              }}
            >
              Statistic
            </button>
            <button
              className="departmentBtn"
              onClick={() => {
                handleNavigation("Urdu");
              }}
            >
              Urdu
            </button>
            <button
              className="departmentBtn"
              onClick={() => {
                handleNavigation("Zoology");
              }}
            >
              Zoology
            </button>
          </div>
        </div>
      ) : (
        <div className="container">
          <h1 className="text-2xl font-bold">Intermediate</h1>
          <div className="flex flex-wrap flex-row gap-4 justify-center">
            <button
              className="departmentBtn"
              onClick={() => {
                handleNavigation("Inter Computer Science I");
              }}
            >
              Inter Computer Science I
            </button>
            <button
              className="departmentBtn"
              onClick={() => {
                handleNavigation("Inter Computer Science II");
              }}
            >
              Inter Computer Science II
            </button>
            <button
              className="departmentBtn"
              onClick={() => {
                handleNavigation("Inter Engineering I");
              }}
            >
              Inter Engineering I
            </button>
            <button
              className="departmentBtn"
              onClick={() => {
                handleNavigation("Inter Engineering II");
              }}
            >
              Inter Engineering II
            </button>
            <button
              className="departmentBtn"
              onClick={() => {
                handleNavigation("Inter Medical I");
              }}
            >
              Inter Medical I
            </button>
            <button
              className="departmentBtn"
              onClick={() => {
                handleNavigation("Inter Medical II");
              }}
            >
              Inter Medical II
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default Department;
