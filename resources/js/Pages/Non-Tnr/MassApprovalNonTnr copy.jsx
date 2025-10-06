import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, usePage, router } from "@inertiajs/react";
import { useState } from "react";

export default function MassApprovalNonTnr({ checklists, empData }) {
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");

  const job = empData?.emp_jobtitle || "";
  const techRoles = ["Senior Equipment Technician", "Equipment Technician 2", "Equipment Technician 3", "PM Technician 2"];
  const qaRoles = ["ESD Technician 1", "ESD Technician 2", "Senior QA Engineer"];
  const engineerRoles = ["Equipment Engineer", "Senior Equipment Engineer", "Equipment Engineering Section Head"];

  let userRole = null;
  if (techRoles.includes(job)) userRole = "tech";
  else if (qaRoles.includes(job)) userRole = "qa";
  else if (engineerRoles.includes(job)) userRole = "senior_ee";

  // Filter by role visibility
  const visibleChecklists = checklists.filter((c) => {
    if (userRole === "tech") return !c.tech_sign;
    if (userRole === "qa") return c.tech_sign && !c.qa_sign;
    if (userRole === "senior_ee") return c.tech_sign && c.qa_sign && !c.senior_ee_sign;
    return false;
  });

  // Search
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
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((act) => (
                  <tr key={act.id} className="text-sm hover:bg-gray-100">
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
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center py-3 text-gray-500">
                    No checklists available for your approval stage.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
