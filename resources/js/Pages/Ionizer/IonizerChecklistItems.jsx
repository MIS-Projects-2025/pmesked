import { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import DataTable from "@/Components/DataTable";
import { usePage, router } from "@inertiajs/react";

export default function ChecklistItems({ items }) {

const { flash } = usePage().props;

    {flash.success && (
  <div className="mb-3 p-2 bg-green-100 text-green-700 rounded">
    {flash.success}
  </div>
)}

  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);

  const [formData, setFormData] = useState({
    check_item: [],
    verification_reading: [],
    std_use_verification: [],
  });

  // 🟢 Open Add Modal
  const openAddModal = () => {
    setEditData(null);
    setFormData({
      check_item: [],
      verification_reading: [],
      std_use_verification: [],
    });
    setShowForm(true);
  };

  // 🟢 Open Edit Modal
  const openEditModal = (item) => {
    setEditData(item);
    setFormData({
      check_item: item.check_item || [],
      verification_reading: item.verification_reading || [],
      std_use_verification: item.std_use_verification || [],
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
          ? { assy_item: "", requirement: "", activity: "", comp: "" }
          : { parameter: "", value: "" },
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
    router.put(`/ionizer-checklist-items/${editData.id}`, formData, {
      onSuccess: () => {
        alert("✅ Updated!");
        setShowForm(false);
      },
    });
  } else {
    router.post("/ionizer-checklist-items", formData, {
      onSuccess: () => {
        alert("✅ Checklist Item created successfully!!");
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
        className="px-2 py-1 bg-amber-500 text-white rounded hover:bg-amber-700"
      ><i className="fa-regular fa-pen-to-square"></i> Edit
      </button>
    ),
  }));

  return (
    <AuthenticatedLayout>
      <div className="p-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-bold">Ionizer Checklist Items</h2>
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
          routeName={route("ionizer-items.index")}
          rowKey="id"
          sortBy="id"
          sortOrder="desc"
        />

        {/* Modal Form */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-5 rounded-lg shadow-lg w-[95%] md:max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-3 bg-gradient-to-r from-white to-gray-500 p-2 rounded">
                <h3 className="text-lg font-bold text-gray-700">
                  <i className="fas fa-info-circle mr-1 "></i>
                  {editData ? "Edit Ionizer Checklist Item" : "Add Ionizer Checklist Item"}
                </h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-red-500 hover:text-red-600 text-lg"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                {/* Check Item Table */}
                <h4 className="font-semibold mb-2 text-gray-600">Check Items</h4>
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
                        {["assy_item", "requirement", "activity"].map(
                          (key) => (
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
                                className="border p-1 w-full"
                              />
                            </td>
                          )
                        )}
                        <td>
                          <button
                            type="button"
                            onClick={() => removeRow("check_item", idx)}
                            className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 m-2 p-2"
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

                {/* Verification Reading Table */}
                <h4 className="font-semibold mb-2 text-gray-600">Verification Reading</h4>
                <table className="w-full border mb-4 text-gray-600">
                  <thead>
                    <tr className="bg-gray-200">
                      <th>Parameter</th>
                      <th>Specs Limit</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.verification_reading.map((row, idx) => (
                     <tr key={idx}>
                     {["parameter", "specs_value"].map((key) => (
                     <td key={key}>
                         {key === "specs_value" ? (
                            <select
                            value={row[key]}
                            onChange={(e) =>
                             handleRowChange("verification_reading", idx, key, e.target.value)
                            }
                             className="border p-1 w-full m-1"
                            >
                              <option value="">-- Select Specs --</option>
                            <option value="(<)±35 Volts">(&lt;)±35 Volts</option>
                            <option value="(<)3 Seconds">(&lt;)3 Seconds</option>
                         </select>
                        ) : (
                         <input
                             type="text"
                             value={row[key]}
                             onChange={(e) =>
                              handleRowChange("verification_reading", idx, key, e.target.value)
                             }
                             className="border p-1 w-full m-1"
                            />
                         )}
                        </td>
                    ))}
                     <td className="text-center">
                        <button
                        type="button"
                        onClick={() => removeRow("verification_reading", idx)}
                        className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 m-2 p-2"
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
                  onClick={() => addRow("verification_reading")}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded mb-4"
                >
                    <i className="fas fa-plus mr-1"></i>
                   Add Verification Reading
                </button>

                {/* Standard Use Verification Table */}
                <h4 className="font-semibold mb-2 text-gray-600">Standard Use for Verification</h4>
                <table className="w-full border mb-4 text-gray-600">
                  <thead>
                    <tr className="bg-gray-200">
                      <th>Description</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.std_use_verification.map((row, idx) => (
                      <tr key={idx}>
                        {["description"].map((key) => (
                          <td key={key}>
                            <input
                              type="text"
                              value={row[key]}
                              onChange={(e) =>
                                handleRowChange(
                                  "std_use_verification",
                                  idx,
                                  key,
                                  e.target.value
                                )
                              }
                               className="border p-1 w-full m-5"
                            />
                          </td>
                        ))}
                        <td className="text-center">
                          <button
                            type="button"
                            onClick={() =>
                              removeRow("std_use_verification", idx)
                            }
                            className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 m-2 p-2"
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
