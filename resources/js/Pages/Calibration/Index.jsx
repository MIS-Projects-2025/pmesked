import { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";

export default function Index({ checklist }) {
    const [editingId, setEditingId] = useState(null);
    const [editRow, setEditRow] = useState({});
    const [selected, setSelected] = useState(null);
    const [viewData, setViewData] = useState([]);

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

    return (
        <AuthenticatedLayout>
            <Head title="PM Checklist Activities" />

            <div className="card border rounded-lg shadow">
                <div className="card-header bg-gray-100 p-3 flex justify-between">
                    <h3 className="font-bold text-gray-700">
                        <i className="fab fa-slack mr-1"></i> PM Checklist Activities
                    </h3>
                    <button
                        className="btn bg-green-500 hover:bg-green-700 text-white"
                        onClick={() => router.visit(route("calibration.create"))}
                    >
                        <i className="fas fa-plus"></i> Add New
                    </button>
                </div>

                <div className="card-body">
                    <table className="table table-bordered text-center w-full">
                        <thead className="bg-gray-200 text-gray-700">
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

           {/* Modal */}
{selected && (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
        <div className="bg-white rounded-lg w-[95%] max-w-6xl p-5 shadow-lg max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center border-b pb-2 mb-3">
                <h5 className="font-semibold text-gray-700 text-base md:text-lg">
                    <i className="fas fa-tasks"></i> Checklist Details (
                    {selected.platform} - {selected.manufacturer})
                </h5>
                <button
                    className="text-red-500 hover:text-red-700 text-xl"
                    onClick={() => setSelected(null)}
                >
                    ✕
                </button>
            </div>

            {/* Responsive Table */}
            <div className="overflow-x-auto">
                <table className="table-auto border-collapse border border-gray-300 w-full text-sm md:text-base">
                    <thead className="bg-gray-200 text-gray-700">
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
                    // --- EDIT MODE ---
                    <>
                        <td className="border px-3 py-2">
                            <input
                                type="text"
                                value={editRow.assy_item}
                                onChange={(e) =>
                                    setEditRow({ ...editRow, assy_item: e.target.value })
                                }
                                className="border p-1 w-full"
                            />
                        </td>
                        <td className="border px-3 py-2">
                            <input
                                type="text"
                                value={editRow.description}
                                onChange={(e) =>
                                    setEditRow({ ...editRow, description: e.target.value })
                                }
                                className="border p-1 w-full"
                            />
                        </td>
                        <td className="border px-3 py-2">
                            <input
                                type="text"
                                value={editRow.requirements}
                                onChange={(e) =>
                                    setEditRow({ ...editRow, requirements: e.target.value })
                                }
                                className="border p-1 w-full"
                            />
                        </td>
                        <td className="border px-3 py-2">
                            <input
                                type="text"
                                value={editRow.activity_1}
                                onChange={(e) =>
                                    setEditRow({ ...editRow, activity_1: e.target.value })
                                }
                                className="border p-1 w-full"
                            />
                        </td>
                        <td className="border px-3 py-2">
                            <input
                                type="text"
                                value={editRow.activity_2}
                                onChange={(e) =>
                                    setEditRow({ ...editRow, activity_2: e.target.value })
                                }
                                className="border p-1 w-full"
                            />
                        </td>
                        <td className="border px-3 py-2 text-center">
                            <button
    className="bg-green-500 hover:bg-green-700 text-white text-xs px-2 py-1 rounded mr-2"
    onClick={() => {
        router.put(
            route("calibration.update", item.id),
            editRow,
            {
                onSuccess: () => {
                    alert("✅ Updated successfully!");
                    setEditingId(null);

                    // ✅ Refresh the page or data
                    // router.reload(); // inertia reload
                    // OR kung gusto mo full browser reload:
                    window.location.reload();
                },
                onError: () =>
                    alert("❌ Failed to update."),
            }
        );
    }}
>
    Save
</button>

                            <button
                                className="bg-gray-400 hover:bg-gray-600 text-white text-xs px-2 py-1 rounded"
                                onClick={() => setEditingId(null)}
                            >
                                Cancel
                            </button>
                        </td>
                    </>
                ) : (
                    // --- VIEW MODE ---
                    <>
                        <td className="border px-3 py-2">{item.assy_item}</td>
                        <td className="border px-3 py-2">{item.description}</td>
                        <td className="border px-3 py-2">{item.requirements}</td>
                        <td className="border px-3 py-2">{item.activity_1}</td>
                        <td className="border px-3 py-2">{item.activity_2}</td>
                        <td className="border px-3 py-2">
                            <div className="flex justify-left space-x-2">
                            <button
                                className="bg-blue-500 hover:bg-blue-700 text-white text-xs px-2 py-1 rounded mr-2"
                                onClick={() => {
                                    setEditingId(item.id);
                                    setEditRow(item);
                                }}
                            >
                                <i className="fas fa-edit"></i> Edit
                            </button>
                            <button
                                className="bg-red-500 hover:bg-red-700 text-white text-xs px-2 py-1 rounded"
                                onClick={() => {
                                    if (confirm("Are you sure you want to delete this item?")) {
                                        router.delete(route("calibration.destroy", item.id), {
                                            onSuccess: () => {
                                                alert("✅ Deleted successfully!");
                                                window.location.reload();
                                            },
                                            onError: () =>
                                                alert("❌ Failed to delete."),
                                        });
                                    }
                                }}
                            >
                                <i className="fas fa-trash"></i> Delete
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
        </div>
    </div>
)}

        </AuthenticatedLayout>
    );
}
