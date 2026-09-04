<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Carbon\Carbon;

class DashboardController extends Controller
{
    /**
     * Convert a workweek code (e.g. "WW501") into a Carbon date.
     * WW501 = Nov 3, 2024 (the reference week).
     *
     * NOTE: this mirrors the JS `parseWWToDate()` on the frontend.
     * Keep both in sync if the base week/date ever changes.
     */
    private function wwToDate(?string $ww): ?Carbon
    {
        if (!$ww || !str_starts_with($ww, 'WW')) {
            return null;
        }

        $weekNum = (int) substr($ww, 2);
        if ($weekNum <= 0) {
            return null;
        }

        $baseWeek = 501;
        $baseDate = Carbon::create(2024, 11, 3)->startOfDay();
        $diffWeeks = $weekNum - $baseWeek;

        return $baseDate->copy()->addWeeks($diffWeeks);
    }

    /**
     * "empty" here means null OR a whitespace-only string.
     */
    private function isAckPending($value): bool
    {
        return $value === null || trim((string) $value) === '';
    }

    public function index()
    {
        // 🔹 Current workweek number, used only for the debug payload below.
        $baseDate = Carbon::create(2024, 11, 3)->startOfDay();
        $currentWeek = 501 + (int) $baseDate->diffInWeeks(now()->startOfDay());

        // 🔹 Pull scheduler_tbl ONCE and derive everything else from the
        // collection in PHP. Previously this table was queried 5 separate
        // times (due today, overdue, completed, tech ack, ee ack, qa ack)
        // with overlapping/duplicate conditions.
        $allSchedulers = DB::connection('mysql')->table('scheduler_tbl')->get();
        $today = today()->startOfDay();

        $dueTodayReports = $allSchedulers
            ->filter(function ($row) use ($today) {
                $due = $this->wwToDate($row->pm_due);
                return $due && $due->isSameDay($today);
            })
            ->values();

        $overdueReports = $allSchedulers
            ->filter(function ($row) use ($today) {
                $due = $this->wwToDate($row->pm_due);
                return $due && $due->lt($today);
            })
            ->values();

        $completedSchedulers = $allSchedulers
            ->filter(fn ($row) => (int) ($row->progress_value ?? 0) === 100)
            ->values();

        $pendingSchedulersCount = $allSchedulers
            ->filter(fn ($row) => (int) ($row->progress_value ?? 0) < 100)
            ->count();

        $checklistStatus = [
            ['name' => 'Completed', 'value' => $completedSchedulers->count()],
            ['name' => 'Pending', 'value' => $pendingSchedulersCount],
        ];

        // Acknowledgement pending counts (tech / senior EE / QA), all derived
        // from the single $allSchedulers collection above.
        $seniortechAck = $allSchedulers->filter(fn ($row) => $this->isAckPending($row->tech_ack))->count();
        $senioreeAck = $allSchedulers->filter(fn ($row) => $this->isAckPending($row->senior_ee_ack))->count();
        $esdAck = $allSchedulers->filter(fn ($row) => $this->isAckPending($row->qa_ack))->count();

        // 🔹 Calibration Reports (TNR table)
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

        // 🔹 Calibration reports grouped per month (for a future trend chart;
        // currently unused by the frontend — kept here since it's cheap and
        // already wired up, in case you want to add the chart back).
        $calibrationReportsByMonth = DB::connection('mysql')->table('calibration_report_list')
            ->selectRaw('MONTHNAME(calibration_date) as month, COUNT(*) as count')
            ->groupBy('month')
            ->get();

        // 🔹 Non-TNR calibration reports pending approval (separate table,
        // separate concern from the scheduler acks above).
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

        // 🔹 TNR PM acknowledgement status, reusing the counts already
        // computed above instead of re-querying scheduler_tbl with the exact
        // same conditions ($eeforApproval/$qaforApproval used to duplicate
        // $senioreeAck/$esdAck respectively).
        $eeVerifierStatus = [['name' => 'For Approval', 'value' => $senioreeAck]];
        $qaVerifierStatus = [['name' => 'For Approval', 'value' => $esdAck]];

        // 🔹 Machine Tracker Summary — exclude fully completed (progress = 100)
$machineTrackerSummary = DB::connection('mysql')
    ->table('machine_tracker')
    ->where('progress', '<', 100)  // ✅ tanggalin na yung completed
    ->get();

$machineOverdue = $machineTrackerSummary->filter(function ($row) use ($today) {
    return $row->pm_due && \Carbon\Carbon::parse($row->pm_due)->startOfDay()->lt($today);
})->count();

$machineDueToday = $machineTrackerSummary->filter(function ($row) use ($today) {
    return $row->pm_due && \Carbon\Carbon::parse($row->pm_due)->isSameDay($today);
})->count();

// Pending = walang kahit isang activity na nagawa (progress = 0)
$machinePending = $machineTrackerSummary
    ->filter(fn($row) => (int)($row->progress ?? 0) === 0)
    ->count();

// In Progress = may nagawa nang kahit isa pero hindi pa tapos (1–99)
$machineInProgress = $machineTrackerSummary
    ->filter(fn($row) => (int)($row->progress ?? 0) > 0)
    ->count();

$machineTotal = $machineTrackerSummary->count();

// Progress level distribution (20, 40, 60, 80 only — 100 excluded na)
$machineProgressDistribution = [
    ['label' => '20% (1/5)',  'value' => $machineTrackerSummary->filter(fn($r) => (int)($r->progress ?? 0) === 20)->count()],
    ['label' => '40% (2/5)',  'value' => $machineTrackerSummary->filter(fn($r) => (int)($r->progress ?? 0) === 40)->count()],
    ['label' => '60% (3/5)',  'value' => $machineTrackerSummary->filter(fn($r) => (int)($r->progress ?? 0) === 60)->count()],
    ['label' => '80% (4/5)',  'value' => $machineTrackerSummary->filter(fn($r) => (int)($r->progress ?? 0) === 80)->count()],
];

        return inertia('Dashboard', [
            // Summary counts
            'calibrationReportsCount' => $calibrationReportsCount,
            'QAforApprovalcalReportsCount' => $QAforApprovalcalReportsCount,
            'EEforApprovalcalReportsCount' => $EEforApprovalcalReportsCount,
            'seniortechAck' => $seniortechAck,
            'esdAck' => $esdAck,
            'senioreeAck' => $senioreeAck,
            'dueSoon' => $dueTodayReports->count(),
            'overdue' => $overdueReports->count(),
            'tnrCompleted' => $completedSchedulers->count(),

            // Chart data
            'calibrationReportsByMonth' => $calibrationReportsByMonth,
            'checklistStatus' => $checklistStatus,

            // verifier chart data
            'eeCalVerifierStatus' => $eeCalVerifierStatus,
            'qaCalVerifierStatus' => $qaCalVerifierStatus,
            'eeVerifierStatus' => $eeVerifierStatus,
            'qaVerifierStatus' => $qaVerifierStatus,

            // Data for modal tables
            'latestReports' => $latestReports,
            'dueTodayReports' => $dueTodayReports,
            'overdueReports' => $overdueReports,
            'completedSchedulers' => $completedSchedulers,

            // Debug info
            'currentWeek' => $currentWeek,

            // Machine Tracker summary (PPC / Process Engineering)
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

        // TODO: add an authorization check here (e.g. Gate/Policy) so that
        // only the appropriate role can open another user's scheduler entry.

        return inertia('Tnr/Extend', [
            'scheduler' => $scheduler,
        ]);
    }
}
