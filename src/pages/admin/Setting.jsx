import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getFeeSetting, setFee } from "../../store/Thunk/commonThunk";
import Button from "../../component/button/button";
import Header from "../../component/header";
import SideBar from "../../component/sideBar";

const Setting = () => {
  const FeeType = [
    "Admission Fee",
    "College Fee",
    "CRF",
    "Registration Fee",
    "Exam Fee",
    "ID Card Fee",
  ];

  const dispatch = useDispatch();
  const globalLoading = useSelector((state) => state.common.loading);

  const [selectedDeprt, setSelectedDeprt] = useState(null);
  const [isBS, setIsBS] = useState(true);

  // Form State
  const [semester, setSemester] = useState("");
  const [interClass, setInterClass] = useState("");
  const [fees, setFees] = useState(
    FeeType.reduce((acc, type) => ({ ...acc, [type]: "" }), {})
  );

  // Track existing record for UPSERT
  const [existingRecordId, setExistingRecordId] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [studyLevel, setStudyLevel] = useState("");

  // Load saved value on page load
  useEffect(() => {
    const storedDepartment = localStorage.getItem("selectedDepartment");
    if (storedDepartment) {
      const parsed = JSON.parse(storedDepartment);
      setStudyLevel(parsed?.study_level || "");
    }
  }, []);

  const bsSemesters = [
    "1st", "2nd", "3rd", "4th", "5th", "6th",
    "7th", "8th", "9th", "10th", "11th", "12th"
  ];

  const bsDepartments = [
    "Computer Science", "Chemistry", "Botany", "Physics", "Zoology",
    "Urdu", "Political Science", "Maths", "Economics", "Statistic",
    "English", "Geography"
  ];

  const interClasses = [
    "Computer Science I", "Computer Science II",
    "Medical I", "Medical II",
    "Engineering I", "Engineering II",
    "Arts I", "Arts II"
  ];

  // Initialize from LocalStorage
  useEffect(() => {
    const stored = localStorage.getItem("selectedDepartment");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSelectedDeprt(parsed);
        // Default to BS if study_level is undefined
        const isInter = studyLevel !== "BS";
        setIsBS(!isInter);
      } catch (e) {
        console.error("Failed to parse selectedDepartment", e);
      }
    }
  }, [studyLevel]);

  // Fetch Existing Settings when selection changes
  useEffect(() => {
    if (!selectedDeprt) return;

    const payload = {
      study_level: selectedDeprt.study_level,
      department_name: selectedDeprt.department_name,
      semester: isBS ? semester : null,
      inter_class: !isBS ? interClass : null,
    };

    // Only fetch if required fields are selected
    if ((isBS && semester) || (!isBS && interClass)) {
      dispatch(getFeeSetting(payload))
        .unwrap()
        .then((data) => {
          if (data) {
            // Existing record found, auto-fill
            setExistingRecordId(data.id);
            setFees({
              "Admission Fee": data.admission_fee || "",
              "College Fee": data.college_fee || "",
              "CRF": data.CRF || "",
              "Registration Fee": data.registration_fee || "",
              "Exam Fee": data.exam_fee || "",
              "ID Card Fee": data.id_card_fee || "",
            });
            setMessage("Existing settings found and loaded.");
            setMessageType("success");
          } else {
            // No record found, clear fields
            setExistingRecordId(null);
            setFees(FeeType.reduce((acc, type) => ({ ...acc, [type]: "" }), {}));
            setMessage("No existing settings found. Create a new one.");
            setMessageType("info");
          }
        })
        .catch(() => {
          setMessage("Failed to check existing settings.");
          setMessageType("error");
        });
    } else {
      // Clear fields if selection is incomplete
      setExistingRecordId(null);
      setFees(FeeType.reduce((acc, type) => ({ ...acc, [type]: "" }), {}));
      setMessage("");
    }
  }, [semester, interClass, isBS, selectedDeprt, dispatch]);

  const handleFeeChange = (feeType, value) => {
    setFees((prev) => ({
      ...prev,
      [feeType]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if ((isBS && !semester) || (!isBS && !interClass)) {
      setMessage("Please complete all required selections.");
      setMessageType("error");
      return;
    }

    const data = {
      id: existingRecordId, // Included for UPSERT logic
      deprt: {
        id: selectedDeprt?.department_id || selectedDeprt?.inter_id || null,
        name: selectedDeprt?.department_name || selectedDeprt?.class_name || null,
      },
      semester: isBS ? semester : null,
      inter_class: !isBS ? interClass : null,
      fees: fees,
    };

    dispatch(setFee(data))
      .unwrap()
      .then((res) => {
        setExistingRecordId(res.id);
        setMessage(existingRecordId ? "Settings updated successfully!" : "Settings created successfully!");
        setMessageType("success");
      })
      .catch((err) => {
        setMessage(err || "Failed to save settings.");
        setMessageType("error");
      });
  };

  const handleChange = (e) => {
    const value = e.target.value;
    setStudyLevel(value);

    const data = {
      study_level: value,
    };

    localStorage.setItem("selectedDepartment", JSON.stringify(data));
  };


  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="flex-shrink-0 h-full z-10">
          <SideBar />
        </div>
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-800">Fee Setting</h1>
              <p className="text-gray-600 mt-2">
                Configure baseline fee amounts for different academic structures.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 p-6 flex flex-wrap gap-6 items-center">
                {selectedDeprt ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Active Scope:</span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium text-sm">
                      {isBS ? selectedDeprt.department_name : selectedDeprt.class_name}
                    </span>
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full font-medium text-sm">
                      {isBS ? "BS Program" : "Intermediate"}
                    </span>
                  </div>
                ) : (
                  <div className="text-red-500 font-medium">
                    Please select a department from the main dashboard first.
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} className="p-6 md:p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 pb-8 border-b border-gray-100">
                  {isBS ? (
                    <>
                      <div className="flex flex-col gap-2">
                        <label className="font-semibold text-gray-700">Department <span className="text-red-500">*</span></label>
                        <select
                          value={selectedDeprt?.department_name || ""}
                          onChange={(e) => {
                            setSelectedDeprt({
                              study_level: "BS",
                              department_name: e.target.value
                            });
                          }}
                          className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b8860b] focus:border-[#b8860b] transition-all"
                          required
                        >
                          <option value="" disabled>Select Department...</option>
                          {bsDepartments.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="font-semibold text-gray-700">Semester <span className="text-red-500">*</span></label>
                        <select
                          value={semester}
                          onChange={(e) => setSemester(e.target.value)}
                          className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b8860b] focus:border-[#b8860b] transition-all"
                          required
                        >
                          <option value="" disabled>Select Semester...</option>
                          {bsSemesters.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col gap-2 md:col-span-2">
                      <label className="font-semibold text-gray-700">Inter Class <span className="text-red-500">*</span></label>
                      <select
                        value={interClass}
                        onChange={(e) => setInterClass(e.target.value)}
                        className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b8860b] focus:border-[#b8860b] transition-all"
                        required
                      >
                        <option value="" disabled>Select Class...</option>
                        {interClasses.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  )}
                </div>

                {message && (
                  <div className={`mb-8 p-4 rounded-lg flex items-center justify-between border ${messageType === "success" ? "bg-green-50 text-green-800 border-green-200" :
                    messageType === "error" ? "bg-red-50 text-red-800 border-red-200" :
                      "bg-blue-50 text-blue-800 border-blue-200"
                    }`}>
                    <span className="font-medium">{message}</span>
                    <button type="button" onClick={() => setMessage("")} className="text-xl opacity-60 hover:opacity-100">&times;</button>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Fee Amounts</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {FeeType.map((fee) => (
                      <div key={fee} className="flex flex-col gap-2 group">
                        <label className="text-sm font-semibold text-gray-600 group-hover:text-[#b8860b] transition-colors">
                          {fee}
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">Rs.</span>
                          <input
                            type="number"
                            min="0"
                            className="w-full pl-10 p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b8860b] focus:border-[#b8860b] transition-all"
                            value={fees[fee]}
                            onChange={(e) => handleFeeChange(fee, e.target.value)}
                            placeholder="0"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-100 flex items-center justify-end gap-4">
                  <Button
                    type="submit"
                    loading={globalLoading}
                    loadingText="Saving..."
                    className="!px-8 !py-3 !text-lg shadow-md hover:shadow-lg disabled:opacity-50"
                    disabled={!selectedDeprt || ((isBS && !semester) || (!isBS && !interClass))}
                  >
                    {existingRecordId ? "Update Setting" : "Create Setting"}
                  </Button>
                </div>
              </form>
            </div>
            <label className="block mb-2 font-semibold">Select Study Level</label>

            <select
              value={studyLevel}
              onChange={handleChange}
              className="border p-2 rounded w-full"
            >
              <option value="">Select option</option>
              <option value="BS">BS</option>
              <option value="Intermediate">Intermediate</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Setting;
