import { useState } from "react";
import { router, useForm } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import DataTable from "@/Components/DataTable"; // 👈 shared DataTable component
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function SchedulerTable({ tableData, machines, empData, tableFilters }) {

  // Function para i-download yung modal content
const handleDownloadPDF = () => {
  const input = document.getElementById("modal-content"); // target yung buong modal
  html2canvas(input, { scale: 2 }).then((canvas) => {
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save("activity-details.pdf");
  });
};
  
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    machine: "",
    controlNo: "",
    serial: "",
    pmDate: "",
    pmDue: "",
    performedBy: empData?.emp_name || "",
    machinePlatform: "",
    quarter: "",
    progress_value: 0,
    seniorTech: "",
    esdTech: "",
    pmEngineer: ""
  });
  const [selectedChecklist, setSelectedChecklist] = useState([]);
  const [answers, setAnswers] = useState({});
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // 🔹 Current Quarter
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  let quarter;
  if (currentMonth >= 1 && currentMonth <= 3) quarter = `1Q${String(currentYear).slice(-2)}`;
  else if (currentMonth >= 4 && currentMonth <= 6) quarter = `2Q${String(currentYear).slice(-2)}`;
  else if (currentMonth >= 7 && currentMonth <= 9) quarter = `3Q${String(currentYear).slice(-2)}`;
  else quarter = `4Q${String(currentYear).slice(-2)}`;

  // 🔹 Compute Work Week
  const getWorkWeek = (date) => {
    const start = new Date("2024-11-03");
    const diffMs = date - start;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return 501 + Math.floor(diffDays / 7);
  };

  const handleAnswerChange = (id, field, value) => {
    setAnswers((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };




  const handleMachineChange = async (e) => {
    const selected = e.target.value;
    const machine = machines.find((m) => m.machine_num === selected);
    if (!machine) return;

    const today = new Date();
    const pmDateWW = getWorkWeek(today);
    const dueDate = new Date(today);
    dueDate.setDate(today.getDate() + 5 * 7);
    const pmDueWW = getWorkWeek(dueDate);
    

    let progress_value = 25;

    setFormData({
      machine: selected,
      controlNo: machine?.pmnt_no || "",
      serial: machine?.serial || "",
      machinePlatform: machine?.machine_platform || "",
      pmDate: `WW${pmDateWW}`,
      pmDue: `WW${pmDueWW}`,
      quarter,
      progress_value,
      performedBy: empData?.emp_name || "",
    });

    if (machine?.machine_platform) {
      try {
        const res = await fetch(`/checklist/${machine.machine_platform}`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        setSelectedChecklist(data);

        const initialAnswers = {};
        data.forEach((row) => {
          initialAnswers[row.id] = {
            assy_item: row.assy_item,
            description: row.description,
            requirements: row.requirements,
            activity_1: row.activity_1,
            compliance1: 0,
            remarks1: "",
            activity_2: row.activity_2,
            compliance2: 0,
            remarks2: "",
          };
        });
        setAnswers(initialAnswers);
      } catch (err) {
        console.error("❌ Error fetching checklist:", err.message);
        setSelectedChecklist([]);
        setAnswers({});
      }
    }
  };

  const saveSchedule = (e) => {
    e.preventDefault();

    const answersArray = Object.keys(answers).map((key) => ({
      id: key,
      ...answers[key],
    }));

    const payload = {
      machine_num: formData.machine,
      pmnt_no: formData.controlNo,
      serial: formData.serial,
      first_cycle: formData.pmDate,
      pm_due: formData.pmDue,
      responsible_person: formData.performedBy,
      quarter: formData.quarter,
      answers: JSON.stringify(answersArray),
      progress_value: formData.progress_value
    };

    router.post("/scheduler", payload, {
      onSuccess: () => {
        alert("✅ PM Scheduler created successfully!");
        setShowModal(false);
        window.location.reload();
      },
      onError: () => {
        alert("❌ Failed to save scheduler. Please check your inputs.");
      },
    });
  };

const dataWithProgressAndAction = (tableData?.data || []).map((row, index) => {

  return {
    ...row,
    i: index + 1,
   progress: (() => {
  const value = row.progress_value || 0;
  let label = "";

  if (value === 0) {
    // label = "In Progress";
  } else if (value > 0 && value <= 25) {
    // label = "Done Filled by Technician";
  } else if (value > 25 && value <= 50) {
    // label = "Done Filled by ESD Personnel";
  } else if (value > 50 && value <= 75) {
    // label = "Done Filled by Senior Technician";
  } else if (value === 100) {
    // label = "Completed";
  }

  return (
    <div className="w-full bg-gray-200 rounded-md h-5 overflow-hidden shadow">
      <div
        className={`
          h-5 text-xs flex justify-center items-center ont-semibold transition-all duration-500
          ${value === 0
            ? "bg-gradient-to-r from-red-600 to-black"
            : value <= 25
            ? "bg-gradient-to-r from-red-900 to-amber-600"
            : value <= 50
            ? "bg-gradient-to-r from-amber-700 to-green-600"
            : value <= 75
            ? "bg-gradient-to-r from-yellow-700 to-green-700"
            : "bg-gradient-to-r from-green-700 to-green-700"
          }
        `}
        style={{ width: `${value}%` }}
      >
        {/* {label} ({value}%) */}
        {value}%
      </div>
    </div>
  );
})(),

  action: (
  <button
    className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
    onClick={() => {
     setFormData({
  machine: row.machine_num,
  controlNo: row.pmnt_no,
  serial: row.serial,
  pmDate: row.first_cycle,
  pmDue: row.pm_due,
  performedBy: row.responsible_person,
  machinePlatform: row.machine_platform,
  quarter: row.quarter,
  progress_value: row.progress_value,
  seniorTech: row.tech_ack && row.tech_ack_date
               ? `${row.tech_ack} / ${row.tech_ack_date}` 
               : '',
  esdTech: row.qa_ack  && row.qa_ack_date
               ? `${row.qa_ack} / ${row.qa_ack_date}` 
               : '',
  pmEngineer: row.senior_ee_ack && row.senior_ee_ack_date 
               ? `${row.senior_ee_ack} / ${row.senior_ee_ack_date}` 
               : ''
});

      setSelectedActivity(row);
      setModalOpen(true); // ito yung view modal
    }}
  >
    <i className="fas fa-eye"></i> View
  </button>
),

  };
});

const handleVerify = (activityId) => {
  if (!empData?.emp_jobtitle) {
    alert("❌ Missing job title, cannot verify.");
    return;
  }

  const now = new Date();
const todayLocal = now.getFullYear() + '-' +
                   String(now.getMonth() + 1).padStart(2, '0') + '-' +
                   String(now.getDate()).padStart(2, '0') + ' ' +
                   String(now.getHours()).padStart(2, '0') + ':' +
                   String(now.getMinutes()).padStart(2, '0') + ':' +
                   String(now.getSeconds()).padStart(2, '0');

console.log(todayLocal);

  let updateFields = {};

  // 1. Technician verify
  const techTitles = [
  "Senior Equipment Technician",
  // "Equipment Technician 1",
  "Equipment Technician 2",
  "Equipment Technician 3",
  // "PM Technician 1",
  "PM Technician 2"
  // "Trainee - Equipment Technician 1"
];

if (techTitles.includes(empData.emp_jobtitle)) {
  if (selectedActivity.tech_ack) {
    alert("⚠️ Already verified by Technician.");
    return;
  }
  updateFields = {
    tech_ack: empData.emp_name,
    tech_ack_date: todayLocal,
    progress_value: (selectedActivity.progress_value || 0) + 25,
  };
}
  // 2. ESD verify
  else if (["ESD Technician 1", "ESD Technician 2", "Senior QA Engineer"].includes(empData.emp_jobtitle)) {
    if (!selectedActivity.tech_ack) {
      alert("⚠️ Technician must verify first.");
      return;
    }
    if (selectedActivity.qa_ack) {
      alert("⚠️ Already verified by ESD.");
      return;
    }
    updateFields = {
      qa_ack: empData.emp_name,
      qa_ack_date: todayLocal,
      progress_value: (selectedActivity.progress_value || 0) + 25,
    };
  }
  // 3. Engineer/Section Head verify
  else if (
    [
      "Equipment Engineer",
      "Supervisor - Equipment Technician",
      "Senior Equipment Engineer",
      "Sr. Equipment Engineer",
      "Equipment Engineering Section Head",
      "Section Head - Equipment Engineering",
    ].includes(empData.emp_jobtitle)
  ) {
    if (!selectedActivity.qa_ack) {
      alert("⚠️ ESD must verify first.");
      return;
    }
    if (selectedActivity.senior_ee_ack || selectedActivity.section_ack) {
      alert("⚠️ Already verified by Engineer/Section Head.");
      return;
    }
    updateFields = {
      senior_ee_ack: empData.emp_name,
      senior_ee_ack_date: todayLocal,
      progress_value: (selectedActivity.progress_value || 0) + 25,
    };
  } else {
    alert("⚠️ You are not allowed to verify.");
    return;
  }

  router.put(`/scheduler/${activityId}/verify`, updateFields, {
    onSuccess: () => {
      alert("✅ Verified successfully!");
      setModalOpen(false);
      window.location.reload();
    },
    onError: () => {
      alert("❌ Verification failed.");
    },
  });
};




  return (
    <AuthenticatedLayout>
      <div className="rounded-2xl shadow p-4 text-white overflow-auto">
        {/* Header */}
        <div className="border-b p-4 flex justify-between items-center bg-gradient-to-r from-gray-600 to-black text-white rounded-t-2xl">
          <h2 className="text-lg font-bold">
            <i className="fas fa-list"></i> List of Machine for PM
          </h2>
          <button
            className="px-4 py-2 rounded-lg bg-blue-700 text-white hover:bg-blue-800 transition"
            onClick={() => setShowModal(true)}
          >
            <i className="fas fa-plus"></i> New
          </button>
        </div>

        {/* ✅ DataTable */}
        <DataTable
          columns={[
            { key: "pmnt_no", label: "PMNT Number" },
            { key: "machine_num", label: "Machine" },
            { key: "quarter", label: "Quarter" },
            { key: "first_cycle", label: "PM Date" },
            { key: "pm_due", label: "PM Due" },
            { key: "progress", label: "Progress" },
            { key: "action", label: "Action" },
          ]}
          data={dataWithProgressAndAction}
          meta={{
            from: tableData?.from,
            to: tableData?.to,
            total: tableData?.total,
            links: tableData?.links,
            currentPage: tableData?.current_page,
            lastPage: tableData?.last_page,
          }}
          routeName={route("tnr.schedulerTable")}
          filters={tableFilters}
          rowKey="id"
          sortBy="id"
          sortOrder="desc"
        />
        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white w-full max-w-7xl rounded-lg shadow-lg max-h-screen overflow-y-auto">
              
              {/* Header */}
              <div className="flex justify-between items-center bg-gradient-to-r from-gray-600 to-black text-white p-4 rounded-t-lg sticky top-0 z-10">
                <h5 className="text-lg font-bold">
                  <i className="fas fa-tools"></i> New TNR Machine for PM
                </h5>
                <button
                  className="text-white text-xl"
                  onClick={() => setShowModal(false)}
                >
                  <i className="fas fa-times text-red-500 hover:text-red-700"></i>
                </button>
              </div>

              {/* Body */}
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-gray-500">Machine</label>
                  <select
                    className="border rounded w-full text-gray-500"
                    value={formData.machine}
                    onChange={handleMachineChange}
                    required
                  >
                    <option value="">Select here...</option>
                    {machines.map((m, i) => (
                      <option key={i} value={m.machine_num}>
                        {m.machine_num}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-500">Machine Platform</label>
                  <input
                    type="text"
                    className="border rounded w-full text-gray-500"
                    value={formData.machinePlatform || ""}
                    readOnly
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-500">Control Number</label>
                  <input
                    type="text"
                    className="border rounded w-full text-gray-500"
                    value={formData.controlNo || ""}
                    readOnly
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-500">Serial Number</label>
                  <input
                    type="text"
                    className="border rounded w-full text-gray-500"
                    value={formData.serial || ""}
                    readOnly
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-500">PM Date</label>
                  <input
                    type="text"
                    className="border rounded w-full text-gray-500"
                    value={formData.pmDate || ""}
                    readOnly
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-500">PM Due</label>
                  <input
                    type="text"
                    className="border rounded w-full text-gray-500"
                    value={formData.pmDue || ""}
                    readOnly
                  />
                </div>

                <div className="sm:col-span-2 md:col-span-1">
                  <label className="block font-semibold text-gray-500">Performed By</label>
                  <input
                    type="text"
                    className="border rounded w-full text-gray-500"
                    value={formData.performedBy || ""}
                    readOnly
                  />
                </div>

                <div className="sm:col-span-2 md:col-span-1">
                  <label className="block font-semibold text-gray-500">Quarter</label>
                  <input
                    type="text"
                    className="border rounded w-full text-gray-500"
                    value={formData.quarter || ""}
                    readOnly
                  />
                </div>
                <div className="sm:col-span-2 md:col-span-1">
                  <label className="block font-semibold text-gray-500">Progress Value</label>
                  <input
                    type="text"
                    className="border rounded w-full text-gray-500"
                    value={formData.progress_value}
                    readOnly
                  />
                </div>
              </div>

              {/* Checklist Section */}
              {selectedChecklist.length > 0 && (
                <div className="p-4">
                  <h3 className="font-bold text-gray-700 mb-2">
                    Checklist for Platform: {formData.machinePlatform}
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="table-auto w-full text-sm border-collapse border border-gray-300">
                      <thead className="bg-gray-200 sticky top-0 z-10">
                        <tr className="bg-gradient-to-r from-gray-600 to-black text-white">
                          <th rowSpan="2" className="border border-gray-300 px-2 py-1">ASSY Item</th>
                          <th rowSpan="2" className="border border-gray-300 px-2 py-1">Description</th>
                          <th rowSpan="2"  className="border border-gray-300 px-2 py-1">Requirement</th>
                          <th colSpan="3" className="border border-gray-300 px-2 py-1">First Cycle</th>
                          <th colSpan="3" className="border border-gray-300 px-2 py-1">Second Cycle</th>
                        </tr>
                        <tr className="bg-gray-500">
                          <th className="border border-gray-300 px-2 py-1">Activity</th>
                          <th className="border border-gray-300 px-2 py-1">Compliance</th>
                          <th className="border border-gray-300 px-2 py-1">Remarks</th>
                          <th className="border border-gray-300 px-2 py-1">Activity</th>
                          <th className="border border-gray-300 px-2 py-1">Compliance</th>
                          <th className="border border-gray-300 px-2 py-1">Remarks</th>
                          </tr>
                      </thead>
                      <tbody>
                        {selectedChecklist.map((row) => (
                          <tr key={row.id} className="hover:bg-gray-400 hover:text-white text-gray-700">
                            <td className="border border-gray-300 px-2 py-1">{answers[row.id]?.assy_item || row.assy_item}</td>
                            <td className="border border-gray-300 px-2 py-1">{answers[row.id]?.description || row.description}</td>
                            <td className="border border-gray-300 px-2 py-1">{answers[row.id]?.requirements || row.requirements}</td>
                            <td className="border border-gray-300 px-2 py-1 text-center">{answers[row.id]?.activity_1 || row.activity_1}</td>
                            <td className="border border-gray-300 px-2 py-1 text-center">
                              <input
                                type="checkbox"
                                checked={answers[row.id]?.compliance1 || false}
                                onChange={(e) =>
                                  handleAnswerChange(row.id, "compliance1", e.target.checked ? 1 : 0)
                                }
                                className="w-5 h-5 mx-auto"
                              />
                              <label className="ml-1" style={{ fontSize: "12px" }}>- Complied</label>
                            </td>
                            <td className="border border-gray-300 px-2 py-1">
                              <input
                                type="text"
                                className="border rounded w-full border border-gray-300 px-2 py-1 text-gray-700"
                                value={answers[row.id]?.remarks1 || ""}
                                onChange={(e) =>
                                  handleAnswerChange(row.id, "remarks1", e.target.value)
                                }
                              />
                            </td>
                            <td className="border border-gray-300 px-2 py-1 text-center">{answers[row.id]?.activity_2 || row.activity_2}</td>
                            <td className="border border-gray-300 px-2 py-1 text-center">
                              <input
                                type="checkbox"
                                checked={answers[row.id]?.compliance2 || false}
                                onChange={(e) =>
                                  handleAnswerChange(row.id, "compliance2", e.target.checked ? 1 : 0)
                                }
                                className="w-5 h-5 mx-auto"
                              />
                              <label className="ml-1" style={{ fontSize: "12px" }}>- Complied</label>
                            </td>
                            <td className="border border-gray-300 px-2 py-1">
                              <input
                                type="text"
                                className="border rounded w-full border border-gray-300 px-2 py-1 text-gray-700"
                                value={answers[row.id]?.remarks2 || ""}
                                onChange={(e) =>
                                  handleAnswerChange(row.id, "remarks2", e.target.value)
                                }
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="flex flex-col sm:flex-row justify-end gap-2 p-4 border-t">
                <button
                  className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600"
                  onClick={() => setShowModal(false)}
                >
                  <i className="fa-solid fa-circle-xmark"></i> Close
                </button>
                <button
                  className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                  onClick={saveSchedule}
                >
                  <i className="fa-solid fa-bookmark"></i> Save
                </button>
              </div>
            </div>
          </div>
        )}

        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div id="modal-content" className="bg-white w-full max-w-7xl rounded-lg shadow-lg max-h-screen overflow-y-auto">
    <div className="bg-white w-full max-w-7xl rounded-lg shadow-lg max-h-screen overflow-y-auto">

    
      
      {/* Header */}
      <div className="flex justify-between items-center bg-gradient-to-r from-gray-600 to-black text-white p-4 rounded-t-lg">
        <h5 className="text-lg font-bold">
          <i className="fas fa-tasks"></i> Activity Details
        </h5>
        <button
          className="text-white text-xl"
          onClick={() => setModalOpen(false)}
        >
          <i className="fas fa-times text-red-500 hover:text-red-700"></i>
        </button>
      </div>
 {selectedActivity?.tech_ack && selectedActivity?.qa_ack && (selectedActivity?.senior_ee_ack || selectedActivity?.section_ack) && (
            <div className="flex justify-end mt-4 mb-4 mr-4">
              <button
                className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-800 "
               onClick={() => window.open(`/scheduler/${selectedActivity.id}/pdf`, "_blank")}
              >
                <i className="fa-solid fa-file-pdf"></i> View as PDF
              </button>
            </div>
          )}
      {/* Body */}
      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block font-semibold text-gray-600">Machine</label>
            <input
              type="text"
              className="form-control border rounded w-full text-gray-600"
              value={formData.machine || ""}
              readOnly
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-600">Control Number</label>
            <input
              type="text"
              className="form-control border rounded w-full text-gray-600"
              value={formData.controlNo || ""}
              readOnly
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-600">Serial Number</label>
            <input
              type="text"
              className="form-control border rounded w-full text-gray-600"
              value={formData.serial || ""}
              readOnly
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-600">PM Date</label>
            <input
              type="text"
              className="form-control border rounded w-full text-gray-600"
              value={formData.pmDate || ""}
              readOnly
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-600">PM Due</label>
            <input
              type="text"
              className="form-control border rounded w-full text-gray-600"
              value={formData.pmDue || ""}
              readOnly
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-600">Technician</label>
            <input
              type="text"
              className="form-control border rounded w-full text-gray-600"
              value={formData.performedBy || "Empty Field..."}
              readOnly
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-600">Senior Technician</label>
            <input
              type="text"
              className="form-control border rounded w-full text-gray-600 text-sm"
              value={formData.seniorTech || "Waiting for Senior Technician..."}
              readOnly
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-600">ESD Technician</label>
            <input
              type="text"
              className="form-control border rounded w-full text-gray-600 text-sm"
              value={formData.esdTech || "Waiting for ESD Technician..."}
              readOnly
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-600">Senior Engineer</label>
            <input
              type="text"
              className="form-control border rounded w-full text-gray-600 text-sm"
              value={formData.pmEngineer || "Waiting for Senior Engineer/ Engineer..."}
              readOnly
            />
          </div>
        </div>
        

        {/* Info callout */}
        <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-4 text-center">
          <label className="font-bold text-gray-700">Activity Code:</label>
          <p className="text-sm text-gray-700">
            A - Check; B - Clean; C - Lubricate; D - Adjust; E - Align; F - Calibrate; G - Modify; H - Repair;
            I - Replace; J - Refill; K - Drain; L - Measure; M - Scan/Disk Defragment; N - Change Oil;
          </p>
        </div>

        {/* Placeholder for answers table */}
       <div className="mt-4">
         
  {/* <h6 className="font-semibold text-gray-600">Answers:</h6> */}
  <div className="border p-2 rounded overflow-x-auto">
    {selectedActivity?.answers ? (
      <table className="table-auto w-full text-sm border-collapse border border-gray-300">
        <thead>
          <tr  className="bg-gradient-to-r from-gray-600 to-black text-white">
            <th rowSpan="2" className="border border-gray-300 px-2 py-1">#</th>
            <th rowSpan="2" className="border border-gray-300 px-2 py-1">Assy Item</th>
            <th rowSpan="2" className="border border-gray-300 px-2 py-1">Description</th>
            <th rowSpan="2" className="border border-gray-300 px-2 py-1">Requirements</th>
            <th colSpan="3" className="border border-gray-300 px-2 py-1">First Cycle</th>
            <th colSpan="3" className="border border-gray-300 px-2 py-1">Second Cycle</th>
          </tr>
          <tr>
            <th className="border border-gray-300 px-2 py-1 bg-gradient-to-r from-gray-700 to-slate-400 text-white">Activity</th>
            <th className="border border-gray-300 px-2 py-1 bg-gradient-to-r from-gray-600 to-slate-400 text-white">Compliance</th>
            <th className="border border-gray-300 px-2 py-1 bg-gradient-to-r from-gray-600 to-slate-400 text-white">Remarks</th>
            <th className="border border-gray-300 px-2 py-1 bg-gradient-to-r from-gray-600 to-slate-400 text-white">Activity</th>
            <th className="border border-gray-300 px-2 py-1 bg-gradient-to-r from-gray-600 to-slate-400 text-white">Compliance</th>
            <th className="border border-gray-300 px-2 py-1 bg-gradient-to-r from-gray-600 to-slate-400 text-white">Remarks</th>
          </tr>
        </thead>
        <tbody>
          {JSON.parse(selectedActivity.answers).map((ans, i) => (
            <tr key={i} className=" text-gray-500">
              <td className="border border-gray-300 px-2 py-1">{i + 1}</td>
              <td className="border border-gray-300 px-2 py-1">{ans.assy_item}</td>
              <td className="border border-gray-300 px-2 py-1">{ans.description}</td>
              <td className="border border-gray-300 px-2 py-1">{ans.requirements}</td>
              <td className="border border-gray-300 px-2 py-1">{ans.activity_1}</td>
              <td className="border border-gray-300 px-2 py-1 text-center">
                 <input
                    type="checkbox"
                   checked={true}
                    readOnly
                    className="h-4 w-4 accent-green-600 rounded-full"
                 />
              </td>
              <td className="border border-gray-300 px-2 py-1">{ans.remarks1}</td>
                <td className="border border-gray-300 px-2 py-1">{ans.activity_2}</td>
              <td className="border border-gray-300 px-2 py-1 text-center">
                 <input
                   type="checkbox"
                    checked={ans.compliance2 == 1}
                    readOnly
                   className="h-4 w-4 accent-green-600 rounded-full"
                  />
              </td>
              <td className="border border-gray-300 px-2 py-1">{ans.remarks2}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ) : (
      <p className="text-gray-500 italic">No answers found.</p>
    )}
  </div>
</div>

      </div>

      {/* Footer */}
      <div className="flex justify-end gap-2 p-4 border-t">
        <button
          className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600"
          onClick={() => setModalOpen(false)}
        >
          <i className="fa-solid fa-xmark"></i> Close
        </button>

        {/* ✅ Show Verify button only if empData is allowed */}
{empData && (() => {
 const isTech = [
  "Senior Equipment Technician",
  // "Equipment Technician 1",
  "Equipment Technician 2",
  "Equipment Technician 3",
  // "PM Technician 1",
  "PM Technician 2"
  // "Trainee - Equipment Technician 1"
].includes(empData.emp_jobtitle);
  const isQA = ["ESD Technician 1", "ESD Technician 2", "Senior QA Engineer"].includes(empData.emp_jobtitle);
  const isEngineer = [
    "Equipment Engineer",
    "Supervisor - Equipment Technician",
    "Senior Equipment Engineer",
    "Sr. Equipment Engineer",
    "Equipment Engineering Section Head",
    "Section Head - Equipment Engineering"
  ].includes(empData.emp_jobtitle);

  // 🔹 1. Technician can verify if no tech_ack yet
  if (isTech && !selectedActivity.tech_ack) {
    return (
      <button
        className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
        onClick={() => handleVerify(selectedActivity.id)}
      >
        <i className="fa-solid fa-check"></i> Verify
      </button>
    );
  }

  // 🔹 2. ESD can verify if tech already verified but no qa_ack yet
  if (isQA && selectedActivity.tech_ack && !selectedActivity.qa_ack) {
    return (
      <button
        className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
        onClick={() => handleVerify(selectedActivity.id)}
      >
        <i className="fa-solid fa-check"></i> Verify
      </button>
    );
  }

  // 🔹 3. Engineer/Section Head can verify if ESD already verified but no engineer/section ack yet
  if (isEngineer && selectedActivity.qa_ack && !selectedActivity.senior_ee_ack && !selectedActivity.section_ack) {
    return (
      <button
        className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
        onClick={() => handleVerify(selectedActivity.id)}
      >
        <i className="fa-solid fa-check"></i> Verify
      </button>
    );
  }

  {/* ✅ Lalabas lang kung lahat ng tatlo ay verified */}



  return null; // hide if not allowed
})()}

      </div>
    </div>
          </div>
        </div>
        )}

      </div>
    </AuthenticatedLayout>
  );
}
