import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, usePage, router } from "@inertiajs/react";
import { useState } from "react";

export default function IonizerCalibrationReportMassApproved({ reports, empData }) {
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewModal, setViewModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const itemsPerPage = 10;

  // Roles
  const isQA = ["ESD Technician 1", "ESD Technician 2", "Senior QA Engineer","DIC Clerk 1"].includes(
    empData?.emp_jobtitle
  );
  const isEngineer = [
    "Equipment Engineer",
    "Supervisor - Equipment Technician",
    "Senior Equipment Engineer",
    "Sr. Equipment Engineer",
  ].includes(empData?.emp_jobtitle);

  // Toggle select row
  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Mass approve selected reports
  const handleMassApproveQA = (ids = selected) => {
    if (!ids.length) return alert("No reports selected!");
    router.post(
      route("ionizer.ionizer.mass.approve_qa"),
      { ids },
      {
        onSuccess: () => {
          alert("✅ Selected reports approved!");
          window.location.reload();
        },
        onError: () => alert("Something went wrong!"),
      }
    );
  };

  const handleMassApproveEE = (ids = selected) => {
    if (!ids.length) return alert("No reports selected!");
    router.post(
      route("ionizer.ionizer.mass.approve_ee"),
      { ids },
      {
        onSuccess: () => {
          alert("✅ Selected reports approved!");
          window.location.reload();
        },
        onError: () => alert("Something went wrong!"),
      }
    );
  };

  // Determine if current user can approve this report
  const canApprove = (report) => {
    // ESD approves first if qa_sign is null/false
    if (isQA && !report.qa_sign) return true;

    // Engineer approves after QA, but only if review_by is still null/empty
    if (isEngineer && report.qa_sign && !report.review_by) return true;

    return false;
  };

  // Filter & pagination
  const filtered = reports.filter((r) =>
    [r.equipment, r.control_no, r.serial, r.performed_by]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

//   console.log(empData);

const handleVerifyQA = () => {
  if (!selectedReport) return;
  router.post(
    route("calibration-reports.ionizer.verify-qa", selectedReport.id),
    {},
    {
      preserveScroll: true,
      onSuccess: (page) => {
         alert("✅ Successfully approved!");
        // update state from server response kung may flash or props
        setSelectedReport(page.props.updatedReport ?? selectedReport);
        window.location.reload();
      },
    }
  );
};

const handleVerifyReviewer = () => {
  if (!selectedReport) return;
  router.post(
    route("calibration-reports.ionizer.verify-reviewer", selectedReport.id),
    {},
    {
      preserveScroll: true,
      onSuccess: (page) => {
        alert("✅ Successfully approved!");
        setSelectedReport(page.props.updatedReport ?? selectedReport);
        window.location.reload();
      },
    }
  );
};

// console.log(reports);

  return (
    <AuthenticatedLayout>
      <Head title="Calibration Mass Approval" />

      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-3 p-4 bg-gradient-to-r from-gray-600 to-black rounded-t-2xl text-white">
          <h1 className="text-2xl font-bold">
            <i className="fas fa-check-circle"></i> Ionizer Calibration Mass Approval
          </h1>

          {selected.length > 0 && canApprove && isQA && (
            <button
              onClick={() => handleMassApproveQA()}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              <i className="fa-solid fa-check"></i> Mass Approve QA ({selected.length})
            </button>
          )}

          {selected.length > 0 && canApprove && isEngineer && (
            <button
              onClick={() => handleMassApproveEE()}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              <i className="fa-solid fa-check"></i> Mass Approve EE ({selected.length})
            </button>
          )}
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search reports..."
          className="border px-2 py-1 rounded mb-3 w-64"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
        />

        {/* Table */}
        <div className="overflow-x-auto border rounded">
          <table className="min-w-full border-collapse text-sm md:text-base">
            <thead>
              <tr className="bg-gradient-to-r from-gray-600 to-black text-white">
                <th className="border px-2 py-1">
                  <input
                    type="checkbox"
                    checked={paginated.length > 0 && selected.length === paginated.length}
                    onChange={(e) =>
                      setSelected(e.target.checked ? paginated.map((r) => r.id) : [])
                    }
                  />
                </th>
                <th className="border px-2 py-1">Machine</th>
                <th className="border px-2 py-1">Control No</th>
                <th className="border px-2 py-1">Serial</th>
                <th className="border px-2 py-1">Technician</th>
                <th className="border px-2 py-1 text-center">QA Personnel</th>
                <th className="border px-2 py-1 text-center">Senior Engineer</th>
                <th className="border px-2 py-1 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length > 0 ? (
                paginated.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-500">
                    <td className="border px-2 py-1 text-center">
                      <input
                        type="checkbox"
                        checked={selected.includes(r.id)}
                        onChange={() => toggleSelect(r.id)}
                      />
                    </td>
                    <td className="border px-2 py-1">{r.equipment}</td>
                    <td className="border px-2 py-1">{r.control_no}</td>
                    <td className="border px-2 py-1">{r.serial}</td>
                    <td className="border px-2 py-1">{r.performed_by}</td>
                    <td className="border px-2 py-1 text-center">
                      {r.qa_sign ? (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                          Approved
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="border px-2 py-1 text-center">
                      {r.review_by ? (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                          Approved
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="border px-2 py-1 text-center space-x-1">
                      <button
                        className="px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700 text-sm"
                        onClick={() => {
                          setSelectedReport(r);
                          setViewModal(true);
                        }}
                      >
                        <i className="fa-solid fa-eye"></i> View
                      </button>

                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-4 text-gray-500">
                    No reports found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
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

        {/* View Modal */}
        {viewModal && selectedReport && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
    <div className="bg-white p-6 rounded shadow-lg w-10/12 max-h-[90vh] overflow-y-auto border-t-4 border-blue-600">
      
      {/* Header */}
      <div className="flex justify-between items-center bg-gradient-to-r from-gray-600 to-black text-white p-4 rounded-t-lg sticky top-0 z-10">
        <h2 className="text-lg font-bold ml-4">
          <i className="fa-regular fa-rectangle-list"></i> Non-TnR Calibration Report View
        </h2>
        <div className="flex space-x-2">
        
          {/* Close */}
          <button
            className="text-white text-xl"
            onClick={() => setViewModal(false)}
          >
            <i className="fas fa-times text-red-500 hover:text-red-700"></i>
          </button>
        </div>
      </div>
    <div className="flex space-x-2 justify-end mt-4 ">
      {selectedReport?.qa_sign && selectedReport?.review_by && (
        

        <button
        onClick={() => window.open(`/pdf/nonTnrCalibration/${selectedReport.id}`, "_blank")}
        className="px-4 py-2 border rounded-md bg-blue-600 text-white hover:bg-blue-700"
        >
        <i className="fas fa-file-pdf mr-2"></i>
          View as PDF
        </button>


        )}
    </div>
      {/* Machine info */}
      <div className="grid grid-cols-4 gap-4 mb-6 mt-4 text-gray-500 border p-4">
        {[
          "equipment",
          "manufacturer",
          "control_no",
          "performed_by",
          "calibration_date",
          "calibration_due",
          "model",
          "serial",
          "temperature",
          "relative_humidity",
          "specs",
          "report_no",
          "cal_interval",
          "review_by",
          "review_date",
        ].map((key) => (
          <div key={key}>
            <label className="block font-semibold" style={{ textTransform: "capitalize" }}>
              {key.replace(/_/g, " ")}
            </label>
            <input
              type="text"
              value={selectedReport[key] || "Wait for Signature..."}
              readOnly
              className="border p-2 rounded w-full text-gray-600 bg-gray-100"
            />
          </div>
        ))}
        
      </div>


      {/* Calibration Standard Used */}
      <h3 className="text-md font-semibold mb-2 text-gray-500">Calibration Standard Used</h3>
      <table className="w-full border mb-3 text-sm">
        <thead className="bg-gray-400">
          <tr>
            {Object.keys(selectedReport.cal_std_use?.[0] || {}).map((key) => (
              <th key={key} className="border p-2" style={{ textTransform: "capitalize" }}>{key.replace(/_/g, " ")}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {selectedReport.cal_std_use?.map((row, i) => (
            <tr key={i}>
              {Object.keys(row).map((key) => (
                <td key={key} className="border p-2 text-gray-500">
                  {/* <input type="text" value={row[key]} readOnly className="w-full border p-1 rounded bg-gray-100" /> */}
                  {row[key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Calibration Details */}
      <h3 className="text-md font-semibold mb-2 text-gray-500">Calibration Details</h3>
      <table className="w-full border mb-3 text-sm">
        <thead className="bg-gray-400">
          <tr>
            {Object.keys(selectedReport.cal_details?.[0] || {}).map((key) => (
              <th key={key} className="border p-2" style={{ textTransform: "capitalize" }}>{key.replace(/_/g, " ")}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {selectedReport.cal_details?.map((row, i) => (
            <tr key={i}>
              {Object.keys(row).map((key) => (
                <td key={key} className="border p-2 text-gray-500">
                  {/* <input type="text" value={row[key]} readOnly className="w-full border p-1 rounded bg-gray-100" /> */}
                  {row[key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="grid grid-cols-4 gap-4 mb-6 mt-4 text-gray-500 border p-4">
        {[
          "qa_sign",
          "qa_sign_date",
        ].map((key) => (
          <div key={key}>
            <label className="block font-semibold" style={{ textTransform: "capitalize" }}>
              {key.replace(/_/g, " ")}
            </label>
            <input
              type="text"
              value={selectedReport[key] || "Wait for Signature..."}
              readOnly
              className="border p-2 rounded w-full text-gray-600 bg-gray-100"
            />
          </div>
        ))}
        
      </div>

      {/* Footer Close (redundant but okay) */}
      <div className="flex justify-end mt-4">
          {/* Verification button logic */}
          {isQA && !selectedReport?.qa_sign && (
  <button
      onClick={handleVerifyQA}
    className="px-4 py-2 border rounded bg-green-500 text-white hover:bg-green-600 mr-2"
  >
    <i className="fas fa-check mr-2"></i>
    Verify (QA)
  </button>
)}

{isEngineer && selectedReport?.qa_sign && !selectedReport?.review_by && (
  <button
     onClick={handleVerifyReviewer}
    className="px-4 py-2 border rounded bg-blue-500 text-white hover:bg-blue-600 mr-2"
  >
    <i className="fas fa-user-cog mr-2"></i>
    Verify (Reviewer)
  </button>
)}


        {/* Close */}
        <button
          type="button"
          onClick={() => setViewModal(false)}
          className="px-4 py-2 border rounded bg-red-500 text-white hover:bg-red-600"
        >
          <i className="fas fa-times mr-2"></i>
          Close
        </button>
      </div>
    </div>
  </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
