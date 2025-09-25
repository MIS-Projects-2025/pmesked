import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, usePage, router } from "@inertiajs/react";
import { useState } from "react";

export default function MassApproval({ activities, empData }) {
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // ilang rows per page

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
          alert("Selected activities approved successfully!");
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

  // 🔑 Role-based button visibility (simplified)
  let showButton = false;
  if (empData && empData.emp_jobtitle) {
    const job = empData.emp_jobtitle;

    const techRoles = [
      "Senior Equipment Technician",
      "Equipment Technician 2",
      "Equipment Technician 3",
      "PM Technician 2",
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

  return (
    <AuthenticatedLayout>
      <Head title="TNR Mass Approval" />

      <div className="p-6">
        <div className="flex justify-between items-center mb-2 p-4 bg-gradient-to-r from-gray-600 to-black rounded-t-2xl">
          <h1 className="text-2xl font-bold text-white">
            <i className="fas fa-tasks"></i> TNR Mass Approval
          </h1>

          {showButton && selected.length > 0 && (
            <button
              onClick={handleMassApprove}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              <i className="fa-solid fa-check"></i> Mass Approve Selected (
              {selected.length})
            </button>
          )}
        </div>

        {/* 🔍 Search bar */}
        <div className="mb-3">
          <input
            type="text"
            placeholder="Search activities..."
            className="border px-2 py-1 rounded w-64"
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
                    <td className="border px-2 py-1">
                      {act.tech_ack ? (
                        <span className="text-green-600 font-semibold">
                          ✔ Approved
                        </span>
                      ) : (
                        <span className="text-red-500">Pending</span>
                      )}
                    </td>
                    <td className="border px-2 py-1">
                      {act.qa_ack ? (
                        <span className="text-green-600 font-semibold">
                          ✔ Approved
                        </span>
                      ) : (
                        <span className="text-red-500">Pending</span>
                      )}
                    </td>
                    <td className="border px-2 py-1">
                      {act.senior_ee_ack || act.section_ack ? (
                        <span className="text-green-600 font-semibold">
                          ✔ Approved
                        </span>
                      ) : (
                        <span className="text-red-500">Pending</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center py-4 text-gray-500">
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
    </AuthenticatedLayout>
  );
}
