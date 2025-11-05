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
        // dd(DB::connection()->getName());

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
        $calibrationReportsCount = DB::table('calibration_report_list')
            ->whereBetween('created_at', [
                today()->startOfDay(),
                today()->endOfDay()
            ])
            ->count();
        $latestReports = DB::table('calibration_report_list')
            ->orderByDesc('created_at')
            ->whereBetween('created_at', [
                today()->startOfDay(),
                today()->endOfDay()
            ])
            ->limit(10)
            ->get();

        $QAforApprovalcalReportsCount = DB::table('calibration_report_list')
            ->where(function ($q) {
                $q->whereNull('qa_sign')
                    ->orWhereRaw("TRIM(qa_sign) = ''");
            })
            ->count();

        $EEforApprovalcalReportsCount = DB::table('calibration_report_list')
            ->where(function ($q) {
                $q->whereNull('review_by')
                    ->orWhereRaw("TRIM(review_by) = ''");
            })
            ->count();

        $seniortechAck = DB::table('scheduler_tbl')
            ->where(function ($q) {
                $q->whereNull('tech_ack')
                    ->orWhereRaw("TRIM(tech_ack) = ''");
            })
            ->count();


        $esdAck = DB::table('scheduler_tbl')
            ->whereNull('qa_ack')
            ->orWhere('qa_ack', '')
            ->count();

        $senioreeAck = DB::table('scheduler_tbl')
            ->whereNull('senior_ee_ack')
            ->orWhere('senior_ee_ack', '')
            ->count();


        // 🔹 Calibration reports grouped per month (for chart)
        $calibrationReportsByMonth = DB::table('calibration_report_list')
            ->selectRaw('MONTHNAME(calibration_date) as month, COUNT(*) as count')
            ->groupBy('month')
            ->get();



        // 🔹 Checklist status (for bar chart)
        $checklistStatus = [
            ['name' => 'Completed', 'value' => $completedSchedulers->count()],
            ['name' => 'Pending', 'value' => DB::table('scheduler_tbl')->where('progress_value', '<', 100)->count()],
        ];


        //para sa chart ng verifier tnr scheduler
        //technician verifier
        $eeCalforApproval = DB::table('calibration_report_list_non_tnr')
            ->whereNull('review_by')
            ->orWhere('review_by', '')
            ->count();

        $eeCalVerifierStatus = [
            ['name' => 'For Approval', 'value' => $eeCalforApproval],
        ];

        $qaCalforApproval = DB::table('calibration_report_list_non_tnr')
            ->whereNull('qa_sign')
            ->orWhere('qa_sign', '')
            ->count();

        $qaCalVerifierStatus = [
            ['name' => 'For Approval', 'value' => $qaCalforApproval],
        ];

        $eeforApproval = DB::table('scheduler_tbl')
            ->whereNull('senior_ee_ack')
            ->orWhere('senior_ee_ack', '')
            ->count();

        $eeVerifierStatus = [
            ['name' => 'For Approval', 'value' => $eeforApproval],
        ];

        //technician verifier
        $qaforApproval = DB::table('scheduler_tbl')
            ->whereNull('qa_ack')
            ->orWhere('qa_ack', '')
            ->count();

        $qaVerifierStatus = [
            ['name' => 'For Approval', 'value' => $qaforApproval],
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

            // verifier Chart
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
