import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, usePage, router } from "@inertiajs/react";
import { useState } from "react";


export default function MassApprovalIonizerChecklist({ ionizerReports, empData }) {
    const { flash, emp_data } = usePage().props;
    const [selected, setSelected] = useState([]);
    const [search, setSearch] = useState("");
    const [showView, setShowView] = useState(false);
    const [viewData, setViewData] = useState(null);

    const techRoles = [
        "Senior Equipment Technician",
        "Equipment Technician 1",
        "Equipment Technician 2",
        "Equipment Technician 3",
        "PM Technician 1",
        "PM Technician 2",
    ];
    const qaRoles = [
        "ESD Technician 1",
        "ESD Technician 2",
        "Senior QA Engineer",
        "DIC Clerk 1",
    ];

    let userRole = null;
    if (techRoles.includes(empData?.emp_jobtitle)) userRole = "tech";
    else if (qaRoles.includes(empData?.emp_jobtitle)) userRole = "qa";

    // Filter visible reports per role
    const visibleReports = ionizerReports.filter((r) => {
        if (userRole === "tech") return !r.tech_sign;
        if (userRole === "qa") return r.tech_sign && !r.qa_sign;
        return false;
    });

    // Search filter
    const filteredReports = visibleReports.filter((r) =>
        [r.report_no, r.platform, r.control_no, r.performed_by]
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
        if (selected.length === 0) return alert("No reports selected!");
        if (!userRole) return alert("You are not authorized to approve.");
        if (!confirm("Confirm mass approval of selected Ionizer reports?")) return;

        router.post(route(userRole === "tech" ? "ionizer.tech.verify" : "ionizer.qa.verify"), { ids: selected }, {
            onSuccess: () => {
                alert("✅ Selected reports approved successfully!");
                window.location.reload();
            },
            onError: (e) => {
                console.error(e);
                alert("❌ Approval failed!");
            },
        });
    };

    const handleView = (data) => {
        setViewData(data);
        setShowView(true);
    };

     const handleVerify = async (type) => {
        try {
          await axios.post(`/ionizer-checklist/${viewData?.id}/verify`, { type });
          alert(`${type.toUpperCase()} verified successfully!`);
          setShowView(false);
          window.location.reload();
        } catch (error) {
          console.error("Verification failed:", error);
          alert("Verification failed.");
        }
      };

    return (
        <AuthenticatedLayout>
            <Head title="Ionizer Mass Approval" />

            <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-3 p-4 bg-gradient-to-r from-gray-600 to-black rounded-t-2xl">
                    <h1 className="text-2xl font-bold text-white">
                        <i className="fa-solid fa-tasks"></i> Ionizer Mass Approval
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
                        placeholder="Search reports..."
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
                                                e.target.checked ? filteredReports.map((r) => r.id) : []
                                            )
                                        }
                                        checked={
                                            filteredReports.length > 0 &&
                                            selected.length === filteredReports.length
                                        }
                                    />
                                </th>
                                <th className="border px-2 py-1">Description</th>
                                <th className="border px-2 py-1">Control No</th>
                                <th className="border px-2 py-1">Serial</th>
                                <th className="border px-2 py-1">Performed By</th>
                                <th className="border px-2 py-1 text-center">Tech</th>
                                <th className="border px-2 py-1 text-center">QA</th>
                                <th className="border px-2 py-1 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredReports.length > 0 ? (
                                filteredReports.map((r) => (
                                    <tr key={r.id} className="text-sm hover:bg-gray-100 hover:text-gray-600">
                                        <td className="border text-center">
                                            <input
                                                type="checkbox"
                                                checked={selected.includes(r.id)}
                                                onChange={() => toggleSelect(r.id)}
                                            />
                                        </td>
                                        <td className="border px-2 py-1">{r.description}</td>
                                        <td className="border px-2 py-1">{r.control_no}</td>
                                        <td className="border px-2 py-1">{r.serial}</td>
                                        <td className="border px-2 py-1">{r.performed_by}</td>
                                        <td className="border text-center">
                                            {r.tech_sign ? (
                                                <span className="bg-green-100 text-green-700 px-3 py-1 rounded">Approved</span>
                                            ) : (
                                                <span className="bg-red-100 text-red-700 px-3 py-1 rounded">Pending</span>
                                            )}
                                        </td>
                                        <td className="border text-center">
                                            {r.qa_sign ? (
                                                <span className="bg-green-100 text-green-700 px-3 py-1 rounded">Approved</span>
                                            ) : (
                                                <span className="bg-red-100 text-red-700 px-3 py-1 rounded">Pending</span>
                                            )}
                                        </td>
                                        <td className="border text-center">
                                            <button
                                                onClick={() => handleView(r)}
                                                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                                            >
                                                <i className="fa-solid fa-eye"></i> View
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8" className="text-center py-3 text-gray-500">
                                        No reports available for your approval stage.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- View Modal (Read-only) --- */}
{showView && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
    <div className="bg-white p-5 rounded-lg shadow-lg w-[95%] md:max-w-8xl overflow-y-auto max-h-[95vh]">
      <div className="flex justify-between items-center mb-3 bg-gradient-to-r from-white to-gray-500 p-2 rounded">
  <h3 className="text-lg font-bold text-violet-800 pt-4 pb-4">
    <i className="fas fa-eye mr-2"></i>
    View Entry
  </h3>

  <div className="flex gap-2 items-center">
    
    {/* Close Button */}
    <button
      onClick={() => setShowView(false)}
      className="text-red-400 hover:text-red-600 pr-2 font-bold text-2xl"
    >
      <i className="fas fa-times"></i>
    </button>
    </div>
  </div>
    <div className="flex justify-end mb-4">
    {/* PDF Button */}
    {viewData?.tech_sign && viewData?.qa_sign && (
    <button
      onClick={() => window.open(`/ionizer-checklist/${viewData?.id}/pdf`, "_blank")}
      className="px-3 py-2 bg-gray-100 text-red-600 rounded shadow hover:bg-red-700 hover:text-white border-2 border-red-600 hover:border-gray-500 flex items-center text-bold"
    >
      <i className="fas fa-file-pdf mr-1"></i> View PDF
    </button>
    )}
    </div>
      {/* Header Info */}
      <table className="w-full border text-sm text-gray-600 mb-4 rounded-lg">
        <tbody>
          <tr>
            <td className="border p-2">Control No</td>
            <td className="border p-2">{viewData?.control_no}</td>
            <td className="border p-2">Serial</td>
            <td className="border p-2">{viewData?.serial}</td>
          </tr>
          <tr>
            <td className="border p-2">Description</td>
            <td className="border p-2">{viewData?.description}</td>
            <td className="border p-2">Frequency</td>
            <td className="border p-2">{viewData?.frequency}</td>
          </tr>
          <tr>
            <td className="border p-2">PM Date</td>
            <td className="border p-2">{viewData?.pm_date}</td>
            <td className="border p-2">PM Due</td>
            <td className="border p-2">{viewData?.pm_due}</td>
          </tr>
          <tr>
            <td className="border p-2">Performed By</td>
            <td className="border p-2">{viewData?.performed_by}</td>
          </tr>
          <tr>
            <td className="border p-2">OMEGA DTHM Temp. (°C)</td>
            <td className="border p-2">{viewData?.dthm_temp}</td>
            <td className="border p-2">OMEGA DTHM Humidity (%RH)</td>
            <td className="border p-2">{viewData?.dthm_rh}</td>
          </tr>
           <tr>
            <td className="border p-2">Tech Verifier</td>
            <td className="border p-2">{viewData?.tech_sign}</td>
            <td className="border p-2">QA Verifier</td>
            <td className="border p-2">{viewData?.qa_sign}</td>
          </tr>
        </tbody>
      </table>

      {/* --- Check Items --- */}
      <h3 className="text-violet-800 mb-2 font-bold">
        <i className="fa-solid fa-list-check"></i> Check Items
      </h3>
      <div className="text-center my-3 bg-gradient-to-r from-white to-gray-500 text-rose-800 rounded">
                  <h5 className="font-semibold p-2 pt-4"><i className="fa-solid fa-bars-staggered"></i> ACTIVITY CODE</h5>
                  <p className=" text-sm p-2 pb-4 ">
                   A - Check ; B - Clean ; C - Lubricant ; D - Adjust ; E - Align ; 
                   F - Calibrate ; G - Modify ; H - Repair ; I - Replace ; L - Measure
                  </p>
                </div>
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
          {viewData?.check_item?.map((row, idx) => (
            <tr key={`ci-${idx}`} className="text-center">
              <td className="border p-2">{row.assy_item}</td>
              <td className="border p-2">{row.requirement}</td>
              <td className="border p-2">{row.activity}</td>
              <td className="border p-2 text-center">
                <input 
                 type="checkbox" 
                  checked={row.compliance === 1} 
                  className="rounded-full cursor-not-allowed checked:bg-gray-400 checked:border-green-500 "
                  readOnly 
                />
              </td>
              <td className="border p-2">{row.date ? new Date(row.date).toLocaleDateString("en-US") : ""}</td>
              <td className="border p-2">{row.remarks}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* --- Verification Reading --- */}
      <h3 className="text-violet-800 mb-2 font-bold">
        <i className="fa-solid fa-magnifying-glass"></i> Verification Reading
      </h3>
      <table className="w-full border text-sm text-gray-600 mb-4">
        <thead>
          <tr>
            <th rowSpan={2} className="border p-2">Parameter</th>
            <th rowSpan={2} className="border p-2">Specs</th>
            <th colSpan={2} className="border p-2">Trial 1</th>
            <th colSpan={2} className="border p-2">Trial 2</th>
            <th colSpan={2} className="border p-2">Trial 3</th>
          </tr>
          <tr className="bg-gray-100 text-center">
            <td className="border p-2">Min</td>
            <td className="border p-2">Max</td>
            <td className="border p-2">Min</td>
            <td className="border p-2">Max</td>
            <td className="border p-2">Min</td>
            <td className="border p-2">Max</td>
          </tr>
        </thead>
        <tbody>
          {viewData?.verification_reading?.map((row, idx) => (
            <tr key={`vr-${idx}`}>
              <td className="border p-2">{row.parameter}</td>
              <td className="border p-2">{row.specs_value}</td>
              <td className="border p-2">{row.trial1_min}</td>
              <td className="border p-2">{row.trial1_max}</td>
              <td className="border p-2">{row.trial2_min}</td>
              <td className="border p-2">{row.trial2_max}</td>
              <td className="border p-2">{row.trial3_min}</td>
              <td className="border p-2">{row.trial3_max}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* --- Standard Use Verification --- */}
      <h3 className="text-violet-800 mb-2 font-bold">
        <i className="fa-solid fa-stroopwafel"></i> Standard Use Verification
      </h3>
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
          {viewData?.std_use_verification?.map((row, idx) => (
            <tr key={`sv-${idx}`}>
              <td className="border p-2">{row.description}</td>
              <td className="border p-2">{row.instrument1}</td>
              <td className="border p-2">{row.instrument2}</td>
              <td className="border p-2">{row.instrument3}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Remarks & Usage */}
      <div className="flex gap-4">
        <div className="flex-3">
          <label className="font-semibold text-gray-600">Duration of usage (Days)</label>
          <div className="border rounded p-2 bg-gray-400 text-lg font-semibold">{viewData?.days}</div>
        </div>
        <div className="flex-1">
          <label className="font-semibold text-gray-600">Remarks</label>
          <div className="border rounded p-2 text-gray-400">
            {/* {viewData?.remarks} */}
            <textarea
             textarea
             value={viewData?.remarks}
             className="w-full border rounded p-2 text-gray-600 border-none w-full h-full"
             readOnly
             >
            </textarea>
          </div>
        </div>
      </div>
{/* --- Verifier Buttons --- */}
<div className="flex justify-end gap-2 mt-4">
  {/* Tech Sign Button */}
  {[
    "Senior Equipment Technician",
  "Equipment Technician 1",
  "Equipment Technician 2",
  "Equipment Technician 3",
  "PM Technician 1",
  "PM Technician 2",
  "Trainee - Equipment Technician 1"
].includes(emp_data?.emp_jobtitle) &&
    !viewData?.tech_sign && (
      <button
        onClick={() => handleVerify("tech")}
        className="px-3 py-1 bg-green-600 text-white rounded shadow hover:bg-green-700"
      >
        <i className="fas fa-check mr-1"></i> Verify (Tech)
      </button>
  )}

  {/* QA Sign Button */}
  {["ESD Technician 1", "ESD Technician 2", "Senior QA Engineer", "DIC Clerk 1"].includes(emp_data?.emp_jobtitle) &&
    viewData?.tech_sign && !viewData?.qa_sign && (
      <button
        onClick={() => handleVerify("qa")}
        className="px-3 py-1 bg-green-600 text-white rounded shadow hover:bg-green-700"
      >
        <i className="fas fa-check-double mr-1"></i> Verify (QA)
      </button>
  )}
</div>


    </div>
    
  </div>
)}

        </AuthenticatedLayout>
    );
}
