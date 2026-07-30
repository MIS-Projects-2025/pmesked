import { useState } from "react";
import { router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import DataTable from "@/Components/DataTable";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Select } from "antd";


export default function SchedulerTable({ tableData, empData, tableFilters, machines, emp_data}) {

  const { Option } = Select;
  // 🔹 PDF Download
  const handleDownloadPDF = () => {
    const input = document.getElementById("modal-content");
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
  const [selectedChecklist, setSelectedChecklist] = useState([]);
  const [answers, setAnswers] = useState({});
  const [tool_life, setToolLifeData] = useState({});
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // 🔹 Compute Quarter const currentDate = new Date(); const year = currentDate.getFullYear(); const month = currentDate.getMonth() + 1; let quarter = month <= 3 ? 1Q${String(year).slice(-2)} : month <= 6 ? 2Q${String(year).slice(-2)} : month <= 9 ? 3Q${String(year).slice(-2)} : 4Q${String(year).slice(-2)};

  // 🔹 Compute Fiscal Quarter (Starting Nov 3, 2024)
const currentDate = new Date();
const fiscalStart = new Date('2024-11-03'); // starting point of 1Q25

// Compute months difference from the start of fiscal cycle
const diffMonths =
  (currentDate.getFullYear() - fiscalStart.getFullYear()) * 12 +
  (currentDate.getMonth() - fiscalStart.getMonth());

// Each quarter = 3 months
const quarterIndex = Math.floor(diffMonths / 3);
const quarterNumber = (quarterIndex % 4) + 1;

// Compute which fiscal year we are in
// Each cycle of 4 quarters → +1 year
const fiscalYear = 2025 + Math.floor(quarterIndex / 4);

// Format label (e.g., "1Q25", "2Q25", "3Q25", "4Q25", then "1Q26")
const quarter = `${quarterNumber}Q${String(fiscalYear).slice(-2)}`;

// console.log("Current Quarter:", quarter);


  // // 🔹 Compute Work Week
  // const getWorkWeek = (date) => {
  //   const start = new Date("2024-11-03"); // Base ref WW501
  //   const diffMs = date - start;
  //   const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  //   const totalWeeks = Math.floor(diffDays / 7);
  //   const baseYear = 500;
  //   const yearOffset = Math.floor(totalWeeks / 52);
  //   const weekInYear = (totalWeeks % 52) + 1;
  //   return `WW${baseYear + yearOffset * 100 + weekInYear}`;
  // };

  // // 🔹 Default PM Dates
  // const today = new Date();
  // const pmDateWW = getWorkWeek(today);
  // const dueDate = new Date(today);
  // dueDate.setDate(today.getDate() + 13 * 7);
  // const pmDueWW = getWorkWeek(dueDate);

  // 🔹 Compute Dates (no more WW codes)
const today = new Date();

// 🔹 Format date helper: MM/DD/YYYY
const formatDate = (date) => {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
};

// 🔹 Compute PM Dates
const pmDateWW = formatDate(today); // current date
const dueDate = new Date(today);
dueDate.setDate(today.getDate() + 91); // add 91 days instead of 13 weeks
const pmDueWW = formatDate(dueDate);

// console.log("PM Date:", pmDateWW);
// console.log("PM Due Date (+91 days):", pmDueWW);


  const [formData, setFormData] = useState({
    controlNo: "",
    serial: "",
    pmDate: "",
    pmDue: "",
    performedBy: empData?.emp_name || "",
    quarter,
    progress_value: 25,
    seniorTech: "",
    esdTech: "",
    pmEngineer: ""
  });

  // 🔹 Handle Answer Inputs
  const handleAnswerChange = (id, field, value) => {
    setAnswers((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  const handleToolLifeChange = (id, field, value) => {
    setToolLifeData((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

const handleMachineChange = (e) => {
  const selected = e.target.value;
  const machine = machines.find((m) => m.machine_num === selected);
  if (!machine) return;

  // const today = new Date();
  // const pmDateWW = getWorkWeek(today);
  // const dueDate = new Date(today);
  // dueDate.setDate(today.getDate() + 5 * 7);
  // const pmDueWW = getWorkWeek(dueDate);

  let progress_value = 25;

  setFormData({
    machine: selected,
    controlNo: machine?.pmnt_no || "",
    serial: machine?.serial || "",
    pmDate: `${pmDateWW}`,
    pmDue: `${pmDueWW}`,
    quarter,
    progress_value,
    performedBy: empData?.emp_name || "",
  });

  // ✅ Clear checklist + answers since di na sila needed
  setSelectedChecklist([]);
  setAnswers({});
};



  // 🔹 Handle Platform Change (Manual options + Fetch checklist)
const handlePlatformChange = async (selectedPlatform) => {
  setFormData((prev) => ({ ...prev, machinePlatform: selectedPlatform }));

  if (!selectedPlatform) {
    setSelectedChecklist([]);
    setAnswers({});
    return;
  }

  try {
    const res = await fetch(`/checklist/${selectedPlatform}`);
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
        remarks1: "PASSED",
        activity_2: row.activity_2,
        compliance2: 0,
        remarks2: "PASSED",
      };
    });
    setAnswers(initialAnswers);
  } catch (err) {
    console.error("❌ Error fetching checklist:", err.message);
    setSelectedChecklist([]);
    setAnswers({});
  }
};


  const handleVerify = (activityId) => {
  if (!empData?.emp_jobtitle) {
    alert("❌ Missing job title, cannot verify.");
    return;
  }

  const today = new Date().toISOString().slice(0, 19).replace("T", " ");
  let updateFields = {};

  // 1. Technician verify
  const techTitles = ["seniortech"];

if (techTitles.includes(emp_data.emp_role)) {
  if (selectedActivity.tech_ack) {
    alert("⚠️ Already verified by Technician.");
    return;
  }
  updateFields = {
    tech_ack: empData.emp_name,
    tech_ack_date: today,
    progress_value: (selectedActivity.progress_value || 0) + 25,
  };
}
  // 2. ESD verify
  else if (["esd"].includes(emp_data.emp_role)) {
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
      qa_ack_date: today,
      progress_value: (selectedActivity.progress_value || 0) + 25,
    };
  }
  // 3. Engineer/Section Head verify
  else if (
    ["engineer"].includes(emp_data.emp_role)
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
      senior_ee_ack_date: today,
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

  const saveSchedule = (e) => {
  e.preventDefault();

  const answersArray = Object.keys(answers).map((key) => ({
    id: key,
    ...answers[key],
  }));

  // ✅ get tool life data directly from the table rows
  const tool_lifeArray = toolLifeRows.filter(
    (row) =>
      row.description !== "" ||
      row.partnumber !== "" ||
      row.duration_usage !== "" ||
      row.expected_tool_life !== "" ||
      row.remarks !== ""
  );

  const payload = {
    machine_num: formData.machine,
    pmnt_no: formData.controlNo,
    serial: formData.serial,
    first_cycle: formData.pmDate,
    pm_due: formData.pmDue,
    responsible_person: formData.performedBy,
    quarter: formData.quarter,
    progress_value: formData.progress_value,
    answers: JSON.stringify(answersArray),
    tool_life: JSON.stringify(tool_lifeArray), // ✅ now correct data
  };

  router.post("/scheduler", payload, {
    onSuccess: () => {
      alert("✅ PM Scheduler created successfully!");
      setShowModal(false);
      router.visit(route("tnr.schedulerTable"));
    },
    onError: () => {
      alert("❌ Failed to save scheduler. Please check your inputs.");
    },
  });
};

const handleInputChange = (e) => {
  const { name, value } = e.target;
  setFormData((prev) => ({ ...prev, [name]: value }));
};

const handleRemove = (row) => {
    if (!confirm(`Are you sure you want to permanently delete this checklist for machine ${row.machine_num}?`)) {
        return;
    }

    router.delete(
        route("pm.remove", row.id),   // <-- your delete route
        {
            onSuccess: () => {
                alert("🗑️ Checklist removed successfully!");
                router.reload(); // refresh table
            },
            onError: (errors) => {
                console.error(errors);
                alert("❌ Failed to remove checklist.");
            }
        }
    );
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
            ? "bg-gradient-to-r from-red-600 to-black text-white"
            : value <= 25
            ? "bg-gradient-to-r from-red-900 to-amber-600 text-white"
            : value <= 50
            ? "bg-gradient-to-r from-amber-700 to-green-600 text-white"
            : value <= 75
            ? "bg-gradient-to-r from-yellow-700 to-green-700 text-white"
            : "bg-gradient-to-r from-green-700 to-green-700 text-white"
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
  <div className="flex gap-2">

    {/* --- VIEW BUTTON --- */}
    <button
      className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 group relative"
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
          seniorTech:
            row.tech_ack && row.tech_ack_date
              ? `${row.tech_ack} / ${row.tech_ack_date}`
              : "",
          esdTech:
            row.qa_ack && row.qa_ack_date
              ? `${row.qa_ack} / ${row.qa_ack_date}`
              : "",
          pmEngineer:
            row.senior_ee_ack && row.senior_ee_ack_date
              ? `${row.senior_ee_ack} / ${row.senior_ee_ack_date}`
              : "",
        });

        setSelectedActivity(row);
        setModalOpen(true);
      }}
    >
      <span className="block group-hover:hidden"><i className="fas fa-eye"></i></span>
      <span className="hidden group-hover:block"><i className="fas fa-eye mr-1"></i>View</span>

    </button>

{/* --- REMOVED BUTTON (VISIBLE ONLY IF tech_ack IS NULL/EMPTY AND USER IS RESPONSIBLE_PERSON) --- */}
{(!row.tech_ack || row.tech_ack.trim() === "") &&
  row.responsible_person === emp_data?.emp_name && (
    <button
  className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 group relative"
  onClick={() => handleRemove(row)}
>
  <span className="block group-hover:hidden"><i className="fas fa-trash"></i></span>
  <span className="hidden group-hover:block"><i className="fas fa-trash mr-1"></i>Remove</span>
</button>

)}


  </div>
),


  };
});

  // Default 4 rows
const [toolLifeRows, setToolLifeRows] = useState([
  { description: "", partnumber: "", duration_usage: "", expected_tool_life: "", remarks: "" },
  { description: "", partnumber: "", duration_usage: "", expected_tool_life: "", remarks: "" },
  { description: "", partnumber: "", duration_usage: "", expected_tool_life: "", remarks: "" },
  { description: "", partnumber: "", duration_usage: "", expected_tool_life: "", remarks: "" },
]);

// Handle changes per cell
const handleRowChange = (index, field, value) => {
  const updated = [...toolLifeRows];
  updated[index][field] = value;
  setToolLifeRows(updated);
};

// Add new row
const handleAddRow = () => {
  setToolLifeRows([
    ...toolLifeRows,
    { description: "", partnumber: "", duration_usage: "", expected_tool_life: "", remarks: "" },
  ]);
};

// Remove last row
const handleRemoveRow = () => {
  if (toolLifeRows.length > 1) {
    setToolLifeRows(toolLifeRows.slice(0, -1));
  }
};

const [isAllChecked1, setIsAllChecked1] = useState(false);
const [isAllChecked2, setIsAllChecked2] = useState(false);

const handleCheckAll = (e, complianceField) => {
  const checked = e.target.checked;

  if (complianceField === "compliance1") {
    setIsAllChecked1(checked);
  } else {
    setIsAllChecked2(checked);
  }

  const updatedAnswers = { ...answers };

  selectedChecklist.forEach((row) => {
    // ✅ Apply only to valid activities (not N/A, not empty, not null)
    if (
      complianceField === "compliance1" &&
      row.activity_1 &&
      row.activity_1 !== "N/A"
    ) {
      updatedAnswers[row.id] = {
        ...updatedAnswers[row.id],
        compliance1: checked ? 1 : 0,
      };
    }

    if (
      complianceField === "compliance2" &&
      row.activity_2 &&
      row.activity_2 !== "N/A"
    ) {
      updatedAnswers[row.id] = {
        ...updatedAnswers[row.id],
        compliance2: checked ? 1 : 0,
      };
    }
  });

  setAnswers(updatedAnswers);
};



  return (
    <AuthenticatedLayout>
      <div className="rounded-2xl shadow p-4 overflow-auto light:text-gray-600">
        {/* Header */}
        <div className="border-b p-4 flex justify-between items-center bg-gradient-to-r from-gray-600 to-black text-white rounded-t-2xl">
          <h2 className="text-lg font-bold">
            <i className="fas fa-list"></i> List of Machine for PM
          </h2>
          <button
            className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 border-2 border-blue-800"
            onClick={() => setShowModal(true)}

            >
              + New Checklist
          </button>
        </div>

        {/* DataTable */}
        <DataTable
          columns={[
            { key: "machine_num", label: "Machine Number" },
            { key: "pmnt_no", label: "PMNT Number" },
            { key: "quarter", label: "Quarter" },
            { key: "first_cycle", label: "PM Date" },
            { key: "pm_due", label: "PM Due" },
            { key: "responsible_person", label: "Done By" },
            { key: "tech_ack", label: "Tech Verifier" },
            { key: "qa_ack", label: "ESD Verifier" },
            { key: "senior_ee_ack", label: "PM Engineer Verifier" },
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
  <Select
    showSearch
    allowClear
    placeholder="Select or type machine..."
    value={formData.machine || undefined}
    onChange={(value) => {
      // Find the selected machine object
      const machine = machines.find((m) => m.machine_num === value);
      if (!machine) return;

      // Set formData fields
      let progress_value = 25;

      setFormData((prev) => ({
        ...prev,
        machine: value,
        controlNo: machine?.pmnt_no || "",
        serial: machine?.serial || "",
        pmDate: pmDateWW,
        pmDue: pmDueWW,
        progress_value,
        performedBy: empData?.emp_name || "",
      }));

      // Clear checklist + answers
      setSelectedChecklist([]);
      setAnswers({});
    }}
    filterOption={(input, option) =>
      option.value.toLowerCase().includes(input.toLowerCase())
    }
    className="w-full p-2 border border-gray-500 rounded"
  >
    {machines.map((m, i) => (
      <Option key={i} value={m.machine_num}>
        {m.machine_num}
      </Option>
    ))}
  </Select>
</div>


                <div>
                  <label className="block font-semibold text-gray-500">
                    Platform
                  </label>
                  <Select
  showSearch
  allowClear
  value={formData.machinePlatform}
  placeholder="Select or type platform..."
  onChange={(value) => handlePlatformChange(value)} // <-- value is already string
  filterOption={(input, option) =>
    option.value.toLowerCase().includes(input.toLowerCase())
  }
   className="w-full p-2 border border-gray-500 rounded"
>
  {[
    "V12",
    "ISMECA",
    "ST60",
    "BRANDING (DYSEC_DIPBR_SOLAS DUM-815)",
    "MH3020",
    "LASER MARKING",
    "HOPE SEIKI",
    "HEPCO",
    "BAKE OVEN",
    "G6L",
    "VITROX TR3000i",
    "VITROX TR1000i2000iTR3000i",
    "HSI200",
    "HSI250",
    "HSI400T",
    "HEXA",
    "AT28",
    "AT128",
    "AT268_AT468",
    "AT8005",
    "MICROVISION_MV853A",
    "MV883",
    "MV996",
  ].map((p, i) => (
    <Option key={i} value={p}>
      {p}
    </Option>
  ))}
</Select>
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
  <label className="block font-semibold text-gray-500">
    PM Date
  </label>
  <input
    type="text"
    name="pmDate"
    className="border rounded w-full text-gray-700"
    value={formData.pmDate}
    onChange={handleInputChange}
    required
  />
</div>

<div>
  <label className="block font-semibold text-gray-500">
    PM Due
  </label>
  <input
    type="text"
    name="pmDue"
    className="border rounded w-full text-gray-700"
    value={formData.pmDue}
    onChange={handleInputChange}
    required
  />
</div>


                <div>
                  <label className="block font-semibold text-gray-500">
                    Performed By
                  </label>
                  <input
                    type="text"
                    className="border rounded w-full text-gray-700"
                    value={formData.performedBy}
                    readOnly
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-500">
                    Quarter
                  </label>
                  <input
                    type="text"
                    className="border rounded w-full text-gray-700"
                    value={formData.quarter}
                    readOnly
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-500">
                    Progress Value
                  </label>
                  <input
                    type="text"
                    className="border rounded w-full text-gray-700"
                    value={formData.progress_value}
                    readOnly
                  />
                </div>
              </div>

              {/* Checklist */}
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
    <th rowSpan="2" className="border border-gray-300 px-2 py-1">Requirement</th>
    <th colSpan="3" className="border border-gray-300 px-2 py-1">First Cycle</th>
    <th colSpan="3" className="border border-gray-300 px-2 py-1">Second Cycle</th>
  </tr>
  <tr className="bg-gray-600">
    <th className="border border-gray-300 text-gray-200 px-2 py-1">Activity</th>
    <th className="border border-gray-300 px-2 py-1 text-center">
      <input
        type="checkbox"
        checked={isAllChecked1}
        onChange={(e) => handleCheckAll(e, "compliance1")}
        className="w-5 h-5"
        title="Check all First Cycle"
      />
    </th>
    <th className="border border-gray-300 text-gray-200 px-2 py-1">Remarks</th>

    <th className="border border-gray-300 text-gray-200 px-2 py-1">Activity</th>
    <th className="border border-gray-300 px-2 py-1 text-center">
      <input
        type="checkbox"
        checked={isAllChecked2}
        onChange={(e) => handleCheckAll(e, "compliance2")}
        className="w-5 h-5"
        title="Check all Second Cycle"
      />
    </th>
    <th className="border border-gray-300 text-gray-200 px-2 py-1">Remarks</th>
  </tr>
</thead>

                      <tbody>
                        {selectedChecklist.map((row) => (
                          <tr key={row.id} className="hover:bg-gray-400 hover:text-white text-gray-700">
                            <td className="border border-gray-300 px-2 py-1">{row.assy_item}</td>
                            <td className="border border-gray-300 px-2 py-1">{row.description}</td>
                            <td className="border border-gray-300 px-2 py-1">{row.requirements}</td>
                            {(row.activity_1 && row.activity_1 !== "N/A") ? (
                            <>
                            <td className="text-center border border-gray-300 px-2 py-1">{row.activity_1}</td>
                            <td className="text-center border border-gray-300 px-2 py-1">
                              <input
                                type="checkbox"
                                checked={!!answers[row.id]?.compliance1}
                                onChange={(e) =>
                                  handleAnswerChange(
                                    row.id,
                                    "compliance1",
                                    e.target.checked ? 1 : 0
                                  )

                                }
                                className="w-5 h-5 mx-auto"
                              />
                            </td>
                            <td className="text-center border border-gray-300 px-2 py-1">
                              <input
                                type="text"
                                value={answers[row.id]?.remarks1 || "PASSED"}
                                onChange={(e) =>
                                  handleAnswerChange(
                                    row.id,
                                    "remarks1",
                                    e.target.value
                                  )
                                }
                                 className="border rounded w-full border border-gray-300 px-2 py-1 text-gray-700"
                              />
                            </td>
                              </>
                              ) : (
                               <>
                                <td className="bg-blue-100"></td>
                                <td className="bg-blue-100"></td>
                                <td className="bg-blue-100"></td>
                               </>
                              )}

                              {(row.activity_2 && row.activity_2 !== "N/A") ? (
                            <>
                           <td className="text-center border border-gray-300 px-2 py-1">{row.activity_2}</td>
                            <td className="text-center border border-gray-300 px-2 py-1">
                              <input
                                type="checkbox"
                                checked={!!answers[row.id]?.compliance2}
                                onChange={(e) =>
                                  handleAnswerChange(
                                    row.id,
                                    "compliance2",
                                    e.target.checked ? 1 : 0
                                  )
                                }
                                className="w-5 h-5 mx-auto"
                              />
                            </td>
                            <td className="text-center border border-gray-300 px-2 py-1">
                              <input
                                type="text"
                                value={answers[row.id]?.remarks2 || "PASSED"}
                                onChange={(e) =>
                                  handleAnswerChange(
                                    row.id,
                                    "remarks2",
                                    e.target.value
                                  )
                                }
                                 className="border rounded w-full border border-gray-300 px-2 py-1 text-gray-700"
                              />
                            </td>
                            </>
                              ) : (
                               <>
                                <td className="bg-blue-100"></td>
                                 <td className="bg-blue-100"></td>
                                 <td className="bg-blue-100"></td>
                               </>
                              )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tool Life Table */}
{selectedChecklist.length > 0 && (
  <div className="p-4">
    <div className="flex justify-between items-center mb-2">
      <h2 className="font-semibold text-gray-700">Tool Life</h2>
      <div className="flex gap-2">
        <button
          onClick={handleAddRow}
          className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
        >
          <i className="fas fa-plus"></i> Add Row
        </button>
        <button
          onClick={handleRemoveRow}
          className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
        >
          <i className="fas fa-trash"></i> Remove
        </button>
      </div>
    </div>

    <table className="table-auto w-full text-sm border border-gray-300">
      <thead className="bg-gradient-to-r from-gray-600 to-black text-white">
        <tr>
          <th>Description</th>
          <th>Partnumber</th>
          <th>Duration Usage (Days)</th>
          <th>Expected Tool Life</th>
          <th>Remarks</th>
        </tr>
      </thead>
      <tbody className="text-gray-600">
        {toolLifeRows.map((row, index) => (
          <tr key={index}>
            <td>
              <input
                type="text"
                value={row.description}
                onChange={(e) =>
                  handleRowChange(index, "description", e.target.value)
                }
                className="border w-full px-1"
              />
            </td>
            <td>
              <input
                type="text"
                value={row.partnumber}
                onChange={(e) =>
                  handleRowChange(index, "partnumber", e.target.value)
                }
                className="border w-full px-1"
              />
            </td>
            <td>
              <input
                type="text"
                value={row.duration_usage}
                onChange={(e) =>
                  handleRowChange(index, "duration_usage", e.target.value)
                }
                className="border w-full px-1"
              />
            </td>
            <td>
              <input
                type="text"
                value={row.expected_tool_life}
                onChange={(e) =>
                  handleRowChange(index, "expected_tool_life", e.target.value)
                }
                className="border w-full px-1"
              />
            </td>
            <td>
              <input
                type="text"
                value={row.remarks}
                onChange={(e) =>
                  handleRowChange(index, "remarks", e.target.value)
                }
                className="border w-full px-1"
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}


              {/* Footer Buttons */}
              <div className="p-4 flex justify-end gap-4 sticky bottom-0 bg-white border-t">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-md bg-red-500 text-white hover:bg-red-700"
                >
                  <i className="fas fa-times"></i> Cancel
                </button>
                <button
                  onClick={saveSchedule}
                  className="px-4 py-2 rounded-md bg-green-700 text-white hover:bg-green-800"
                >
                  <i className="fas fa-save"></i> Save Schedule
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Activity View Modal */}
        {modalOpen && selectedActivity && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div
              id="modal-content"
              className="bg-white w-full max-w-5xl rounded-lg shadow-lg max-h-screen overflow-y-auto"
            >
              {/* Header */}
              <div className="flex justify-between items-center bg-gradient-to-r from-gray-600 to-black text-white p-4 rounded-t-lg sticky top-0 z-10">
                <h5 className="text-lg font-bold">
                  <i className="fas fa-clipboard-list"></i> PM Details
                </h5>
                <div className="flex gap-3">
                  <button
                    onClick={handleDownloadPDF}
                    className="bg-red-700 px-3 py-2 rounded-md text-white hover:bg-red-800"
                  >
                    <i className="fas fa-file-pdf"></i> PDF
                  </button>
                  <button
                    onClick={() => setModalOpen(false)}
                    className="text-white text-xl"
                  >
                    <i className="fas fa-times text-red-500 hover:text-red-700"></i>
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-4">
                <table className="table-auto w-full border-collapse border border-gray-300 text-sm">
                  <tbody>
                    <tr>
                      <td className="font-semibold border p-2">Platform</td>
                      <td className="font-semibold border p-2">Control No</td>
                      <td className="border p-2">{selectedActivity.pmnt_no}</td>
                    </tr>
                    <tr>
                      <td className="font-semibold border p-2">Serial</td>
                      <td className="border p-2">{selectedActivity.serial}</td>
                      <td className="font-semibold border p-2">Quarter</td>
                      <td className="border p-2">{selectedActivity.quarter}</td>
                    </tr>
                    <tr>
                      <td className="font-semibold border p-2">PM Date</td>
                      <td className="border p-2">{selectedActivity.first_cycle}</td>
                      <td className="font-semibold border p-2">PM Due</td>
                      <td className="border p-2">{selectedActivity.pm_due}</td>
                    </tr>
                    <tr>
                      <td className="font-semibold border p-2">Performed By</td>
                      <td className="border p-2" colSpan="3">
                        {selectedActivity.responsible_person}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}


       {modalOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
    <div id="modal-content" className="bg-white w-full max-w-7xl rounded-lg shadow-lg max-h-screen overflow-y-auto">
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

      {/* PDF button */}
      {selectedActivity?.tech_ack && selectedActivity?.qa_ack && (selectedActivity?.senior_ee_ack || selectedActivity?.section_ack) && (
        <div className="flex justify-end mt-4 mb-4 mr-4">
          <button
            className="px-3 py-2 bg-gray-100 text-red-600 rounded shadow hover:bg-red-700 hover:text-white border-2 border-red-600 hover:border-gray-500 flex items-center text-bold"
            onClick={() => window.open(`/scheduler/${selectedActivity.id}/pdf`, "_blank")}
          >
            <i className="fa-solid fa-file-pdf"></i> View as PDF
          </button>
        </div>
      )}

      {/* Body */}
      <div className="p-6">
        {/* Info Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block font-semibold text-gray-600">Machine</label>
            <input type="text" className="form-control border rounded w-full text-gray-600" value={formData.machine || ""} readOnly />
          </div>

          <div>
            <label className="block font-semibold text-gray-600">Control Number</label>
            <input type="text" className="form-control border rounded w-full text-gray-600" value={formData.controlNo || ""} readOnly />
          </div>

          <div>
            <label className="block font-semibold text-gray-600">Serial Number</label>
            <input type="text" className="form-control border rounded w-full text-gray-600" value={formData.serial || ""} readOnly />
          </div>

          <div>
            <label className="block font-semibold text-gray-600">PM Date</label>
            <input type="text" className="form-control border rounded w-full text-gray-600" value={formData.pmDate || ""} readOnly />
          </div>

          <div>
            <label className="block font-semibold text-gray-600">PM Due</label>
            <input type="text" className="form-control border rounded w-full text-gray-600" value={formData.pmDue || ""} readOnly />
          </div>

          <div>
            <label className="block font-semibold text-gray-600">Technician</label>
            <input type="text" className="form-control border rounded w-full text-gray-600" value={formData.performedBy || "Empty Field..."} readOnly />
          </div>

          <div>
            <label className="block font-semibold text-gray-600">Senior Technician</label>
            <input type="text" className="form-control border rounded w-full text-gray-600 text-sm" value={formData.seniorTech || "Waiting for Senior Technician..."} readOnly />
          </div>

          <div>
            <label className="block font-semibold text-gray-600">QA Personnel</label>
            <input type="text" className="form-control border rounded w-full text-gray-600 text-sm" value={formData.esdTech || "Waiting for ESD Technician..."} readOnly />
          </div>

          <div>
            <label className="block font-semibold text-gray-600">Senior Engineer</label>
            <input type="text" className="form-control border rounded w-full text-gray-600 text-sm" value={formData.pmEngineer || "Waiting for Senior Engineer/ Engineer..."} readOnly />
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

        {/* Answers Table */}
        <div className="mt-4">
          <div className="border p-2 rounded overflow-x-auto">
            {selectedActivity?.answers ? (
              <table className="table-auto w-full text-sm border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-600 to-black text-white">
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
                    <tr key={i} className="text-gray-500">
                      <td className="border border-gray-300 px-2 py-1">{i + 1}</td>
                      <td className="border border-gray-300 px-2 py-1">{ans.assy_item}</td>
                      <td className="border border-gray-300 px-2 py-1">{ans.description}</td>
                      <td className="border border-gray-300 px-2 py-1">{ans.requirements}</td>
                      {(ans.activity_1 && ans.activity_1 !== "N/A") ? (
                            <>
                      <td className="border border-gray-300 px-2 py-1">{ans.activity_1}</td>
                      <td className="border border-gray-300 px-2 py-1 text-center">
                        <input type="checkbox" checked={true} readOnly className="h-4 w-4 accent-green-600 rounded-full" />
                      </td>
                      <td className="border border-gray-300 px-2 py-1">{ans.remarks1}</td>
                            </>
                              ) : (
                               <>
                                <td className="bg-blue-100"></td>
                                 <td className="bg-blue-100"></td>
                                 <td className="bg-blue-100"></td>
                               </>
                              )}
                               {(ans.activity_2 && ans.activity_2 !== "N/A") ? (
                                <>
                      <td className="border border-gray-300 px-2 py-1">{ans.activity_2}</td>
                      <td className="border border-gray-300 px-2 py-1 text-center">
                        <input type="checkbox" checked={ans.compliance2 == 1} readOnly className="h-4 w-4 accent-green-600 rounded-full" />
                      </td>
                      <td className="border border-gray-300 px-2 py-1">{ans.remarks2}</td>
                       </>
                              ) : (
                               <>
                                <td className="bg-blue-100"></td>
                                 <td className="bg-blue-100"></td>
                                 <td className="bg-blue-100"></td>
                               </>
                              )}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-500 italic">No answers found.</p>
            )}
          </div>
        </div>

        {(() => {
  try {
    const toolLifeArray = JSON.parse(selectedActivity?.tool_life || "[]");
    if (!Array.isArray(toolLifeArray) || toolLifeArray.length === 0) return null;

    return (
      <div className="mt-6">
        <h6 className="font-semibold text-gray-600 mb-2">Tool Life Data:</h6>
        <div className="border p-2 rounded overflow-x-auto">
          <table className="table-auto w-full text-sm border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gradient-to-r from-gray-600 to-black text-white">
                <th className="border border-gray-300 px-2 py-1">#</th>
                <th className="border border-gray-300 px-2 py-1">Description</th>
                <th className="border border-gray-300 px-2 py-1">Part Number</th>
                <th className="border border-gray-300 px-2 py-1">Duration Usage</th>
                <th className="border border-gray-300 px-2 py-1">Expected Tool Life</th>
                <th className="border border-gray-300 px-2 py-1">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {toolLifeArray.map((tool, i) => (
                <tr key={i} className="text-gray-500">
                  <td className="border border-gray-300 px-2 py-1 text-center">{i + 1}</td>
                  <td className="border border-gray-300 px-2 py-1">{tool.description}</td>
                  <td className="border border-gray-300 px-2 py-1">{tool.partnumber}</td>
                  <td className="border border-gray-300 px-2 py-1 text-center">{tool.duration_usage}</td>
                  <td className="border border-gray-300 px-2 py-1 text-center">{tool.expected_tool_life}</td>
                  <td className="border border-gray-300 px-2 py-1">{tool.remarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  } catch (e) {
    return null;
  }
})()}

      </div>

      {/* Footer */}
      <div className="flex justify-end gap-2 p-4 border-t">
        {empData && (() => {
           const currentUser = emp_data?.emp_name;
        if (formData.performedBy === currentUser) {
  return (
    <div className="text-red-600 font-semibold bg-red-100 border border-red-400 rounded px-3 py-2 mt-2">
      <i className="fa-solid fa-circle-exclamation"></i>
      &nbsp; You cannot verify your own activity.
    </div>
  );
}
        })()}
        <button className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600" onClick={() => setModalOpen(false)}>
          <i className="fa-solid fa-xmark"></i> Close
        </button>

        {/* ✅ Verify Buttons */}
        {empData && (() => {
          const isTech = ["seniortech"].includes(emp_data.emp_role);
          const isQA = ["esd"].includes(emp_data.emp_role);
          const isEngineer = ["engineer"].includes(emp_data.emp_role);
          const currentUser = emp_data?.emp_name;

          // If user is the same person → show error instead of button


          if (isTech && !selectedActivity.tech_ack && formData.performedBy !== currentUser) {
            return (
              <button className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700" onClick={() => handleVerify(selectedActivity.id)}>
                <i className="fa-solid fa-check"></i> Verify
              </button>
            );
          }



          if (isQA && selectedActivity.tech_ack && !selectedActivity.qa_ack) {
            return (
              <button className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700" onClick={() => handleVerify(selectedActivity.id)}>
                <i className="fa-solid fa-check"></i> Verify
              </button>
            );
          }

          if (isEngineer && selectedActivity.qa_ack && !selectedActivity.senior_ee_ack && !selectedActivity.section_ack) {
            return (
              <button className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700" onClick={() => handleVerify(selectedActivity.id)}>
                <i className="fa-solid fa-check"></i> Verify
              </button>
            );
          }

          return null;
        })()}
      </div>
    </div>
  </div>
        )}


      </div>
    </AuthenticatedLayout>
  );
}
