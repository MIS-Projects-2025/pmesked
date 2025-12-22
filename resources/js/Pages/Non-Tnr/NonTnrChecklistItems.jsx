import { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import DataTable from "@/Components/DataTable";
import { usePage, router } from "@inertiajs/react";

export default function NonTnrChecklistItems({ items }) {
  const { flash } = usePage().props;

  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);

  const [formData, setFormData] = useState({
    platform: "",
    check_item: [],
    std_use_verification: [], // optional pa rin kahit wala sa ibang checklist
    tool_life: [],
  });

  // 🔹 Platforms dropdown options
  const platforms = [
    "Bake Oven",
    "Vacuum Sealer",
    "VTEK Part Counter",
    "Strapping Machine",
    "Microscope",
    "Paper Gum Dispenser",
    "GPD Peel Back Force Tester",
    "VTEK Peel Back Force Tester",
    "Profile Projector",
    "Foot Impulse Stamping Machine (Manual Sealer)",
    "VR20 Reel Inspection Machine",
  ];

  // 🟢 Open Add Modal
  const openAddModal = () => {
    setEditData(null);
    setFormData({
      platform: "",
      check_item: [],
      std_use_verification: [],
      tool_life: [],
    });
    setShowForm(true);
  };

  // 🟢 Open Edit Modal
const openEditModal = (item) => {
  setEditData(item);
  setFormData({
    platform: item.platform || "",
    check_item: item.items ? JSON.parse(item.items) : [], // ← parse string to array
    std_use_verification: item.std_use_verification ? JSON.parse(item.std_use_verification) : [], // ← parse string to array
    tool_life: item.tool_life ? JSON.parse(item.tool_life) : [],
  });
  setShowForm(true);
};


  // 🟢 Add Row to JSON Table
  const addRow = (field) => {
    setFormData({
      ...formData,
      [field]: [
        ...formData[field],
        field === "check_item"
          ? { assy_item: "", requirement: "", activity: "" }
          : { description: "" },
      ],
    });
  };

  // 🟢 Handle Row Change
  const handleRowChange = (field, idx, key, value) => {
    const updated = [...formData[field]];
    updated[idx][key] = value;
    setFormData({ ...formData, [field]: updated });
  };

  // 🟢 Remove Row
  const removeRow = (field, idx) => {
    const updated = formData[field].filter((_, i) => i !== idx);
    setFormData({ ...formData, [field]: updated });
  };

  // 🟢 Submit Form
  const handleSubmit = (e) => {
    e.preventDefault();

    if (editData) {
      router.put(`/non-tnr-checklist-items/${editData.id}`, formData, {
        onSuccess: () => {
          alert("✅ Updated!");
          setShowForm(false);
        },
      });
    } else {
      router.post("/non-tnr-checklist-items", formData, {
        onSuccess: () => {
          alert("✅ Checklist Item created successfully!");
          window.location.reload();
          setShowForm(false);
        },
      });
    }
  };

  // 🟢 DataTable Rows
  const dataWithAction = items.data.map((item) => ({
    ...item,
    action: (
      <button
        onClick={() => openEditModal(item)}
        className="px-3 py-2 bg-amber-500 text-white rounded hover:bg-amber-700 border-2 border-amber-600"
      >
        <i className="fas fa-edit"></i> Edit
      </button>
    ),
  }));

  return (
    <AuthenticatedLayout>
      <div className="p-4">
        {flash.success && (
          <div className="mb-3 p-2 bg-green-100 text-green-700 rounded">
            {flash.success}
          </div>
        )}

        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-bold">Non-TNR Checklist Items</h2>
          <button
            onClick={openAddModal}
            className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            + Add New
          </button>
        </div>

        {/* DataTable */}
        <DataTable
          columns={[
            { key: "id", label: "ID" },
            { key: "platform", label: "Platform" },
            { key: "created_by", label: "Created By" },
            { key: "action", label: "Action" },
          ]}
          data={dataWithAction}
          meta={{
            from: items.from,
            to: items.to,
            total: items.total,
            links: items.links,
            currentPage: items.current_page,
            lastPage: items.last_page,
          }}
          routeName={route("non-tnr-items.index")}
          rowKey="id"
          sortBy="id"
          sortOrder="desc"
        />

        {/* Modal Form */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-5 rounded-lg shadow-lg w-[95%] md:max-w-6xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-3 bg-gradient-to-r from-white to-gray-500 p-2 rounded">
                <h3 className="text-lg font-bold text-gray-700">
                  <i className="fas fa-info-circle mr-1"></i>
                  {editData ? "Edit Non-TnR Checklist Item" : "Add Non-TnR Checklist Item"}
                </h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-red-500 hover:text-red-600 text-lg"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                {/* Platform */}
                <div className="mb-4">
                  <label className="block font-semibold text-gray-600 mb-1">
                    Platform
                  </label>
                  <select
                    value={formData.platform}
                    onChange={(e) =>
                      setFormData({ ...formData, platform: e.target.value })
                    }
                    className="border p-2 w-full text-gray-600 rounded"
                    required
                  >
                    <option value="">-- Select Platform --</option>
                    {platforms.map((p, idx) => (
                      <option key={idx} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Check Item Table */}
                <h4 className="font-semibold mb-2 text-gray-600">Check Items</h4>
                <div className="text-center my-3 bg-gradient-to-r from-white to-gray-500 text-cyan-900 rounded">
                  <h5 className="font-semibold p-2 pt-4"><i className="fa-solid fa-bars-staggered"></i> ACTIVITY CODE</h5>
                  <p className=" text-sm p-2 pb-4 ">
                   A - Check ; B - Clean ; C - Lubricant ; D - Adjust ; E - Align ; 
                   F - Calibrate ; G - Modify ; H - Repair ; I - Replace ; L - Measure
                  </p>
                </div>
                <table className="w-full border mb-4 text-gray-600">
                  <thead>
                    <tr className="bg-gray-200">
                      <th>Assembly Item</th>
                      <th>Requirement</th>
                      <th>Activity</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.check_item.map((row, idx) => (
                      <tr key={idx}>
                        {["assy_item", "requirement", "activity"].map((key) => (
                          <td key={key}>
                            <input
                              type="text"
                              value={row[key]}
                              onChange={(e) =>
                                handleRowChange(
                                  "check_item",
                                  idx,
                                  key,
                                  e.target.value
                                )
                              }
                              className="border p-1 w-full text-gray-600 rounded"
                            />
                          </td>
                        ))}
                        <td className="text-center">
                          <button
                            type="button"
                            onClick={() => removeRow("check_item", idx)}
                            className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 m-1"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button
                  type="button"
                  onClick={() => addRow("check_item")}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded mb-4"
                >
                  <i className="fas fa-plus mr-1"></i>
                  Add Check Item
                </button>

                {/* Standard Use Verification (Optional) */}
                <h4 className="font-semibold mb-2 text-gray-600">
                  Standard Use for Verification (Optional)
                </h4>
                <table className="w-full border mb-4 text-gray-600">
                  <thead>
                    <tr className="bg-gray-200">
                      <th>Description</th>
                      <th className="w-1/12">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.std_use_verification.map((row, idx) => (
                      <tr key={idx} className="w-1/12">
                        <td>
                          <input
                            type="text"
                            value={row.description}
                            onChange={(e) =>
                              handleRowChange(
                                "std_use_verification",
                                idx,
                                "description",
                                e.target.value
                              )
                            }
                            className="border p-1 w-full rounded"
                          />
                        </td>
                        <td className="text-right pr-7">
                          <button
                            type="button"
                            onClick={() =>
                              removeRow("std_use_verification", idx)
                            }
                            className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 m-1"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button
                  type="button"
                  onClick={() => addRow("std_use_verification")}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded mb-4"
                >
                  <i className="fas fa-plus mr-1"></i>
                  Add Standard
                </button>

                {/* Tool Life */}
<h4 className="font-semibold mb-2 text-gray-600">
  Tool Life
</h4>
<table className="w-full border mb-4 text-gray-600">
  <thead>
    <tr className="bg-gray-200">
      <th>Description</th>
      <th className="w-1/12">Action</th>
    </tr>
  </thead>
  <tbody>
    {formData.tool_life.map((row, idx) => (
      <tr key={idx} className="w-1/12">
        <td>
          <input
            type="text"
            value={row.description}
            onChange={(e) =>
              handleRowChange(
                "tool_life",
                idx,
                "description",
                e.target.value
              )
            }
            className="border p-1 w-full rounded"
          />
        </td>
        <td className="text-right pr-7">
          <button
            type="button"
            onClick={() => removeRow("tool_life", idx)}
            className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 m-1"
          >
            <i className="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    ))}
  </tbody>
</table>
<button
  type="button"
  onClick={() => addRow("tool_life")}
  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded mb-4"
>
  <i className="fas fa-plus mr-1"></i>
  Add Tool Life
</button>


                {/* Submit */}
                <div className="mt-4 text-right">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    <i className="fas fa-save mr-1"></i>
                    {editData ? "Update" : "Save"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
