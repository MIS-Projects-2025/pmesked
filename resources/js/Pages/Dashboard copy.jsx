import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
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

export default function Dashboard(props) {
  const calibrationReportsCount = props.calibrationReportsCount ?? 0;
  const dueSoon = props.dueSoon ?? 0;
  const overdue = props.overdue ?? 0;
  const tnrCompleted = props.tnrCompleted ?? 0;

  const calibrationReportsByMonth = props.calibrationReportsByMonth ?? [];
  const checklistStatus = props.checklistStatus ?? [];
  const latestReports = props.latestReports ?? [];

  const dueSoonReports = props.dueSoonReports ?? [];
  const overdueReports = props.overdueReports ?? [];
  const completedSchedulers = props.completedSchedulers ?? [];

  const COLORS = ["#10B981", "#F59E0B"];

  // 🔹 State for Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalData, setModalData] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null); // para list -> detail

  const openModal = (title, data) => {
    if (!data || data.length === 0) return;
    setModalTitle(title);
    setModalData(data);
    setSelectedItem(null); // list view muna
    setModalOpen(true);
  };

  return (
    <AuthenticatedLayout>
      <Head title="Dashboard" />

      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

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
          onClick={() => openModal("Due Soon", dueSoonReports)}
        >
          <h2 className="text-2xl font-bold text-yellow-500">{dueSoon}</h2>
          <p className="text-gray-600">Due Soon</p>
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
          onClick={() => openModal("TNR PM Completed", completedSchedulers)}
        >
          <h2 className="text-2xl font-bold text-green-500">{tnrCompleted}</h2>
          <p className="text-gray-600">TNR PM Completed</p>
        </div>
      </div>

      {/* 🔹 Charts */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-4 shadow rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-gray-600">
            Calibration Reports (per Month)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={calibrationReportsByMonth}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#4F46E5" />
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
          </ResponsiveContainer>
        </div>
      </div>

      {/* 🔹 Recent Reports */}
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
                // 🔹 List View muna
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
                          >
                            View
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
                    <div>
                      <div className="grid grid-cols-4 gap-4 mb-6">
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
                    </div>
                  )}

                  {/* Footer for detail */}
                  <div className="flex justify-between mt-6">
                    <button
                      type="button"
                      onClick={() => setSelectedItem(null)}
                      className="px-4 py-2 border rounded bg-gray-400 text-white hover:bg-gray-500"
                    >
                      Back to List
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className="px-4 py-2 border rounded bg-red-500 text-white hover:bg-red-600"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AuthenticatedLayout>
  );
}
