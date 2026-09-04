<?php

namespace App\Http\Controllers;

use App\Services\WorkweekCalendar;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class DashboardController extends Controller
{
    /** Number of weeks shown in the week-board view. */
    private const BOARD_WEEKS = 8;

    /** Months of history / lookahead available in the month view. */
    private const MONTHS_BACK    = 1;
    private const MONTHS_FORWARD = 3;

    /** "Empty" means null or a whitespace-only string. */
    private function isAckPending($value): bool
    {
        return $value === null || trim((string) $value) === '';
    }

    /**
     * Parse a pm_due value into a date.
     * Accepts MM/DD/YYYY, MM/DD/YY, M/D/YYYY, YYYY-MM-DD, or a full datetime.
     * Returns null when the value is empty or unreadable.
     */
    private function parseDueDate($value): ?Carbon
    {
        $value = trim((string) $value);
        if ($value === '') {
            return null;
        }

        if (preg_match('#^(\d{1,2})/(\d{1,2})/(\d{2}|\d{4})$#', $value, $m)) {
            $year = (int) $m[3];
            if ($year < 100) {
                $year += 2000;               // "09/16/26" => 2026
            }
            if (!checkdate((int) $m[1], (int) $m[2], $year)) {
                return null;
            }
            return Carbon::create($year, (int) $m[1], (int) $m[2])->startOfDay();
        }

        try {
            return Carbon::parse($value)->startOfDay();
        } catch (\Throwable $e) {
            return null;
        }
    }

    /**
     * Identity of a machine for schedule purposes.
     * Prefer machine_num + pmnt_no; fall back to serial, then id.
     */
    private function machineKey(object $row): string
    {
        $machine = strtoupper(trim((string) ($row->machine_num ?? '')));
        $control = strtoupper(trim((string) ($row->pmnt_no ?? '')));
        $serial  = strtoupper(trim((string) ($row->serial ?? '')));

        if ($machine !== '' || $control !== '') {
            return $machine . '|' . $control;
        }
        if ($serial !== '') {
            return 'SN|' . $serial;
        }
        return 'ID|' . ($row->id ?? spl_object_id($row));
    }

    /**
     * Keep only the most recent scheduler row per machine.
     * "Most recent" = latest parsable pm_due; ties broken by highest id.
     */
    private function latestPerMachine(\Illuminate\Support\Collection $rows, WorkweekCalendar $calendar): \Illuminate\Support\Collection
    {
        $latest = [];

        foreach ($rows as $row) {
            [$due] = $this->resolveDue($row->pm_due, $calendar);
            if ($due === null) {
                continue;                                   // unreadable pm_due: not a live schedule
            }

            $key  = $this->machineKey($row);
            $rank = [$due->timestamp, (int) ($row->id ?? 0)];

            if (!isset($latest[$key]) || $rank > $latest[$key]['rank']) {
                $latest[$key] = ['rank' => $rank, 'row' => $row];
            }
        }

        return collect(array_column($latest, 'row'))->values();
    }

    /**
     * Resolve a pm_due value (date string or legacy WW label) to
     * [Carbon|null $date, int|null $weekIndex].
     */
    private function resolveDue($value, WorkweekCalendar $calendar): array
    {
        $raw = trim((string) $value);

        if (preg_match('/^WW\s*\d+$/i', $raw)) {           // legacy workweek label
            $idx = $calendar->indexForLabel(strtoupper(str_replace(' ', '', $raw)));
            if ($idx === null) {
                return [null, null];
            }
            $week = $calendar->weekAt($idx);
            return [Carbon::parse($week['end'])->startOfDay(), $idx];
        }

        $date = $this->parseDueDate($raw);
        if ($date === null) {
            return [null, null];
        }

        return [$date, $calendar->indexForDate($date)];
    }

    public function index(WorkweekCalendar $calendar)
    {
        $today      = today()->startOfDay();
        $currentIdx = $calendar->currentIndex();
        $currentWw  = $calendar->currentWeek()['label'] ?? null;

        // ------------------------------------------------------------------
        // Scheduler data (single fetch, everything derived in PHP)
        // ------------------------------------------------------------------
        $allSchedulers = DB::connection('mysql')->table('scheduler_tbl')->get();

        // Each completed PM cycle inserts a new row with the next pm_due, so a
        // machine's older rows are superseded. Only the latest row per machine
        // represents its live schedule; superseded rows must never count as overdue.
        $currentSchedulers = $this->latestPerMachine($allSchedulers, $calendar);

        $completedSchedulers = $allSchedulers
            ->filter(fn($row) => (int) ($row->progress_value ?? 0) >= 100)
            ->values();

        $pendingSchedulers = $allSchedulers
            ->filter(fn($row) => (int) ($row->progress_value ?? 0) < 100)
            ->values();

        // pm_due is stored as a date (e.g. "09/03/2026"); resolve it against analog_calendar.
        // Schedule status is based on pm_due only (progress_value is not a filter).
        $dueTodayReports = $currentSchedulers
            ->filter(function ($row) use ($calendar, $today) {
                [$date] = $this->resolveDue($row->pm_due, $calendar);
                return $date && $date->isSameDay($today);
            })
            ->values();

        $overdueReports = $currentSchedulers
            ->filter(function ($row) use ($calendar, $today) {
                [$date] = $this->resolveDue($row->pm_due, $calendar);
                return $date && $date->lt($today);
            })
            ->values();

        $checklistStatus = [
            ['name' => 'Completed', 'value' => $completedSchedulers->count()],
            ['name' => 'Pending',   'value' => $pendingSchedulers->count()],
        ];

        $seniortechAck = $allSchedulers->filter(fn($row) => $this->isAckPending($row->tech_ack))->count();
        $senioreeAck   = $allSchedulers->filter(fn($row) => $this->isAckPending($row->senior_ee_ack))->count();
        $esdAck        = $allSchedulers->filter(fn($row) => $this->isAckPending($row->qa_ack))->count();

        // ------------------------------------------------------------------
        // Calibration reports
        // ------------------------------------------------------------------
        $calibrationReportsCount = DB::connection('mysql')->table('calibration_report_list')
            ->whereBetween('created_at', [today()->startOfDay(), today()->endOfDay()])
            ->count();

        $latestReports = DB::connection('mysql')->table('calibration_report_list')
            ->whereBetween('created_at', [today()->startOfDay(), today()->endOfDay()])
            ->orderByDesc('created_at')
            ->limit(10)
            ->get();

        $QAforApprovalcalReportsCount = DB::connection('mysql')->table('calibration_report_list')
            ->where(function ($q) {
                $q->whereNull('qa_sign')->orWhereRaw("TRIM(qa_sign) = ''");
            })
            ->count();

        $EEforApprovalcalReportsCount = DB::connection('mysql')->table('calibration_report_list')
            ->where(function ($q) {
                $q->whereNull('review_by')->orWhereRaw("TRIM(review_by) = ''");
            })
            ->count();

        $calibrationReportsByMonth = DB::connection('mysql')->table('calibration_report_list')
            ->selectRaw('MONTHNAME(calibration_date) as month, COUNT(*) as count')
            ->groupBy('month')
            ->get();

        $eeCalforApproval = DB::connection('mysql')->table('calibration_report_list_non_tnr')
            ->where(function ($q) {
                $q->whereNull('review_by')->orWhere('review_by', '');
            })
            ->count();

        $qaCalforApproval = DB::connection('mysql')->table('calibration_report_list_non_tnr')
            ->where(function ($q) {
                $q->whereNull('qa_sign')->orWhere('qa_sign', '');
            })
            ->count();

        $eeCalVerifierStatus = [['name' => 'For Approval', 'value' => $eeCalforApproval]];
        $qaCalVerifierStatus = [['name' => 'For Approval', 'value' => $qaCalforApproval]];
        $eeVerifierStatus    = [['name' => 'For Approval', 'value' => $senioreeAck]];
        $qaVerifierStatus    = [['name' => 'For Approval', 'value' => $esdAck]];

        // ------------------------------------------------------------------
        // Machine tracker
        // ------------------------------------------------------------------
        $machineTrackerSummary = DB::connection('mysql')
            ->table('machine_tracker')
            ->get();

        $machineOverdue = $machineTrackerSummary->filter(function ($row) use ($today) {
            $d = $this->parseDueDate($row->pm_due);
            return $d && $d->lt($today);
        })->count();

        $machineDueToday = $machineTrackerSummary->filter(function ($row) use ($today) {
            $d = $this->parseDueDate($row->pm_due);
            return $d && $d->isSameDay($today);
        })->count();

        $machinePending = $machineTrackerSummary
            ->filter(fn($row) => (int) ($row->progress ?? 0) === 0)
            ->count();

        $machineInProgress = $machineTrackerSummary
            ->filter(fn($row) => (int) ($row->progress ?? 0) > 0)
            ->count();

        $machineTotal = $machineTrackerSummary->count();

        $machineProgressDistribution = [
            ['label' => '20% (1/5)', 'value' => $machineTrackerSummary->filter(fn($r) => (int) ($r->progress ?? 0) === 20)->count()],
            ['label' => '40% (2/5)', 'value' => $machineTrackerSummary->filter(fn($r) => (int) ($r->progress ?? 0) === 40)->count()],
            ['label' => '60% (3/5)', 'value' => $machineTrackerSummary->filter(fn($r) => (int) ($r->progress ?? 0) === 60)->count()],
            ['label' => '80% (4/5)', 'value' => $machineTrackerSummary->filter(fn($r) => (int) ($r->progress ?? 0) === 80)->count()],
        ];

        // ------------------------------------------------------------------
        // PM schedule — normalised items, bucketed by analog_calendar week.
        // This is a schedule board: status is derived from pm_due only.
        // progress_value is shown for reference but never filters items.
        // ------------------------------------------------------------------
        $itemsByWeek = [];   // week index => item[]
        $overdueItems = collect();
        $unmatchedWw  = collect();

        $push = function (array $item) use (&$itemsByWeek, &$overdueItems) {
            if ($item['status'] === 'overdue') {
                $overdueItems->push($item);
                return;
            }
            $itemsByWeek[$item['week_index']][] = $item;
        };

        // Source 1 — scheduler_tbl (TNR PM). pm_due is an exact date, e.g. "09/03/2026".
        foreach ($currentSchedulers as $row) {
            [$due, $idx] = $this->resolveDue($row->pm_due, $calendar);

            if ($due === null || $idx === null) {
                if (!$this->isAckPending($row->pm_due)) {
                    $unmatchedWw->push($row->pm_due);
                }
                continue;
            }

            $week   = $calendar->weekAt($idx);
            $offset = $currentIdx === null ? 0 : $idx - $currentIdx;

            $push([
                'id'          => $row->id ?? null,
                'source'      => 'tnr',
                'placement'   => 'day',            // lands on the exact due date
                'status'      => $due->lt($today) ? 'overdue' : ($offset === 0 ? 'due' : 'upcoming'),
                'title'       => $row->machine_num ?? '—',
                'control_no'  => $row->pmnt_no ?? null,
                'serial'      => $row->serial ?? null,
                'technician'  => $row->responsible_person ?? null,
                'progress'    => (int) ($row->progress_value ?? 0),
                'ww'          => $week['label'],
                'week_index'  => $idx,
                'week_start'  => $week['start'],
                'week_end'    => $week['end'],
                'offset'      => $offset,
                'due_date'    => $due->toDateString(),
                'due_label'   => $due->format('M d, Y'),
                'days_late'   => $due->lt($today) ? (int) $due->diffInDays($today) : null,
                'tech_ack'    => !$this->isAckPending($row->tech_ack ?? null),
                'ee_ack'      => !$this->isAckPending($row->senior_ee_ack ?? null),
                'qa_ack'      => !$this->isAckPending($row->qa_ack ?? null),
            ]);
        }

        // Source 2 — machine_tracker (due is an exact date).
        foreach ($machineTrackerSummary as $row) {
            [$due, $idx] = $this->resolveDue($row->pm_due, $calendar);

            if ($due === null || $idx === null) {
                continue;
            }

            $week   = $calendar->weekAt($idx);
            $offset = $currentIdx === null ? 0 : $idx - $currentIdx;

            $push([
                'id'         => $row->id ?? null,
                'source'     => 'machine',
                'placement'  => 'day',             // lands on a specific date
                'status'     => $due->lt($today) ? 'overdue' : ($offset === 0 ? 'due' : 'upcoming'),
                'title'      => $row->machine_num ?? ($row->machine_name ?? '—'),
                'control_no' => $row->control_no ?? ($row->pmnt_no ?? null),
                'serial'     => $row->serial ?? null,
                'technician' => $row->responsible_person ?? ($row->assigned_to ?? null),
                'progress'   => (int) ($row->progress ?? 0),
                'ww'         => $week['label'],
                'week_index' => $idx,
                'week_start' => $week['start'],
                'week_end'   => $week['end'],
                'offset'     => $offset,
                'due_date'   => $due->toDateString(),
                'due_label'  => $due->format('M d, Y'),
                'days_late'  => $due->lt($today) ? (int) $due->diffInDays($today) : null,
            ]);
        }

        // Week board — the next N weeks starting with the current one.
        $boardWeeks = $calendar->upcomingWeeks(self::BOARD_WEEKS);
        $pmCalendar = [];

        foreach ($boardWeeks as $offset => $week) {
            // Include overdue items that fall inside this week (e.g. earlier days of the current week).
            $items = collect($itemsByWeek[$week['index']] ?? [])
                ->merge($overdueItems->where('week_index', $week['index']))
                ->sortBy('due_date')->values()->all();

            $pmCalendar[] = [
                'ww'          => $week['label'],
                'week_index'  => $week['index'],
                'start'       => $week['start'],
                'end'         => $week['end'],
                'range_label' => $calendar->rangeLabel($week),
                'is_current'  => $offset === 0,
                'offset'      => $offset,
                'count'       => count($items),
                'items'       => $items,
            ];
        }

        // Month grid — real calendar rows, one row per analog_calendar week.
        $rangeStart = today()->copy()->startOfMonth()->subMonths(self::MONTHS_BACK);
        $rangeEnd   = today()->copy()->endOfMonth()->addMonths(self::MONTHS_FORWARD);

        $pmMonthWeeks = [];

        foreach ($calendar->weeksBetween($rangeStart, $rangeEnd) as $week) {
            $items = collect($itemsByWeek[$week['index']] ?? [])
                ->merge($overdueItems->where('week_index', $week['index']))
                ->sortBy('due_date')->values()->all();

            $pmMonthWeeks[] = [
                'ww'          => $week['label'],
                'week_index'  => $week['index'],
                'month_key'   => $calendar->monthKeyOf($week),
                'start'       => $week['start'],
                'end'         => $week['end'],
                'range_label' => $calendar->rangeLabel($week),
                'is_current'  => $currentIdx !== null && $week['index'] === $currentIdx,
                'offset'      => $currentIdx === null ? 0 : $week['index'] - $currentIdx,
                'days'        => $calendar->daysOf($week),
                'items'       => $items,
            ];
        }

        $overdueItems = $overdueItems->sortBy('due_date')->values();

        $horizonLabel = null;
        if (!empty($boardWeeks)) {
            $horizonLabel = Carbon::parse($boardWeeks[0]['start'])->format('M d')
                . ' – ' . Carbon::parse($boardWeeks[count($boardWeeks) - 1]['end'])->format('M d, Y');
        }

        return inertia('Dashboard', [
            // Summary counts
            'calibrationReportsCount'      => $calibrationReportsCount,
            'QAforApprovalcalReportsCount' => $QAforApprovalcalReportsCount,
            'EEforApprovalcalReportsCount' => $EEforApprovalcalReportsCount,
            'seniortechAck' => $seniortechAck,
            'esdAck'        => $esdAck,
            'senioreeAck'   => $senioreeAck,
            'dueSoon'       => $dueTodayReports->count(),
            'overdue'       => $overdueReports->count(),
            'tnrCompleted'  => $completedSchedulers->count(),

            // Chart data
            'calibrationReportsByMonth' => $calibrationReportsByMonth,
            'checklistStatus'           => $checklistStatus,
            'eeCalVerifierStatus'       => $eeCalVerifierStatus,
            'qaCalVerifierStatus'       => $qaCalVerifierStatus,
            'eeVerifierStatus'          => $eeVerifierStatus,
            'qaVerifierStatus'          => $qaVerifierStatus,

            // Modal tables
            'latestReports'       => $latestReports,
            'dueTodayReports'     => $dueTodayReports,
            'overdueReports'      => $overdueReports,
            'completedSchedulers' => $completedSchedulers,

            // PM schedule calendar (driven by analog_calendar on server25)
            'pmCalendar'   => $pmCalendar,
            'pmMonthWeeks' => $pmMonthWeeks,
            'pmOverdue'    => $overdueItems,
            'wwIndex'      => $calendar->frontendIndex(16),
            'currentWw'    => $currentWw,
            'pmCalendarMeta' => [
                'current_week' => $currentWw,
                'week_range'   => $calendar->currentWeek() ? $calendar->rangeLabel($calendar->currentWeek()) : null,
                'today'        => $today->toDateString(),
                'weeks'        => count($boardWeeks),
                'range_label'  => $horizonLabel,
                'month_key'    => today()->format('Y-m'),
                'due_now'      => collect($pmCalendar)->flatMap(fn($w) => $w['items'])->where('status', 'due')->count(),
                'upcoming'     => collect($pmCalendar)->flatMap(fn($w) => $w['items'])->where('status', 'upcoming')->count(),
                'overdue'      => $overdueItems->count(),
                'machines'     => $currentSchedulers->count(),
                'superseded'   => $allSchedulers->count() - $currentSchedulers->count(),
                'source'       => $calendar->isFallback() ? 'fallback' : 'analog_calendar',
                'unmatched_ww' => $unmatchedWw->unique()->values()->all(),
            ],

            // Machine tracker summary (PPC / Process Engineering)
            'machineTotal'                => $machineTotal,
            'machineDueToday'             => $machineDueToday,
            'machineOverdue'              => $machineOverdue,
            'machinePending'              => $machinePending,
            'machineInProgress'           => $machineInProgress,
            'machineProgressDistribution' => $machineProgressDistribution,
        ]);
    }

    public function extend($id)
    {
        $scheduler = DB::connection('mysql')->table('scheduler_tbl')->where('id', $id)->first();

        if (!$scheduler) {
            abort(404, 'Scheduler not found');
        }

        // TODO: add an authorization check here (e.g. Gate/Policy).

        return inertia('Tnr/Extend', [
            'scheduler' => $scheduler,
        ]);
    }
}
