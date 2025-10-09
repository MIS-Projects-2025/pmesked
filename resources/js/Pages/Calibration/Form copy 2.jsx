import { useState } from "react";
import { useForm, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";

export default function Form({ platforms, manufacturers, model, auth }) {
    const { data, setData, post, processing, reset } = useForm({
        created_by: auth?.user?.id || "", // kunin ID ng logged-in user
        platform: "",
        manufacturer: "",
        checklistGroups: [],
    });

    
    

    const [step, setStep] = useState(1);

    // Add new assembly group
    const addGroup = () => {
        setData("checklistGroups", [
            ...data.checklistGroups,
            {
                id: Date.now(),
                assy_item: "",
                rows: [
                    { description: "", requirements: "", activity_1: "", activity_2: "" },
                ],
            },
        ]);
    };

    // Add new row inside group
    const addRow = (groupId) => {
        setData(
            "checklistGroups",
            data.checklistGroups.map((g) =>
                g.id === groupId
                    ? {
                          ...g,
                          rows: [
                              ...g.rows,
                              { description: "", requirements: "", activity_1: "", activity_2: "" },
                          ],
                      }
                    : g
            )
        );
    };

    // Remove row
    const removeRow = (groupId, rowIdx) => {
        setData(
            "checklistGroups",
            data.checklistGroups.map((g) =>
                g.id === groupId
                    ? {
                          ...g,
                          rows: g.rows.filter((_, i) => i !== rowIdx),
                      }
                    : g
            )
        );
    };

    // Remove group
    const removeGroup = (groupId) => {
        setData(
            "checklistGroups",
            data.checklistGroups.filter((g) => g.id !== groupId)
        );
    };

    const handleSubmit = (e) => {
    e.preventDefault();
    post(route("calibration.store"), {
        onSuccess: () => {
            alert("✅ Checklist saved successfully!");
            router.visit(route("calibration.index")); // redirect to index page
        },
        onError: () => {
            alert("❌ Failed to save checklist. Please check your inputs.");
        },
    });
};


    return (
        <AuthenticatedLayout>
            <Head title="New Calibration Checklist" />
            <div className="max-w-10xl mx-auto bg-white p-6 rounded-xl shadow-md bg-gradient-to-r from-gray-600 to-black text-white rounded-t-2xl p-3">
                <form onSubmit={handleSubmit}>
                    {step === 1 && (
                        <div>
                            <h2 className="text-xl font-bold mb-4 text-white text-white">Step 1: Platform & Manufacturer</h2>

                            {/* Platform */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-white">Platform</label>
                                <select
                                    value={data.platform}
                                    onChange={(e) => setData("platform", e.target.value)}
                                    className="w-full border rounded p-2 text-gray-800"
                                    required
                                >
                                    <option value="">-- Select Platform --</option>
                                    {platforms.map((p, i) => (
                                        <option key={i} value={p}>
                                            {p}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Manufacturer */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-white">Manufacturer</label>
                                <select
                                    value={data.manufacturer}
                                    onChange={(e) => setData("manufacturer", e.target.value)}
                                    className="w-full border rounded p-2 text-gray-800"
                                    required
                                >
                                    <option value="">-- Select Manufacturer --</option>
                                    {manufacturers.map((m, i) => (
                                        <option key={i} value={m}>
                                            {m}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Model */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-white">Manufacturer</label>
                                <select
                                    value={data.model}
                                    onChange={(e) => setData("model", e.target.value)}
                                    className="w-full border rounded p-2 text-gray-800"
                                    required
                                >
                                    <option value="">-- Select Model --</option>
                                    {model.map((md, i) => (
                                        <option key={i} value={md}>
                                            {md}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <button
                                type="button"
                                onClick={() => setStep(2)}
                                className="bg-blue-600 text-white px-4 py-2 rounded"
                            >
                                Next →
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div>
                            <h2 className="text-xl font-bold mb-4 text-white">Step 2: Add Checklist Items</h2>
                            
                            <div className="text-center border-b pb-2 mb-4 bg-gradient-to-r from-gray-600 to-black text-white rounded-t-2xl">
                                <label
                                   className="block text-sm font-semibold mb-1"
                                    style={{
                                        fontSize: "13px",
                                        color: "white",
                                        fontWeight: "bold",
                                       textAlign: "center",
                                 }}
                                >
                                   Activity Code:
                                </label>
                                <h6
                                 style={{
                                        fontSize: "13px",
                                        color: "white",
                                        fontWeight: "bold",
                                       textAlign: "center",
                                 }}
                                >
                                  A - Check; / B - Clean; / C - Lubricate; / D - Adjust; / E - Align; / 
                                  F - Calibrate; / G - Modify; / H - Repair; / I - Replace; / J - Refill; / 
                                 K - Drain; / L - Measure; / M - Scan/Disk Defragment; / N - Change Oil;
                             </h6>
                            </div>

                            {/* Groups */}
                            {data.checklistGroups.map((group) => (
                                <div
                                    key={group.id}
                                    className="border rounded-lg p-4 mb-4 shadow-sm bg-white overflow-x-auto"
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <input
                                            type="text"
                                            placeholder="Assembly Item"
                                            value={group.assy_item}
                                            onChange={(e) =>
                                                setData(
                                                    "checklistGroups",
                                                    data.checklistGroups.map((g) =>
                                                        g.id === group.id
                                                            ? { ...g, assy_item: e.target.value }
                                                            : g
                                                    )
                                                )
                                            }
                                            className="border rounded p-2 flex-1 text-gray-500"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeGroup(group.id)}
                                            className="text-white bg-red-500 text-sm font-semibold border rounded px-2 py-1 ml-2"
                                        >
                                           <i className="fas fa-remove"></i>
                                        </button>
                                    </div>
                                <div
                                    className="border rounded-lg p-4 mb-4 shadow-sm bg-white overflow-x-auto"
                                >
                                    <table className="w-full border mb-3 text-center table-auto">
                                        <thead>
                                            <tr className="bg-gradient-to-r from-gray-600 to-black text-white rounded-t-2xl p-3">
                                                <th>Description</th>
                                                <th>Requirements</th>
                                                <th>Activity 1</th>
                                                <th>Activity 2</th>
                                                <th></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {group.rows.map((row, idx) => (
                                                <tr key={idx} className="text-sm text-gray-600">
                                                    <td>
                                                        <input
                                                            type="text"
                                                            value={row.description}
                                                            onChange={(e) => {
                                                                const newRows = [...group.rows];
                                                                newRows[idx].description = e.target.value;
                                                                setData(
                                                                    "checklistGroups",
                                                                    data.checklistGroups.map((g) =>
                                                                        g.id === group.id
                                                                            ? { ...g, rows: newRows }
                                                                            : g
                                                                    )
                                                                );
                                                            }}
                                                            className="border rounded p-1 w-full"
                                                            required
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="text"
                                                            value={row.requirements}
                                                            onChange={(e) => {
                                                                const newRows = [...group.rows];
                                                                newRows[idx].requirements = e.target.value;
                                                                setData(
                                                                    "checklistGroups",
                                                                    data.checklistGroups.map((g) =>
                                                                        g.id === group.id
                                                                            ? { ...g, rows: newRows }
                                                                            : g
                                                                    )
                                                                );
                                                            }}
                                                            className="border rounded p-1 w-full"
                                                            required
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="text"
                                                            value={row.activity_1}
                                                            onChange={(e) => {
                                                                const newRows = [...group.rows];
                                                                newRows[idx].activity_1 = e.target.value;
                                                                setData(
                                                                    "checklistGroups",
                                                                    data.checklistGroups.map((g) =>
                                                                        g.id === group.id
                                                                            ? { ...g, rows: newRows }
                                                                            : g
                                                                    )
                                                                );
                                                            }}
                                                            className="border rounded p-1 w-full"
                                                            required
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="text"
                                                            value={row.activity_2}
                                                            onChange={(e) => {
                                                                const newRows = [...group.rows];
                                                                newRows[idx].activity_2 = e.target.value;
                                                                setData(
                                                                    "checklistGroups",
                                                                    data.checklistGroups.map((g) =>
                                                                        g.id === group.id
                                                                            ? { ...g, rows: newRows }
                                                                            : g
                                                                    )
                                                                );
                                                            }}
                                                            className="border rounded p-1 w-full"
                                                        />
                                                    </td>
                                                    <td>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeRow(group.id, idx)}
                                                            className="text-white bg-red-500 text-sm font-semibold border rounded px-2 py-1 ml-2"
                                                        >
                                                           <i className="fas fa-remove"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <button
                                        type="button"
                                        onClick={() => addRow(group.id)}
                                        className="text-sm text-white mt-2 bg-blue-500 px-2 py-1 rounded hover:bg-blue-700"
                                    >
                                        <i className="fas fa-plus"></i> Add Row
                                    </button>
                                    </div>
                                </div>
                            ))}

                            <button
                                type="button"
                                onClick={addGroup}
                                className="mb-4 px-3 py-1 rounded text-sm text-white bg-green-400 font-semibold hover:bg-green-700"
                            >
                               <i className="fas fa-plus"></i> Add Assembly Group
                            </button>

                            <div className="flex justify-between">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="px-4 py-2 bg-gray-500 text-white rounded"
                                >
                                    <i className="fas fa-arrow-left"></i> Back
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-4 py-2 bg-green-600 text-white rounded"
                                >
                                    <i className="fas fa-save"></i> {processing ? "Saving..." : "Save"}
                                </button>
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
