<?php

namespace App\Http\Controllers\tnr;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\CalibrationReport;
use Inertia\Inertia;

class CalibrationMassApprovedController extends Controller
{
    // 🔹 View Mass Approval Page
    public function index()
    {
        $empData = session('emp_data');
        $jobTitle = $empData['emp_jobtitle'] ?? null;

        $query = CalibrationReport::query();

        // ✅ Kung ESD (QA roles) → makita lang kung qa_sign = NULL/empty at review_by = NULL/empty
        if (in_array($jobTitle, ["ESD Technician 1", "ESD Technician 2", "Senior QA Engineer", "DIC Clerk 1"])) {
            $query->where(function ($q) {
                $q->whereNull('qa_sign')
                    ->orWhere('qa_sign', '');
            })
                ->where(function ($q) {
                    $q->whereNull('review_by')
                        ->orWhere('review_by', '');
                });
        }

        // ✅ Kung Engineer roles → makita lang kung qa_sign ≠ NULL/empty at review_by = NULL/empty
        if (in_array($jobTitle, [
            "Equipment Engineer",
            "Supervisor - Equipment Technician",
            "Senior Equipment Engineer",
            "Sr. Equipment Engineer",
            "Equipment Engineering Section Head",
            "Section Head - Equipment Engineering"
        ])) {
            $query->where(function ($q) {
                $q->whereNotNull('qa_sign')
                    ->where('qa_sign', '!=', '');
            })
                ->where(function ($q) {
                    $q->whereNull('review_by')
                        ->orWhere('review_by', '');
                });
        }

        $reports = $query->get();

        return Inertia::render('Calibration/calibrationReportMassApproved', [
            'reports' => $reports,
            'empData' => $empData,
        ]);
    }

    // 🔹 Mass Approve Action
    public function approve(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:calibration_report_list,id',
        ]);

        CalibrationReport::whereIn('id', $request->ids)->update([
            'qa_sign'      => session('emp_data')['emp_name'] ?? null,
            'qa_sign_date' => now(),
        ]);

        return redirect()->back()->with('success', 'Calibration Report saved successfully!');
    }
}
