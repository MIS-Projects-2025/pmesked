import { useMemo, useState } from "react";
import { router } from "@inertiajs/react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Columns3,
    List,
    Search,
    CalendarOff,
    Wrench,
    ClipboardCheck,
    User,
    Hash,
    ArrowUpRight,
    Info,
} from "lucide-react";

/* ---------------------------------------------------------------------------
 * PM Checklist Due Dates
 * Each entry is a checklist whose pm_due falls on that date. Workweeks and
 * dates come from the analog_calendar table (server25); nothing is derived
 * client-side. Only the latest scheduler row per machine is shown, so a
 * machine that already has a newer schedule never appears as overdue.
 * ------------------------------------------------------------------------ */

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const STATUS = {
    overdue: {
        label: "Overdue",
        hint: "Checklist due date has passed and no newer schedule exists for the machine.",
        dot: "bg-red-600",
        text: "text-red-700",
        line: "border-l-red-600",
        soft: "bg-red-50 hover:bg-red-100/70",
        badge: "border-red-200 bg-red-50 text-red-700",
    },
    due: {
        label: "Due this week",
        hint: "Checklist due date falls within the current workweek.",
        dot: "bg-amber-500",
        text: "text-amber-700",
        line: "border-l-amber-500",
        soft: "bg-amber-50 hover:bg-amber-100/70",
        badge: "border-amber-200 bg-amber-50 text-amber-700",
    },
    upcoming: {
        label: "Upcoming",
        hint: "Checklist due date falls in a later workweek.",
        dot: "bg-sky-600",
        text: "text-sky-700",
        line: "border-l-sky-600",
        soft: "bg-sky-50/70 hover:bg-sky-100/70",
        badge: "border-sky-200 bg-sky-50 text-sky-700",
    },
};

const SOURCE_LABEL = { tnr: "TNR PM", machine: "Machine PM" };
const SOURCE_HINT = {
    tnr: "TNR PM checklist (scheduler)",
    machine: "Machine PM / calibration tracker",
};

const SOURCE_OPTIONS = {
    all: "All sources",
    tnr: "TNR PM",
    machine: "Machine PM",
};
const STATUS_OPTIONS = {
    all: "All statuses",
    overdue: "Overdue",
    due: "Due this week",
    upcoming: "Upcoming",
};

const statusOf = (item) => STATUS[item?.status] ?? STATUS.upcoming;

const monthLabel = (key) => {
    if (!key) return "";
    const [y, m] = key.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
    });
};

/* -------------------------------- pieces -------------------------------- */

function StatusDot({ status, className = "" }) {
    return (
        <span
            className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${statusOf({ status }).dot} ${className}`}
        />
    );
}

function SummaryBadge({ status, count }) {
    const s = STATUS[status];
    return (
        <TooltipProvider delayDuration={150}>
            <Tooltip>
                <TooltipTrigger
                    type="button"
                    className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`${s.label}: ${count}. ${s.hint}`}
                >
                    <Badge
                        variant="outline"
                        className={`gap-1.5 font-normal ${s.badge}`}
                    >
                        <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                        {s.label}
                        <span className="font-semibold tabular-nums">
                            {count}
                        </span>
                    </Badge>
                </TooltipTrigger>
                <TooltipContent
                    side="bottom"
                    className="max-w-xs border bg-white text-xs text-neutral-900 shadow-md dark:bg-neutral-950 dark:text-neutral-50"
                >
                    {s.hint}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

/** Compact one-line entry used inside month cells. */
function CalendarEntry({ item, onSelect, dense = false }) {
    const s = statusOf(item);

    return (
        <TooltipProvider delayDuration={200}>
            <Tooltip>
                {/* base-ui: TooltipTrigger renders its own <button>; style it directly. */}
                <TooltipTrigger
                    type="button"
                    onClick={() => onSelect(item)}
                    className={`flex w-full items-center gap-1.5 truncate rounded-sm border-l-2 py-0.5 pl-1.5 pr-1 text-left text-[11px] leading-tight transition-colors ${s.line} ${s.soft}`}
                >
                    <span className="truncate font-medium text-foreground">
                        {item.title}
                    </span>
                    {!dense && (
                        <span className="ml-auto shrink-0 tabular-nums text-muted-foreground">
                            {item.progress}%
                        </span>
                    )}
                </TooltipTrigger>
                <TooltipContent
                    side="top"
                    className="max-w-xs border bg-white text-neutral-900 shadow-md dark:bg-neutral-950 dark:text-neutral-50"
                >
                    <p className="font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                        {SOURCE_LABEL[item.source]} · {item.ww} ·{" "}
                        {item.due_label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {item.control_no || "No control number"} ·{" "}
                        {item.technician || "Unassigned"} · {item.progress}%
                        complete
                    </p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

/** Compact single-line row used in the week board. */
function BoardRow({ item, onSelect }) {
    const s = statusOf(item);

    return (
        <button
            type="button"
            onClick={() => onSelect(item)}
            className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-accent"
            title={`${item.title} · ${item.control_no || "—"} · ${item.technician || "Unassigned"}`}
        >
            <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
            <span className="min-w-0">
                <span className="block truncate text-sm font-medium leading-snug">
                    {item.title}
                </span>
                <span className="mt-0.5 block truncate text-xs leading-snug text-muted-foreground">
                    {item.control_no || "—"}
                    {item.technician ? ` · ${item.technician}` : ""}
                </span>
            </span>
            <span className="shrink-0 pl-1 text-xs tabular-nums text-muted-foreground">
                {item.progress ?? 0}%
            </span>
        </button>
    );
}

/** Group a week's items by due date, preserving order. */
const groupByDay = (items) => {
    const map = new Map();
    for (const it of items) {
        const key = it.due_date ?? "unscheduled";
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(it);
    }
    return [...map.entries()];
};

const dayHeading = (iso, todayIso) => {
    if (!iso || iso === "unscheduled") return "Unscheduled";
    const [y, m, d] = iso.split("-").map(Number);
    const label = new Date(y, m - 1, d).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "2-digit",
    });
    return iso === todayIso ? `${label} · Today` : label;
};

const BOARD_PREVIEW = 8;

/** One week column in the board view. */
function BoardColumn({ week, todayIso, onSelect }) {
    const [expanded, setExpanded] = useState(false);
    const items = expanded ? week.items : week.items.slice(0, BOARD_PREVIEW);
    const hidden = week.items.length - items.length;
    const groups = groupByDay(items);

    return (
        <div
            className={`flex flex-col rounded-md border ${
                week.is_current ? "border-amber-300 bg-amber-50/40" : "bg-card"
            }`}
        >
            <div className="flex items-center justify-between border-b px-4 py-3">
                <div>
                    <p className="text-sm font-semibold">{week.ww}</p>
                    <p className="text-[11px] text-muted-foreground">
                        {week.range_label}
                    </p>
                </div>
                <Badge
                    variant={week.count ? "secondary" : "outline"}
                    className="tabular-nums"
                >
                    {week.count}
                </Badge>
            </div>

            <div
                className={`${
                    expanded ? "max-h-[640px]" : "max-h-[440px]"
                } overflow-y-auto px-2 py-2`}
            >
                {week.items.length === 0 ? (
                    <p className="py-6 text-center text-xs text-muted-foreground">
                        No checklists due
                    </p>
                ) : (
                    groups.map(([day, rows]) => (
                        <div key={day} className="mb-3 last:mb-1">
                            <p className="px-3 pb-1.5 pt-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                {dayHeading(day, todayIso)}
                                <span className="ml-1 tabular-nums">
                                    ({rows.length})
                                </span>
                            </p>
                            {rows.map((item, i) => (
                                <BoardRow
                                    key={`${item.source}-${item.id ?? "x"}-${i}`}
                                    item={item}
                                    onSelect={onSelect}
                                />
                            ))}
                        </div>
                    ))
                )}
            </div>

            {week.items.length > BOARD_PREVIEW && (
                <button
                    type="button"
                    onClick={() => setExpanded((v) => !v)}
                    className="border-t px-4 py-2.5 text-left text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                    {expanded
                        ? "Show less"
                        : `Show all ${week.items.length} (${hidden} more)`}
                </button>
            )}
        </div>
    );
}

function EmptyState({ icon: Icon = CalendarOff, title, description }) {
    return (
        <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <Icon className="h-6 w-6 text-muted-foreground/60" />
            <p className="text-sm font-medium text-foreground">{title}</p>
            {description && (
                <p className="max-w-sm text-xs text-muted-foreground">
                    {description}
                </p>
            )}
        </div>
    );
}

/* ------------------------------ month view ------------------------------ */

function MonthGrid({ weeks, onSelect }) {
    const [expanded, setExpanded] = useState(() => new Set());

    const toggle = (key) =>
        setExpanded((prev) => {
            const next = new Set(prev);
            next.has(key) ? next.delete(key) : next.add(key);
            return next;
        });

    const monthKey = weeks[0]?.month_key;
    const monthNum = monthKey ? Number(monthKey.split("-")[1]) : null;

    return (
        <div className="overflow-hidden rounded-md border">
            {/* Weekday header */}
            <div className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))] border-b bg-muted/40">
                <div className="px-2 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    WW
                </div>
                {WEEKDAYS.map((d) => (
                    <div
                        key={d}
                        className="border-l px-2 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                        {d}
                    </div>
                ))}
            </div>

            {weeks.map((week) => {
                const slots = Array.from(
                    { length: 7 },
                    (_, dow) => week.days?.find((d) => d.dow === dow) ?? null,
                );

                const weekItems = week.items.filter(
                    (i) => i.placement === "week",
                );
                const dayItems = week.items.filter(
                    (i) => i.placement !== "week",
                );

                return (
                    <div
                        key={week.week_index}
                        className={`grid grid-cols-[56px_repeat(7,minmax(0,1fr))] border-b last:border-b-0 ${
                            week.is_current ? "bg-amber-50/40" : ""
                        }`}
                    >
                        {/* Workweek gutter */}
                        <div className="border-r px-2 py-2">
                            <p className="text-[11px] font-semibold tabular-nums">
                                {week.ww.replace("WW", "")}
                            </p>
                            {week.items.length > 0 && (
                                <p className="text-[10px] tabular-nums text-muted-foreground">
                                    {week.items.length}
                                </p>
                            )}
                            {week.is_current && (
                                <p className="mt-1 text-[9px] font-medium uppercase tracking-wide text-amber-700">
                                    Now
                                </p>
                            )}
                        </div>

                        <div className="relative col-span-7 min-h-[104px]">
                            {/* Column guides */}
                            <div className="pointer-events-none absolute inset-0 grid grid-cols-7">
                                {slots.map((_, i) => (
                                    <div key={i} className="border-l" />
                                ))}
                            </div>

                            <div className="relative">
                                {/* Day numbers */}
                                <div className="grid grid-cols-7">
                                    {slots.map((day, i) => (
                                        <div
                                            key={i}
                                            className="px-2 pt-1.5 text-right"
                                        >
                                            {day ? (
                                                <span
                                                    className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] tabular-nums ${
                                                        day.is_today
                                                            ? "bg-foreground font-semibold text-background"
                                                            : day.month !==
                                                                monthNum
                                                              ? "text-muted-foreground/50"
                                                              : "text-muted-foreground"
                                                    }`}
                                                >
                                                    {day.day}
                                                </span>
                                            ) : null}
                                        </div>
                                    ))}
                                </div>

                                {/* Workweek-scoped entries (TNR PM spans the week) */}
                                {weekItems.length > 0 && (
                                    <div className="space-y-0.5 px-1.5 pb-1 pt-1">
                                        {(expanded.has(week.ww)
                                            ? weekItems
                                            : weekItems.slice(0, 3)
                                        ).map((item, i) => (
                                            <CalendarEntry
                                                key={`w-${item.source}-${item.id ?? i}`}
                                                item={item}
                                                onSelect={onSelect}
                                            />
                                        ))}
                                        {weekItems.length > 3 && (
                                            <button
                                                type="button"
                                                onClick={() => toggle(week.ww)}
                                                className="pl-1.5 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:underline"
                                            >
                                                {expanded.has(week.ww)
                                                    ? "Show less"
                                                    : `${weekItems.length - 3} more`}
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* Date-scoped entries (machine tracker) */}
                                <div className="grid grid-cols-7">
                                    {slots.map((day, i) => {
                                        const entries = day
                                            ? dayItems.filter(
                                                  (it) =>
                                                      it.due_date === day.date,
                                              )
                                            : [];

                                        return (
                                            <div
                                                key={i}
                                                className="min-h-[24px] space-y-0.5 px-1 pb-1.5"
                                            >
                                                {entries.map((item, k) => (
                                                    <CalendarEntry
                                                        key={`d-${item.source}-${item.id ?? k}`}
                                                        item={item}
                                                        onSelect={onSelect}
                                                        dense
                                                    />
                                                ))}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

/* -------------------------------- main ---------------------------------- */

export default function PmScheduleCalendar({
    weeks = [],
    monthWeeks = [],
    overdue = [],
    meta = {},
    canAct = false,
}) {
    const [query, setQuery] = useState("");
    const [source, setSource] = useState("all");
    const [status, setStatus] = useState("all");
    const [view, setView] = useState("month");
    const [boardPage, setBoardPage] = useState(0);
    const [selected, setSelected] = useState(null);

    const matches = (item) => {
        if (source !== "all" && item.source !== source) return false;
        if (status !== "all" && item.status !== status) return false;
        if (!query.trim()) return true;
        const q = query.trim().toLowerCase();
        return [
            item.title,
            item.control_no,
            item.technician,
            item.ww,
            item.serial,
        ]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(q));
    };

    /* ---- month grouping ---- */
    const monthKeys = useMemo(
        () => [...new Set(monthWeeks.map((w) => w.month_key))].sort(),
        [monthWeeks],
    );

    const [monthIndex, setMonthIndex] = useState(() => {
        const idx = monthKeys.indexOf(meta.month_key);
        return idx >= 0 ? idx : Math.max(0, monthKeys.indexOf(monthKeys[0]));
    });

    const activeMonth = monthKeys[monthIndex];

    const monthRows = useMemo(
        () =>
            monthWeeks
                .filter((w) => w.month_key === activeMonth)
                .map((w) => ({ ...w, items: (w.items ?? []).filter(matches) })),
        [monthWeeks, activeMonth, query, source, status],
    );

    /* ---- board + list ---- */
    const boardWeeks = useMemo(
        () =>
            weeks.map((w) => {
                const items = (w.items ?? []).filter(matches);
                return { ...w, items, count: items.length };
            }),
        [weeks, query, source, status],
    );

    const filteredOverdue = useMemo(
        () => (overdue ?? []).filter(matches),
        [overdue, query, source, status],
    );

    // Overdue items inside the current week appear in both `overdue` and the
    // week board, so de-duplicate by source + id before rendering the list.
    const listRows = useMemo(() => {
        const seen = new Set();
        return [
            ...filteredOverdue,
            ...boardWeeks.flatMap((w) => w.items),
        ].filter((item) => {
            const key = `${item.source}-${item.id ?? item.due_date}-${item.title}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }, [filteredOverdue, boardWeeks]);

    const perPage = 4;
    const boardPages = Math.max(1, Math.ceil(boardWeeks.length / perPage));
    const visibleBoard = boardWeeks.slice(
        boardPage * perPage,
        boardPage * perPage + perPage,
    );

    const monthItemCount = monthRows.reduce((n, w) => n + w.items.length, 0);
    const goToday = () => {
        const idx = monthKeys.indexOf(meta.month_key);
        if (idx >= 0) setMonthIndex(idx);
        setBoardPage(0);
    };

    return (
        <>
            <Card>
                <CardHeader className="gap-4 pb-4 m-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="space-y-1">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                                PM Checklist Due Dates
                            </CardTitle>
                            <CardDescription>
                                Each entry is a checklist placed on its{" "}
                                <span className="font-medium text-foreground">
                                    PM due date
                                </span>
                                {meta.current_week
                                    ? ` · Current workweek ${meta.current_week} (${meta.week_range})`
                                    : ""}
                            </CardDescription>
                            <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
                                <Info className="h-3.5 w-3.5 shrink-0" />
                                <span>
                                    Shows the latest schedule for each machine
                                    {meta.machines
                                        ? ` (${meta.machines} machines)`
                                        : ""}
                                    . A machine drops off the overdue list once
                                    a newer checklist is scheduled. Completion
                                    percentage is for reference only.
                                </span>
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <SummaryBadge
                                status="overdue"
                                count={filteredOverdue.length}
                            />
                            <SummaryBadge
                                status="due"
                                count={
                                    boardWeeks[0]?.items.filter(
                                        (i) => i.status === "due",
                                    ).length ?? 0
                                }
                            />
                            <SummaryBadge
                                status="upcoming"
                                count={boardWeeks.reduce(
                                    (n, w) =>
                                        n +
                                        w.items.filter(
                                            (i) => i.status === "upcoming",
                                        ).length,
                                    0,
                                )}
                            />
                        </div>
                    </div>

                    <Separator />

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search machine, control number, technician"
                                className="h-8 w-72 pl-8 text-sm"
                            />
                        </div>

                        <Select value={source} onValueChange={setSource}>
                            <SelectTrigger className="h-8 w-[150px] text-sm">
                                <SelectValue>
                                    {SOURCE_OPTIONS[source]}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="border bg-white text-neutral-900 shadow-md dark:bg-neutral-950 dark:text-neutral-50">
                                <SelectItem value="all">All sources</SelectItem>
                                <SelectItem value="tnr">TNR PM</SelectItem>
                                <SelectItem value="machine">
                                    Machine PM
                                </SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="h-8 w-[160px] text-sm">
                                <SelectValue>
                                    {STATUS_OPTIONS[status]}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="border bg-white text-neutral-900 shadow-md dark:bg-neutral-950 dark:text-neutral-50">
                                <SelectItem value="all">
                                    All statuses
                                </SelectItem>
                                <SelectItem value="overdue">Overdue</SelectItem>
                                <SelectItem value="due">
                                    Due this week
                                </SelectItem>
                                <SelectItem value="upcoming">
                                    Upcoming
                                </SelectItem>
                            </SelectContent>
                        </Select>

                        <Tabs
                            value={view}
                            onValueChange={setView}
                            className="ml-auto"
                        >
                            <TabsList className="h-8">
                                <TabsTrigger
                                    value="month"
                                    className="gap-1.5 text-xs"
                                >
                                    <CalendarDays className="h-3.5 w-3.5" />
                                    Month
                                </TabsTrigger>
                                <TabsTrigger
                                    value="week"
                                    className="gap-1.5 text-xs"
                                >
                                    <Columns3 className="h-3.5 w-3.5" />
                                    Weeks
                                </TabsTrigger>
                                <TabsTrigger
                                    value="list"
                                    className="gap-1.5 text-xs"
                                >
                                    <List className="h-3.5 w-3.5" />
                                    List
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </CardHeader>

                <CardContent className="px-4 pb-4 pt-0 m-4">
                    <Tabs value={view} onValueChange={setView}>
                        {/* ------------------------- MONTH ------------------------- */}
                        <TabsContent value="month" className="mt-0 space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8"
                                        disabled={monthIndex <= 0}
                                        onClick={() =>
                                            setMonthIndex((i) =>
                                                Math.max(0, i - 1),
                                            )
                                        }
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8"
                                        disabled={
                                            monthIndex >= monthKeys.length - 1
                                        }
                                        onClick={() =>
                                            setMonthIndex((i) =>
                                                Math.min(
                                                    monthKeys.length - 1,
                                                    i + 1,
                                                ),
                                            )
                                        }
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                    <h3 className="ml-2 text-sm font-semibold">
                                        {monthLabel(activeMonth)}
                                    </h3>
                                    <Badge
                                        variant="secondary"
                                        className="ml-1 tabular-nums"
                                    >
                                        {monthItemCount}
                                    </Badge>
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8"
                                    onClick={goToday}
                                >
                                    Today
                                </Button>
                            </div>

                            {monthRows.length === 0 ? (
                                <EmptyState
                                    title="No weeks in this month"
                                    description="The analog_calendar table has no rows for the selected month."
                                />
                            ) : (
                                <MonthGrid
                                    weeks={monthRows}
                                    onSelect={setSelected}
                                />
                            )}
                        </TabsContent>

                        {/* ------------------------- WEEKS ------------------------- */}
                        <TabsContent value="week" className="mt-0 space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-xs text-muted-foreground">
                                    Showing weeks {boardPage * perPage + 1}–
                                    {Math.min(
                                        (boardPage + 1) * perPage,
                                        boardWeeks.length,
                                    )}{" "}
                                    of {boardWeeks.length}
                                </p>
                                <div className="flex gap-1">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8"
                                        disabled={boardPage === 0}
                                        onClick={() =>
                                            setBoardPage((p) =>
                                                Math.max(0, p - 1),
                                            )
                                        }
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8"
                                        disabled={boardPage >= boardPages - 1}
                                        onClick={() =>
                                            setBoardPage((p) =>
                                                Math.min(boardPages - 1, p + 1),
                                            )
                                        }
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                {visibleBoard.map((week) => (
                                    <BoardColumn
                                        key={week.week_index}
                                        week={week}
                                        todayIso={meta.today}
                                        onSelect={setSelected}
                                    />
                                ))}
                            </div>
                        </TabsContent>

                        {/* -------------------------- LIST ------------------------- */}
                        <TabsContent value="list" className="mt-0">
                            {listRows.length === 0 ? (
                                <EmptyState
                                    title="No checklists due"
                                    description="Nothing matches the current filters."
                                />
                            ) : (
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[150px]">
                                                    Status
                                                </TableHead>
                                                <TableHead>Machine</TableHead>
                                                <TableHead>
                                                    Control No.
                                                </TableHead>
                                                <TableHead>Workweek</TableHead>
                                                <TableHead>Due</TableHead>
                                                <TableHead>
                                                    Technician
                                                </TableHead>
                                                <TableHead className="w-[140px]">
                                                    Progress
                                                </TableHead>
                                                <TableHead className="w-[80px]" />
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {listRows.map((item, i) => (
                                                <TableRow
                                                    key={`${item.source}-${item.id ?? "x"}-${i}`}
                                                >
                                                    <TableCell>
                                                        <span className="flex items-center gap-2 text-xs">
                                                            <StatusDot
                                                                status={
                                                                    item.status
                                                                }
                                                            />
                                                            <span
                                                                className={
                                                                    statusOf(
                                                                        item,
                                                                    ).text
                                                                }
                                                            >
                                                                {
                                                                    statusOf(
                                                                        item,
                                                                    ).label
                                                                }
                                                            </span>
                                                            {item.days_late ? (
                                                                <span className="text-muted-foreground">
                                                                    ·{" "}
                                                                    {
                                                                        item.days_late
                                                                    }
                                                                    d
                                                                </span>
                                                            ) : null}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="font-medium">
                                                        {item.title}
                                                        <span className="ml-2 text-[10px] uppercase text-muted-foreground">
                                                            {item.source ===
                                                            "tnr"
                                                                ? "TNR"
                                                                : "MCH"}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground">
                                                        {item.control_no || "—"}
                                                    </TableCell>
                                                    <TableCell className="tabular-nums">
                                                        {item.ww}
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap text-muted-foreground">
                                                        {item.due_label}
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground">
                                                        {item.technician ||
                                                            "Unassigned"}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Progress
                                                                value={
                                                                    item.progress ??
                                                                    0
                                                                }
                                                                className="h-1"
                                                            />
                                                            <span className="w-8 text-right text-[11px] tabular-nums text-muted-foreground">
                                                                {item.progress ??
                                                                    0}
                                                                %
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 px-2 text-xs"
                                                            onClick={() =>
                                                                setSelected(
                                                                    item,
                                                                )
                                                            }
                                                        >
                                                            Details
                                                            <ArrowUpRight className="ml-1 h-3 w-3" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {/* ------------------------- detail sheet ------------------------- */}
            <Sheet
                open={!!selected}
                onOpenChange={(open) => (open ? null : setSelected(null))}
            >
                <SheetContent className="w-full overflow-y-auto border-l bg-white text-neutral-900 shadow-xl dark:bg-neutral-950 dark:text-neutral-50 sm:max-w-md">
                    {selected && (
                        <>
                            <SheetHeader className="space-y-2 text-left">
                                <SheetTitle className="flex items-center gap-2">
                                    <Wrench className="h-4 w-4 text-muted-foreground" />
                                    {selected.title}
                                </SheetTitle>
                                <SheetDescription className="flex flex-wrap items-center gap-2">
                                    <Badge
                                        variant="outline"
                                        className={`gap-1.5 font-normal ${statusOf(selected).badge}`}
                                    >
                                        <StatusDot status={selected.status} />
                                        {statusOf(selected).label}
                                        {selected.days_late
                                            ? ` · ${selected.days_late} days late`
                                            : ""}
                                    </Badge>
                                    <Badge
                                        variant="secondary"
                                        className="font-normal"
                                    >
                                        {SOURCE_LABEL[selected.source]}{" "}
                                        checklist
                                    </Badge>
                                </SheetDescription>
                            </SheetHeader>

                            <div className="mt-6 space-y-5">
                                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                                    {[
                                        ["Workweek", selected.ww],
                                        ["Checklist due", selected.due_label],
                                        ["Control number", selected.control_no],
                                        ["Serial number", selected.serial],
                                        ["Technician", selected.technician],
                                    ].map(([label, value]) => (
                                        <div key={label}>
                                            <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                                {label}
                                            </dt>
                                            <dd className="truncate">
                                                {value || "—"}
                                            </dd>
                                        </div>
                                    ))}
                                </dl>

                                <div>
                                    <div className="mb-1.5 flex items-center justify-between text-[11px] uppercase tracking-wide text-muted-foreground">
                                        <span>Completion</span>
                                        <span className="tabular-nums">
                                            {selected.progress ?? 0}%
                                        </span>
                                    </div>
                                    <Progress
                                        value={selected.progress ?? 0}
                                        className="h-1.5"
                                    />
                                </div>

                                {selected.source === "tnr" && (
                                    <div>
                                        <p className="mb-2 text-[11px] uppercase tracking-wide text-muted-foreground">
                                            Acknowledgements
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {[
                                                [
                                                    "Technician",
                                                    selected.tech_ack,
                                                ],
                                                ["Senior EE", selected.ee_ack],
                                                ["QA", selected.qa_ack],
                                            ].map(([label, done]) => (
                                                <Badge
                                                    key={label}
                                                    variant={
                                                        done
                                                            ? "secondary"
                                                            : "outline"
                                                    }
                                                    className="gap-1.5 font-normal"
                                                >
                                                    <ClipboardCheck
                                                        className={`h-3 w-3 ${
                                                            done
                                                                ? "text-emerald-600"
                                                                : "text-muted-foreground"
                                                        }`}
                                                    />
                                                    {label}
                                                    {done ? "" : " · pending"}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {canAct &&
                                    selected.source === "tnr" &&
                                    (selected.status === "due" ||
                                        selected.status === "overdue") && (
                                        <>
                                            <Separator />
                                            <div className="flex gap-2">
                                                <Button
                                                    className="flex-1"
                                                    onClick={() =>
                                                        router.visit(
                                                            route(
                                                                "tnr.fillup",
                                                                {
                                                                    id: selected.id,
                                                                },
                                                            ),
                                                        )
                                                    }
                                                >
                                                    Open checklist
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    className="flex-1"
                                                    onClick={() =>
                                                        router.visit(
                                                            route(
                                                                "tnr.extend",
                                                                {
                                                                    id: selected.id,
                                                                },
                                                            ),
                                                        )
                                                    }
                                                >
                                                    Request extension
                                                </Button>
                                            </div>
                                        </>
                                    )}
                            </div>
                        </>
                    )}
                </SheetContent>
            </Sheet>
        </>
    );
}
