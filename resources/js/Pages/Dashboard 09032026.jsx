import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, usePage } from "@inertiajs/react";
import { useState } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    ClipboardList,
    Eye,
    Wrench,
    CheckCircle2,
    ArrowLeft,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Parse WW format (e.g. "WW501") into a Date (start of that week).
// IMPORTANT: build the base date from local Y/M/D components, NOT from a
// "YYYY-MM-DD" string. `new Date("2024-11-03")` is parsed as UTC midnight,
// which silently shifts by a day for anyone west of UTC (e.g. PH is fine,
// but this kept the door open for bugs depending on server/browser TZ).
const parseWWToDate = (ww) => {
    if (!ww || typeof ww !== "string" || !ww.startsWith("WW")) return null;
    const weekNum = parseInt(ww.slice(2), 10);
    if (isNaN(weekNum)) return null;
    const baseWeek = 501;
    const baseDate = new Date(2024, 10, 3); // Nov 3, 2024, local time
    const diffWeeks = weekNum - baseWeek;
    const result = new Date(baseDate);
    result.setDate(baseDate.getDate() + diffWeeks * 7);
    return result;
};

// Local YYYY-MM-DD key. Using toISOString() here (as the original code did)
// converts to UTC first, which can make "today" compare as a different day
// depending on the time of day / timezone. This stays in local time.
const toDateKey = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
};

const isDueToday = (ww) => {
    const dueDate = parseWWToDate(ww);
    if (!dueDate) return false;
    return toDateKey(dueDate) === toDateKey(new Date());
};

const isOverdue = (ww) => {
    const dueDate = parseWWToDate(ww);
    if (!dueDate) return false;
    return toDateKey(dueDate) < toDateKey(new Date());
};

// Guards against malformed/empty JSON columns instead of letting
// JSON.parse() throw and crash the modal.
const safeJsonParse = (value, fallback = []) => {
    if (!value) return fallback;
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : fallback;
    } catch {
        return fallback;
    }
};

const CARD_COLOR_CLASSES = {
    stone: "bg-stone-100 text-stone-500 hover:bg-stone-200",
    orange: "bg-orange-100 text-orange-500 hover:bg-orange-200",
    blue: "bg-blue-100 text-blue-500 hover:bg-blue-200",
    yellow: "bg-yellow-100 text-yellow-500 hover:bg-yellow-200",
    red: "bg-red-100 text-red-500 hover:bg-red-200",
    green: "bg-green-100 text-green-500 hover:bg-green-200",
    purple: "bg-purple-100 text-purple-500 hover:bg-purple-200",
};

// ---------------------------------------------------------------------------
// Small reusable pieces
// ---------------------------------------------------------------------------

function SummaryCard({ label, value, color = "stone", onClick }) {
    return (
        <Card
            onClick={onClick}
            className={`text-center transition-colors border-none shadow ${
                CARD_COLOR_CLASSES[color] ?? ""
            } ${onClick ? "cursor-pointer" : ""}`}
        >
            <CardContent className="pt-6">
                <h2 className="text-2xl font-bold">{value}</h2>
                <p className="text-sm opacity-80">{label}</p>
            </CardContent>
        </Card>
    );
}

// Used for both EE and QA roles — previously this was two near-identical
// copy-pasted <BarChart> blocks (one even had a stray <p> tag rendered
// inside the chart itself, which recharts can't handle as a child).
function NonTnrApprovalBarChart({ data }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base font-semibold text-gray-600">
                    Non-TNR Cal Reports for Approval
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={data}>
                        <XAxis dataKey="name" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar
                            dataKey="value"
                            radius={[8, 8, 0, 0]}
                            label={{ position: "top" }}
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={
                                        entry.name === "For Approval"
                                            ? "#515257"
                                            : "#FACC15"
                                    }
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}

// Renamed from "non-TNR PM Checklist Status": this data comes from
// scheduler_tbl (senior_ee_ack / qa_ack), which IS the TNR scheduler — the
// old label called it "non-TNR" which was backwards.
function TnrAckPieChart({ data }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base font-semibold text-gray-600">
                    TNR PM Acknowledgement Status
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            outerRadius={90}
                            dataKey="value"
                            label={({ name, value }) => `${name}: ${value}`}
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={
                                        entry.name === "For Approval"
                                            ? "#f78940"
                                            : "#FACC15"
                                    }
                                />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}

function ReadOnlyField({ label, value }) {
    return (
        <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {label.replace(/_/g, " ")}
            </Label>
            <Input value={value || ""} readOnly className="mt-1 bg-gray-50" />
        </div>
    );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function Dashboard(props) {
    const { emp_data } = usePage().props;

    const QAforApprovalcalReportsCount =
        props.QAforApprovalcalReportsCount ?? 0;
    const EEforApprovalcalReportsCount =
        props.EEforApprovalcalReportsCount ?? 0;
    const calibrationReportsCount = props.calibrationReportsCount ?? 0;
    const seniortechAck = props.seniortechAck ?? 0;
    const esdAck = props.esdAck ?? 0;
    const senioreeAck = props.senioreeAck ?? 0;
    const dueSoon = props.dueSoon ?? 0;
    const overdue = props.overdue ?? 0;
    const tnrCompleted = props.tnrCompleted ?? 0;

    const eeCalVerifierStatus = props.eeCalVerifierStatus ?? [];
    const qaCalVerifierStatus = props.qaCalVerifierStatus ?? [];
    const eeVerifierStatus = props.eeVerifierStatus ?? [];
    const qaVerifierStatus = props.qaVerifierStatus ?? [];

    const checklistStatus = props.checklistStatus ?? [];
    const latestReports = props.latestReports ?? [];
    const dueTodayReports = props.dueTodayReports ?? [];
    const overdueReports = props.overdueReports ?? [];
    const completedSchedulers = props.completedSchedulers ?? [];

    // Job groups
    const qaJobs = ["esd"];
    const eeJobs = ["superadmin", "admin", "engineer"];
    const combinedJobs = [...qaJobs, ...eeJobs];
    const departmentRoles = ["pmtech", "seniortech", "toolcrib", "tooling"];

    const isQaRole = qaJobs.includes(emp_data?.emp_role);
    const isEeRole = eeJobs.includes(emp_data?.emp_role);

    const calApprovalCount = isQaRole
        ? QAforApprovalcalReportsCount
        : isEeRole
          ? EEforApprovalcalReportsCount
          : 0;
    const tnrApprovalCount = isQaRole ? esdAck : isEeRole ? senioreeAck : 0;
    const verifierBarData = isEeRole
        ? eeCalVerifierStatus
        : qaCalVerifierStatus;
    const verifierPieData = isEeRole ? eeVerifierStatus : qaVerifierStatus;

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState("");
    const [modalData, setModalData] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);

    const machineTotal = props.machineTotal ?? 0;
    const machineDueToday = props.machineDueToday ?? 0;
    const machineOverdue = props.machineOverdue ?? 0;
    const machinePending = props.machinePending ?? 0;
    const machineInProgress = props.machineInProgress ?? 0;
    const machineProgressDistribution = props.machineProgressDistribution ?? [];

    const ppcRoles = ['ppc', 'process engineering']; // i-adjust kung paano nakastore sa DB
const isPpcDept = ppcRoles.includes(emp_data?.emp_dept?.toLowerCase());

    const openModal = (title, data) => {
        if (!data || data.length === 0) return;
        setModalTitle(title);
        setModalData(data);
        setSelectedItem(null);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setSelectedItem(null);
    };

    const renderCustomLegend = () => (
        <ul className="flex gap-6 items-center justify-center">
            {checklistStatus.map((entry, index) => (
                <li
                    key={`item-${index}`}
                    className="flex items-center gap-2 text-gray-600"
                >
                    <span
                        className="inline-block w-3 h-3"
                        style={{
                            backgroundColor:
                                entry.name === "Completed"
                                    ? "#10B981"
                                    : "#FACC15",
                        }}
                    />
                    {entry.name}
                </li>
            ))}
        </ul>
    );

    const isCalibrationModal = modalTitle === "Calibration Reports";

    const CALIBRATION_FIELDS = [
        "equipment",
        "manufacturer",
        "control_no",
        "performed_by",
        "calibration_date",
        "calibration_due",
        "model",
        "serial",
        "temperature",
        "relative_humidity",
        "specs",
        "report_no",
        "cal_interval",
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />

            <h1 className="text-2xl font-bold mb-6">TNR Checklist</h1>

            {/* Role-level (QA / EE) view */}
            {combinedJobs.includes(emp_data?.emp_role) && (
                <div className="mt-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <SummaryCard
                            label="Calibration Reports for Approval"
                            value={calApprovalCount}
                            color="stone"
                        />
                        <SummaryCard
                            label="TNR for Approval"
                            value={tnrApprovalCount}
                            color="orange"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <NonTnrApprovalBarChart data={verifierBarData} />
                        <TnrAckPieChart data={verifierPieData} />
                    </div>
                </div>
            )}

            {/* Department-level view */}
            {departmentRoles.includes(emp_data?.emp_role) && (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        <SummaryCard
                            label="TnR Calibration Reports"
                            value={calibrationReportsCount}
                            color="blue"
                            onClick={() =>
                                openModal("Calibration Reports", latestReports)
                            }
                        />
                        <SummaryCard
                            label="Due Today"
                            value={dueSoon}
                            color="yellow"
                            onClick={() =>
                                openModal("Due Today", dueTodayReports)
                            }
                        />
                        <SummaryCard
                            label="Overdue"
                            value={overdue}
                            color="red"
                            onClick={() => openModal("Overdue", overdueReports)}
                        />
                        <SummaryCard
                            label="TNR PM Completed"
                            value={tnrCompleted}
                            color="green"
                            onClick={() =>
                                openModal(
                                    "TNR PM Completed",
                                    completedSchedulers,
                                )
                            }
                        />
                        <SummaryCard
                            label="Tech Acknowledgement Pending"
                            value={seniortechAck}
                            color="purple"
                        />
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-semibold text-gray-600">
                                TNR PM Checklist Status
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={checklistStatus}>
                                    <XAxis dataKey="name" />
                                    <YAxis allowDecimals={false} />
                                    <Tooltip />
                                    <Bar
                                        dataKey="value"
                                        radius={[8, 8, 0, 0]}
                                        label={{ position: "top" }}
                                    >
                                        {checklistStatus.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={
                                                    entry.name === "Completed"
                                                        ? "#10B981"
                                                        : "#FACC15"
                                                }
                                            />
                                        ))}
                                    </Bar>
                                    <Legend content={renderCustomLegend} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-semibold text-gray-600">
                                Non TnR Calibration Reports
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-gray-400">
                            {/* Placeholder — no data wired up yet for this section. */}
                            Coming soon.
                        </CardContent>
                    </Card>

                    {/* Modal */}
                    <Dialog
                        open={modalOpen}
                        onOpenChange={(open) => (open ? null : closeModal())}
                        className="bg-white"
                    >
                        <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto bg-white">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    {selectedItem && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7"
                                            onClick={() =>
                                                setSelectedItem(null)
                                            }
                                        >
                                            <ArrowLeft className="h-4 w-4" />
                                        </Button>
                                    )}
                                    <ClipboardList className="h-5 w-5" />
                                    {modalTitle}
                                </DialogTitle>
                            </DialogHeader>

                            {!selectedItem ? (
                                <ScrollArea className="max-h-[70vh] bg-white">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>#</TableHead>
                                                {isCalibrationModal ? (
                                                    <>
                                                        <TableHead>
                                                            Equipment
                                                        </TableHead>
                                                        <TableHead>
                                                            Control No
                                                        </TableHead>
                                                        <TableHead>
                                                            Due
                                                        </TableHead>
                                                    </>
                                                ) : (
                                                    <>
                                                        <TableHead>
                                                            Machine
                                                        </TableHead>
                                                        <TableHead>
                                                            Control No
                                                        </TableHead>
                                                        <TableHead>
                                                            PM Due
                                                        </TableHead>
                                                    </>
                                                )}
                                                <TableHead className="text-center">
                                                    Action
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {modalData.map((item, i) => (
                                                <TableRow key={i}>
                                                    <TableCell>
                                                        {i + 1}
                                                    </TableCell>
                                                    {isCalibrationModal ? (
                                                        <>
                                                            <TableCell>
                                                                {item.equipment}
                                                            </TableCell>
                                                            <TableCell>
                                                                {
                                                                    item.control_no
                                                                }
                                                            </TableCell>
                                                            <TableCell>
                                                                {
                                                                    item.calibration_due
                                                                }
                                                            </TableCell>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <TableCell>
                                                                {
                                                                    item.machine_num
                                                                }
                                                            </TableCell>
                                                            <TableCell>
                                                                {item.pmnt_no}
                                                            </TableCell>
                                                            <TableCell>
                                                                {item.pm_due}
                                                            </TableCell>
                                                        </>
                                                    )}
                                                    <TableCell className="text-center">
                                                        <Button
                                                            size="sm"
                                                            onClick={() =>
                                                                setSelectedItem(
                                                                    item,
                                                                )
                                                            }
                                                        >
                                                            <Eye className="h-4 w-4 mr-1" />{" "}
                                                            View
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </ScrollArea>
                            ) : isCalibrationModal ? (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {CALIBRATION_FIELDS.map((key) => (
                                            <ReadOnlyField
                                                key={key}
                                                label={key}
                                                value={selectedItem[key]}
                                            />
                                        ))}
                                    </div>

                                    {selectedItem.cal_std_use && (
                                        <div>
                                            <h4 className="font-semibold text-gray-700 mb-2">
                                                Calibration Standards Used
                                            </h4>
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>
                                                            Description
                                                        </TableHead>
                                                        <TableHead>
                                                            Manufacturer
                                                        </TableHead>
                                                        <TableHead>
                                                            Model
                                                        </TableHead>
                                                        <TableHead>
                                                            Control No
                                                        </TableHead>
                                                        <TableHead>
                                                            Serial No
                                                        </TableHead>
                                                        <TableHead>
                                                            Accuracy
                                                        </TableHead>
                                                        <TableHead>
                                                            Cal Date
                                                        </TableHead>
                                                        <TableHead>
                                                            Cal Due
                                                        </TableHead>
                                                        <TableHead>
                                                            Traceability
                                                        </TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {safeJsonParse(
                                                        selectedItem.cal_std_use,
                                                    ).map((std, i) => (
                                                        <TableRow key={i}>
                                                            <TableCell>
                                                                {
                                                                    std.description
                                                                }
                                                            </TableCell>
                                                            <TableCell>
                                                                {
                                                                    std.cal_manufacturer
                                                                }
                                                            </TableCell>
                                                            <TableCell>
                                                                {std.model_no}
                                                            </TableCell>
                                                            <TableCell>
                                                                {
                                                                    std.cal_control_no
                                                                }
                                                            </TableCell>
                                                            <TableCell>
                                                                {std.serial_no}
                                                            </TableCell>
                                                            <TableCell>
                                                                {std.accuracy}
                                                            </TableCell>
                                                            <TableCell>
                                                                {std.cal_date}
                                                            </TableCell>
                                                            <TableCell>
                                                                {std.cal_due}
                                                            </TableCell>
                                                            <TableCell>
                                                                {
                                                                    std.traceability
                                                                }
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    )}

                                    {selectedItem.cal_details && (
                                        <div>
                                            <h4 className="font-semibold text-gray-700 mb-2">
                                                Calibration Details
                                            </h4>
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>
                                                            Function Tested
                                                        </TableHead>
                                                        <TableHead>
                                                            Nominal
                                                        </TableHead>
                                                        <TableHead>
                                                            Tolerance
                                                        </TableHead>
                                                        <TableHead>
                                                            Unit Under Test
                                                        </TableHead>
                                                        <TableHead>
                                                            Standard Instrument
                                                        </TableHead>
                                                        <TableHead>
                                                            Disparity
                                                        </TableHead>
                                                        <TableHead>
                                                            Correction
                                                        </TableHead>
                                                        <TableHead>
                                                            Remarks
                                                        </TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {safeJsonParse(
                                                        selectedItem.cal_details,
                                                    ).map((d, i) => (
                                                        <TableRow key={i}>
                                                            <TableCell>
                                                                {
                                                                    d.function_tested
                                                                }
                                                            </TableCell>
                                                            <TableCell>
                                                                {d.nominal}
                                                            </TableCell>
                                                            <TableCell>
                                                                {d.tolerance}
                                                            </TableCell>
                                                            <TableCell>
                                                                {
                                                                    d.unit_under_test
                                                                }
                                                            </TableCell>
                                                            <TableCell>
                                                                {
                                                                    d.standard_instrument
                                                                }
                                                            </TableCell>
                                                            <TableCell>
                                                                {d.disparity}
                                                            </TableCell>
                                                            <TableCell>
                                                                {d.correction}
                                                            </TableCell>
                                                            <TableCell>
                                                                {d.remarks}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                        <ReadOnlyField
                                            label="Machine"
                                            value={selectedItem.machine_num}
                                        />
                                        <ReadOnlyField
                                            label="Control Number"
                                            value={selectedItem.pmnt_no}
                                        />
                                        <ReadOnlyField
                                            label="Serial Number"
                                            value={selectedItem.serial}
                                        />
                                        <ReadOnlyField
                                            label="PM Date"
                                            value={selectedItem.first_cycle}
                                        />
                                        <ReadOnlyField
                                            label="PM Due"
                                            value={selectedItem.pm_due}
                                        />
                                        <ReadOnlyField
                                            label="Technician"
                                            value={
                                                selectedItem.responsible_person ||
                                                "Empty Field..."
                                            }
                                        />
                                    </div>

                                    {selectedItem.answers && (
                                        <ScrollArea className="w-full">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>#</TableHead>
                                                        <TableHead>
                                                            Assy Item
                                                        </TableHead>
                                                        <TableHead>
                                                            Description
                                                        </TableHead>
                                                        <TableHead>
                                                            Requirements
                                                        </TableHead>
                                                        <TableHead>
                                                            Activity
                                                        </TableHead>
                                                        <TableHead>
                                                            Compliance
                                                        </TableHead>
                                                        <TableHead>
                                                            Remarks
                                                        </TableHead>
                                                        <TableHead>
                                                            Activity
                                                        </TableHead>
                                                        <TableHead>
                                                            Compliance
                                                        </TableHead>
                                                        <TableHead>
                                                            Remarks
                                                        </TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {safeJsonParse(
                                                        selectedItem.answers,
                                                    ).map((ans, i) => (
                                                        <TableRow key={i}>
                                                            <TableCell>
                                                                {i + 1}
                                                            </TableCell>
                                                            <TableCell>
                                                                {ans.assy_item}
                                                            </TableCell>
                                                            <TableCell>
                                                                {
                                                                    ans.description
                                                                }
                                                            </TableCell>
                                                            <TableCell>
                                                                {
                                                                    ans.requirements
                                                                }
                                                            </TableCell>
                                                            <TableCell>
                                                                {ans.activity_1}
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                <Badge
                                                                    variant={
                                                                        ans.compliance1
                                                                            ? "default"
                                                                            : "secondary"
                                                                    }
                                                                >
                                                                    {ans.compliance1
                                                                        ? "Yes"
                                                                        : "No"}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell>
                                                                {ans.remarks1}
                                                            </TableCell>
                                                            <TableCell>
                                                                {ans.activity_2}
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                <Badge
                                                                    variant={
                                                                        ans.compliance2
                                                                            ? "default"
                                                                            : "secondary"
                                                                    }
                                                                >
                                                                    {ans.compliance2
                                                                        ? "Yes"
                                                                        : "No"}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell>
                                                                {ans.remarks2}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </ScrollArea>
                                    )}

                                    {/* Fixed: these used to live inside the Calibration Reports
                      branch behind `modalTitle !== "Calibration Reports"`,
                      which is always false there — so the buttons could
                      never render. They belong here, in the PM-checklist
                      branch. */}
                                    {(isDueToday(selectedItem.pm_due) ||
                                        isOverdue(selectedItem.pm_due)) && (
                                        <div className="flex justify-end gap-2 pt-2">
                                            <Button
                                                className="bg-sky-500 hover:bg-sky-600"
                                                onClick={() =>
                                                    router.visit(
                                                        route("tnr.fillup", {
                                                            id: selectedItem.id,
                                                        }),
                                                    )
                                                }
                                            >
                                                <Wrench className="h-4 w-4 mr-1" />{" "}
                                                Fillup
                                            </Button>
                                            <Button
                                                className="bg-green-500 hover:bg-green-600"
                                                onClick={() =>
                                                    router.visit(
                                                        route("tnr.extend", {
                                                            id: selectedItem.id,
                                                        }),
                                                    )
                                                }
                                            >
                                                <CheckCircle2 className="h-4 w-4 mr-1" />{" "}
                                                Extend
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </DialogContent>
                    </Dialog>
                </div>
            )}

            {isPpcDept && (
                <div className="mt-6 space-y-6">
                    <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                        <Wrench className="h-5 w-5" />
                        Machine PM/Cal Tracker Overview
                    </h2>

                    {/* Summary Cards — completed excluded na */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <SummaryCard
                            label="Total Active Machines"
                            value={machineTotal}
                            color="stone"
                        />
                        <SummaryCard
                            label="Due Today"
                            value={machineDueToday}
                            color="yellow"
                        />
                        <SummaryCard
                            label="Overdue"
                            value={machineOverdue}
                            color="red"
                        />
                        <SummaryCard
                            label="Pending (No Activity)"
                            value={machinePending}
                            color="orange"
                        />
                        <SummaryCard
                            label="In Progress"
                            value={machineInProgress}
                            color="blue"
                        />
                    </div>

                    {/* Two charts side by side */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Chart 1: Pending vs In Progress — Donut */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base font-semibold text-gray-600">
                                    Activity Status
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={280}>
                                    <PieChart>
                                        <Pie
                                            data={[
                                                {
                                                    name: "Pending (No Activity)",
                                                    value: machinePending,
                                                },
                                                {
                                                    name: "In Progress",
                                                    value: machineInProgress,
                                                },
                                            ]}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={90}
                                            dataKey="value"
                                            label={({ name, value }) =>
                                                `${name}: ${value}`
                                            }
                                        >
                                            <Cell fill="#FACC15" />
                                            <Cell fill="#3B82F6" />
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Chart 2: Progress level distribution — Horizontal Bar */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base font-semibold text-gray-600">
                                    Progress Level Breakdown
                                </CardTitle>
                                <p className="text-xs text-gray-400 mt-1">
                                    Number of Machines per Progress Level
                                    (Excluding Completed)
                                </p>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={280}>
                                    <BarChart
                                        layout="vertical"
                                        data={machineProgressDistribution}
                                        margin={{ left: 16 }}
                                    >
                                        <XAxis
                                            type="number"
                                            allowDecimals={false}
                                        />
                                        <YAxis
                                            type="category"
                                            dataKey="label"
                                            width={90}
                                        />
                                        <Tooltip />
                                        <Bar
                                            dataKey="value"
                                            radius={[0, 8, 8, 0]}
                                            label={{ position: "right" }}
                                        >
                                            <Cell fill="#93C5FD" />{" "}
                                            {/* 20% - light blue */}
                                            <Cell fill="#60A5FA" /> {/* 40% */}
                                            <Cell fill="#3B82F6" /> {/* 60% */}
                                            <Cell fill="#1D4ED8" />{" "}
                                            {/* 80% - dark blue */}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Link to full tracker */}
                    {/* <div className="flex justify-end">
                        <Button
                            className="bg-blue-500 hover:bg-blue-600 text-white"
                            onClick={() =>
                                router.visit(route("machines-tracker.index"))
                            }
                        >
                            <Eye className="h-4 w-4 mr-2" />
                            View Full Machine Tracker
                        </Button>
                    </div> */}
                </div>
            )}
        </AuthenticatedLayout>
    );
}
