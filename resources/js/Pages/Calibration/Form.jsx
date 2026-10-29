import { useState } from "react";
import { useForm, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/Components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/Components/ui/table";
import { Plus, X, ChevronLeft, ChevronRight, Save, AlertCircle, ClipboardList, Info } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/Components/ui/badge";

// Platform options as constant
const PLATFORM_OPTIONS = [
    { value: "", label: "-- Select Platform --" },
    { value: "Manual Tape & Reel", label: "Manual Tape & Reel" },
    { value: "V12", label: "V12" },
    { value: "ISMECA", label: "ISMECA" },
    { value: "ST60", label: "ST60" },
    { value: "BRANDING (DYSEC_DIPBR_SOLAS DUM-815)", label: "BRANDING (DYSEC_DIPBR_SOLAS DUM-815)" },
    { value: "MH3020", label: "MH3020" },
    { value: "LASER MARKING", label: "LASER MARKING" },
    { value: "HOPE SEIKI", label: "HOPE SEIKI" },
    { value: "HEPCO", label: "HEPCO" },
    { value: "BAKE OVEN", label: "BAKE OVEN" },
    { value: "G6L", label: "G6L" },
    { value: "VITROX TR3000i", label: "VITROX TR3000i" },
    { value: "VITROX TR1000i2000iTR3000i", label: "VITROX TR1000i2000iTR3000i" },
    { value: "HSI200", label: "HSI200" },
    { value: "HSI250", label: "HSI250" },
    { value: "HSI400T", label: "HSI400T" },
    { value: "HEXA", label: "HEXA" },
    { value: "AT28", label: "AT28" },
    { value: "AT128", label: "AT128" },
    { value: "AT268_AT468", label: "AT268_AT468" },
    { value: "AT8005", label: "AT8005" },
    { value: "MICROVISION_MV853A", label: "MICROVISION_MV853A" },
    { value: "MV883", label: "MV883" },
    { value: "MV996", label: "MV996" },
    { value: "ATS-1200 Leadcon", label: "ATS-1200 Leadcon" },
];

// Activity codes info
const ACTIVITY_CODES = [
    "A - Check",
    "B - Clean",
    "C - Lubricate",
    "D - Adjust",
    "E - Align",
    "F - Calibrate",
    "G - Modify",
    "H - Repair",
    "I - Replace",
    "J - Refill",
    "K - Drain",
    "L - Measure",
    "M - Scan/Disk Defragment",
    "N - Change Oil",
];

export default function Form({ platforms, manufacturers = [], auth }) {
    const { data, setData, post, processing, reset, errors } = useForm({
        created_by: auth?.user?.id || "",
        platform: "",
        manufacturer: "",
        checklistGroups: [],
    });

    const [step, setStep] = useState(1);

    // Helper function to update nested state
    const updateGroup = (groupId, updates) => {
        setData(
            "checklistGroups",
            data.checklistGroups.map((g) =>
                g.id === groupId ? { ...g, ...updates } : g
            )
        );
    };

    // Helper function to update row in a group
    const updateRow = (groupId, rowIndex, updates) => {
        setData(
            "checklistGroups",
            data.checklistGroups.map((g) =>
                g.id === groupId
                    ? {
                          ...g,
                          rows: g.rows.map((row, idx) =>
                              idx === rowIndex ? { ...row, ...updates } : row
                          ),
                      }
                    : g
            )
        );
    };

    // Add new assembly group
    const addGroup = () => {
        setData("checklistGroups", [
            ...data.checklistGroups,
            {
                id: Date.now(),
                assy_item: "",
                rows: [
                    {
                        description: "",
                        requirements: "",
                        activity_1: "",
                        activity_2: "",
                    },
                ],
            },
        ]);
    };

    // Add new row inside group
    const addRow = (groupId) => {
        updateGroup(groupId, {
            rows: [
                ...data.checklistGroups.find((g) => g.id === groupId)?.rows,
                {
                    description: "",
                    requirements: "",
                    activity_1: "",
                    activity_2: "",
                },
            ],
        });
    };

    // Remove row
    const removeRow = (groupId, rowIdx) => {
        updateGroup(groupId, {
            rows: data.checklistGroups
                .find((g) => g.id === groupId)
                ?.rows.filter((_, i) => i !== rowIdx),
        });
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

        // Validate at least one group exists
        if (data.checklistGroups.length === 0) {
            toast.error("Please add at least one assembly group");
            return;
        }

        // Validate all groups have assy_item
        const invalidGroups = data.checklistGroups.filter((g) => !g.assy_item?.trim());
        if (invalidGroups.length > 0) {
            toast.error("All assembly groups must have an Assembly Item");
            return;
        }

        post(route("calibration.store"), {
            onSuccess: () => {
                toast.success("Checklist saved successfully!");
                router.visit(route("calibration.index"));
            },
            onError: (err) => {
                toast.error("Failed to save checklist. Please check your inputs.");
                console.error("Save error:", err);
            },
        });
    };

    // Step 1: Platform & Manufacturer
    const renderStep1 = () => (
        <Card className="border border-gray-200 dark:border-gray-800 shadow-sm">
            <CardHeader className="p-8 pb-4">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                        <ClipboardList className="h-8 w-8 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-bold">
                            Step 1: Platform & Manufacturer
                        </CardTitle>
                        <CardDescription className="text-lg mt-1">
                            Please select the platform and manufacturer for this checklist
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-8 pt-4 space-y-8">
                <div className="space-y-6">
                    <div>
                        <label className="text-sm font-semibold flex items-center gap-2 mb-3 text-gray-700 dark:text-gray-200">
                            <span className="text-red-500">*</span>
                            Platform
                        </label>
                        <Select
                            value={data.platform}
                            onValueChange={(value) => setData("platform", value)}
                            required
                        >
                            <SelectTrigger className="w-full border-2 border-gray-300 dark:border-gray-700 focus:border-gray-500 focus:ring-2 focus:ring-gray-200">
                                <SelectValue placeholder="Select Platform" />
                            </SelectTrigger>
                            <SelectContent className="max-h-80">
                                {PLATFORM_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value} className="py-2">
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.platform && (
                            <p className="text-sm text-red-500 flex items-center gap-1 mt-2">
                                <AlertCircle className="h-4 w-4" />
                                {errors.platform}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="text-sm font-semibold flex items-center gap-2 mb-3 text-gray-700 dark:text-gray-200">
                            <span className="text-red-500">*</span>
                            Manufacturer
                        </label>
                        <Select
                            value={data.manufacturer}
                            onValueChange={(value) => setData("manufacturer", value)}
                            required
                        >
                            <SelectTrigger className="w-full border-2 border-gray-300 dark:border-gray-700 focus:border-gray-500 focus:ring-2 focus:ring-gray-200">
                                <SelectValue placeholder="Select Manufacturer" />
                            </SelectTrigger>
                            <SelectContent className="max-h-80">
                                <SelectItem value="">-- Select Manufacturer --</SelectItem>
                                {manufacturers.map((m, i) => (
                                    <SelectItem key={i} value={m} className="py-2">
                                        {m}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.manufacturer && (
                            <p className="text-sm text-red-500 flex items-center gap-1 mt-2">
                                <AlertCircle className="h-4 w-4" />
                                {errors.manufacturer}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex justify-end pt-2">
                    <Button
                        type="button"
                        onClick={() => setStep(2)}
                        disabled={!data.platform || !data.manufacturer}
                        className="gap-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-2 border-gray-300 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        size="lg"
                    >
                        Next
                        <ChevronRight className="h-5 w-5" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );

    // Step 2: Checklist Items
    const renderStep2 = () => (
        <div className="space-y-8">
            <Card className="border border-gray-200 dark:border-gray-800 shadow-sm">
                <CardHeader className="p-8 pb-4">
                    <div className="flex items-center gap-5">
                        <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600 dark:text-gray-400">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                <polyline points="10 9 9 9 8 9"></polyline>
                            </svg>
                        </div>
                        <div>
                            <CardTitle className="text-2xl font-bold">
                                Step 2: Add Checklist Items
                            </CardTitle>
                            <CardDescription className="text-lg mt-1">
                                Create assembly groups and add checklist items with descriptions, requirements, and activities
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-8 pt-4">
                    {/* Activity Codes Reference */}
                    <Card className="mb-8 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800">
                        <CardContent className="p-6">
                            <div className="flex items-start gap-3">
                                <Info className="h-6 w-6 text-gray-600 dark:text-gray-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-200">Activity Code Reference</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {ACTIVITY_CODES.join(" | ")}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Assembly Groups */}
                    <div className="space-y-8">
                        {data.checklistGroups.map((group, groupIndex) => (
                            <Card
                                key={group.id}
                                className="border border-gray-300 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-300"
                            >
                                <CardHeader className="p-6 pb-4">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex-1">
                                            <Input
                                                placeholder="Assembly Item *"
                                                value={group.assy_item}
                                                onChange={(e) =>
                                                    updateGroup(group.id, {
                                                        assy_item: e.target.value,
                                                    })
                                                }
                                                required
                                                className="h-12 text-lg font-bold border-2 border-gray-300 dark:border-gray-700 focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeGroup(group.id)}
                                            className="ml-2 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6 pt-0">
                                    <Table>
                                        <TableHeader className="bg-gray-50 dark:bg-gray-900">
                                            <TableRow>
                                                <TableHead className="h-12 px-4 font-bold">Description *</TableHead>
                                                <TableHead className="h-12 px-4 font-bold">Requirements *</TableHead>
                                                <TableHead className="h-12 px-4 font-bold">Activity 1</TableHead>
                                                <TableHead className="h-12 px-4 font-bold">Activity 2</TableHead>
                                                <TableHead className="h-12 w-[70px]"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {group.rows.map((row, rowIdx) => (
                                                <TableRow
                                                    key={rowIdx}
                                                    className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                                                >
                                                    <TableCell className="px-4 py-4">
                                                        <Input
                                                            value={row.description}
                                                            onChange={(e) =>
                                                                updateRow(group.id, rowIdx, {
                                                                    description: e.target.value,
                                                                })
                                                            }
                                                            required
                                                            placeholder="Enter description"
                                                            className="border-2 border-gray-300 dark:border-gray-700 focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="px-4 py-4">
                                                        <Input
                                                            value={row.requirements}
                                                            onChange={(e) =>
                                                                updateRow(group.id, rowIdx, {
                                                                    requirements: e.target.value,
                                                                })
                                                            }
                                                            required
                                                            placeholder="Enter requirements"
                                                            className="border-2 border-gray-300 dark:border-gray-700 focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="px-4 py-4">
                                                        <Input
                                                            value={row.activity_1}
                                                            onChange={(e) =>
                                                                updateRow(group.id, rowIdx, {
                                                                    activity_1: e.target.value,
                                                                })
                                                            }
                                                            placeholder="Activity code"
                                                            className="border-2 border-gray-300 dark:border-gray-700 focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="px-4 py-4">
                                                        <Input
                                                            value={row.activity_2}
                                                            onChange={(e) =>
                                                                updateRow(group.id, rowIdx, {
                                                                    activity_2: e.target.value,
                                                                })
                                                            }
                                                            placeholder="Activity code"
                                                            className="border-2 border-gray-300 dark:border-gray-700 focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="px-4 py-4">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => removeRow(group.id, rowIdx)}
                                                            className="hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors p-2"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>

                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => addRow(group.id)}
                                        className="mt-6 gap-2 border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 px-5"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Add Row
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}

                        <Button
                            type="button"
                            onClick={addGroup}
                            className="w-full gap-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-2 border-gray-300 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 shadow-lg hover:shadow-xl transition-all duration-300"
                            size="lg"
                        >
                            <Plus className="h-5 w-5" />
                            <span className="font-semibold">Add Assembly Group</span>
                        </Button>
                    </div>

                    {/* Navigation */}
                    <div className="flex flex-wrap justify-between items-center gap-4 mt-10 pt-8 border-t border-gray-200 dark:border-gray-800">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setStep(1)}
                            className="gap-2 border-2 border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
                            size="lg"
                        >
                            <ChevronLeft className="h-5 w-5" />
                            Back
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing || data.checklistGroups.length === 0}
                            className="gap-2 bg-gray-700 dark:bg-gray-200 text-white dark:text-gray-800 hover:bg-gray-800 dark:hover:bg-gray-300 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            size="lg"
                        >
                            <Save className="h-5 w-5" />
                            {processing ? "Saving..." : "Save Checklist"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );

    return (
        <AuthenticatedLayout>
            <Head title="New Calibration Checklist" />
            <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
                {/* Header */}
                <div className="space-y-3">
                    <h1 className="text-4xl font-bold flex items-center gap-3">
                        <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                            <ClipboardList className="h-8 w-8 text-gray-600 dark:text-gray-400" />
                        </div>
                        Calibration Checklist
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Create a new calibration checklist with platform, manufacturer, and detailed checklist items
                    </p>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center gap-6 px-1">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 text-sm">
                            <div className={`px-4 py-1.5 rounded-full font-medium ${step >= 1 ? 'bg-gray-700 text-white dark:bg-gray-200 dark:text-gray-800' : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                                Step 1
                            </div>
                            <span className="text-muted-foreground">Platform & Manufacturer</span>
                        </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                        <div className="flex items-center gap-3 text-sm">
                            <div className={`px-4 py-1.5 rounded-full font-medium ${step >= 2 ? 'bg-gray-700 text-white dark:bg-gray-200 dark:text-gray-800' : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                                Step 2
                            </div>
                            <span className="text-muted-foreground">Checklist Items</span>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {step === 1 && renderStep1()}
                    {step === 2 && renderStep2()}
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
