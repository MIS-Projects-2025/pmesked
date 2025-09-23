<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class DashboardController extends Controller
{
    /**
     * Convert workweek number (WW501 onwards) to start/end date
     */
    private function getWeekDateRange($weekNumber)
    {
        // WW501 = Nov 3, 2024 (Sunday start)
        $baseDate = Carbon::create(2024, 11, 3)->startOfDay();

        // ilang linggo mula base
        $offsetWeeks = $weekNumber - 501;

        $weekStart = $baseDate->copy()->addWeeks($offsetWeeks);
        $weekEnd   = $weekStart->copy()->addDays(6)->endOfDay();

        return [$weekStart, $weekEnd];
    }

    public function index()
    {
        // 🔹 Compute current workweek number
        $baseDate = Carbon::create(2024, 11, 3)->startOfDay();
        $currentWeek = 501 + (int) $baseDate->diffInWeeks(now()->startOfDay());

        // 🔹 Scheduler (TNR PM Checklists)
        $dueTodayReports = DB::table('scheduler_tbl')
            ->whereRaw("CAST(SUBSTRING(pm_due, 3) AS UNSIGNED) = ?", [$currentWeek]) // next WW
            ->get();

        $overdueReports = DB::table('scheduler_tbl')
            ->whereRaw("CAST(SUBSTRING(pm_due, 3) AS UNSIGNED) < ?", [$currentWeek]) // before current WW
            ->get();

        $completedSchedulers = DB::table('scheduler_tbl')
            ->where('progress_value', 100)
            ->get();

        // 🔹 Calibration Reports
        $calibrationReportsCount = DB::table('calibration_report_list')->count();
        $latestReports = DB::table('calibration_report_list')
            ->orderByDesc('created_at')
            ->limit(10)
            ->get();

        // 🔹 Calibration reports grouped per month (for chart)
        $calibrationReportsByMonth = DB::table('calibration_report_list')
            ->selectRaw('MONTHNAME(calibration_date) as month, COUNT(*) as count')
            ->groupBy('month')
            ->get();


        // dd([
        //     'currentWeek' => $currentWeek,
        //     'dueSoon_sql' => DB::table('scheduler_tbl')
        //         ->whereRaw("CAST(SUBSTRING(pm_due, 3) AS UNSIGNED) = ?", [$currentWeek + 1])
        //         ->toSql(),

        //     'overdue_sql' => DB::table('scheduler_tbl')
        //         ->whereRaw("CAST(SUBSTRING(pm_due, 3) AS UNSIGNED) < ?", [$currentWeek])
        //         ->toSql(),

        //     'dueTodayReports' => $dueTodayReports->pluck('pm_due'),
        //     'overdueReports' => $overdueReports->pluck('pm_due'),
        // ]);

        // 🔹 Checklist status (for pie chart)
        $checklistStatus = [
            ['name' => 'Completed', 'value' => $completedSchedulers->count()],
            ['name' => 'Pending', 'value' => DB::table('scheduler_tbl')->where('progress_value', '<', 100)->count()],
        ];

        return inertia('Dashboard', [
            // Summary counts
            'calibrationReportsCount' => $calibrationReportsCount,
            'dueSoon' => $dueTodayReports->count(),
            'overdue' => $overdueReports->count(),
            'tnrCompleted' => $completedSchedulers->count(),

            // Chart data
            'calibrationReportsByMonth' => $calibrationReportsByMonth,
            'checklistStatus' => $checklistStatus,

            // Data for modal tables
            'latestReports' => $latestReports,
            'dueTodayReports' => $dueTodayReports,
            'overdueReports' => $overdueReports,
            'completedSchedulers' => $completedSchedulers,

            // Debug info
            'currentWeek' => $currentWeek,
        ]);
    }

    public function extend($id)
    {
        $scheduler = DB::table('scheduler_tbl')->where('id', $id)->first();

        if (!$scheduler) {
            abort(404, 'Scheduler not found');
        }

        return inertia('Tnr/Extend', [
            'scheduler' => $scheduler
        ]);
    }
}
