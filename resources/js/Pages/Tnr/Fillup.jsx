import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, router } from "@inertiajs/react";
import { useState, useEffect } from "react";

export default function Extend({ scheduler, empData, machines }) {
  const [showModal, setShowModal] = useState(true);
  const [selectedChecklist, setSelectedChecklist] = useState([]);
  const [answers, setAnswers] = useState({});

  // 🔹 Quarter computation
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

  // 🔹 Default dates
  const today = new Date();
  const pmDateWW = `WW${getWorkWeek(today)}`;
  const dueDate = new Date(today);
  dueDate.setDate(today.getDate() + 5 * 7);
  const pmDueWW = `WW${getWorkWeek(dueDate)}`;

  // 🔹 Inertia form
  const { data, setData, post, processing, errors } = useForm({
    pmnt_no: scheduler.pmnt_no || "",
    machine_num: scheduler.machine_num || "",
    serial: scheduler.serial || "",
    machine_platform: scheduler.machine_platform || "",
    first_cycle: pmDateWW,
    pm_due: pmDueWW,
    quarter,
    progress_value: 25,
    responsible_person: empData?.emp_name || "",
    answers: "", // 🔹 initialize answers JSON
  });

  // 🔹 Sync answers to form data
  useEffect(() => {
    const answersArray = Object.values(answers);
    setData("answers", JSON.stringify(answersArray));
  }, [answers]);

  // 🔹 Handle checklist answers
  const handleAnswerChange = (id, field, value) => {
    setAnswers((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  // 🔹 Handle machine change
  const handleMachineChange = async (e) => {
    const selected = e.target.value;
    const machine = machines.find((m) => m.machine_num === selected);
    if (!machine) return;

    const today = new Date();
    const pmDateWW = `WW${getWorkWeek(today)}`;
    const dueDate = new Date(today);
    dueDate.setDate(today.getDate() + 5 * 7);
    const pmDueWW = `WW${getWorkWeek(dueDate)}`;

    setData({
      ...data,
      machine_num: selected,
      pmnt_no: machine?.pmnt_no || "",
      serial: machine?.serial || "",
      machine_platform: machine?.machine_platform || "",
      first_cycle: pmDateWW,
      pm_due: pmDueWW,
      quarter,
      progress_value: 25,
      responsible_person: empData?.emp_name || "",
    });

    if (machine?.machine_platform) {
      try {
        const res = await fetch(`/checklist/${machine.machine_platform}`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const checklist = await res.json();
        setSelectedChecklist(checklist);

        const initialAnswers = {};
        checklist.forEach((row) => {
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

  // 🔹 Auto-run machineChange on mount
  useEffect(() => {
    if (scheduler.machine_num) {
      handleMachineChange({ target: { value: scheduler.machine_num } });
    }
  }, [scheduler.machine_num]);

  // 🔹 Submit handler
  const handleSubmit = (e) => {
    e.preventDefault();
    post(route("tnr.fillup.update", { id: scheduler.id }), {
      data,
      onSuccess: () => {
        alert("✅ PM Due Filled successfully!");
        setShowModal(false);
        window.location.reload();
      },
      onError: () => alert("❌ Failed to update scheduler."),
    });
  };





  return (
    <AuthenticatedLayout>
      <Head title="Filled PM Due" />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white w-full max-w-7xl rounded-lg shadow-lg max-h-screen overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center bg-gradient-to-r from-gray-600 to-black text-white p-4 rounded-t-lg sticky top-0 z-10">
              <h5 className="text-lg font-bold">
                <i className="fas fa-up-right-from-square"></i> Filled PM Due
              </h5>
              <button
                className="text-white text-xl"
                onClick={() => setShowModal(false)}
              >
                <i className="fas fa-times text-red-500 hover:text-red-700"></i>
              </button>
            </div>

            {/* Body (no form wrapper 🟢) */}
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-gray-500">Machine</label>
                <input
                  type="text"
                  className="border rounded w-full text-gray-500 bg-gray-100"
                  value={data.machine_num || ""}
                  readOnly
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-500">
                  Machine Platform
                </label>
                <input
                  type="text"
                  className="border rounded w-full text-gray-500"
                  value={data.machine_platform || ""}
                  readOnly
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-500">
                  Control Number
                </label>
                <input
                  type="text"
                  className="border rounded w-full text-gray-500"
                  value={data.pmnt_no || ""}
                  readOnly
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-500">
                  Serial Number
                </label>
                <input
                  type="text"
                  className="border rounded w-full text-gray-500"
                  value={data.serial || ""}
                  readOnly
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-500">PM Date</label>
                <input
                  type="text"
                  className="border rounded w-full text-gray-500"
                  value={data.first_cycle || ""}
                  readOnly
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-500">
                  New PM Due
                </label>
                <input
                  type="text"
                  className="border rounded w-full text-gray-500"
                  value={data.pm_due || ""}
                  onChange={(e) => setData("pm_due", e.target.value)}
                />
                {errors.pm_due && (
                  <p className="text-red-500 text-sm">{errors.pm_due}</p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-gray-500">
                  Performed By
                </label>
                <input
                  type="text"
                  className="border rounded w-full text-gray-500"
                  value={data.responsible_person || ""}
                  readOnly
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-500">Quarter</label>
                <input
                  type="text"
                  className="border rounded w-full text-gray-500"
                  value={data.quarter || ""}
                  readOnly
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-500">
                  Progress Value
                </label>
                <input
                  type="text"
                  className="border rounded w-full text-gray-500"
                  value={data.progress_value}
                  readOnly
                />
              </div>
            </div>

            {/* Checklist Section */}
            {selectedChecklist.length > 0 && (
              <div className="p-4">
                <h3 className="font-bold text-gray-700 mb-2">
                  Checklist for Platform: {data.machinePlatform}
                </h3>
                <div className="overflow-x-auto">
                  <table className="table-auto w-full text-sm border-collapse border border-gray-300">
                    <thead className="bg-gray-200 sticky top-0 z-10">
                      <tr className="bg-gradient-to-r from-gray-600 to-black text-white">
                        <th rowSpan="2" className="border px-2 py-1">ASSY Item</th>
                        <th rowSpan="2" className="border px-2 py-1">Description</th>
                        <th rowSpan="2" className="border px-2 py-1">Requirement</th>
                        <th colSpan="3" className="border px-2 py-1">First Cycle</th>
                        <th colSpan="3" className="border px-2 py-1">Second Cycle</th>
                      </tr>
                      <tr className="bg-gray-500">
                        <th className="border px-2 py-1">Activity</th>
                        <th className="border px-2 py-1">Compliance</th>
                        <th className="border px-2 py-1">Remarks</th>
                        <th className="border px-2 py-1">Activity</th>
                        <th className="border px-2 py-1">Compliance</th>
                        <th className="border px-2 py-1">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedChecklist.map((row) => (
                        <tr
                          key={row.id}
                          className="hover:bg-gray-400 hover:text-white text-gray-700"
                        >
                          <td className="border px-2 py-1">
                            {answers[row.id]?.assy_item || row.assy_item}
                          </td>
                          <td className="border px-2 py-1">
                            {answers[row.id]?.description || row.description}
                          </td>
                          <td className="border px-2 py-1">
                            {answers[row.id]?.requirements || row.requirements}
                          </td>
                          <td className="border px-2 py-1 text-center">
                            {answers[row.id]?.activity_1 || row.activity_1}
                          </td>
                          <td className="border px-2 py-1 text-center">
                            <input
                              type="checkbox"
                              checked={answers[row.id]?.compliance1 || false}
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
                          <td className="border px-2 py-1">
                            <input
                              type="text"
                              className="border rounded w-full px-2 py-1 text-gray-700"
                              value={answers[row.id]?.remarks1 || ""}
                              onChange={(e) =>
                                handleAnswerChange(row.id, "remarks1", e.target.value)
                              }
                            />
                          </td>
                          <td className="border px-2 py-1 text-center">
                            {answers[row.id]?.activity_2 || row.activity_2}
                          </td>
                          <td className="border px-2 py-1 text-center">
                            <input
                              type="checkbox"
                              checked={answers[row.id]?.compliance2 || false}
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
                          <td className="border px-2 py-1">
                            <input
                              type="text"
                              className="border rounded w-full px-2 py-1 text-gray-700"
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
            <div className="sm:col-span-2 md:col-span-3 flex justify-end gap-2 mt-4 p-4">
              <button
                type="button"
                className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600"
                onClick={() => router.visit(route('dashboard'))}
              >
                <i className="fa-solid fa-circle-xmark"></i> Close
              </button>
              <button
                type="button" // 🟢 no longer "submit"
                disabled={processing}
                onClick={handleSubmit} // 🟢 manual handler
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                <i className="fa-solid fa-bookmark"></i> Save
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthenticatedLayout>
  );
}
