import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, usePage, router } from "@inertiajs/react";
import { useState } from "react";

export default function MassApproval({ activities, empData }) {
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ✅ Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [formData, setFormData] = useState({});

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleMassApprove = () => {
    if (selected.length === 0) {
      return alert("No activities selected!");
    }

    router.post(
      route("mass.approval.approve"),
      { ids: selected },
      {
        onSuccess: () => {
          alert("✅ Selected checklist successfully Approved!");
          window.location.reload();
        },
        onError: () => {
          alert("Something went wrong while approving activities!");
        },
      }
    );
  };

  // 🔍 Search filter
  const filtered = activities.filter((act) =>
    [act.machine_num, act.pmnt_no, act.serial, act.responsible_person]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  // 📄 Pagination
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // 🔑 Role-based button visibility
  let showButton = false;
  if (empData && empData.emp_jobtitle) {
    const job = empData.emp_jobtitle;
    const techRoles = [
       "Senior Equipment Technician",
  "Equipment Technician 1",
  "Equipment Technician 2",
  "Equipment Technician 3",
  "PM Technician 1",
  "PM Technician 2",
  "Trainee - Equipment Technician 1"
    ];
    const esdRoles = [
      "ESD Technician 1",
      "ESD Technician 2",
      "Senior QA Engineer",
    ];
    const engineerRoles = [
      "Equipment Engineer",
      "Supervisor - Equipment Technician",
      "Senior Equipment Engineer",
      "Sr. Equipment Engineer",
      "Equipment Engineering Section Head",
      "Section Head - Equipment Engineering",
    ];
    if (techRoles.includes(job)) showButton = true;
    if (esdRoles.includes(job)) showButton = true;
    if (engineerRoles.includes(job)) showButton = true;
  }

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
  "Equipment Technician 1",
  "Equipment Technician 2",
  "Equipment Technician 3",
  "PM Technician 1",
  "PM Technician 2",
  "Trainee - Equipment Technician 1"
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
  else if (["ESD Technician 1", "ESD Technician 2", "Senior QA Engineer", "DIC Clerk 1"].includes(empData.emp_jobtitle)) {
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
      <Head title="TNR Mass Approval" />

      <div className="p-6">
        <div className="flex justify-between items-center mb-2 p-4 bg-gradient-to-r from-gray-600 to-black rounded-t-2xl">
          <h1 className="text-2xl font-bold text-white">
            <i className="fas fa-tasks"></i> TNR Checklist Mass Approval
          </h1>

          {showButton && selected.length > 0 && (
            <button
              onClick={handleMassApprove}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              <i className="fa-solid fa-check"></i>Approve Selected (
              {selected.length})
            </button>
          )}
        </div>

        {/* 🔍 Search bar */}
        <div className="mb-3">
          <input
            type="text"
            placeholder="Search activities..."
            className="border px-2 py-1 rounded w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-500"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        {/* 📋 Table */}
        <div className="overflow-x-auto border rounded">
          <table className="table-auto w-full border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-gray-600 to-black text-white">
                <th className="border px-2 py-1">
                  <input
                    type="checkbox"
                    onChange={(e) =>
                      setSelected(
                        e.target.checked ? paginated.map((a) => a.id) : []
                      )
                    }
                    checked={
                      paginated.length > 0 &&
                      selected.length === paginated.length
                    }
                  />
                </th>
                <th className="border px-2 py-1">Machine</th>
                <th className="border px-2 py-1">Control No</th>
                <th className="border px-2 py-1">Serial</th>
                <th className="border px-2 py-1">Technician</th>
                <th className="border px-2 py-1">Senior Tech</th>
                <th className="border px-2 py-1">ESD Personnel</th>
                <th className="border px-2 py-1">Senior Engineer</th>
                <th className="border px-2 py-1 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length > 0 ? (
                paginated.map((act) => (
                  <tr key={act.id} className="text-sm hover:bg-gray-600">
                    <td className="border px-2 py-1 text-center">
                      <input
                        type="checkbox"
                        checked={selected.includes(act.id)}
                        onChange={() => toggleSelect(act.id)}
                      />
                    </td>
                    <td className="border px-2 py-1">{act.machine_num}</td>
                    <td className="border px-2 py-1">{act.pmnt_no}</td>
                    <td className="border px-2 py-1">{act.serial}</td>
                    <td className="border px-2 py-1">
                      {act.responsible_person}
                    </td>
                   <td className="border px-2 py-1 text-center">
  {act.tech_ack ? (
    <span className="inline-block min-w-[10px] px-3 py-1 rounded-lg text-sm font-medium bg-green-100 text-green-700">
      Approved
    </span>
  ) : (
    <span className="inline-block min-w-[10px] px-3 py-1 rounded-lg text-sm font-medium bg-red-100 text-red-700">
      Pending
    </span>
  )}
</td>

<td className="border px-2 py-1 text-center">
  {act.qa_ack ? (
    <span className="inline-block min-w-[10px] px-3 py-1 rounded-lg text-sm font-medium bg-green-100 text-green-700">
      Approved
    </span>
  ) : (
    <span className="inline-block min-w-[10px] px-3 py-1 rounded-lg text-sm font-medium bg-red-100 text-red-700">
      Pending
    </span>
  )}
</td>

<td className="border px-2 py-1 text-center">
  {act.senior_ee_ack || act.section_ack ? (
    <span className="inline-block min-w-[10px] px-3 py-1 rounded-lg text-sm font-medium bg-green-100 text-green-700">
      Approved
    </span>
  ) : (
    <span className="inline-block min-w-[10px] px-3 py-1 rounded-lg text-sm font-medium bg-red-100 text-red-700">
      Pending
    </span>
  )}
</td>

                    {/* ✅ Action Button */}
                    <td className="border px-2 py-1 text-center flex justify-center gap-2">
                        <div className="flex justify-center gap-2">
                            <button
                        onClick={() => {
                          setSelectedActivity(act);
                          setFormData({
                            machine: act.machine_num,
                            controlNo: act.pmnt_no,
                            serial: act.serial,
                            pmDate: act.first_cycle,
                            pmDue: act.pm_due,
                            performedBy: act.responsible_person,
                            seniorTech: act.tech_ack_by,
                            esdTech: act.qa_ack_by,
                            pmEngineer:
                              act.senior_ee_ack_by || act.section_ack_by,
                          });
                          setModalOpen(true);
                        }}
                        className="px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-800 text-sm"
                      >
                        <i className="fa-solid fa-eye"></i> View
                      </button>
                        </div>
                      
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="text-center py-4 text-gray-500">
                    No activities found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 📌 Pagination */}
        <div className="flex justify-between items-center mt-2">
          <span>
            Page {currentPage} of {totalPages || 1}
          </span>
          <div className="space-x-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="px-2 py-1 border rounded disabled:opacity-50"
            >
              Prev
            </button>
            <button
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="px-2 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* ✅ Modal (simplified, pwede mong palitan ng full details mo) */}
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

  {/* ✅ Tool Life Table */}
        <div className="mt-6">
          <h6 className="font-semibold text-gray-600 mb-2">Tool Life Data:</h6>
          <div className="border p-2 rounded overflow-x-auto">
            {selectedActivity?.tool_life ? (
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
                  {JSON.parse(selectedActivity.tool_life).map((tool, i) => (
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
            ) : (
              <p className="text-gray-500 italic">No tool life data found.</p>
            )}
          </div>
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
  "Equipment Technician 1",
  "Equipment Technician 2",
  "Equipment Technician 3",
  "PM Technician 1",
  "PM Technician 2",
  "Trainee - Equipment Technician 1"
].includes(empData.emp_jobtitle);
  const isQA = ["ESD Technician 1", "ESD Technician 2", "Senior QA Engineer","DIC Clerk 1"].includes(empData.emp_jobtitle);
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

    </AuthenticatedLayout>
  );
}
