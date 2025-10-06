import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useState } from "react";
import DataTable from "@/Components/DataTable";
import { router, usePage } from "@inertiajs/react";

export default function Index({ reports, filters, empData, items, templates, machines }) {
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

  // --- Default form values ---
  const defaultFormData = {
    control_no: "",
    description: "",
    serial: "",
    frequency: "",
    platform: "", // 🔑 add platform
    pm_date: formatDate(today),
    pm_due: formatDate(nextWeek),
    performed_by: empData?.emp_name || "",
    check_item: [],
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
    resetForm();
    setShowForm(true);
  };

  // --- Handle Platform Change ---
 // --- Handle Platform Change ---
const handlePlatformChange = (e) => {
  const platform = e.target.value;
  setFormData({ ...formData, platform });

  // hanapin template based on platform
  const template = templates.find((t) => t.platform === platform);

  if (template) {
    // parse items (baka stringified JSON pa)
    let parsedItems = [];
    try {
      parsedItems = Array.isArray(template.items)
        ? template.items
        : JSON.parse(template.items || "[]");
    } catch (err) {
      parsedItems = [];
    }

    const defaultCheckItems = parsedItems.map((ci, idx) => ({
      id: idx,
      assy_item: ci.assy_item ?? "",
      requirement: ci.requirement ?? "",
      activity: ci.activity ?? "",
      compliance: ci.compliance ?? 0,
      date: ci.date ?? "",
      remarks: ci.remarks ?? "",
    }));

    // parse std_use_verification (baka stringified JSON din)
    let parsedStd = [];
    try {
      parsedStd = Array.isArray(template.std_use_verification)
        ? template.std_use_verification
        : JSON.parse(template.std_use_verification || "[]");
    } catch (err) {
      parsedStd = [];
    }

    const defaultStdVerification = parsedStd.map((sv, idx) => ({
      id: idx,
      description: sv.description ?? "",
      instrument1: sv.instrument1 ?? "",
      instrument2: sv.instrument2 ?? "",
      instrument3: sv.instrument3 ?? "",
    }));

    setFormData((prev) => ({
      ...prev,
      check_item: defaultCheckItems,
      std_use_verification: defaultStdVerification,
    }));
  } else {
    setFormData((prev) => ({
      ...prev,
      check_item: [],
      std_use_verification: [],
    }));
  }
};

const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "control_no") {
      const machine = machines.find((m) => m.pmnt_no === value);
      if (machine) {
        setFormData({
          ...formData,
          control_no: value,
          serial: machine.serial,
          description: machine.company_rec_id,
          frequency: "Weekly",
          days: "",
        });
        setError("");
      } else {
        setFormData({
          ...formData,
          control_no: value,
          serial: "",
          description: "",
          performed_by: empData?.emp_name || "",
          frequency: "",
          days: "",
        });
        setError(`Machine "${value}" not found. Please add it first in the inventory.`);
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // --- Checklist Change Handler ---
  const handleChecklistChange = (index, field, value) => {
    const updated = [...formData.check_item];
    updated[index][field] = value;
    setFormData({ ...formData, check_item: updated });
  };

  // --- Submit Handler ---
  const handleSubmit = (e) => {
    e.preventDefault();

    if (editData) {
      router.put(`/non-tnr-checklists/${editData.id}`, formData, {
        onSuccess: () => {
          alert("✅ Successfully updated!");
          setShowForm(false);
        },
      });
    } else {
      router.post("/non-tnr-checklists", formData, {
        onSuccess: () => {
          alert("✅ Successfully saved!");
          setShowForm(false);
          window.location.reload();
        },
      });
    }
  };

  // Sa loob ng component
const openViewModal = (item) => {
    setViewData(item);
    setShowView(true);
};

// Data preparation for DataTable
const dataWithAction = reports?.data?.map((item) => ({
    ...item,
    action: (
        <button
            onClick={() => openViewModal(item)} // <- call arrow function here
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
            <i className="fas fa-eye"></i> View
        </button>
    ),
}));

const handleVerify = (id) => {
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


  
  // --- JSX ---
  return (
    <AuthenticatedLayout>
      <div className="p-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-bold">Non-TNR Checklist</h2>
          <button
            onClick={openAddModal}
            className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            + Add New
          </button>
        </div>

<DataTable
          columns={[
            { key: "platform", label: "Platform" },
            { key: "control_no", label: "Control No" },
            { key: "pm_date", label: "PM Date" },
            { key: "pm_due", label: "PM Due" },
            { key: "performed_by", label: "Performed By" },
            { key: "tech_sign", label: "Tech Verified" },
            { key: "qa_sign", label: "QA Verified" },
            { key: "senior_ee_sign", label: "PM Engineer" },
            { key: "action", label: "Action" }, // View button
          ]}
          data={dataWithAction}
          meta={{
            from: reports?.meta?.from ?? 0,
            to: reports?.meta?.to ?? 0,
            total: reports?.meta?.total ?? 0,
            links: reports?.links ?? [],
            currentPage: reports?.meta?.current_page ?? 1,
            lastPage: reports?.meta?.last_page ?? 1,
          }}
          filters={filters}
          rowKey="id"
          sortBy="id"
          sortOrder="desc"
        />



        {/* Add/Edit Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
            <div className="bg-white p-5 rounded-lg shadow-lg w-[95%] md:max-w-7xl overflow-y-auto max-h-[95vh]">
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
                <div className="flex gap-4">
                  <div className="flex-1">
                     <table className="w-full border text-sm text-gray-600 mb-4 rounded-lg">
                  <tbody>
                    <tr>
                      <td className="border p-2">Control No</td>
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
                     
                      <td className="border p-2">Serial</td>
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
                    </tr>
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
                      <td className="border p-2">Frequency</td>
                      <td className="border p-2">
                        <input
                          type="text"
                          name="frequency"
                          value={formData.frequency}
                          onChange={handleChange}
                          className="w-full border rounded p-1 bg-gray-100"
                          required
                        />
                      </td>
                    </tr>
                    <tr>
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
                      <td className="border p-2">Platform</td>
                      <td className="border p-2">
                        <select
                             name="platform"
                             value={formData.platform}
                            onChange={handlePlatformChange}
                             className="w-full border rounded p-2"
                         >
                         <option value="">-- Select Platform --</option>
                             {templates.map((tpl, idx) => (
                         <option key={idx} value={tpl.platform}>
                             {tpl.platform}
                        </option>
                      ))}
                    </select>
                        </td>
                    </tr>
                  </tbody>
                </table>
                  </div>
                </div>
                {/* Check Items Table */}
                {formData.check_item.length > 0 && (
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
                        {formData.check_item.map((row, index) => (
                          <tr key={index}>
                            <td className="border p-2">
                              <input
                                type="text"
                                value={row.assy_item}
                                onChange={(e) =>
                                  handleChecklistChange(
                                    index,
                                    "assy_item",
                                    e.target.value
                                  )
                                }
                                className="border p-1 rounded w-full"
                              />
                            </td>
                            <td className="border p-2">
                              <input
                                type="text"
                                value={row.requirement}
                                onChange={(e) =>
                                  handleChecklistChange(
                                    index,
                                    "requirement",
                                    e.target.value
                                  )
                                }
                                className="border p-1 rounded w-full"
                              />
                            </td>
                            <td className="border p-2">
                              <input
                                type="text"
                                value={row.activity}
                                onChange={(e) =>
                                  handleChecklistChange(
                                    index,
                                    "activity",
                                    e.target.value
                                  )
                                }
                                className="border p-1 rounded w-full"
                              />
                            </td>
                            <td className="border p-2 text-center">
                              <input
                                type="checkbox"
                                checked={row.compliance === 1}
                                onChange={(e) =>
                                  handleChecklistChange(
                                    index,
                                    "compliance",
                                    e.target.checked ? 1 : 0
                                  )
                                }
                              />
                            </td>
                            <td className="border p-2">
                              <input
                                type="date"
                                value={row.date}
                                onChange={(e) =>
                                  handleChecklistChange(
                                    index,
                                    "date",
                                    e.target.value
                                  )
                                }
                                className="border p-1 rounded w-full bg-amber-300"
                              />
                            </td>
                            <td className="border p-2">
                              <input
                                type="text"
                                value={row.remarks}
                                onChange={(e) =>
                                  handleChecklistChange(
                                    index,
                                    "remarks",
                                    e.target.value
                                  )
                                }
                                className="border p-1 rounded w-full"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}

                {/* Standard Use Verification */}
                {formData.std_use_verification &&
                  formData.std_use_verification.length > 0 && (
                    <>
                      <h3 className="font-bold text-violet-700">
                        Standard Use Verification
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
                          {formData.std_use_verification.map((sv, idx) => (
                            <tr key={idx}>
                              <td className="border p-2">
                                <input
                                  type="text"
                                  value={sv.description}
                                  onChange={(e) => {
                                    const updated = [
                                      ...formData.std_use_verification,
                                    ];
                                    updated[idx].description = e.target.value;
                                    setFormData({
                                      ...formData,
                                      std_use_verification: updated,
                                    });
                                  }}
                                  className="border p-1 rounded w-full text-right"
                                  style={{ textAlign: "right" }}
                                />
                              </td>
                              <td className="border p-2">
                                <input
                                  type="text"
                                  value={sv.instrument1}
                                  onChange={(e) => {
                                    const updated = [
                                      ...formData.std_use_verification,
                                    ];
                                    updated[idx].instrument1 = e.target.value;
                                    setFormData({
                                      ...formData,
                                      std_use_verification: updated,
                                    });
                                  }}
                                  className="border p-1 rounded w-full"
                                />
                              </td>
                              <td className="border p-2">
                                <input
                                  type="text"
                                  value={sv.instrument2}
                                  onChange={(e) => {
                                    const updated = [
                                      ...formData.std_use_verification,
                                    ];
                                    updated[idx].instrument2 = e.target.value;
                                    setFormData({
                                      ...formData,
                                      std_use_verification: updated,
                                    });
                                  }}
                                  className="border p-1 rounded w-full"
                                />
                              </td>
                              <td className="border p-2">
                                <input
                                  type="text"
                                  value={sv.instrument3}
                                  onChange={(e) => {
                                    const updated = [
                                      ...formData.std_use_verification,
                                    ];
                                    updated[idx].instrument3 = e.target.value;
                                    setFormData({
                                      ...formData,
                                      std_use_verification: updated,
                                    });
                                  }}
                                  className="border p-1 rounded w-full"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  )}

                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 bg-red-600 text-white rounded mr-2 hover:bg-red-700"
                  >
                    <i className="fa fa-times mr-2"></i>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    <i className="fa fa-save mr-2"></i>
                    {editData ? "Update" : "Save"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

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

<div className="flex justify-end mt-4 gap-2">
  {/* Verify Button */}
  <div>
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

      const canVerifyTech = isTech && !viewData.tech_sign;
      const canVerifyQA = isQA && viewData.tech_sign && !viewData.qa_sign;
      const canVerifySenior =
        isSenior && viewData.tech_sign && viewData.qa_sign && !viewData.senior_ee_sign;

      if (canVerifyTech || canVerifyQA || canVerifySenior) {
        return (
          <button
            onClick={() => handleVerify(viewData.id)}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            <i className="fas fa-check mr-2"></i> Verify
          </button>
        );
      }

      return (
        <button
          disabled
          className="px-4 py-2 bg-gray-300 text-gray-600 rounded cursor-not-allowed"
        >
          <i className="fas fa-lock mr-2"></i> Not Eligible to Verify
        </button>
      );
    })()}
  </div>

  {/* Close Button */}
  <button
    type="button"
    onClick={() => setShowView(false)}
    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
  >
    <i className="fa fa-times mr-2"></i> Close
  </button>
</div>

              {/* <div className="text-right">
                <button
                  type="button"
                  onClick={() => setShowView(false)}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  <i className="fa fa-times mr-2"></i> Close
                </button>
              </div> */}
            </div>
          </div>
        )}

      </div>
    </AuthenticatedLayout>
  );
}
