import { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/Components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/Components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/Components/ui/dialog";
import { Eye, Plus, Edit, Trash2, X, Check, AlertCircle, Search } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/Components/ui/badge";

export default function Index({ checklist = [] }) {
    const [selected, setSelected] = useState(null);
    const [viewData, setViewData] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [editRow, setEditRow] = useState({});
    const [newRow, setNewRow] = useState({
        assy_item: "",
        description: "",
        requirements: "",
        activity_1: "",
        activity_2: "",
    });
    const [searchQuery, setSearchQuery] = useState("");

    const filteredChecklist = checklist.filter(
        (item) =>
            item.platform.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.manufacturer.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleView = async (platform, manufacturer) => {
        setSelected({ platform, manufacturer });
        try {
            const response = await fetch(
                route("calibration.show", { platform, manufacturer }),
            );
            const data = await response.json();
            setViewData(data.items ?? []);
        } catch (err) {
            console.error("Failed to fetch data", err);
            toast.error("Failed to fetch checklist data");
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
            toast.error("Please fill in all required fields before adding");
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

        router.post(route("calibration.store"), payload, {
            onSuccess: () => {
                toast.success("Item added successfully!");
                setNewRow({
                    assy_item: "",
                    description: "",
                    requirements: "",
                    activity_1: "",
                    activity_2: "",
                });
                if (selected) {
                    handleView(selected.platform, selected.manufacturer);
                }
            },
            onError: () => toast.error("Failed to add item"),
        });
    };

    const handleEdit = (item) => {
        setEditingId(item.id);
        setEditRow(item);
    };

    const handleUpdate = () => {
        router.put(
            route("calibration.update", editingId),
            editRow,
            {
                onSuccess: () => {
                    toast.success("Updated successfully!");
                    setEditingId(null);
                    setEditRow({});
                    if (selected) {
                        handleView(selected.platform, selected.manufacturer);
                    }
                },
                onError: () => toast.error("Failed to update"),
            },
        );
    };

    const handleDelete = (id) => {
        if (confirm("Are you sure you want to delete this item?")) {
            router.delete(
                route("calibration.destroy", id),
                {
                    onSuccess: () => {
                        toast.success("Deleted successfully!");
                        if (selected) {
                            handleView(selected.platform, selected.manufacturer);
                        }
                    },
                    onError: () => toast.error("Failed to delete"),
                },
            );
        }
    };

    const handleCloseModal = () => {
        setSelected(null);
        setEditingId(null);
        setEditRow({});
    };

    return (
        <AuthenticatedLayout>
            <Head title="PM Checklist Activities" />

            <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Header Card */}
                <Card className="border border-gray-200 dark:border-gray-800 shadow-sm">
                    <CardHeader className="p-6 sm:p-8 pb-0">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                            <div className="min-w-0">
                                <CardTitle className="text-3xl font-bold flex items-center gap-4">
                                    <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shrink-0">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600 dark:text-gray-400">
                                            <path d="M9 12l2 2 4-4"></path>
                                            <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"></path>
                                            <path d="M12 18v-6"></path>
                                        </svg>
                                    </div>
                                    PM Checklist Activities
                                </CardTitle>
                                <CardDescription className="text-lg mt-3">
                                    Manage and view all calibration checklist items
                                </CardDescription>
                            </div>
                            <Button
                                onClick={() => router.visit(route("calibration.create"))}
                                className="gap-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-2 border-gray-300 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 shadow-sm hover:shadow-md transition-all duration-300 shrink-0"
                                size="lg"
                            >
                                <Plus className="h-5 w-5" />
                                <span className="font-semibold">Add New</span>
                            </Button>
                        </div>
                    </CardHeader>

                    {/* Search Bar */}
                    <CardContent className="p-6 sm:p-8 pt-6">
                        <div className="relative w-full max-w-xl">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <Input
                                placeholder="Search by platform or manufacturer..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-12 pl-12 pr-4 bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-700 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-800"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Main Table Card */}
                <Card className="border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-gray-50 dark:bg-gray-900">
                                <TableRow>
                                    <TableHead className="w-[80px] h-14 px-6 font-bold text-gray-700 dark:text-gray-200">#</TableHead>
                                    <TableHead className="h-14 px-6 font-bold text-gray-700 dark:text-gray-200">Platform</TableHead>
                                    <TableHead className="h-14 px-6 font-bold text-gray-700 dark:text-gray-200">Manufacturer</TableHead>
                                    <TableHead className="h-14 px-6 text-right font-bold text-gray-700 dark:text-gray-200">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredChecklist.length > 0 ? (
                                    filteredChecklist.map((row, index) => (
                                        <TableRow
                                            key={index}
                                            className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors duration-200"
                                        >
                                            <TableCell className="px-6 py-5 font-medium text-gray-500 dark:text-gray-400">
                                                {index + 1}
                                            </TableCell>
                                            <TableCell className="px-6 py-5 font-semibold">
                                                <Badge
                                                    variant="secondary"
                                                    className="font-bold px-4 py-1.5 rounded-full text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700"
                                                >
                                                    {row.platform}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="px-6 py-5 text-gray-600 dark:text-gray-300">
                                                {row.manufacturer}
                                            </TableCell>
                                            <TableCell className="px-6 py-5 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleView(row.platform, row.manufacturer)}
                                                    className="gap-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 px-4"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                    <span className="font-medium">View</span>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-5">
                                                <div className="p-5 bg-gray-100 dark:bg-gray-800 rounded-full">
                                                    <AlertCircle className="h-8 w-8 text-gray-400" />
                                                </div>
                                                <p className="text-gray-500 dark:text-gray-400 font-medium">
                                                    No checklist items found
                                                </p>
                                                {searchQuery && (
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => setSearchQuery("")}
                                                        className="gap-1 text-sm"
                                                    >
                                                        <X className="h-4 w-4" />
                                                        Clear search
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* View/Edit Modal */}
            <Dialog open={!!selected} onOpenChange={handleCloseModal}>
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-0 gap-0">
                    <DialogHeader className="border-b border-gray-200 dark:border-gray-800 px-8 py-6 space-y-3">
                        <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                            <div className="p-2.5 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600 dark:text-gray-400">
                                    <path d="M9 12l2 2 4-4"></path>
                                    <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"></path>
                                    <path d="M12 18v-6"></path>
                                </svg>
                            </div>
                            Checklist Details
                        </DialogTitle>
                        <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-3 pt-1">
                            <Badge variant="secondary" className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700 font-bold px-3 py-1 rounded-full">
                                {selected?.platform}
                            </Badge>
                            <span className="text-gray-400">-</span>
                            <Badge variant="secondary" className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700 font-medium px-3 py-1 rounded-full">
                                {selected?.manufacturer}
                            </Badge>
                        </div>
                    </DialogHeader>

                    {/* Checklist Table */}
                    <div className="space-y-6 px-8 py-6">
                        {viewData.length > 0 ? (
                            <Card className="border-0 shadow-sm">
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader className="bg-gray-50 dark:bg-gray-900">
                                            <TableRow>
                                                <TableHead className="h-12 px-4 font-bold">Assembly Item</TableHead>
                                                <TableHead className="h-12 px-4 font-bold">Description</TableHead>
                                                <TableHead className="h-12 px-4 font-bold">Requirements</TableHead>
                                                <TableHead className="h-12 px-4 font-bold">Activity 1</TableHead>
                                                <TableHead className="h-12 px-4 font-bold">Activity 2</TableHead>
                                                <TableHead className="h-12 px-4 text-right font-bold">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {viewData.map((item, idx) => (
                                                <TableRow
                                                    key={idx}
                                                    className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                                                >
                                                    {editingId === item.id ? (
                                                        <>
                                                            <TableCell>
                                                                <Input
                                                                    value={editRow.assy_item || ""}
                                                                    onChange={(e) =>
                                                                        setEditRow({
                                                                            ...editRow,
                                                                            assy_item: e.target.value,
                                                                        })
                                                                    }
                                                                    className="border-2 border-gray-400 dark:border-gray-600 focus:border-gray-600 focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-800"
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                <Input
                                                                    value={editRow.description || ""}
                                                                    onChange={(e) =>
                                                                        setEditRow({
                                                                            ...editRow,
                                                                            description: e.target.value,
                                                                        })
                                                                    }
                                                                    className="border-2 border-gray-400 dark:border-gray-600 focus:border-gray-600 focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-800"
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                <Input
                                                                    value={editRow.requirements || ""}
                                                                    onChange={(e) =>
                                                                        setEditRow({
                                                                            ...editRow,
                                                                            requirements: e.target.value,
                                                                        })
                                                                    }
                                                                    className="border-2 border-gray-400 dark:border-gray-600 focus:border-gray-600 focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-800"
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                <Input
                                                                    value={editRow.activity_1 || ""}
                                                                    onChange={(e) =>
                                                                        setEditRow({
                                                                            ...editRow,
                                                                            activity_1: e.target.value,
                                                                        })
                                                                    }
                                                                    className="border-2 border-gray-400 dark:border-gray-600 focus:border-gray-600 focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-800"
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                <Input
                                                                    value={editRow.activity_2 || ""}
                                                                    onChange={(e) =>
                                                                        setEditRow({
                                                                            ...editRow,
                                                                            activity_2: e.target.value,
                                                                        })
                                                                    }
                                                                    className="border-2 border-gray-400 dark:border-gray-600 focus:border-gray-600 focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-800"
                                                                />
                                                            </TableCell>
                                                            <TableCell className="text-right space-x-2">
                                                                <Button
                                                                    size="sm"
                                                                    onClick={handleUpdate}
                                                                    className="gap-1.5 bg-gray-700 text-white hover:bg-gray-800 dark:bg-gray-200 dark:text-gray-900 dark:hover:bg-gray-300"
                                                                >
                                                                    <Check className="h-4 w-4" />
                                                                    Save
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        setEditingId(null);
                                                                        setEditRow({});
                                                                    }}
                                                                >
                                                                    Cancel
                                                                </Button>
                                                            </TableCell>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <TableCell className="font-medium">{item.assy_item}</TableCell>
                                                            <TableCell>{item.description}</TableCell>
                                                            <TableCell>{item.requirements}</TableCell>
                                                            <TableCell className="space-x-2">
                                                                <Badge variant="secondary" className="font-mono bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700 px-2 py-1">
                                                                    {item.activity_1}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="space-x-2">
                                                                {item.activity_2 && (
                                                                    <Badge variant="secondary" className="font-mono bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700 px-2 py-1">
                                                                        {item.activity_2}
                                                                    </Badge>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="text-right space-x-2">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => handleEdit(item)}
                                                                    className="gap-1"
                                                                >
                                                                    <Edit className="h-4 w-4" />
                                                                    Edit
                                                                </Button>
                                                                <Button
                                                                    variant="destructive"
                                                                    size="sm"
                                                                    onClick={() => handleDelete(item.id)}
                                                                    className="gap-1"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                    Delete
                                                                </Button>
                                                            </TableCell>
                                                        </>
                                                    )}
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card className="border-dashed border-2 border-gray-200 dark:border-gray-700">
                                <CardContent className="py-12 text-center">
                                    <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full inline-block mb-4">
                                        <AlertCircle className="h-12 w-12 text-gray-400" />
                                    </div>
                                    <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">
                                        No records found
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Add New Row Section */}
                        {selected && (
                            <Card className="border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                                <CardHeader className="p-6 pb-4">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Plus className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                        <span className="text-gray-700 dark:text-gray-200">Add New Row</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 pt-0">
                                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                                        <Input
                                            placeholder="Assembly Item *"
                                            value={newRow.assy_item}
                                            onChange={(e) =>
                                                setNewRow({
                                                    ...newRow,
                                                    assy_item: e.target.value,
                                                })
                                            }
                                            className="border-2 border-gray-300 dark:border-gray-700 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-800"
                                        />
                                        <Input
                                            placeholder="Description *"
                                            value={newRow.description}
                                            onChange={(e) =>
                                                setNewRow({
                                                    ...newRow,
                                                    description: e.target.value,
                                                })
                                            }
                                            className="border-2 border-gray-300 dark:border-gray-700 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-800"
                                        />
                                        <Input
                                            placeholder="Requirements *"
                                            value={newRow.requirements}
                                            onChange={(e) =>
                                                setNewRow({
                                                    ...newRow,
                                                    requirements: e.target.value,
                                                })
                                            }
                                            className="border-2 border-gray-300 dark:border-gray-700 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-800"
                                        />
                                        <Input
                                            placeholder="Activity 1 *"
                                            value={newRow.activity_1}
                                            onChange={(e) =>
                                                setNewRow({
                                                    ...newRow,
                                                    activity_1: e.target.value,
                                                })
                                            }
                                            className="border-2 border-gray-300 dark:border-gray-700 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-800"
                                        />
                                        <Input
                                            placeholder="Activity 2"
                                            value={newRow.activity_2}
                                            onChange={(e) =>
                                                setNewRow({
                                                    ...newRow,
                                                    activity_2: e.target.value,
                                                })
                                            }
                                            className="border-2 border-gray-300 dark:border-gray-700 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-800"
                                        />
                                    </div>
                                    <div className="flex justify-end">
                                        <Button
                                            onClick={handleAddRow}
                                            className="gap-1.5 bg-gray-700 text-white hover:bg-gray-800 dark:bg-gray-200 dark:text-gray-900 dark:hover:bg-gray-300 shadow-sm hover:shadow-md transition-all duration-300 px-5"
                                        >
                                            <Plus className="h-4 w-4" />
                                            Add Row
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    <DialogFooter className="m-0 border-t border-gray-200 dark:border-gray-800 px-8 py-5 bg-gray-50 dark:bg-gray-900/50">
                        <Button
                            variant="outline"
                            onClick={handleCloseModal}
                            className="gap-2 border-2 border-gray-300 dark:border-gray-700 px-5"
                        >
                            <X className="h-4 w-4" />
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    );
}
