<?php

namespace App\Http\Controllers\ionizer;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\IonizerCalibrationReport;
use Inertia\Inertia;

class IonizerCalibrationMassApprovedController extends Controller
{
    // 🔹 View Mass Approval Page
    public function index()
    {
        $empData = session('emp_data');
        $jobTitle = $empData['emp_jobtitle'] ?? null;

        $query = IonizerCalibrationReport::query();

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

        return Inertia::render('Calibration/IonizerCalibrationReportMassApproved', [
            'reports' => $reports,
            'empData' => $empData,
        ]);
    }

    // 🔹 Mass Approve Action
    public function nonTnrapproveQA(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:calibration_report_list_non_tnr,id',
        ]);

        IonizerCalibrationReport::whereIn('id', $request->ids)->update([
            'qa_sign'      => session('emp_data')['emp_name'] ?? null,
            'qa_sign_date' => now(),
        ]);

        return redirect()->back()->with('success', 'Calibration Report saved successfully!');
    }

    public function nonTnrapproveEE(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:calibration_report_list_non_tnr,id',
        ]);

        IonizerCalibrationReport::whereIn('id', $request->ids)->update([
            'review_by'      => session('emp_data')['emp_name'] ?? null,
            'review_date' => now(),
        ]);

        return redirect()->back()->with('success', 'Calibration Report saved successfully!');
    }
}
