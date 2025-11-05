import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useState } from "react";
import DataTable from "@/Components/DataTable";
import { router, usePage } from "@inertiajs/react";
import axios from "axios";

export default function Index({ reports, filters, machines, empData, items }) {
  const { flash, emp_data } = usePage().props;

  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);

  const formatDate = (date) => {
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const year = d.getFullYear();
    return `${month}/${day}/${year}`;
  };

  // --- Default form values (Add modal) ---
  const defaultFormData = {
    control_no: "",
    description: "",
    serial: "",
    frequency: "",
    pm_date: formatDate(today),
    pm_due: formatDate(nextWeek),
    performed_by: empData?.emp_name || "",
    check_item: [],
    verification_reading: [],
    std_use_verification: [],
    tech_sign: "",
    qa_sign: "",
    days: "",
    remarks: "",
    updated_by: empData?.emp_name || "",
  };

  const [showForm, setShowForm] = useState(false);
  const [showView, setShowView] = useState(false);
  const [editData, setEditData] = useState(null);
  const [viewData, setViewData] = useState(null);
  const [formData, setFormData] = useState(defaultFormData);
  const [error, setError] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);

  // --- Reset form ---
  const resetForm = () => {
    setFormData(defaultFormData);
    setError("");
  };

  // --- Open Add Modal ---
  const openAddModal = () => {
    setEditData(null);

    const template = items[0] || {};

    const defaultCheckItems = (template.check_item || []).map((ci, idx) => ({
      id: idx,
      assy_item: ci.assy_item ?? "",
      requirement: ci.requirement ?? "",
      activity: ci.activity ?? "",
      compliance: ci.compliance ?? 0,
      date: ci.date ?? "",
      remarks: ci.remarks ?? "",
    }));

    const defaultVerificationReading = (template.verification_reading || []).map(
      (vr, idx) => ({
        id: idx,
        parameter: vr.parameter ?? "",
        specs_value: vr.specs_value ?? "",
        trial1_min: vr.trial1_min ?? "",
        trial1_max: vr.trial1_max ?? "",
        trial2_min: vr.trial2_min ?? "",
        trial2_max: vr.trial2_max ?? "",
        trial3_min: vr.trial3_min ?? "",
        trial3_max: vr.trial3_max ?? "",
      })
    );

    const defaultStdUseVerification = (template.std_use_verification || []).map(
      (sv, idx) => ({
        id: idx,
        description: sv.description ?? "",
        instrument1: sv.instrument1 ?? "",
        instrument2: sv.instrument2 ?? "",
        instrument3: sv.instrument3 ?? "",
      })
    );

    setFormData({
      ...defaultFormData,
      check_item: defaultCheckItems,
      verification_reading: defaultVerificationReading,
      std_use_verification: defaultStdUseVerification,
    });

    setShowForm(true);
  };

  // --- Open Edit Modal ---
  const openEditModal = (item) => {
    setEditData(item);

    setFormData({
      ...defaultFormData,
      ...item,
      check_item: Array.isArray(item.check_item)
        ? item.check_item.map((ci, idx) => ({ id: idx, ...ci }))
        : [],
      verification_reading: Array.isArray(item.verification_reading)
        ? item.verification_reading.map((vr, idx) => ({ id: idx, ...vr }))
        : [],
      std_use_verification: Array.isArray(item.std_use_verification)
        ? item.std_use_verification.map((sv, idx) => ({ id: idx, ...sv }))
        : [],
    });

    setShowForm(true);
  };

  const openViewModal = (item) => {
    setViewData(item);
    setShowView(true);
  };

  const closeModals = () => {
    setShowForm(false);
    setShowView(false);
    setEditData(null);
    setViewData(null);
  };

  // --- Input Handlers ---
  const handleChecklistChange = (index, field, value) => {
    const updated = [...formData.check_item];
    updated[index][field] = value;
    setFormData({ ...formData, check_item: updated });
  };

  const handleVerificationChange = (index, field, value) => {
    const updated = [...formData.verification_reading];
    updated[index][field] = value;
    setFormData({ ...formData, verification_reading: updated });
  };

  const handleStdVerificationChange = (index, field, value) => {
    const updated = [...formData.std_use_verification];
    updated[index][field] = value;
    setFormData({ ...formData, std_use_verification: updated });
  };

const handleChange = (e) => {
  const { name, value } = e.target;

  // helper for formatting date as YYYY-MM-DD
  const formatDate = (date) => {
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const year = d.getFullYear();
    return `${year}-${month}-${day}`;
  };

  // 🔹 1. kapag nagbago ang CONTROL NO
  if (name === "control_no") {
    const machine = machines.find((m) => m.pmnt_no === value);

    if (machine) {
      setFormData({
        ...formData,
        control_no: value,
        serial: machine.serial,
        description: "AIR IONIZER",
        frequency: "Weekly",
        days: "",
        performed_by: empData?.emp_name || "",
      });
      setError("");
    } else {
      setFormData({
        ...formData,
        control_no: value,
        serial: "",
        description: "",
        frequency: "",
        days: "",
        performed_by: empData?.emp_name || "",
      });
      setError(`Machine "${value}" not found. Please add it first in the inventory.`);
    }
    return; // ✅ stop here para hindi tuloy sa ibang logic
  }

  // 🔹 2. kapag nagbago ang PM DATE → auto +7 days
  if (name === "pm_date") {
    const date = new Date(value);

    if (!isNaN(date)) {
      const dueDate = new Date(date);
      dueDate.setDate(date.getDate() + 7);

      setFormData({
        ...formData,
        pm_date: formatDate(date),
        pm_due: formatDate(dueDate),
      });
    } else {
      setFormData({ ...formData, pm_date: value });
    }
    return;
  }

  // 🔹 3. other fields
  setFormData({ ...formData, [name]: value });
};


  // --- Submit Handler ---  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (error) {
      alert("Please fix the errors before submitting.");
      return;
    }

    if (editData) {
      router.put(`/ionizer-checklists/${editData.id}`, formData, {
        onSuccess: () => {
          alert("✅ Successfully saved!");
          setShowForm(false);
          window.location.reload();
        },
      });
    } else {
      router.post("/ionizer-checklists", formData, {
        onSuccess: () => {
          alert("✅ Successfully saved!");
          setShowForm(false);
          window.location.reload();
        },
      });
    }
  };

  // --- Verify Handler ---
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

  // --- Bulk Verify Handler ---
  const handleBulkVerify = async (ids) => {
    try {
      const type =
        emp_data?.emp_system_role === "qa" ? "qa" : "tech"; // auto decide

      await axios.post("/ionizer-checklist/bulk-verify", { ids, type });

      alert("Selected items verified successfully!");
      setSelectedIds([]);
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert("Bulk verification failed!");
    }
  };

  // --- Selection Handlers ---
  const toggleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(filteredReports.map((item) => item.id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // --- Role-based filtering (QA only sees rows without QA sign) ---
  const isQaUser = ["ESD Technician 1", "ESD Technician 2", "Senior QA Engineer", "DIC Clerk 1"].includes(emp_data?.emp_jobtitle);
  const filteredReports = isQaUser
    ? reports.data.filter((item) => !item.qa_sign || item.qa_sign.trim() === "")
    : reports.data;

  // --- Table Data with Actions ---
  const dataWithAction = filteredReports.map((item) => {
    const isTechUser = [
      "Senior Equipment Technician",
      "Equipment Technician 1",
      "Equipment Technician 2",
      "Equipment Technician 3",
      "PM Technician 1",
      "PM Technician 2",
      "Trainee - Equipment Technician 1",
    ].includes(emp_data?.emp_jobtitle);

    const disableCheckbox =
      (isTechUser && item.tech_sign && item.tech_sign.trim() !== "") ||
      (isQaUser && item.qa_sign && item.qa_sign.trim() !== "");

    return {
      ...item,
      select: (
        <input
          type="checkbox"
          checked={selectedIds.includes(item.id)}
          onChange={() => toggleSelectOne(item.id)}
          disabled={disableCheckbox}
        />
      ),
      action: (
        <div className="flex gap-2">
          <button
            onClick={() => openViewModal(item)}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            <i className="fas fa-eye"></i> View
          </button>

          {["superadmin", "admin"].includes(emp_data?.emp_system_role) && (
            <button
              onClick={() => openEditModal(item)}
              className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              <i className="fas fa-edit"></i> Edit
            </button>
          )}
        </div>
      ),
    };
  });

  // --- JSX ---
  return (
    <AuthenticatedLayout>
      <div className="p-4">
        {flash?.success && (
          <div className="mb-3 p-2 bg-green-100 text-green-700 rounded">
            {flash.success}
          </div>
        )}

        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-bold">Ionizer Checklist</h2>
          {["Equipment Engineering"].includes(emp_data?.emp_dept) && (
            <button
              onClick={openAddModal}
              className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              + Add New
            </button>
          )}
        </div>

        {/* Bulk Verify Button */}
        {selectedIds.length > 0 && (
          <div className="flex justify-between items-center mb-3">
            <button
              onClick={() => handleBulkVerify(selectedIds)}
              className="px-3 py-1 bg-green-600 text-white rounded shadow hover:bg-green-700 mt-2"
            >
              <i className="fas fa-check mr-1"></i> Verify Selected (
              {selectedIds.length})
            </button>
          </div>
        )}

        <DataTable
          columns={[
            { key: "control_no", label: "Control No" },
            { key: "pm_date", label: "PM Date" },
            { key: "pm_due", label: "PM Due" },
            { key: "performed_by", label: "Performed By" },
            { key: "tech_sign", label: "Tech Verified" },
            { key: "qa_sign", label: "QA Verified" },
            { key: "action", label: "Action" },
          ]}
          data={dataWithAction}
          meta={{
            from: reports.from,
            to: reports.to,
            total: reports.total,
            links: reports.links,
            currentPage: reports.current_page,
            lastPage: reports.last_page,
          }}
          routeName={route("ionizer.index")}
          filters={filters}
          rowKey="id"
          sortBy="id"
          sortOrder="desc"
        />

        

        {/* --- Modal Form --- */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
            <div className="bg-white p-5 rounded-lg shadow-lg w-[95%] md:max-w-8xl overflow-y-auto max-h-[95vh]">
              <div className="flex justify-between items-center mb-3 bg-gradient-to-r from-white to-gray-500 p-2 rounded">
                <h3 className="text-lg font-bold text-violet-800 pt-4 pb-4">
                  <i className="fas fa-wrench mr-2"></i>
                  {editData ? "Edit Entry" : "Add New Entry"}
                </h3>
              
                <button
                  onClick={() => setShowForm(false)}
                  className="text-red-400 hover:text-red-600 pr-2 font-bold text-2xl"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <input type="text" name="updated_by" value={formData.updated_by} hidden />
                {/* Header */}
                <table className="w-full border text-sm text-gray-600 mb-4 rounded-lg">
                  <tbody>
                    <tr>
                      <td className="border p-2">Description</td>
                      <td className="border p-2">
                        <input
                          type="text"
                          name="description"
                          value={formData.description}
                          onChange={handleChange}
                          className="w-full border rounded p-1 bg-gray-100"
                          readOnly
                        />
                      </td>
                      <td className="border p-2">PM Date</td>
                      <td className="border p-2">
                        <input
                          type="text"
                          name="pm_date"
                          value={formData.pm_date}
                          onChange={handleChange}
                          className="w-full border rounded p-1"
                          required
                        />
                      </td>
                    </tr>
                    <tr>
                       <td className="border p-2">Control Number</td>
                      <td className="border p-2">
                        <input
                          list="control_no_list"
                          name="control_no"
                          value={formData.control_no}
                          onChange={handleChange}
                          className="w-full border rounded p-1"
                          placeholder="Enter/ Select Control No..."
                          required
                        />
                        <datalist id="control_no_list">
                          {machines.map((m) => (
                            <option key={m.id} value={m.pmnt_no} />
                          ))}
                        </datalist>
                        {error && (
                          <p className="text-red-600 text-sm mt-1">
                            {error}{" "}
                            <a
                              href="http://192.168.1.26/mc-inventory-beta/admin"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline text-blue-600"
                            >
                              Go to Inventory
                            </a>
                          </p>
                        )}
                      </td>
                      <td className="border p-2">PM Due</td>
                      <td className="border p-2">
                        <input
                          type="text"
                          name="pm_due"
                          value={formData.pm_due}
                          onChange={handleChange}
                          className="w-full border rounded p-1"
                          required
                        />
                      </td>
                       
                      
                    </tr>
                    <tr>
                       <td className="border p-2">Serial Number</td>
                      <td className="border p-2">
                        <input
                          type="text"
                          name="serial"
                          value={formData.serial}
                          onChange={handleChange}
                          className="w-full border rounded p-1 bg-gray-100"
                          readOnly
                        />
                      </td>
                      <td className="border p-2">Performed By</td>
                      <td className="border p-2">
                        <input
                          type="text"
                          name="performed_by"
                          value={formData.performed_by}
                          onChange={handleChange}
                          className="w-full border rounded p-1 bg-gray-100"
                          readOnly
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="border p-2">PM Frequency</td>
                      <td className="border p-2">
                        <input
                          type="text"
                          name="frequency"
                          value={formData.frequency}
                          onChange={handleChange}
                          className="w-full border rounded p-1"
                          required
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* --- Check Items --- */}
                <h3 className="text-violet-800 mb-2 font-bold"><i className="fa-solid fa-list-check"></i> Check Items</h3>
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
                    {formData.check_item.map((row, index) => (
                      <tr key={`ci-${row.id}`} className="text-center">
                        <td className="border p-2 w-3/12">
                            <input
                              type="text"
                              name="assy_item"
                              placeholder="Assembly Item"
                              value={row.assy_item || ""}
                              onChange={(e) =>
                                handleChecklistChange(index, "assy_item", e.target.value)
                              }
                              className="border p-1 rounded w-full"
                              readOnly
                            />
                        </td>
                        <td className="border p-2 w-2/12">
                            <input
                              type="text"
                              name="requirement"
                              placeholder="Requirement"
                              value={row.requirement || ""}
                              onChange={(e) =>
                                handleChecklistChange(
                                  index,
                                  "requirement",
                                  e.target.value
                                )
                              }
                              className="border p-1 rounded w-full"
                              readOnly
                            />
                        </td>
                        <td className="border p-2 w-1/12 items-center">
                            <input
                              type="text"
                              name="activity"
                              placeholder="Activity"
                              value={row.activity || ""}
                              onChange={(e) =>
                                handleChecklistChange(index, "activity", e.target.value)
                              }
                              className="border p-1 rounded w-full text-center"
                              readOnly
                            />
                        </td>
                        <td className="border p-2 w-1/12 items-center">
                          <input
                            type="checkbox"
                            name="compliance"
                            checked={row.compliance === 1} // naka-bind sa row
                            onChange={(e) =>
                              handleChecklistChange(index, "compliance", e.target.checked ? 1 : 0)
                           }
                          />
                        </td>
                        <td className="border p-2 w-1/12 items-center">
                        <input
                          type="date"
                          name="date"
                          value={row.date || "" }
                          onChange={(e) =>
                            handleChecklistChange(index, "date", e.target.value)
                          }
                          className="border p-1 rounded bg-blue-300"
                          placeholder="Select Date on right side..."
                        />

                        </td>
                        <td className="border p-2 w-1/12 items-center">                       
                         <input
                           type="text"
                            name="remarks"
                            placeholder="PASS/FAIL..."
                            value={row.remarks || ""}
                            onChange={(e) =>
                              handleChecklistChange(index, "remarks", e.target.value)
                            }
                           className="border p-1 rounded"
                         />
                        </td>
                      </tr>
                    ))}
                   
                  </tbody>
                </table>

                {/* --- Verification Reading --- */}
                <h3 className="text-violet-800 mb-2 font-bold">
                  <i className="fa-solid fa-magnifying-glass"></i>
                  Verification Reading
                </h3>
                <table className="w-full border text-sm text-gray-600 mb-4 bordered">
                  <thead>
                    <tr>
                      <th rowSpan={2} className="border p-2">Verfication Reading</th>
                      <th rowSpan={2} className="border p-2">Specs Limit</th>
                      <th colSpan={2}  className="border p-2">Trial 1</th>
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
                   {formData.verification_reading.map((row, index) => (
                  <tr key={`vr-${index}`}>
                    <td className="border p-2 w-3/12">
                     <input
                       type="text"
                       placeholder="Parameter"
                        value={row.parameter || ""}
                       onChange={(e) =>
                         handleVerificationChange(index, "parameter", e.target.value)
                       }
                        className="border-none p-1 rounded"
                       style={{ width: "350px" }}
                       readOnly
                      />
                    </td>

                    <td className="border p-2 w-2/12">
                    <input
                      type="text"
                      placeholder="Specs"
                      value={row.specs_value || ""}
                      onChange={(e) =>
                        handleVerificationChange(index, "specs_value", e.target.value)
                      }
                      className="border-none p-1 rounded w-full"
                      style={{ width: "150px" }}
                      readOnly
                    />
                  </td>

                  {/* Trial 1 Min */}
                   <td className="border p-2">
                      <input
                       type="text"
                        placeholder="Min"
                        value={row.trial1_min || ""}
                        onChange={(e) =>
                         handleVerificationChange(index, "trial1_min", e.target.value)
                        }
                        className="border p-1 rounded w-full"
                       style={{ width: "150px" }}
                      />
                    </td>

                    {/* Trial 1 Max */}
                   <td className="border p-2">
                      <input
                        type="text"
                       placeholder="Max"
                        value={row.trial1_max || ""}
                        onChange={(e) =>
                         handleVerificationChange(index, "trial1_max", e.target.value)
                        }
                       className="border p-1 rounded"
                       style={{ width: "150px" }}
                     />
                    </td>

                    {/* Trial 2 Min */}
                    <td className="border p-2">
                     <input
                        type="text"
                       placeholder="Min"
                        value={row.trial2_min || ""}
                       onChange={(e) =>
                         handleVerificationChange(index, "trial2_min", e.target.value)
                       }
                       className="border p-1 rounded"
                        style={{ width: "150px" }}
                     />
                    </td>

                     {/* Trial 2 Max */}
                      <td className="border p-2">
                       <input
                         type="text"
                          placeholder="Max"
                          value={row.trial2_max || ""}
                          onChange={(e) =>
                            handleVerificationChange(index, "trial2_max", e.target.value)
                         }
                          className="border p-1 rounded"
                         style={{ width: "150px" }}
                       />
                     </td>

                     {/* Trial 3 Min */}
                     <td className="border p-2">
                       <input
                          type="text"
                          placeholder="Min"
                          value={row.trial3_min || ""}
                          onChange={(e) =>
                            handleVerificationChange(index, "trial3_min", e.target.value)
                          }
                         className="border p-1 rounded"
                         style={{ width: "150px" }}
                       />
                      </td>

                      {/* Trial 3 Max */}
                     <td className="border p-2 w-2/12">
                       <input
                         type="text"
                          placeholder="Max"
                          value={row.trial3_max || ""}
                          onChange={(e) =>
                            handleVerificationChange(index, "trial3_max", e.target.value)
                         }
                         className="border p-1 rounded w-full"
                         style={{ width: "150px" }}
                       />
                     </td>
                    </tr>
                    ))}
                    <tr>
                       <td className="border p-2 w-2/12">OMEGA DTHM (REFERRENCE EQUIPMENT)</td>
                      <td colSpan={3} className="border p-2">
                        <input
                          type="text"
                          name="dthm_temp"
                          value={formData.dthm_temp}
                          onChange={handleChange}
                          className="w-full border rounded p-1"
                          placeholder="OMEGA DTHM Temp. (°C)"
                          required
                        />
                      </td>
                      <td colSpan={5} className="border p-2">
                        <input
                          type="text"
                          name="dthm_rh"
                          value={formData.dthm_rh}
                          onChange={handleChange}
                          className="w-full border rounded p-1"
                          placeholder="OMEGA DTHM Humidity (%RH)"
                          required
                        />
                      </td>
                    </tr>
                </tbody>
                </table>

                {/* --- Standard Use Verification --- */}
                <h3 className="text-violet-800 mb-2 font-bold">
                  <i class="fa-solid fa-stroopwafel"></i>
                  Standard Use Verification
                </h3>
                <table className="w-full border text-sm text-gray-600 mb-4">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2 w-2/12">Description</th>
                      <th className="border p-2 w-1/12">Instrument 1</th>
                      <th className="border p-2 w-1/12">Instrument 2</th>
                      <th className="border p-2 w-1/12">Instrument 3</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.std_use_verification.map((row, index) => (
                      <tr key={`sv-${row.id}`}>
                        <td className="border p-2 w-1/12">
                            <input
                              type="text"
                              placeholder="Description"
                              value={row.description || ""}
                              onChange={(e) =>
                                handleStdVerificationChange(
                                  index,
                                  "description",
                                  e.target.value
                                )
                              }
                              className="border p-1 rounded w-full"
                              readOnly
                            />
                        </td>
                         <td className="border p-2 w-1/12">
                            <input
                              type="text"
                              placeholder="Value"
                              value={row.instrument1 || ""}
                              onChange={(e) =>
                                handleStdVerificationChange(
                                  index,
                                  "instrument1",
                                  e.target.value
                                )
                              }
                              className="border p-1 rounded w-full"
                              required
                            />
                        </td>
                        <td className="border p-2 w-1/12">
                            <input
                              type="text"
                              placeholder="Value"
                              value={row.instrument2 || ""}
                              onChange={(e) =>
                                handleStdVerificationChange(
                                  index,
                                  "instrument2",
                                  e.target.value
                                )
                              }
                              className="border p-1 rounded w-full"
                              required
                            />
                        </td>
                        <td className="border p-2 w-1/12">
                            <input
                              type="text"
                              placeholder="Value"
                              value={row.instrument3 || ""}
                              onChange={(e) =>
                                handleStdVerificationChange(
                                  index,
                                  "instrument3",
                                  e.target.value
                                )
                              }
                              className="border p-1 rounded w-full"
                              required
                            />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Remarks */}
               <div className="flex gap-4">
               <div className="flex-3">
                  <label className="font-semibold text-gray-600">
                   Duration of usage (Days)
                 </label>
                  <input
                    type="text"
                    name="days"
                    value={formData.days}
                    onChange={handleChange}
                    placeholder="Enter Number of Days..."
                   className="w-full border rounded p-2 text-gray-600 bg-gray-100"
                   style={{ height: "65px", fontSize: "22px" }}
                   required
                  />
                </div>

                <div className="flex-1">
                 <label className="font-semibold text-gray-600">
                    Remarks
                 </label>
                 <textarea
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleChange}
                    className="w-full border rounded p-2 text-gray-600"
                 />
                </div>
              </div>

                <div className="mt-3 text-right">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    <i className="fas fa-save mr-2"></i>{editData ? "Update" : "Save"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

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
            <td className="border p-2">Description</td>
            <td className="border p-2">{viewData?.description}</td>
            <td className="border p-2">PM Date</td>
            <td className="border p-2">{viewData?.pm_date}</td>
          </tr>
          <tr>
             <td className="border p-2">Control No</td>
            <td className="border p-2">{viewData?.control_no}</td>
             <td className="border p-2">PM Due</td>
            <td className="border p-2">{viewData?.pm_due}</td>
          </tr>
          <tr>
            <td className="border p-2">Serial</td>
            <td className="border p-2">{viewData?.serial}</td>
            <td className="border p-2">Performed By</td>
            <td className="border p-2">{viewData?.performed_by}</td>
          </tr>
          <tr>
            <td className="border p-2">Frequency</td>
            <td className="border p-2">{viewData?.frequency}</td>
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
                  className="rounded-full cursor-not-allowed checked:bg-blue-400 checked:border-green-800 "
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
          <tr>
            <td className="border p-2">OMEGA DTHM (REFERRENCE EQUIPMENT)</td>
            <td colSpan={3} className="border p-2">{viewData?.dthm_temp} °C</td>
            <td colSpan={5} className="border p-2">{viewData?.dthm_rh} %RH</td>
          </tr>
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



      </div>
    </AuthenticatedLayout>
  );
}
