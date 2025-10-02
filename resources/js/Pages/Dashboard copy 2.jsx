import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { hrefToUrl } from "@inertiajs/inertia";
import { Head, router, usePage } from "@inertiajs/react";
import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

export default function Dashboard(props,) {
   const { emp_data } = usePage().props;

  // Check kung due today
// Parse WW format (ex: WW501) into a Date (start of that week)
// Parse WW format (ex: WW501) into a Date (start of that week)
const parseWWToDate = (ww) => {
  if (!ww || typeof ww !== "string" || !ww.startsWith("WW")) return null;

  const weekNum = parseInt(ww.slice(2)); // "WW501" -> 501
  if (isNaN(weekNum)) return null;

  const baseWeek = 501; // starting reference
  const baseDate = new Date("2024-11-03"); // WW501 starts Nov 3, 2024

  const diffWeeks = weekNum - baseWeek;
  const result = new Date(baseDate);
  result.setDate(baseDate.getDate() + diffWeeks * 7);
  return result;
};

// Check if due today
const isDueToday = (ww) => {
  const dueDate = parseWWToDate(ww);
  if (!dueDate) return false; // guard
  const today = new Date().toISOString().split("T")[0];
  return dueDate.toISOString().split("T")[0] === today;
};

// Check if overdue
const isOverdue = (ww) => {
  const dueDate = parseWWToDate(ww);
  if (!dueDate) return false; // guard
  const today = new Date().toISOString().split("T")[0];
  return dueDate.toISOString().split("T")[0] < today;
};

  const QAforApprovalcalReportsCount = props.QAforApprovalcalReportsCount ?? 0;
  const EEforApprovalcalReportsCount = props.EEforApprovalcalReportsCount ?? 0;
  const calibrationReportsCount = props.calibrationReportsCount ?? 0;
  const seniortechAck = props.seniortechAck ?? 0;
  const esdAck = props.esdAck ?? 0;
  const senioreeAck = props.senioreeAck ?? 0;
  const dueSoon = props.dueSoon ?? 0;
  const overdue = props.overdue ?? 0;
  const tnrCompleted = props.tnrCompleted ?? 0;

  //for verifier
   const eeVerifierStatus = props.eeVerifierStatus ?? [];


  const checklistStatus = props.checklistStatus ?? [];
  const latestReports = props.latestReports ?? [];

  const dueTodayReports = props.dueTodayReports ?? [];
  const overdueReports = props.overdueReports ?? [];
  const completedSchedulers = props.completedSchedulers ?? [];

  const COLORS = ["#10B981", "#F59E0B"];

  // 🔹 State for Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalData, setModalData] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

  const openModal = (title, data) => {
    if (!data || data.length === 0) return;
    setModalTitle(title);
    setModalData(data);
    setSelectedItem(null);
    setModalOpen(true);
  };


  const renderCustomLegend = ({ payload }) => (
  <ul className="flex gap-6 items-center" style={{ textAlign: "center" }}>
    {checklistStatus.map((entry, index) => (
      <li key={`item-${index}`} className="flex items-center gap-2 text-gray-600">
        <span
          style={{
            display: "inline-block",
            width: 12,
            height: 12,
            backgroundColor:
              entry.name === "Completed" ? "#10B981" : "#FACC15",
          }}
        />
        {entry.name}
      </li>
    ))}
  </ul>
);


 
 

  return (
    <AuthenticatedLayout>
     
      <Head title="Dashboard" />

      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      
      {[
        // "Senior Equipment Technician", "Equipment Technician 1", "Equipment Technician 2", "Equipment Technician 3", "PM Technician 1", "PM Technician 2",
                "ESD Technician 1", "ESD Technician 2", "Senior QA Engineer", "DIC Clerk 1",
                 "Equipment Engineer",  "Supervisor - Equipment Technician",  "Senior Equipment Engineer",  "Sr. Equipment Engineer",  "Equipment Engineering Section Head",  "Section Head - Equipment Engineering"
      ].includes(emp_data?.emp_jobtitle) && (
        <div className="mt-6">
      {/* 🔹 Summary Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
  {/* Calibration Reports for Approval */}
  <div className="p-4 bg-stone-100 rounded-lg shadow text-center cursor-pointer hover:bg-stone-200">
    <h2 className="text-2xl font-bold text-stone-500">
      {(() => {
        const qaJobs = [
          "ESD Technician 1",
          "ESD Technician 2",
          "Senior QA Engineer",
          "DIC Clerk 1",
        ];

        const eeJobs = [
          "Equipment Engineer",
          "Supervisor - Equipment Technician",
          "Senior Equipment Engineer",
          "Sr. Equipment Engineer",
          "Equipment Engineering Section Head",
          "Section Head - Equipment Engineering",
        ];

        if (qaJobs.includes(emp_data?.emp_jobtitle)) {
          return QAforApprovalcalReportsCount;
        } else if (eeJobs.includes(emp_data?.emp_jobtitle)) {
          return EEforApprovalcalReportsCount;
        } else {
          return 0;
        }
      })()}
    </h2>
    <p className="text-gray-600">Calibration Reports for Approval</p>
  </div>

  {/* TNR for Approval */}
  <div className="p-4 bg-orange-100 rounded-lg shadow text-center cursor-pointer hover:bg-orange-200">
    <h2 className="text-2xl font-bold text-orange-500">
      {(() => {
        const qaJobs = [
          "ESD Technician 1",
          "ESD Technician 2",
          "Senior QA Engineer",
          "DIC Clerk 1",
        ];

        const eeJobs = [
          "Equipment Engineer",
          "Supervisor - Equipment Technician",
          "Senior Equipment Engineer",
          "Sr. Equipment Engineer",
          "Equipment Engineering Section Head",
          "Section Head - Equipment Engineering",
        ];

        if (qaJobs.includes(emp_data?.emp_jobtitle)) {
          return esdAck;
        } else if (eeJobs.includes(emp_data?.emp_jobtitle)) {
          return senioreeAck;
        } else {
          return 0;
        }
      })()}
    </h2>
    <p className="text-gray-600">TNR for Approval</p>
  </div>
      </div>


        {/* 🔹 Charts */}
      <div className="grid grid-cols-2 gap-4 mb-6">

        <div className="bg-white p-4 shadow rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-gray-600">
            TNR PM Checklist Status
          </h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={props.eeVerifierStatus}>
                 <XAxis dataKey="name" />
                 <YAxis allowDecimals={false} />
                 <Tooltip />
                 <Legend />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} label={{ position: "top" }}>
                      {props.eeVerifierStatus.map((entry, index) => (
                     <Cell
                       key={`cell-${index}`}
                       fill={entry.name === "Approved" ? "#10B981" : "#FACC15"} 
                     />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
        </div>
        <div className="bg-white p-4 shadow rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-gray-600">
            TNR PM Checklist Status
          </h3>
          <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={props.eeVerifierStatus}
             cx="50%"
              cy="50%"
             outerRadius={100}
             dataKey="value"
             label={({ name, value }) => `${name}: ${value}`}
             >
               {props.eeVerifierStatus.map((entry, index) => (
                 <Cell
                    key={`cell-${index}`}
                    fill={entry.name === "Approved" ? "#10B981" : "#FACC15"}
                  />
                ))}
             </Pie>
              <Tooltip />
             <Legend />
           </PieChart>
          </ResponsiveContainer>

        </div>
      </div>
      </div>
      )}
 {["Equipment Engineering"].includes(emp_data?.emp_dept) && (
        <div>
      {/* 🔹 Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div
          className="p-4 bg-blue-100 rounded-lg shadow text-center cursor-pointer hover:bg-blue-200"
          onClick={() => openModal("Calibration Reports", latestReports)}
        >
          <h2 className="text-2xl font-bold text-blue-500">
            {calibrationReportsCount}
          </h2>
          <p className="text-gray-600">Calibration Reports</p>
        </div>
        <div
          className="p-4 bg-yellow-100 rounded-lg shadow text-center cursor-pointer hover:bg-yellow-200"
          onClick={() => openModal("Due Soon", dueTodayReports)}
        >
          <h2 className="text-2xl font-bold text-yellow-500">{dueSoon}</h2>
          <p className="text-gray-600">Due Today</p>
        </div>
        <div
          className="p-4 bg-red-100 rounded-lg shadow text-center cursor-pointer hover:bg-red-200"
          onClick={() => openModal("Overdue", overdueReports)}
        >
          <h2 className="text-2xl font-bold text-red-500">{overdue}</h2>
          <p className="text-gray-600">Overdue</p>
        </div>
        <div
          className="p-4 bg-green-100 rounded-lg shadow text-center cursor-pointer hover:bg-green-200"
          // onClick={() => openModal("TNR PM Completed", completedSchedulers)}
        >
          <h2 className="text-2xl font-bold text-green-500">{tnrCompleted}</h2>
          <p className="text-gray-600">TNR PM Completed</p>
        </div>
      </div>

      {/* 🔹 Charts */}
      <div className="grid grid-cols-1 gap-6 mb-6">
        <div className="bg-white p-4 shadow rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-gray-600">
            TNR PM Checklist Status
          </h3>
          {/* <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={checklistStatus}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label
              >
                {checklistStatus.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer> */}

<ResponsiveContainer width="100%" height={300}>
  <BarChart data={checklistStatus}>
    <XAxis dataKey="name" />
    <YAxis allowDecimals={false} />
    <Tooltip />
    <Bar dataKey="value" radius={[8, 8, 0, 0]} label={{ position: "top" }}>
      {checklistStatus.map((entry, index) => (
        <Cell
          key={`cell-${index}`}
          fill={entry.name === "Completed" ? "#10B981" : "#FACC15"}
        />
      ))}
    </Bar>
    <Legend text-align="center" content={renderCustomLegend} />
  </BarChart>
</ResponsiveContainer>





          
        </div>
      </div>

      {/* 🔹 Latest Calibration Reports */}
      <div className="bg-white p-4 shadow rounded-lg">
        <h3 className="text-lg font-semibold mb-4 text-gray-600">
          Latest Calibration Reports
        </h3>
        <table className="w-full border text-sm">
          <thead className="bg-gray-200 text-gray-600">
            <tr>
              <th className="p-2 border">Report No</th>
              <th className="p-2 border">Equipment</th>
              <th className="p-2 border">Calibration Date</th>
              <th className="p-2 border">Due</th>
            </tr>
          </thead>
          <tbody>
            {latestReports.map((r, i) => (
              <tr key={i} className="hover:bg-gray-100 text-gray-600">
                <td className="border p-2">{r.report_no}</td>
                <td className="border p-2">{r.equipment}</td>
                <td className="border p-2">{r.calibration_date}</td>
                <td className="border p-2">{r.calibration_due}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 🔹 Modal */}
      {modalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-lg w-11/12 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center bg-gradient-to-r from-gray-600 to-black text-white p-4 rounded-t-lg sticky top-0 z-10">
              <h2 className="text-lg font-bold ml-4">
                <i className="fa-regular fa-rectangle-list"></i> {modalTitle}
              </h2>
              <button
                className="text-white text-xl"
                onClick={() => setModalOpen(false)}
              >
                <i className="fas fa-times text-red-500 hover:text-red-700"></i>
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              {!selectedItem ? (
                // 🔹 List View
                <table className="w-full border text-sm">
                  <thead className="bg-gray-200 text-gray-600">
                    <tr>
                      <th className="p-2 border">#</th>
                      {modalTitle === "Calibration Reports" ? (
                        <>
                          <th className="p-2 border">Equipment</th>
                          <th className="p-2 border">Control No</th>
                          <th className="p-2 border">Due</th>
                        </>
                      ) : (
                        <>
                          <th className="p-2 border">Machine</th>
                          <th className="p-2 border">Control No</th>
                          <th className="p-2 border">PM Due</th>
                        </>
                      )}
                      <th className="p-2 border">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalData.map((item, i) => (
                      <tr key={i} className="hover:bg-gray-100 text-gray-600">
                        <td className="border p-2">{i + 1}</td>
                        {modalTitle === "Calibration Reports" ? (
                          <>
                            <td className="border p-2">{item.equipment}</td>
                            <td className="border p-2">{item.control_no}</td>
                            <td className="border p-2">{item.calibration_due}</td>
                          </>
                        ) : (
                          <>
                            <td className="border p-2">{item.machine_num}</td>
                            <td className="border p-2">{item.pmnt_no}</td>
                            <td className="border p-2">{item.pm_due}</td>
                          </>
                        )}
                        <td className="border p-2 text-center">
                          <button
                            className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                            onClick={() => setSelectedItem(item)}
                          > <i className="fa-regular fa-eye"></i> View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                // 🔹 Detail View
                <div>
                  {modalTitle === "Calibration Reports" ? (
                    <div className="space-y-6">
                      {/* Basic Fields */}
                      <div className="grid grid-cols-4 gap-4">
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
                        ].map((key) => (
                          <div key={key}>
                            <label className="block font-semibold text-gray-500">
                              {key.replace(/_/g, " ")}
                            </label>
                            <input
                              type="text"
                              value={selectedItem[key] || ""}
                              readOnly
                              className="border p-2 rounded w-full text-gray-600 bg-gray-100"
                            />
                          </div>
                        ))}
                      </div>

                      {/* Calibration Standards Used */}
                      {selectedItem.cal_std_use && (
                        <div>
                          <h4 className="font-semibold text-gray-700 mb-2">
                            Calibration Standards Used
                          </h4>
                          <table className="table-auto w-full border text-sm">
                            <thead className="bg-gray-200 text-gray-600">
                              <tr>
                                <th className="border p-2">Description</th>
                                <th className="border p-2">Manufacturer</th>
                                <th className="border p-2">Model</th>
                                <th className="border p-2">Control No</th>
                                <th className="border p-2">Serial No</th>
                                <th className="border p-2">Accuracy</th>
                                <th className="border p-2">Cal Date</th>
                                <th className="border p-2">Cal Due</th>
                                <th className="border p-2">Traceability</th>
                              </tr>
                            </thead>
                            <tbody>
                              {JSON.parse(selectedItem.cal_std_use).map(
                                (std, i) => (
                                  <tr
                                    key={i}
                                    className="text-gray-600 hover:bg-gray-50"
                                  >
                                    <td className="border p-2">{std.description}</td>
                                    <td className="border p-2">{std.cal_manufacturer}</td>
                                    <td className="border p-2">{std.model_no}</td>
                                    <td className="border p-2">{std.cal_control_no}</td>
                                    <td className="border p-2">{std.serial_no}</td>
                                    <td className="border p-2">{std.accuracy}</td>
                                    <td className="border p-2">{std.cal_date}</td>
                                    <td className="border p-2">{std.cal_due}</td>
                                    <td className="border p-2">{std.traceability}</td>
                                  </tr>
                                )
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Calibration Details */}
                      {selectedItem.cal_details && (
                        <div>
                          <h4 className="font-semibold text-gray-700 mb-2">
                            Calibration Details
                          </h4>
                          <table className="table-auto w-full border text-sm">
                            <thead className="bg-gray-200 text-gray-600">
                              <tr>
                                <th className="border p-2">Function Tested</th>
                                <th className="border p-2">Nominal</th>
                                <th className="border p-2">Tolerance</th>
                                <th className="border p-2">Unit Under Test</th>
                                <th className="border p-2">Standard Instrument</th>
                                <th className="border p-2">Disparity</th>
                                <th className="border p-2">Correction</th>
                                <th className="border p-2">Remarks</th>
                              </tr>
                            </thead>
                            <tbody>
                              {JSON.parse(selectedItem.cal_details).map(
                                (d, i) => (
                                  <tr
                                    key={i}
                                    className="text-gray-600 hover:bg-gray-50"
                                  >
                                    <td className="border p-2">{d.function_tested}</td>
                                    <td className="border p-2">{d.nominal}</td>
                                    <td className="border p-2">{d.tolerance}</td>
                                    <td className="border p-2">{d.unit_under_test}</td>
                                    <td className="border p-2">{d.standard_instrument}</td>
                                    <td className="border p-2">{d.disparity}</td>
                                    <td className="border p-2">{d.correction}</td>
                                    <td className="border p-2">{d.remarks}</td>
                                  </tr>
                                )
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block font-semibold text-gray-600">
                            Machine
                          </label>
                          <input
                            type="text"
                            className="form-control border rounded w-full text-gray-600"
                            value={selectedItem.machine_num || ""}
                            readOnly
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-gray-600">
                            Control Number
                          </label>
                          <input
                            type="text"
                            className="form-control border rounded w-full text-gray-600"
                            value={selectedItem.pmnt_no || ""}
                            readOnly
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-gray-600">
                            Serial Number
                          </label>
                          <input
                            type="text"
                            className="form-control border rounded w-full text-gray-600"
                            value={selectedItem.serial || ""}
                            readOnly
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-gray-600">
                            PM Date
                          </label>
                          <input
                            type="text"
                            className="form-control border rounded w-full text-gray-600"
                            value={selectedItem.first_cycle || ""}
                            readOnly
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-gray-600">
                            PM Due
                          </label>
                          <input
                            type="text"
                            className="form-control border rounded w-full text-gray-600"
                            value={selectedItem.pm_due || ""}
                            readOnly
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-gray-600">
                            Technician
                          </label>
                          <input
                            type="text"
                            className="form-control border rounded w-full text-gray-600"
                            value={
                              selectedItem.responsible_person || "Empty Field..."
                            }
                            readOnly
                          />
                        </div>
                      </div>

                      {/* PM Answers Table */}
                      {selectedItem.answers && (
                        <div className="mt-4">
                          <div className="border p-2 rounded overflow-x-auto">
                            <table className="table-auto w-full text-sm border-collapse border border-gray-300">
                              <thead>
                                <tr className="bg-gradient-to-r from-gray-600 to-black text-white">
                                  <th className="border px-2 py-1">#</th>
                                  <th className="border px-2 py-1">Assy Item</th>
                                  <th className="border px-2 py-1">Description</th>
                                  <th className="border px-2 py-1">Requirements</th>
                                  <th className="border px-2 py-1">Activity</th>
                                  <th className="border px-2 py-1">Compliance</th>
                                  <th className="border px-2 py-1">Remarks</th>
                                  <th className="border px-2 py-1">Activity</th>
                                  <th className="border px-2 py-1">Compliance</th>
                                  <th className="border px-2 py-1">Remarks</th>
                                </tr>
                              </thead>
                              <tbody>
                                {JSON.parse(selectedItem.answers).map(
                                  (ans, i) => (
                                    <tr key={i} className="text-gray-500">
                                      <td className="border px-2 py-1">{i + 1}</td>
                                      <td className="border px-2 py-1">{ans.assy_item}</td>
                                      <td className="border px-2 py-1">{ans.description}</td>
                                      <td className="border px-2 py-1">{ans.requirements}</td>
                                      <td className="border px-2 py-1">{ans.activity_1}</td>
                                      <td className="border px-2 py-1 text-center">
                                        <input
                                        type="checkbox"
                                        checked={!!ans.compliance1} // force boolean
                                        readOnly
                                        className="h-4 w-4 accent-green-600 rounded-full"
                                      />
                                      </td>
                                      <td className="border px-2 py-1">{ans.remarks1}</td>
                                      <td className="border px-2 py-1">{ans.activity_2}</td>
                                      <td className="border px-2 py-1 text-center">
                                        <input
                                          type="checkbox"
                                          checked={!!ans.compliance2} 
                                          readOnly
                                          className="h-4 w-4 accent-green-600 rounded-full"
                                        />
                                      </td>
                                      <td className="border px-2 py-1">{ans.remarks2}</td>
                                    </tr>
                                  )
                                )}
                              </tbody>
                            </table>
                            <div className="flex justify-end mt-4">
                      {(modalTitle !== "Calibration Reports" &&
                      (isDueToday(selectedItem.pm_due) || isOverdue(selectedItem.pm_due))) && (
                      <>
                          <button
                           className="text-white text-xl bg-sky-500 hover:bg-sky-600 rounded px-4 py-2 mr-2 btn-sm"
                           onClick={() =>
                          router.visit(route("tnr.fillup", { id: selectedItem.id }))
                          }
                          
                          >
                           <i className="fas fa-fill mr-1"></i> Fillup
                          </button>

                         <button
                          className="text-white text-xl bg-green-400 hover:bg-green-600 rounded px-4 py-2"
                            onClick={() =>
                          router.visit(route("tnr.extend", { id: selectedItem.id }))
                          }
                          >
                         <i className="fas fa-check mr-1"></i> Extend
                        </button>

                       </>
                      
                     )}
                    </div>
                          </div>
                          
                        </div>
                      )}
                    


                    </div>

                  )}

                </div>
              )}
            </div>
          </div>
        </div>
      )}
      </div>  
      )}

    </AuthenticatedLayout>
  );
}
