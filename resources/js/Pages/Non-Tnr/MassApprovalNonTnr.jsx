import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, usePage, router } from "@inertiajs/react";
import { useState } from "react";

export default function MassApprovalNonTnr({ checklists, empData }) {
     const { flash, emp_data } = usePage().props;
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");
  const [showView, setShowView] = useState(false);
  const [viewData, setViewData] = useState(null);

  const job = empData?.emp_jobtitle || "";
  const techRoles = [
    "Senior Equipment Technician",
    "Equipment Technician 2",
    "Equipment Technician 3",
    "PM Technician 2",
  ];
  const qaRoles = [
    "ESD Technician 1",
    "ESD Technician 2",
    "Senior QA Engineer",
    "DIC Clerk 1",
  ];
  const engineerRoles = [
    "Equipment Engineer",
    "Senior Equipment Engineer",
    "Equipment Engineering Section Head",
    "Sr. Equipment Engineer",
  ];

  let userRole = null;
  if (techRoles.includes(job)) userRole = "tech";
  else if (qaRoles.includes(job)) userRole = "qa";
  else if (engineerRoles.includes(job)) userRole = "senior_ee";

  // ✅ Filter by visibility per role
  const visibleChecklists = checklists.filter((c) => {
    if (userRole === "tech") return !c.tech_sign;
    if (userRole === "qa") return c.tech_sign && !c.qa_sign;
    if (userRole === "senior_ee") return c.tech_sign && c.qa_sign && !c.senior_ee_sign;
    return false;
  });

  // ✅ Search filter
  const filtered = visibleChecklists.filter((act) =>
    [act.platform, act.control_no, act.description, act.performed_by]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleMassApprove = () => {
    if (selected.length === 0) return alert("No checklists selected!");
    if (!userRole) return alert("You are not authorized to approve.");

    if (!confirm("Confirm mass approval of selected Non-TNR checklists?")) return;

    router.post(
      route("non_tnr.mass.approve"),
      { ids: selected, role: userRole },
      {
        onSuccess: () => {
          alert("✅ Selected checklists approved successfully!");
          window.location.reload();
        },
        onError: (e) => {
          console.error(e);
          alert("❌ Approval failed!");
        },
      }
    );
  };

  const handleView = (data) => {
    setViewData(data);
    setShowView(true);
  };

  const handleVerify = (activityId) => {
    if (!userRole) return alert("You are not authorized to verify.");

    router.put(`/non-tnr/${activityId}/verify`, { role: userRole }, {
      onSuccess: () => {
        alert("✅ Verified successfully!");
        setShowView(false);
        window.location.reload();
      },
      onError: () => alert("❌ Verification failed."),
    });
  };

  const handleVerified = (id) => {
  if (!confirm("Are you sure you want to verify this record?")) return;

  router.post(
    route("non-tnr-checklists.verify", id),
    {},
    {
      onSuccess: () => {
        alert("✅ Verification successful!");
        setShowView(false);
      },
      onError: (err) => {
        console.error(err);
        alert("❌ Verification failed!");
      },
    }
  );
};

  return (
    <AuthenticatedLayout>
      <Head title="Non-TNR Mass Approval" />

      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-3 p-4 bg-gradient-to-r from-gray-600 to-black rounded-t-2xl">
          <h1 className="text-2xl font-bold text-white">
            <i className="fa-solid fa-tasks"></i> Non-TNR Mass Approval
          </h1>

          {userRole && selected.length > 0 && (
            <button
              onClick={handleMassApprove}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              <i className="fa-solid fa-check"></i> Approve Selected ({selected.length})
            </button>
          )}
        </div>

        {/* Search */}
        <div className="mb-3">
          <input
            type="text"
            placeholder="Search checklist..."
            className="border px-2 py-1 rounded w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto border rounded">
          <table className="table-auto w-full border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-gray-600 to-black text-white">
                <th className="border px-2 py-1">
                  <input
                    type="checkbox"
                    onChange={(e) =>
                      setSelected(
                        e.target.checked ? filtered.map((a) => a.id) : []
                      )
                    }
                    checked={
                      filtered.length > 0 &&
                      selected.length === filtered.length
                    }
                  />
                </th>
                <th className="border px-2 py-1">Platform</th>
                <th className="border px-2 py-1">Description</th>
                <th className="border px-2 py-1">Control No</th>
                <th className="border px-2 py-1">Performed By</th>
                <th className="border px-2 py-1 text-center">Technician</th>
                <th className="border px-2 py-1 text-center">QA</th>
                <th className="border px-2 py-1 text-center">Engineer</th>
                <th className="border px-2 py-1 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((act) => (
                  <tr key={act.id} className="text-sm hover:bg-gray-100 hover:text-gray-600">
                    <td className="border text-center">
                      <input
                        type="checkbox"
                        checked={selected.includes(act.id)}
                        onChange={() => toggleSelect(act.id)}
                      />
                    </td>
                    <td className="border px-2 py-1">{act.platform}</td>
                    <td className="border px-2 py-1">{act.description}</td>
                    <td className="border px-2 py-1">{act.control_no}</td>
                    <td className="border px-2 py-1">{act.performed_by}</td>

                    <td className="border text-center">
                      {act.tech_sign ? (
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded">Approved</span>
                      ) : (
                        <span className="bg-red-100 text-red-700 px-3 py-1 rounded">Pending</span>
                      )}
                    </td>
                    <td className="border text-center">
                      {act.qa_sign ? (
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded">Approved</span>
                      ) : (
                        <span className="bg-red-100 text-red-700 px-3 py-1 rounded">Pending</span>
                      )}
                    </td>
                    <td className="border text-center">
                      {act.senior_ee_sign ? (
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded">Approved</span>
                      ) : (
                        <span className="bg-red-100 text-red-700 px-3 py-1 rounded">Pending</span>
                      )}
                    </td>
                    <td className="border text-center">
                      <button
                        onClick={() => handleView(act)}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        <i className="fa-solid fa-eye"></i> View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="text-center py-3 text-gray-500">
                    No checklists available for your approval stage.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

            {/* View Modal */}
{showView && viewData && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
    <div className="bg-white p-5 rounded-lg shadow-lg w-[95%] md:max-w-7xl overflow-y-auto max-h-[95vh]">
      <div className="flex justify-between items-center mb-3 bg-gradient-to-r from-white to-gray-500 p-2 rounded">
        <h3 className="text-lg font-bold text-violet-800 pt-4 pb-4">
          <i className="fas fa-eye mr-2"></i> View Entry
        </h3>
        <button
          onClick={() => setShowView(false)}
          className="text-red-400 hover:text-red-600 pr-2 font-bold text-2xl"
        >
          <i className="fas fa-times"></i>
        </button>
      </div>
 <div className="flex justify-end mb-4  rounded-t-2xl">
          {/* View PDF Button */}
{viewData.tech_sign && viewData.qa_sign && viewData.senior_ee_sign && (
  <a
    href={`/non-tnr/view-pdf/${viewData.id}`}
    target="_blank"
    rel="noopener noreferrer"
    className="px-3 py-2 bg-gray-100 text-red-600 rounded shadow hover:bg-red-700 hover:text-white border-2 border-red-600 hover:border-gray-500 flex items-center text-bold"
  >
    <i className="fas fa-file-pdf mr-2"></i> View as PDF
  </a>
)}

          </div>
      {/* Header */}
      <table className="w-full border text-sm text-gray-600 mb-4 rounded-lg">
       
        <tbody>
          <tr>
            <td className="border p-2">Control No</td>
            <td className="border p-2">{viewData.control_no}</td>
            <td className="border p-2">Serial</td>
            <td className="border p-2">{viewData.serial}</td>
          </tr>
          <tr>
            <td className="border p-2">Description</td>
            <td className="border p-2">{viewData.description}</td>
            <td className="border p-2">Frequency</td>
            <td className="border p-2">{viewData.frequency}</td>
          </tr>
          <tr>
            <td className="border p-2">PM Date</td>
            <td className="border p-2">{viewData.pm_date}</td>
            <td className="border p-2">PM Due</td>
            <td className="border p-2">{viewData.pm_due}</td>
          </tr>
          <tr>
            <td className="border p-2">Performed By</td>
            <td className="border p-2">{viewData.performed_by}</td>
            <td className="border p-2">Platform</td>
            <td className="border p-2 text-red-800 font-bold">{viewData.platform}</td>
          </tr>
        </tbody>
      </table>

      {/* Check Items */}
      {viewData.check_item?.length > 0 && (
        <>
          <h3 className="font-bold text-violet-700">Check Items</h3>
          <table className="w-full border text-sm text-gray-600 mb-4">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">Assembly Items</th>
                <th className="border p-2">Requirement</th>
                <th className="border p-2">Activity</th>
                <th className="border p-2">Compliance</th>
                <th className="border p-2">Date</th>
                <th className="border p-2">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {viewData.check_item.map((row, idx) => (
                <tr key={idx}>
                  <td className="border p-2">{row.assy_item}</td>
                  <td className="border p-2">{row.requirement}</td>
                  <td className="border p-2">{row.activity}</td>
                  <td className="border p-2 text-center">
                    {row.compliance === 1 ? "✔" : "✘"}
                  </td>
                  <td className="border p-2">{row.date}</td>
                  <td className="border p-2">{row.remarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Standard Use Verification */}
      {viewData.std_use_verification?.length > 0 && (
        <>
          <h3 className="font-bold text-violet-700">Standard Use Verification</h3>
          <table className="w-full border text-sm text-gray-600 mb-4">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">Description</th>
                <th className="border p-2">Instrument 1</th>
                <th className="border p-2">Instrument 2</th>
                <th className="border p-2">Instrument 3</th>
              </tr>
            </thead>
            <tbody>
              {viewData.std_use_verification.map((sv, idx) => (
                <tr key={idx}>
                  <td className="border p-2">{sv.description}</td>
                  <td className="border p-2">{sv.instrument1}</td>
                  <td className="border p-2">{sv.instrument2}</td>
                  <td className="border p-2">{sv.instrument3}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Signatures */}
      <h3 className="font-bold text-violet-700 mt-4">Signatures</h3>
      <table className="w-full border text-sm text-gray-600 mb-4">
        <tbody>
          <tr>
            <td className="border p-2 font-semibold">Technician</td>
            <td className="border p-2">{viewData.tech_sign || "-"}</td>
            <td className="border p-2 font-semibold">Date</td>
            <td className="border p-2">{viewData.tech_sign_date || "-"}</td>
          </tr>
          <tr>
            <td className="border p-2 font-semibold">QA Personnel</td>
            <td className="border p-2">{viewData.qa_sign || "-"}</td>
            <td className="border p-2 font-semibold">Date</td>
            <td className="border p-2">{viewData.qa_sign_date || "-"}</td>
          </tr>
          <tr>
            <td className="border p-2 font-semibold">Senior EE</td>
            <td className="border p-2">{viewData.senior_ee_sign || "-"}</td>
            <td className="border p-2 font-semibold">Date</td>
            <td className="border p-2">{viewData.senior_ee_sign_date || "-"}</td>
          </tr>
        </tbody>
      </table>

      {/* ✅ Action Buttons */}
      <div className="flex justify-end mt-4 gap-2">

        {/* ✅ Conditional Verify Button */}
        {(() => {
          const techRoles = [
            "Senior Equipment Technician",
            "Equipment Technician 1",
            "Equipment Technician 2",
            "Equipment Technician 3",
            "PM Technician 1",
            "PM Technician 2",
            "Trainee - Equipment Technician 1",
          ];
          const qaRoles = [
            "ESD Technician 1",
            "ESD Technician 2",
            "Senior QA Engineer",
            "DIC Clerk 1",
          ];
          const seniorRoles = [
            "Equipment Engineer",
            "Supervisor - Equipment Technician",
            "Senior Equipment Engineer",
            "Sr. Equipment Engineer",
            "Equipment Engineering Section Head",
            "Section Head - Equipment Engineering",
          ];

          const isTech = techRoles.includes(emp_data?.emp_jobtitle);
          const isQA = qaRoles.includes(emp_data?.emp_jobtitle);
          const isSenior = seniorRoles.includes(emp_data?.emp_jobtitle);

          // ✅ Technician verify visible only if no tech_sign
          if (isTech && !viewData.tech_sign) {
            return (
              <button
                onClick={() => handleVerified(viewData.id)}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                <i className="fas fa-check mr-2"></i> Verify
              </button>
            );
          }

          // ✅ QA verify visible only if tech signed but no QA yet
          if (isQA && viewData.tech_sign && !viewData.qa_sign) {
            return (
              <button
                onClick={() => handleVerified(viewData.id)}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                <i className="fas fa-check mr-2"></i> Verify
              </button>
            );
          }

          // ✅ Senior verify visible only if tech + QA signed but no Senior yet
          if (isSenior && viewData.tech_sign && viewData.qa_sign && !viewData.senior_ee_sign) {
            return (
              <button
                onClick={() => handleVerified(viewData.id)}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                <i className="fas fa-check mr-2"></i> Verify
              </button>
            );
          }

          return null; // hide completely if already verified or not eligible
        })()}

        {/* Close Button */}
        <button
          type="button"
          onClick={() => setShowView(false)}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          <i className="fa fa-times mr-2"></i> Close
        </button>
      </div>
    </div>
  </div>
)}

    </AuthenticatedLayout>
  );
}
