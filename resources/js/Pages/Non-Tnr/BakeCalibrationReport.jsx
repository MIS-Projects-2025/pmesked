import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import DataTable from "@/Components/DataTable";
import { useState } from "react";

export default function BakeCalibrationReport({
    tableData,
    tableFilters,
    emp_data,
    machines,
}) {
    const [showModal, setShowModal] = useState(false);

    

    const createProfilingTemplate = () => [
        "Thermocouple 1",
        "Thermocouple 2",
        "Thermocouple 3",
        "Thermocouple 4",
        "Thermocouple 5",
        "Thermocouple 6",
        "Thermocouple 7",
        "Thermocouple 8",
        "Thermocouple 9",
        "Temperature Controller",
        "Temperature Recorder",
        "Under Temp. Protection",
        "Over Temp. Protection",
    ].map((desc) => ({
        description: desc,
        values: Array(12).fill(""),
        remarks: "",
    }));

    const [formData, setFormData] = useState({
        machine_num: "",
        control_no: "",
        serial_no: "",
        performed_by: emp_data?.emp_name || "",
        date_performed: "",
        due_date: "",
        note: "", // ✅ added
        oven_set_point1: { tolerance: "", profiling: createProfilingTemplate() },
        oven_set_point2: { tolerance: "", profiling: createProfilingTemplate() },
        oven_set_point3: { tolerance: "", profiling: createProfilingTemplate() },
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleToleranceChange = (index, value) => {
        setFormData((prev) => ({
            ...prev,
            [`oven_set_point${index}`]: {
                ...prev[`oven_set_point${index}`],
                tolerance: value,
            },
        }));
    };

    const handleProfilingChange = (setIndex, rowIndex, colIndex, value) => {
        setFormData((prev) => {
            const updated = { ...prev };
            updated[`oven_set_point${setIndex}`].profiling[rowIndex].values[colIndex] = value;
            return updated;
        });
    };

    const handleRemarksChange = (setIndex, rowIndex, value) => {
        setFormData((prev) => {
            const updated = { ...prev };
            updated[`oven_set_point${setIndex}`].profiling[rowIndex].remarks = value;
            return updated;
        });
    };

    // Replace empty fields with "N/A"
    const replaceEmptyWithNA = (data) => {
        if (Array.isArray(data)) {
            return data.map(replaceEmptyWithNA);
        } else if (typeof data === "object" && data !== null) {
            const newObj = {};
            for (const key in data) {
                newObj[key] = replaceEmptyWithNA(data[key]);
            }
            return newObj;
        } else {
            return data === "" ? "N/A" : data;
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const sanitizedData = replaceEmptyWithNA(formData);
        router.post(route("report.store"), sanitizedData, {
            onSuccess: () => {
                setShowModal(false);
                alert("✅ Record added successfully!");
                window.location.reload();
                setFormData({
                    machine_num: "",
                    control_no: "",
                    serial_no: "",
                    performed_by: emp_data?.emp_name || "",
                    date_performed: "",
                    due_date: "",
                    note: "",
                    oven_set_point1: { tolerance: "", profiling: createProfilingTemplate() },
                    oven_set_point2: { tolerance: "", profiling: createProfilingTemplate() },
                    oven_set_point3: { tolerance: "", profiling: createProfilingTemplate() },
                });
            },
        });
    };

    const renderProfilingSection = (index) => {
        const ovenKey = `oven_set_point${index}`;
        const setData = formData[ovenKey];

        return (
            <div key={index} className="mt-6 border rounded-lg p-4 bg-gray-50">
                <div className="mb-3">
                    <label className="font-medium">
                        Oven Set Point & Tolerance:
                    </label>
                    <input
                        type="text"
                        value={setData.tolerance}
                        onChange={(e) => handleToleranceChange(index, e.target.value)}
                        className="ml-2 border rounded p-2 w-64"
                        placeholder="e.g. 150°C ±5°C"
                    />
                </div>

                <div className="overflow-auto">
                    <table className="w-full border text-sm text-center">
                        <thead className="bg-gray-200">
                            <tr>
                                <th className="border p-2 w-56">Description</th>
                                {Array.from({ length: 12 }, (_, i) => (
                                    <th key={i} className="border p-2 w-10">
                                        {i + 1}
                                    </th>
                                ))}
                                <th className="border p-2 w-32">Remarks</th>
                            </tr>
                        </thead>
                        <tbody>
                            {setData.profiling.map((row, rIdx) => (
                                <tr key={rIdx}>
                                    <td className="border p-1 text-left font-medium">{row.description}</td>
                                    {row.values.map((val, cIdx) => (
                                        <td key={cIdx} className="border p-1">
                                            <input
                                                type="text"
                                                value={val}
                                                onChange={(e) =>
                                                    handleProfilingChange(index, rIdx, cIdx, e.target.value)
                                                }
                                                className="w-full text-left border-none focus:ring-0"
                                            />
                                        </td>
                                    ))}
                                    <td className="border p-1">
                                        <input
                                            type="text"
                                            value={row.remarks}
                                            onChange={(e) =>
                                                handleRemarksChange(index, rIdx, e.target.value)
                                            }
                                            className="w-full text-left border-none focus:ring-0"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const [viewModal, setViewModal] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);

    

// State para sa Edit Modal
const [editModal, setEditModal] = useState(false);
const [editData, setEditData] = useState(null);

// Action buttons kasama ang Edit
const dataWithAction = tableData.data.map((r) => ({
  ...r,
  action: (
    <div className="flex gap-2">
      {/* View Button */}
      <button
        className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        onClick={() => {
          setSelectedReport(r);
          setViewModal(true);
        }}
      >
        <i className="fas fa-eye"></i> View
      </button>

      
      {/* Conditional edit Button */}
      {/* {(r.performed_by === emp_data?.emp_name || ['1788'].includes(emp_data?.emp_id)) && ( */}
      {(['1788'].includes(emp_data?.emp_id)) && (
  <button
    className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
    onClick={() => {
      setEditData(r);
      setEditModal(true);
    }}
  >
    <i className="fas fa-pen"></i> Edit
  </button>
)}

    </div>
  ),
}));

// const Creators = emp_data?.emp_name === selectedReport?.performed_by;

// console.log(
//   "Creators (boolean):", Creators,
//   "emp_data.emp_name:", emp_data?.emp_name,
//   "selectedReport.performed_by:", selectedReport?.performed_by
// );




    return (
        <AuthenticatedLayout>
            <Head title="Manage Bake Oven Calibration Report" />

            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold">
                    <i className="fa-solid fa-file-lines mr-2"></i>
                    Bake Oven Calibration Report
                </h1>

                <button
                    className="text-blue-600 border-blue-600 btn"
                    onClick={() => setShowModal(true)}
                >
                    Add New Report
                </button>
            </div>

            <DataTable
                columns={[
                    { key: "machine_num", label: "Machine Number" },
                    { key: "control_no", label: "Controller Number" },
                    { key: "serial_no", label: "Serial Number" },
                    { key: "performed_by", label: "Performed By" },
                    { key: "date_performed", label: "Date Performed" },
                    { key: "due_date", label: "Due Date" },
                    { key: "note", label: "Note" }, // ✅ added
                    { key: "action", label: "Action" },
                ]}
                data={dataWithAction}
                meta={{
                    from: tableData.from,
                    to: tableData.to,
                    total: tableData.total,
                    links: tableData.links,
                    currentPage: tableData.current_page,
                    lastPage: tableData.last_page,
                }}
                routeName={route("bake.calibration.index")}
                filters={tableFilters}
                rowKey="machine_num"
                showExport={false}
            />

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
                    <div className="bg-white p-5 rounded-lg shadow-lg w-[95%] md:max-w-10xl overflow-y-auto max-h-[95vh] text-gray-600">
                        <div className="flex justify-between items-center mb-3 border-b pb-2">
                            <h3 className="text-lg font-bold">
                                <i className="fa-solid fa-file-lines mr-2"></i>
                                Add New Bake Oven Report
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-red-500 hover:text-red-700 text-xl font-bold"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block font-medium mb-1">Machine Number</label>
                                    <input
                                        list="machineList"
                                        name="machine_num"
                                        value={formData.machine_num}
                                        onChange={(e) => {
                                            const selectedMachine = machines.find(
                                                (m) => m.machine_num === e.target.value
                                            );
                                            setFormData((prev) => ({
                                                ...prev,
                                                machine_num: e.target.value,
                                                control_no: selectedMachine?.cn_no || "",
                                                serial_no: selectedMachine?.serial || "",
                                            }));
                                        }}
                                        className="w-full border rounded p-2"
                                        placeholder="Type or select a machine number"
                                        required
                                    />
                                    <datalist id="machineList">
                                        {machines.map((m) => (
                                            <option key={m.machine_num} value={m.machine_num}>
                                                {m.machine_num}
                                            </option>
                                        ))}
                                    </datalist>
                                </div>

                                <div>
                                    <label className="block font-medium mb-1">Controller Number</label>
                                    <input
                                        type="text"
                                        name="control_no"
                                        value={formData.control_no}
                                        readOnly
                                        className="w-full border rounded p-2 bg-gray-100"
                                    />
                                </div>

                                <div>
                                    <label className="block font-medium mb-1">Serial Number</label>
                                    <input
                                        type="text"
                                        name="serial_no"
                                        value={formData.serial_no}
                                        readOnly
                                        className="w-full border rounded p-2 bg-gray-100"
                                    />
                                </div>

                                <div>
                                    <label className="block font-medium mb-1">Performed By</label>
                                    <input
                                        type="text"
                                        name="performed_by"
                                        value={formData.performed_by}
                                        readOnly
                                        className="w-full border rounded p-2 bg-gray-100"
                                    />
                                </div>

                                <div>
                                    <label className="block font-medium mb-1">Date Performed</label>
                                    <input
                                        type="date"
                                        name="date_performed"
                                        value={formData.date_performed}
                                        onChange={handleChange}
                                        className="w-full border rounded p-2"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block font-medium mb-1">Due Date</label>
                                    <input
                                        type="date"
                                        name="due_date"
                                        value={formData.due_date}
                                        onChange={handleChange}
                                        className="w-full border rounded p-2"
                                        required
                                    />
                                </div>

                            </div>

                            {renderProfilingSection(1)}
                            {renderProfilingSection(2)}
                            {renderProfilingSection(3)}

                            <div className="grid grid-cols-3 gap-4">
                                {/* ✅ New Note field */}
                                <div className="col-span-3">
                                    <label className="block font-medium mb-1">Note</label>
                                    <textarea
                                        name="note"
                                        value={formData.note}
                                        onChange={handleChange}
                                        className="w-full border rounded p-2"
                                        placeholder="Enter note (optional)"
                                        rows="3"
                                    ></textarea>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                                >
                                    <i className="fa-solid fa-xmark mr-2"></i>
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    <i className="fa-solid fa-floppy-disk mr-2"></i>
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Modal */}
{viewModal && selectedReport && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white p-5 rounded-lg shadow-lg w-[95%] md:max-w-7xl overflow-y-auto max-h-[95vh] text-gray-600">
      <div className="flex justify-between items-center mb-3 border-b pb-2">
        <h3 className="text-lg font-bold">
          <i className="fa-solid fa-eye mr-2"></i>
          View Bake Oven Report
        </h3>
        <button
          onClick={() => setViewModal(false)}
          className="text-red-500 hover:text-red-700 text-xl font-bold"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>
      </div>
<div className="flex justify-end items-center mb-3 border-b pb-2">
 {emp_data?.emp_name === selectedReport.performed_by && (
      <a
  href={`/bake-calibration/pdf/${selectedReport.id}`}
  target="_blank"
  className="px-3 py-2 bg-gray-100 text-red-600 rounded shadow hover:bg-red-700 hover:text-white border-2 border-red-600 hover:border-gray-500 flex items-center text-bold"
>
  <i className="fa-solid fa-file-pdf mr-2"></i>
  View as PDF
</a>
  )}
</div>

      <div className="space-y-4">
        <table className="w-full border-collapse border text-sm text-left">
        <tbody>
    <tr>
      <th className="border p-2 w-1/2 font-medium">Machine Number</th>
      <td className="border p-2">{selectedReport.machine_num}</td>
    </tr>
    <tr>
      <th className="border p-2 font-medium">Controller Number</th>
      <td className="border p-2">{selectedReport.control_no}</td>
    </tr>
    <tr>
      <th className="border p-2 font-medium">Serial Number</th>
      <td className="border p-2">{selectedReport.serial_no}</td>
    </tr>
    <tr>
      <th className="border p-2 font-medium">Performed By</th>
      <td className="border p-2">{selectedReport.performed_by}</td>
    </tr>
    <tr>
      <th className="border p-2 font-medium">Date Performed</th>
      <td className="border p-2"> {selectedReport.date_performed
    ? new Date(selectedReport.date_performed).toLocaleDateString("en-US", {
        year: "2-digit",
        month: "2-digit",
        day: "2-digit",
      })
    : "N/A"}</td>
    </tr>
    <tr>
      <th className="border p-2 font-medium">Due Date</th>
      <td className="border p-2"> {selectedReport.due_date
    ? new Date(selectedReport.due_date).toLocaleDateString("en-US", {
        year: "2-digit",
        month: "2-digit",
        day: "2-digit",
      })
    : "N/A"}</td>
    </tr>
         </tbody>
        </table>


       

        {/* Oven Set Points */}
        {[1, 2, 3].map((i) => {
          const ovenData = JSON.parse(selectedReport[`oven_set_point${i}`] || '{}');
          if (!ovenData) return null;

          return (
            <div key={i} className="mt-4 border rounded p-4 bg-gray-50">
              <div className="mb-2 font-medium">Oven Set Point {i}: {ovenData.tolerance}</div>
              <div className="overflow-auto">
                <table className="w-full border text-sm text-center">
                  <thead className="bg-gray-200">
                    <tr>
                      <th className="border p-2 w-56">Description</th>
                      {Array.from({ length: 12 }, (_, idx) => (
                        <th key={idx} className="border p-2 w-10">{idx + 1}</th>
                      ))}
                      <th className="border p-2 w-32">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ovenData.profiling?.map((row, rIdx) => (
                      <tr key={rIdx}>
                        <td className="border p-1 text-left font-medium">{row.description}</td>
                        {row.values.map((val, cIdx) => (
                          <td key={cIdx} className="border p-1">{val}</td>
                        ))}
                        <td className="border p-1">{row.remarks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
         <div>
          <label className="font-medium">Note:</label>
          <p>{selectedReport.note}</p>
        </div>
      </div>
      {/* Close Button at Bottom */}
      <hr className="mt-2 border border-2 border-gray-400" />
        <div className="flex justify-end mt-4">
          <button
            onClick={() => setViewModal(false)}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            <i className="fa-solid fa-xmark mr-2"></i> Close
          </button>
        </div>
    </div>
  </div>
)}

{editModal && editData && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white p-5 rounded-lg shadow-lg w-[95%] md:max-w-7xl overflow-y-auto max-h-[95vh] text-gray-600">
      <div className="flex justify-between items-center mb-3 border-b pb-2">
        <h3 className="text-lg font-bold">
          <i className="fa-solid fa-pen mr-2"></i> Edit Bake Oven Report
        </h3>
        <button
          onClick={() => setEditModal(false)}
          className="text-red-500 hover:text-red-700 text-xl font-bold"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          router.put(route("report.update", editData.id), editData, {
            onSuccess: () => {
              setEditModal(false);
              alert("✅ Record updated successfully!");
              window.location.reload();
            },
          });
        }}
        className="space-y-4"
      >
        {/* Basic Info Table */}
        <table className="w-full border-collapse border text-sm text-left">
          <tbody>
            <tr>
              <th className="border p-2 font-medium w-1/2">Machine Number</th>
              <td className="border p-2">
                <input
                  type="text"
                  value={editData.machine_num}
                  onChange={(e) =>
                    setEditData((prev) => ({ ...prev, machine_num: e.target.value }))
                  }
                  className="w-full border rounded p-1"
                />
              </td>
            </tr>
            <tr>
              <th className="border p-2 font-medium">Controller Number</th>
              <td className="border p-2">
                <input
                  type="text"
                  value={editData.control_no}
                  onChange={(e) =>
                    setEditData((prev) => ({ ...prev, control_no: e.target.value }))
                  }
                  className="w-full border rounded p-1"
                />
              </td>
            </tr>
            <tr>
              <th className="border p-2 font-medium">Serial Number</th>
              <td className="border p-2">
                <input
                  type="text"
                  value={editData.serial_no}
                  onChange={(e) =>
                    setEditData((prev) => ({ ...prev, serial_no: e.target.value }))
                  }
                  className="w-full border rounded p-1"
                />
              </td>
            </tr>
            <tr>
              <th className="border p-2 font-medium">Performed By</th>
              <td className="border p-2">
                <input
                  type="text"
                  value={editData.performed_by}
                  onChange={(e) =>
                    setEditData((prev) => ({ ...prev, performed_by: e.target.value }))
                  }
                  className="w-full border rounded p-1"
                />
              </td>
            </tr>
            <tr>
              <th className="border p-2 font-medium">Date Performed</th>
              <td className="border p-2">
                <input
                  type="date"
                  value={editData.date_performed}
                  onChange={(e) =>
                    setEditData((prev) => ({ ...prev, date_performed: e.target.value }))
                  }
                  className="w-full border rounded p-1"
                />
              </td>
            </tr>
            <tr>
              <th className="border p-2 font-medium">Due Date</th>
              <td className="border p-2">
                <input
                  type="date"
                  value={editData.due_date}
                  onChange={(e) =>
                    setEditData((prev) => ({ ...prev, due_date: e.target.value }))
                  }
                  className="w-full border rounded p-1"
                />
              </td>
            </tr>
          </tbody>
        </table>

        {/* Oven Set Points */}
        {[1, 2, 3].map((i) => {
          const ovenData = JSON.parse(editData[`oven_set_point${i}`] || '{}');
          if (!ovenData) return null;

          return (
            <div key={i} className="mt-4 border rounded p-4 bg-gray-50">
              <div className="mb-2 font-medium">
                Oven Set Point {i}:
                <input
                  type="text"
                  value={ovenData.tolerance}
                  onChange={(e) => {
                    const updatedOven = { ...ovenData, tolerance: e.target.value };
                    setEditData((prev) => ({
                      ...prev,
                      [`oven_set_point${i}`]: JSON.stringify(updatedOven),
                    }));
                  }}
                  className="ml-2 border rounded p-1 w-48"
                />
              </div>

              <div className="overflow-auto">
                <table className="w-full border text-sm text-center">
                  <thead className="bg-gray-200">
                    <tr>
                      <th className="border p-2 w-56">Description</th>
                      {Array.from({ length: 12 }, (_, idx) => (
                        <th key={idx} className="border p-2 w-10">{idx + 1}</th>
                      ))}
                      <th className="border p-2 w-32">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ovenData.profiling?.map((row, rIdx) => (
                      <tr key={rIdx}>
                        <td className="border p-1 text-left font-medium">{row.description}</td>
                        {row.values.map((val, cIdx) => (
                          <td key={cIdx} className="border p-1">
                            <input
                              type="text"
                              value={val}
                              onChange={(e) => {
                                const updatedProfiling = [...row.values];
                                updatedProfiling[cIdx] = e.target.value;
                                const updatedRow = { ...row, values: updatedProfiling };
                                const updatedOven = {
                                  ...ovenData,
                                  profiling: ovenData.profiling.map((r, idx) =>
                                    idx === rIdx ? updatedRow : r
                                  ),
                                };
                                setEditData((prev) => ({
                                  ...prev,
                                  [`oven_set_point${i}`]: JSON.stringify(updatedOven),
                                }));
                              }}
                              className="w-full border p-1"
                            />
                          </td>
                        ))}
                        <td className="border p-1">
                          <input
                            type="text"
                            value={row.remarks}
                            onChange={(e) => {
                              const updatedRow = { ...row, remarks: e.target.value };
                              const updatedOven = {
                                ...ovenData,
                                profiling: ovenData.profiling.map((r, idx) =>
                                  idx === rIdx ? updatedRow : r
                                ),
                              };
                              setEditData((prev) => ({
                                ...prev,
                                [`oven_set_point${i}`]: JSON.stringify(updatedOven),
                              }));
                            }}
                            className="w-full border p-1"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}

            <div className="mt-4">
                <label htmlFor="" className="block text-xl mb-1">Note:</label>
                <textarea
                  value={editData.note}
                  onChange={(e) =>
                    setEditData((prev) => ({ ...prev, note: e.target.value }))
                  }
                  className="w-full border rounded p-4"
                  rows={3}
                ></textarea>
            </div>

        {/* Save / Cancel Buttons */}
        <div className="flex justify-end gap-2 mt-4">
          <button
            type="button"
            onClick={() => setEditModal(false)}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            <i className="fas fa-times mr-2"></i>
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            <i className="fas fa-save mr-2"></i>
            Save Changes
          </button>
        </div>
      </form>
    </div>
  </div>
)}


        </AuthenticatedLayout>
    );
}
