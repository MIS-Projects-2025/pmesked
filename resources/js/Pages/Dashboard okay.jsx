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
    CartesianGrid,
} from "recharts";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import PmScheduleCalendar from "@/Components/PmScheduleCalendar";
import {
    ClipboardList,
    Eye,
    Wrench,
    CheckCircle2,
    ArrowLeft,
    FileCheck2,
    Stamp,
    CalendarClock,
    AlertTriangle,
    Gauge,
    Activity,
    ChevronRight,
} from "lucide-react";

/* ---------------------------------------------------------------------------
 * Helpers
 * Workweek ↔ date mapping is supplied by the server from analog_calendar
 * (server25) through the `wwIndex` prop:
 *   { "WW644": { offset: 0, start: "2026-08-30", end: "2026-09-05" }, ... }
 * offset 0 = current week, negative = past, positive = upcoming.
 * ------------------------------------------------------------------------ */

const toIsoDate = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** pm_due is stored as "MM/DD/YYYY" (occasionally "MM/DD/YY" or ISO). */
const parseDueDate = (value) => {
    if (!value) return null;
    const raw = String(value).trim();
    let m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
    if (m) {
        let year = parseInt(m[3], 10);
        if (year < 100) year += 2000;
        const d = new Date(year, parseInt(m[1], 10) - 1, parseInt(m[2], 10));
        return isNaN(d) ? null : d;
    }
    m = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
    return null;
};

/** Find the analog_calendar week (from wwIndex) that contains a date. */
const wwEntryForDate = (value, wwIndex) => {
    const d = parseDueDate(value);
    if (!d || !wwIndex) return null;
    const iso = toIsoDate(d);
    for (const [label, entry] of Object.entries(wwIndex)) {
        if (iso >= entry.start && iso <= entry.end) return { label, ...entry };
    }
    return null;
};

const wwOffset = (value, wwIndex) => wwEntryForDate(value, wwIndex)?.offset ?? null;

const isDueThisWeek = (value, wwIndex) => wwOffset(value, wwIndex) === 0;

const isOverdueWw = (value) => {
    const d = parseDueDate(value);
    if (!d) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d < today;
};

/** Returns e.g. "WW644 · Aug 30 – Sep 05" for the week that contains pm_due. */
const wwRangeLabel = (value, wwIndex) => {
    const entry = wwEntryForDate(value, wwIndex);
    if (!entry) return null;
    const fmt = (iso) => {
        const [y, m, d] = iso.split("-").map(Number);
        return new Date(y, m - 1, d).toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit",
        });
    };
    return `${entry.label} · ${fmt(entry.start)} – ${fmt(entry.end)}`;
};

const safeJsonParse = (value, fallback = []) => {
    if (!value) return fallback;
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : fallback;
    } catch {
        return fallback;
    }
};

const CHART_COLORS = {
    primary: "#334155",
    pending: "#d97706",
    complete: "#059669",
    accent: "#0284c7",
    muted: "#cbd5e1",
};

const chartTooltip = {
    contentStyle: {
        borderRadius: 6,
        border: "1px solid hsl(214 32% 91%)",
        boxShadow: "0 4px 12px rgb(15 23 42 / 0.08)",
        fontSize: 12,
    },
};

/* ------------------------------- components ------------------------------ */

function SectionHeading({ title, description, action }) {
    return (
        <div className="flex items-end justify-between gap-4">
            <div>
                <h2 className="text-sm font-semibold text-foreground">
                    {title}
                </h2>
                {description && (
                    <p className="text-xs text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>
            {action}
        </div>
    );
}

function StatCard({ label, value, icon: Icon, hint, onClick }) {
    const clickable = typeof onClick === "function";

    return (
        <Card
            onClick={onClick}
            role={clickable ? "button" : undefined}
            tabIndex={clickable ? 0 : undefined}
            onKeyDown={(e) => {
                if (clickable && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    onClick();
                }
            }}
            className={
                clickable
                    ? "group cursor-pointer transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    : ""
            }
        >
            <CardContent className="flex items-start justify-between gap-3 p-4">
                <div className="min-w-0">
                    <p className="text-2xl font-semibold tabular-nums tracking-tight">
                        {value}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {label}
                    </p>
                    {hint && (
                        <p className="mt-1 truncate text-[11px] text-muted-foreground/80">
                            {hint}
                        </p>
                    )}
                </div>
                <div className="flex flex-col items-end gap-2">
                    {Icon && (
                        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    {clickable && (
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function ChartCard({ title, description, children }) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm">{title}</CardTitle>
                {description && (
                    <CardDescription className="text-xs">
                        {description}
                    </CardDescription>
                )}
            </CardHeader>
            <CardContent>{children}</CardContent>
        </Card>
    );
}

function ChartEmpty({ label = "No data available" }) {
    return (
        <div className="flex h-[240px] flex-col items-center justify-center gap-2 text-muted-foreground">
            <Activity className="h-5 w-5 opacity-60" />
            <p className="text-xs">{label}</p>
        </div>
    );
}

function ApprovalBarChart({ data }) {
    const hasData = data?.some((d) => d.value > 0);

    return (
        <ChartCard
            title="Non-TNR calibration reports"
            description="Reports awaiting your signature"
        >
            {hasData ? (
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={data} barSize={64}>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="#eef2f6"
                        />
                        <XAxis
                            dataKey="name"
                            tickLine={false}
                            axisLine={false}
                            fontSize={12}
                        />
                        <YAxis
                            allowDecimals={false}
                            tickLine={false}
                            axisLine={false}
                            fontSize={12}
                        />
                        <Tooltip cursor={{ fill: "#f8fafc" }} {...chartTooltip} />
                        <Bar
                            dataKey="value"
                            radius={[4, 4, 0, 0]}
                            fill={CHART_COLORS.primary}
                            label={{ position: "top", fontSize: 12 }}
                        />
                    </BarChart>
                </ResponsiveContainer>
            ) : (
                <ChartEmpty label="No reports pending approval" />
            )}
        </ChartCard>
    );
}

function AcknowledgementChart({ data }) {
    const hasData = data?.some((d) => d.value > 0);

    return (
        <ChartCard
            title="TNR PM acknowledgement"
            description="Scheduler entries awaiting EE / QA sign-off"
        >
            {hasData ? (
                <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={58}
                            outerRadius={88}
                            paddingAngle={1}
                            dataKey="value"
                            labelLine={false}
                            label={({ value }) => value}
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={
                                        index === 0
                                            ? CHART_COLORS.pending
                                            : CHART_COLORS.muted
                                    }
                                />
                            ))}
                        </Pie>
                        <Tooltip {...chartTooltip} />
                        <Legend
                            iconType="circle"
                            iconSize={8}
                            wrapperStyle={{ fontSize: 12 }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            ) : (
                <ChartEmpty label="No pending acknowledgements" />
            )}
        </ChartCard>
    );
}

function ReadOnlyField({ label, value }) {
    return (
        <div>
            <Label className="text-[11px] font-normal uppercase tracking-wide text-muted-foreground">
                {label.replace(/_/g, " ")}
            </Label>
            <Input
                value={value || ""}
                readOnly
                className="mt-1 h-8 bg-muted/40 text-sm"
            />
        </div>
    );
}

/* --------------------------------- page ---------------------------------- */

export default function Dashboard(props) {
    const { emp_data } = usePage().props;

    const QAforApprovalcalReportsCount = props.QAforApprovalcalReportsCount ?? 0;
    const EEforApprovalcalReportsCount = props.EEforApprovalcalReportsCount ?? 0;
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

    // PM schedule (analog_calendar driven)
    const pmCalendar = props.pmCalendar ?? [];
    const pmMonthWeeks = props.pmMonthWeeks ?? [];
    const pmOverdue = props.pmOverdue ?? [];
    const pmCalendarMeta = props.pmCalendarMeta ?? {};
    const wwIndex = props.wwIndex ?? {};

    // Role groups
    const qaJobs = ["esd"];
    const eeJobs = ["superadmin", "admin", "engineer"];
    const combinedJobs = [...qaJobs, ...eeJobs];
    const departmentRoles = ["pmtech", "seniortech", "toolcrib", "tooling"];

    const isQaRole = qaJobs.includes(emp_data?.emp_role);
    const isEeRole = eeJobs.includes(emp_data?.emp_role);
    const isDeptRole = departmentRoles.includes(emp_data?.emp_role);

    const calApprovalCount = isQaRole
        ? QAforApprovalcalReportsCount
        : isEeRole
          ? EEforApprovalcalReportsCount
          : 0;
    const tnrApprovalCount = isQaRole ? esdAck : isEeRole ? senioreeAck : 0;
    const verifierBarData = isEeRole ? eeCalVerifierStatus : qaCalVerifierStatus;
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

    const ppcRoles = ["ppc", "process engineering"];
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

    const isCalibrationModal = modalTitle === "Calibration reports";

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

    const todayLabel = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    const headlineStats = [
        { label: "Overdue", value: pmCalendarMeta.overdue ?? 0 },
        { label: "Due this week", value: pmCalendarMeta.due_now ?? 0 },
        { label: "Upcoming", value: pmCalendarMeta.upcoming ?? 0 },
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />

            <div className="space-y-6 pb-10">
                {/* Page header */}
                <div className="flex flex-wrap items-end justify-between gap-4 border-b pb-4">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">
                            Maintenance Dashboard
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {todayLabel}
                            {pmCalendarMeta.current_week
                                ? ` · ${pmCalendarMeta.current_week} (${pmCalendarMeta.week_range})`
                                : ""}
                        </p>
                    </div>

                    <div className="flex items-center gap-5">
                        {headlineStats.map((stat, i) => (
                            <div key={stat.label} className="flex items-center">
                                {i > 0 && (
                                    <Separator
                                        orientation="vertical"
                                        className="mr-5 h-8"
                                    />
                                )}
                                <div className="text-right">
                                    <p className="text-lg font-semibold tabular-nums">
                                        {stat.value}
                                    </p>
                                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                        {stat.label}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Data-source notice (administrators only) */}
                {(isEeRole || isQaRole) &&
                    (pmCalendarMeta.source === "fallback" ||
                        (pmCalendarMeta.unmatched_ww ?? []).length > 0) && (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Calendar data issue</AlertTitle>
                            <AlertDescription className="space-y-1 text-sm">
                                {pmCalendarMeta.source === "fallback" && (
                                    <p>
                                        The <code>analog_calendar</code> table
                                        on <code>server25</code> is
                                        unreachable. Workweeks are temporarily
                                        computed and may be inaccurate.
                                    </p>
                                )}
                                {(pmCalendarMeta.unmatched_ww ?? []).length >
                                    0 && (
                                    <p>
                                        {pmCalendarMeta.unmatched_ww.length}{" "}
                                        scheduler record(s) have a{" "}
                                        <code>pm_due</code> value with no
                                        matching workweek:{" "}
                                        <span className="font-mono text-xs">
                                            {pmCalendarMeta.unmatched_ww
                                                .slice(0, 8)
                                                .join(", ")}
                                            {pmCalendarMeta.unmatched_ww
                                                .length > 8
                                                ? " …"
                                                : ""}
                                        </span>
                                    </p>
                                )}
                            </AlertDescription>
                        </Alert>
                    )}

                {/* PM schedule — visible to every role */}
                <PmScheduleCalendar
                    weeks={pmCalendar}
                    monthWeeks={pmMonthWeeks}
                    overdue={pmOverdue}
                    meta={pmCalendarMeta}
                    canAct={isDeptRole || isEeRole}
                />

                {/* Approvals (QA / EE) */}
                {combinedJobs.includes(emp_data?.emp_role) && (
                    <section className="space-y-3">
                        <SectionHeading
                            title="Approvals"
                            description="Items awaiting your review and signature"
                        />

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <StatCard
                                label="Calibration reports for approval"
                                value={calApprovalCount}
                                icon={FileCheck2}
                            />
                            <StatCard
                                label="TNR for approval"
                                value={tnrApprovalCount}
                                icon={Stamp}
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <ApprovalBarChart data={verifierBarData} />
                            <AcknowledgementChart data={verifierPieData} />
                        </div>
                    </section>
                )}

                {/* TNR checklist (department roles) */}
                {isDeptRole && (
                    <section className="space-y-3">
                        <SectionHeading
                            title="TNR checklist"
                            description="Select a card to view the underlying records"
                        />

                        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
                            <StatCard
                                label="TNR calibration reports"
                                value={calibrationReportsCount}
                                icon={FileCheck2}
                                hint="Created today"
                                onClick={() =>
                                    openModal(
                                        "Calibration reports",
                                        latestReports,
                                    )
                                }
                            />
                            <StatCard
                                label="Due this week"
                                value={dueSoon}
                                icon={CalendarClock}
                                hint={
                                    pmCalendarMeta.current_week
                                        ? `${pmCalendarMeta.current_week} · ${pmCalendarMeta.week_range}`
                                        : undefined
                                }
                                onClick={() =>
                                    openModal("Due this week", dueTodayReports)
                                }
                            />
                            <StatCard
                                label="Overdue"
                                value={overdue}
                                icon={AlertTriangle}
                                onClick={() =>
                                    openModal("Overdue", overdueReports)
                                }
                            />
                            <StatCard
                                label="Completed"
                                value={tnrCompleted}
                                icon={CheckCircle2}
                                onClick={() =>
                                    openModal(
                                        "Completed PM",
                                        completedSchedulers,
                                    )
                                }
                            />
                            <StatCard
                                label="Technician acknowledgement pending"
                                value={seniortechAck}
                                icon={Stamp}
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                            <div className="lg:col-span-2 ">
                                <ChartCard
                                    title="Checklist status"
                                    description="Completed versus pending scheduler entries"

                                >
                                    {checklistStatus.some((d) => d.value > 0) ? (
                                        <ResponsiveContainer
                                            width="100%"
                                            height={260}
                                        >
                                            <BarChart
                                                data={checklistStatus}
                                                barSize={72}
                                            >
                                                <CartesianGrid
                                                    strokeDasharray="3 3"
                                                    vertical={false}
                                                    stroke="#eef2f6"
                                                />
                                                <XAxis
                                                    dataKey="name"
                                                    tickLine={false}
                                                    axisLine={false}
                                                    fontSize={12}
                                                />
                                                <YAxis
                                                    allowDecimals={false}
                                                    tickLine={false}
                                                    axisLine={false}
                                                    fontSize={12}
                                                />
                                                <Tooltip
                                                    cursor={{ fill: "#f8fafc" }}
                                                    {...chartTooltip}
                                                />
                                                <Bar
                                                    dataKey="value"
                                                    radius={[4, 4, 0, 0]}
                                                    label={{
                                                        position: "top",
                                                        fontSize: 12,
                                                    }}
                                                >
                                                    {checklistStatus.map(
                                                        (entry, index) => (
                                                            <Cell
                                                                key={`cell-${index}`}
                                                                fill={
                                                                    entry.name ===
                                                                    "Completed"
                                                                        ? CHART_COLORS.complete
                                                                        : CHART_COLORS.pending
                                                                }
                                                            />
                                                        ),
                                                    )}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <ChartEmpty />
                                    )}
                                </ChartCard>
                            </div>

                            <ChartCard
                                title="Non-TNR calibration reports"
                                description="Not yet connected to a data source"
                            >
                                <ChartEmpty label="Not available" />
                            </ChartCard>
                        </div>
                    </section>
                )}

                {/* Machine tracker (PPC / Process Engineering) */}
                {isPpcDept && (
                    <section className="space-y-3">
                        <SectionHeading
                            title="Machine PM / calibration tracker"
                            description="Active machines only; completed work is excluded"
                        />

                        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                            <StatCard
                                label="Active machines"
                                value={machineTotal}
                                icon={Wrench}
                            />
                            <StatCard
                                label="Due today"
                                value={machineDueToday}
                                icon={CalendarClock}
                            />
                            <StatCard
                                label="Overdue"
                                value={machineOverdue}
                                icon={AlertTriangle}
                            />
                            <StatCard
                                label="No activity yet"
                                value={machinePending}
                                icon={ClipboardList}
                            />
                            <StatCard
                                label="In progress"
                                value={machineInProgress}
                                icon={Gauge}
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <ChartCard
                                title="Activity status"
                                description="Machines with no activity versus work in progress"
                            >
                                {machinePending + machineInProgress > 0 ? (
                                    <ResponsiveContainer
                                        width="100%"
                                        height={260}
                                    >
                                        <PieChart>
                                            <Pie
                                                data={[
                                                    {
                                                        name: "No activity",
                                                        value: machinePending,
                                                    },
                                                    {
                                                        name: "In progress",
                                                        value: machineInProgress,
                                                    },
                                                ]}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={58}
                                                outerRadius={88}
                                                paddingAngle={1}
                                                dataKey="value"
                                                labelLine={false}
                                                label={({ value }) => value}
                                            >
                                                <Cell
                                                    fill={CHART_COLORS.pending}
                                                />
                                                <Cell
                                                    fill={CHART_COLORS.accent}
                                                />
                                            </Pie>
                                            <Tooltip {...chartTooltip} />
                                            <Legend
                                                iconType="circle"
                                                iconSize={8}
                                                wrapperStyle={{ fontSize: 12 }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <ChartEmpty />
                                )}
                            </ChartCard>

                            <ChartCard
                                title="Progress distribution"
                                description="Machines per completion level, excluding finished work"
                            >
                                {machineProgressDistribution.some(
                                    (d) => d.value > 0,
                                ) ? (
                                    <ResponsiveContainer
                                        width="100%"
                                        height={260}
                                    >
                                        <BarChart
                                            layout="vertical"
                                            data={machineProgressDistribution}
                                            margin={{ left: 8, right: 24 }}
                                            barSize={18}
                                        >
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                horizontal={false}
                                                stroke="#eef2f6"
                                            />
                                            <XAxis
                                                type="number"
                                                allowDecimals={false}
                                                tickLine={false}
                                                axisLine={false}
                                                fontSize={12}
                                            />
                                            <YAxis
                                                type="category"
                                                dataKey="label"
                                                width={88}
                                                tickLine={false}
                                                axisLine={false}
                                                fontSize={12}
                                            />
                                            <Tooltip
                                                cursor={{ fill: "#f8fafc" }}
                                                {...chartTooltip}
                                            />
                                            <Bar
                                                dataKey="value"
                                                radius={[0, 4, 4, 0]}
                                                fill={CHART_COLORS.accent}
                                                label={{
                                                    position: "right",
                                                    fontSize: 12,
                                                }}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <ChartEmpty />
                                )}
                            </ChartCard>
                        </div>
                    </section>
                )}
            </div>

            {/* Record browser */}
            <Dialog
                open={modalOpen}
                onOpenChange={(open) => (open ? null : closeModal())}
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto border bg-white text-neutral-900 shadow-xl dark:bg-neutral-950 dark:text-neutral-50 sm:max-w-5xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base">
                            {selectedItem && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => setSelectedItem(null)}
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                            )}
                            {modalTitle}
                            <Badge variant="secondary" className="tabular-nums">
                                {modalData.length}
                            </Badge>
                        </DialogTitle>
                    </DialogHeader>

                    {!selectedItem ? (
                        <ScrollArea className="max-h-[70vh]">
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-10">
                                                #
                                            </TableHead>
                                            {isCalibrationModal ? (
                                                <>
                                                    <TableHead>
                                                        Equipment
                                                    </TableHead>
                                                    <TableHead>
                                                        Control no.
                                                    </TableHead>
                                                    <TableHead>Due</TableHead>
                                                </>
                                            ) : (
                                                <>
                                                    <TableHead>
                                                        Machine
                                                    </TableHead>
                                                    <TableHead>
                                                        Control no.
                                                    </TableHead>
                                                    <TableHead>
                                                        PM due
                                                    </TableHead>
                                                </>
                                            )}
                                            <TableHead className="w-24 text-right">
                                                Action
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {modalData.map((item, i) => (
                                            <TableRow key={i}>
                                                <TableCell className="text-muted-foreground">
                                                    {i + 1}
                                                </TableCell>
                                                {isCalibrationModal ? (
                                                    <>
                                                        <TableCell className="font-medium">
                                                            {item.equipment}
                                                        </TableCell>
                                                        <TableCell>
                                                            {item.control_no}
                                                        </TableCell>
                                                        <TableCell>
                                                            {
                                                                item.calibration_due
                                                            }
                                                        </TableCell>
                                                    </>
                                                ) : (
                                                    <>
                                                        <TableCell className="font-medium">
                                                            {item.machine_num}
                                                        </TableCell>
                                                        <TableCell>
                                                            {item.pmnt_no}
                                                        </TableCell>
                                                        <TableCell className="tabular-nums">
                                                            {item.pm_due}
                                                            {wwRangeLabel(
                                                                item.pm_due,
                                                                wwIndex,
                                                            ) && (
                                                                <span className="ml-2 text-xs text-muted-foreground">
                                                                    {wwRangeLabel(
                                                                        item.pm_due,
                                                                        wwIndex,
                                                                    )}
                                                                </span>
                                                            )}
                                                        </TableCell>
                                                    </>
                                                )}
                                                <TableCell className="text-right">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-7 px-2 text-xs"
                                                        onClick={() =>
                                                            setSelectedItem(
                                                                item,
                                                            )
                                                        }
                                                    >
                                                        <Eye className="mr-1 h-3.5 w-3.5" />
                                                        View
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </ScrollArea>
                    ) : isCalibrationModal ? (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
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
                                    <h4 className="mb-2 text-sm font-semibold">
                                        Calibration standards used
                                    </h4>
                                    <div className="rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>
                                                        Description
                                                    </TableHead>
                                                    <TableHead>
                                                        Manufacturer
                                                    </TableHead>
                                                    <TableHead>Model</TableHead>
                                                    <TableHead>
                                                        Control no.
                                                    </TableHead>
                                                    <TableHead>
                                                        Serial no.
                                                    </TableHead>
                                                    <TableHead>
                                                        Accuracy
                                                    </TableHead>
                                                    <TableHead>
                                                        Cal. date
                                                    </TableHead>
                                                    <TableHead>
                                                        Cal. due
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
                                                            {std.description}
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
                                                            {std.cal_control_no}
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
                                                            {std.traceability}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            )}

                            {selectedItem.cal_details && (
                                <div>
                                    <h4 className="mb-2 text-sm font-semibold">
                                        Calibration details
                                    </h4>
                                    <div className="rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>
                                                        Function tested
                                                    </TableHead>
                                                    <TableHead>
                                                        Nominal
                                                    </TableHead>
                                                    <TableHead>
                                                        Tolerance
                                                    </TableHead>
                                                    <TableHead>
                                                        Unit under test
                                                    </TableHead>
                                                    <TableHead>
                                                        Standard instrument
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
                                                            {d.function_tested}
                                                        </TableCell>
                                                        <TableCell>
                                                            {d.nominal}
                                                        </TableCell>
                                                        <TableCell>
                                                            {d.tolerance}
                                                        </TableCell>
                                                        <TableCell>
                                                            {d.unit_under_test}
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
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                                <ReadOnlyField
                                    label="Machine"
                                    value={selectedItem.machine_num}
                                />
                                <ReadOnlyField
                                    label="Control number"
                                    value={selectedItem.pmnt_no}
                                />
                                <ReadOnlyField
                                    label="Serial number"
                                    value={selectedItem.serial}
                                />
                                <ReadOnlyField
                                    label="PM due"
                                    value={
                                        wwRangeLabel(
                                            selectedItem.pm_due,
                                            wwIndex,
                                        )
                                            ? `${selectedItem.pm_due} (${wwRangeLabel(selectedItem.pm_due, wwIndex)})`
                                            : selectedItem.pm_due
                                    }
                                />
                                <ReadOnlyField
                                    label="Technician"
                                    value={selectedItem.responsible_person}
                                />
                            </div>

                            {selectedItem.answers && (
                                <ScrollArea className="w-full">
                                    <div className="rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>#</TableHead>
                                                    <TableHead>
                                                        Assembly item
                                                    </TableHead>
                                                    <TableHead>
                                                        Description
                                                    </TableHead>
                                                    <TableHead>
                                                        Requirements
                                                    </TableHead>
                                                    <TableHead>
                                                        Activity 1
                                                    </TableHead>
                                                    <TableHead>
                                                        Compliance
                                                    </TableHead>
                                                    <TableHead>
                                                        Remarks
                                                    </TableHead>
                                                    <TableHead>
                                                        Activity 2
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
                                                        <TableCell className="text-muted-foreground">
                                                            {i + 1}
                                                        </TableCell>
                                                        <TableCell>
                                                            {ans.assy_item}
                                                        </TableCell>
                                                        <TableCell>
                                                            {ans.description}
                                                        </TableCell>
                                                        <TableCell>
                                                            {ans.requirements}
                                                        </TableCell>
                                                        <TableCell>
                                                            {ans.activity_1}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge
                                                                variant={
                                                                    ans.compliance1
                                                                        ? "secondary"
                                                                        : "outline"
                                                                }
                                                                className="font-normal"
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
                                                        <TableCell>
                                                            <Badge
                                                                variant={
                                                                    ans.compliance2
                                                                        ? "secondary"
                                                                        : "outline"
                                                                }
                                                                className="font-normal"
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
                                    </div>
                                </ScrollArea>
                            )}

                            {(isDueThisWeek(selectedItem.pm_due, wwIndex) ||
                                isOverdueWw(selectedItem.pm_due, wwIndex)) && (
                                <>
                                    <Separator />
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={() =>
                                                router.visit(
                                                    route("tnr.extend", {
                                                        id: selectedItem.id,
                                                    }),
                                                )
                                            }
                                        >
                                            Request extension
                                        </Button>
                                        <Button
                                            onClick={() =>
                                                router.visit(
                                                    route("tnr.fillup", {
                                                        id: selectedItem.id,
                                                    }),
                                                )
                                            }
                                        >
                                            Open checklist
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    );
}
