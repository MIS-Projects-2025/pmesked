import { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";

export default function Index({ checklist }) {
    const [editingId, setEditingId] = useState(null);
    const [editRow, setEditRow] = useState({});
    const [selected, setSelected] = useState(null);
    const [viewData, setViewData] = useState([]);
    const [newRow, setNewRow] = useState({
        assy_item: "",
        description: "",
        requirements: "",
        activity_1: "",
        activity_2: "",
    });

    const handleView = async (platform, manufacturer) => {
        setSelected({ platform, manufacturer });
        try {
            const response = await fetch(
                route("calibration.show", { platform, manufacturer })
            );
            const data = await response.json();
            setViewData(data.items ?? []);
        } catch (err) {
            console.error("Failed to fetch data", err);
            setViewData([]);
        }
    };

    const handleAddRow = () => {
        if (
            !newRow.assy_item ||
            !newRow.description ||
            !newRow.requirements ||
            !newRow.activity_1
        ) {
            alert("⚠️ Please fill in all required fields before adding.");
            return;
        }

        const payload = {
            platform: selected.platform,
            manufacturer: selected.manufacturer,
            checklistGroups: [
                {
                    assy_item: newRow.assy_item,
                    rows: [
                        {
                            description: newRow.description,
                            requirements: newRow.requirements,
                            activity_1: newRow.activity_1,
                            activity_2: newRow.activity_2,
                        },
                    ],
                },
            ],
        };

        if (!confirm("Are you sure you want to add this item?")) return;

        router.post(route("calibration.store"), payload, {
            onSuccess: () => {
                alert("✅ Item added successfully!");
                window.location.reload();
            },
            onError: () => alert("❌ Failed to add item."),
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="PM Checklist Activities" />

            <div className="card border rounded-lg shadow">
                <div className="card-header bg-gray-100 p-3 flex justify-between bg-gradient-to-r from-gray-600 to-black text-white rounded-t-2xl">
                    <h3 className="font-bold text-gray-700 text-white mt-2 ml-2">
                        <i className="fab fa-slack mr-1"></i> PM Checklist Activities
                    </h3>
                    <button
                        className="btn bg-green-500 hover:bg-green-700 text-white"
                        onClick={() => router.visit(route("calibration.create"))}
                    >
                        <i className="fas fa-plus"></i> Add New
                    </button>
                </div>

                <div className="card-body w-full overflow-x-auto">
                    <table className="min-w-full border text-center text-sm">
                        <thead className="bg-gradient-to-r from-gray-600 to-black text-white rounded-t-2xl">
                            <tr>
                                <th>#</th>
                                <th>Platform</th>
                                <th>Manufacturer</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(checklist ?? []).map((row, index) => (
                                <tr key={index}>
                                    <td>{index + 1}</td>
                                    <td>{row.platform}</td>
                                    <td>{row.manufacturer}</td>
                                    <td>
                                        <button
                                            className="btn btn-sm bg-gray-500 hover:bg-gray-700 text-white mr-2"
                                            onClick={() =>
                                                handleView(row.platform, row.manufacturer)
                                            }
                                        >
                                            <i className="fas fa-eye"></i> View
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal for Checklist View */}
            {selected && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white rounded-lg w-[95%] max-w-6xl p-5 shadow-lg max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="flex justify-between items-center border-b pb-2 mb-3 bg-gradient-to-r from-gray-600 to-black text-white rounded-t-2xl">
                            <h5 className="font-semibold text-white text-base md:text-lg mt-2 ml-2">
                                <i className="fas fa-tasks"></i> Checklist Details (
                                {selected.platform} - {selected.manufacturer})
                            </h5>
                            <button
                                className="text-red-400 hover:text-red-700 text-xl mr-3 font-bold"
                                onClick={() => setSelected(null)}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="table-auto border-collapse border border-gray-300 w-full text-sm md:text-base">
                                <thead className="bg-gradient-to-r from-gray-600 to-black text-white rounded-t-2xl">
                                    <tr>
                                        <th className="border px-3 py-2">Assembly Item</th>
                                        <th className="border px-3 py-2">Description</th>
                                        <th className="border px-3 py-2">Requirements</th>
                                        <th className="border px-3 py-2">Activity 1</th>
                                        <th className="border px-3 py-2">Activity 2</th>
                                        <th className="border px-3 py-2">Actions</th>
                                    </tr>
                                </thead>

                                <tbody className="text-gray-600">
                                    {viewData.length > 0 ? (
                                        viewData.map((item, idx) => (
                                            <tr key={idx}>
                                                {editingId === item.id ? (
                                                    <>
                                                        <td className="border px-3 py-2">
                                                            <input
                                                                type="text"
                                                                value={editRow.assy_item}
                                                                onChange={(e) =>
                                                                    setEditRow({
                                                                        ...editRow,
                                                                        assy_item: e.target.value,
                                                                    })
                                                                }
                                                                className="border p-1 w-full"
                                                            />
                                                        </td>
                                                        <td className="border px-3 py-2">
                                                            <input
                                                                type="text"
                                                                value={editRow.description}
                                                                onChange={(e) =>
                                                                    setEditRow({
                                                                        ...editRow,
                                                                        description:
                                                                            e.target.value,
                                                                    })
                                                                }
                                                                className="border p-1 w-full"
                                                            />
                                                        </td>
                                                        <td className="border px-3 py-2">
                                                            <input
                                                                type="text"
                                                                value={editRow.requirements}
                                                                onChange={(e) =>
                                                                    setEditRow({
                                                                        ...editRow,
                                                                        requirements:
                                                                            e.target.value,
                                                                    })
                                                                }
                                                                className="border p-1 w-full"
                                                            />
                                                        </td>
                                                        <td className="border px-3 py-2">
                                                            <input
                                                                type="text"
                                                                value={editRow.activity_1}
                                                                onChange={(e) =>
                                                                    setEditRow({
                                                                        ...editRow,
                                                                        activity_1:
                                                                            e.target.value,
                                                                    })
                                                                }
                                                                className="border p-1 w-full"
                                                            />
                                                        </td>
                                                        <td className="border px-3 py-2">
                                                            <input
                                                                type="text"
                                                                value={editRow.activity_2}
                                                                onChange={(e) =>
                                                                    setEditRow({
                                                                        ...editRow,
                                                                        activity_2:
                                                                            e.target.value,
                                                                    })
                                                                }
                                                                className="border p-1 w-full"
                                                            />
                                                        </td>
                                                        <td className="border px-3 py-2 text-center">
                                                            <button
                                                                className="bg-green-500 hover:bg-green-700 text-white text-xs px-2 py-1 rounded mr-2"
                                                                onClick={() => {
                                                                    router.put(
                                                                        route(
                                                                            "calibration.update",
                                                                            item.id
                                                                        ),
                                                                        editRow,
                                                                        {
                                                                            onSuccess: () => {
                                                                                alert(
                                                                                    "✅ Updated successfully!"
                                                                                );
                                                                                setEditingId(null);
                                                                                window.location.reload();
                                                                            },
                                                                            onError: () =>
                                                                                alert(
                                                                                    "❌ Failed to update."
                                                                                ),
                                                                        }
                                                                    );
                                                                }}
                                                            >
                                                                Save
                                                            </button>

                                                            <button
                                                                className="bg-gray-400 hover:bg-gray-600 text-white text-xs px-2 py-1 rounded"
                                                                onClick={() =>
                                                                    setEditingId(null)
                                                                }
                                                            >
                                                                Cancel
                                                            </button>
                                                        </td>
                                                    </>
                                                ) : (
                                                    <>
                                                        <td className="border px-3 py-2">
                                                            {item.assy_item}
                                                        </td>
                                                        <td className="border px-3 py-2">
                                                            {item.description}
                                                        </td>
                                                        <td className="border px-3 py-2">
                                                            {item.requirements}
                                                        </td>
                                                        <td className="border px-3 py-2">
                                                            {item.activity_1}
                                                        </td>
                                                        <td className="border px-3 py-2">
                                                            {item.activity_2}
                                                        </td>
                                                        <td className="border px-3 py-2">
                                                            <div className="flex justify-left space-x-2">
                                                                <button
                                                                    className="bg-blue-500 hover:bg-blue-700 text-white text-xs px-2 py-1 rounded mr-2"
                                                                    onClick={() => {
                                                                        setEditingId(item.id);
                                                                        setEditRow(item);
                                                                    }}
                                                                >
                                                                    <i className="fas fa-edit"></i>{" "}
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    className="bg-red-500 hover:bg-red-700 text-white text-xs px-2 py-1 rounded"
                                                                    onClick={() => {
                                                                        if (
                                                                            confirm(
                                                                                "Are you sure you want to delete this item?"
                                                                            )
                                                                        ) {
                                                                            router.delete(
                                                                                route(
                                                                                    "calibration.destroy",
                                                                                    item.id
                                                                                ),
                                                                                {
                                                                                    onSuccess:
                                                                                        () => {
                                                                                            alert(
                                                                                                "✅ Deleted successfully!"
                                                                                            );
                                                                                            window.location.reload();
                                                                                        },
                                                                                    onError:
                                                                                        () =>
                                                                                            alert(
                                                                                                "❌ Failed to delete."
                                                                                            ),
                                                                                }
                                                                            );
                                                                        }
                                                                    }}
                                                                >
                                                                    <i className="fas fa-trash"></i>{" "}
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </>
                                                )}
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="text-gray-500 py-3">
                                                No records found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* ADD NEW ROW */}
                        <div className="mt-5 border-t pt-4">
                            <h4 className="font-semibold mb-2 text-gray-700">
                                ➕ New Row
                            </h4>
                            <div className="grid grid-cols-5 gap-2 mb-3 text-gray-500">
                                <input
                                    type="text"
                                    placeholder="Assembly Item"
                                    className="border p-2"
                                    value={newRow.assy_item}
                                    onChange={(e) =>
                                        setNewRow({
                                            ...newRow,
                                            assy_item: e.target.value,
                                        })
                                    }
                                />
                                <input
                                    type="text"
                                    placeholder="Description"
                                    className="border p-2"
                                    value={newRow.description}
                                    onChange={(e) =>
                                        setNewRow({
                                            ...newRow,
                                            description: e.target.value,
                                        })
                                    }
                                />
                                <input
                                    type="text"
                                    placeholder="Requirements"
                                    className="border p-2"
                                    value={newRow.requirements}
                                    onChange={(e) =>
                                        setNewRow({
                                            ...newRow,
                                            requirements: e.target.value,
                                        })
                                    }
                                />
                                <input
                                    type="text"
                                    placeholder="Activity 1"
                                    className="border p-2"
                                    value={newRow.activity_1}
                                    onChange={(e) =>
                                        setNewRow({
                                            ...newRow,
                                            activity_1: e.target.value,
                                        })
                                    }
                                />
                                <input
                                    type="text"
                                    placeholder="Activity 2"
                                    className="border p-2"
                                    value={newRow.activity_2}
                                    onChange={(e) =>
                                        setNewRow({
                                            ...newRow,
                                            activity_2: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <button
                                className="bg-green-500 hover:bg-green-700 text-white px-4 py-2 rounded"
                                onClick={handleAddRow}
                            >
                                <i className="fas fa-plus-circle"></i> Add Row
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
