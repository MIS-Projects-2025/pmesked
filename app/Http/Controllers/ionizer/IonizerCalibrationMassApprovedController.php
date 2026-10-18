<?php

namespace App\Http\Controllers\ionizer;

use App\Http\Controllers\Controller;
use App\Models\IonizerCalibrationReport;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class IonizerCalibrationMassApprovedController extends Controller
{
    // QA roles: approve first (qa_sign)
    private const QA_TITLES = [
        'ESD Technician 1',
        'ESD Technician 2',
        'Senior QA Engineer',
        'DIC Clerk 1',
    ];

    // Engineer roles: approve after QA (review_by)
    private const ENGINEER_TITLES = [
        'Equipment Engineer',
        'Supervisor - Equipment Technician',
        'Senior Equipment Engineer',
        'Sr. Equipment Engineer',
        'Equipment Engineering Section Head',
        'Section Head - Equipment Engineering',
    ];

    // 🔹 View Mass Approval Page
    public function index()
    {
        $empData = session('emp_data');
        $jobTitle = $empData['emp_jobtitle'] ?? null;

        $query = IonizerCalibrationReport::query();

        // ✅ QA roles → only reports with qa_sign empty and review_by empty
        if (in_array($jobTitle, self::QA_TITLES)) {
            $query->where(function ($q) {
                $q->whereNull('qa_sign')
                    ->orWhere('qa_sign', '');
            })
                ->where(function ($q) {
                    $q->whereNull('review_by')
                        ->orWhere('review_by', '');
                });
        }

        // ✅ Engineer roles → only reports with qa_sign filled and review_by empty
        if (in_array($jobTitle, self::ENGINEER_TITLES)) {
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

    // 🔹 Mass Approve (QA)
    public function nonTnrapproveQA(Request $request): RedirectResponse
    {
        abort_unless($this->isQa(), 403, 'You are not allowed to approve as QA.');

        $ids = $this->validatedIds($request);

        // Only reports that still need QA approval
        $updated = IonizerCalibrationReport::whereIn('id', $ids)
            ->where(function ($q) {
                $q->whereNull('qa_sign')->orWhere('qa_sign', '');
            })
            ->where(function ($q) {
                $q->whereNull('review_by')->orWhere('review_by', '');
            })
            ->update([
                'qa_sign'      => session('emp_data')['emp_name'] ?? null,
                'qa_sign_date' => now(),
            ]);

        return $this->result($updated, count($ids));
    }

    // 🔹 Mass Approve (Engineer / Reviewer)
    public function nonTnrapproveEE(Request $request): RedirectResponse
    {
        abort_unless($this->isEngineer(), 403, 'You are not allowed to approve as Engineer.');

        $ids = $this->validatedIds($request);

        // Only reports already signed by QA and not yet reviewed
        $updated = IonizerCalibrationReport::whereIn('id', $ids)
            ->where(function ($q) {
                $q->whereNotNull('qa_sign')->where('qa_sign', '!=', '');
            })
            ->where(function ($q) {
                $q->whereNull('review_by')->orWhere('review_by', '');
            })
            ->update([
                'review_by'   => session('emp_data')['emp_name'] ?? null,
                'review_date' => now(),
            ]);

        return $this->result($updated, count($ids));
    }

    /**
     * Validate the selected IDs against the Ionizer report table
     * (taken from the model, including its connection).
     *
     * @return array<int,int>
     */
    private function validatedIds(Request $request): array
    {
        $model = new IonizerCalibrationReport();
        $connection = $model->getConnectionName();
        $table = ($connection ? $connection . '.' : '') . $model->getTable();

        return $request->validate([
            'ids'   => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'distinct', Rule::exists($table, $model->getKeyName())],
        ])['ids'];
    }

    private function result(int $updated, int $selected): RedirectResponse
    {
        if ($updated === 0) {
            return back()->withErrors([
                'ids' => 'None of the selected reports can be approved. They may already be signed or are not ready for your approval.',
            ]);
        }

        $message = $updated === $selected
            ? 'Selected calibration reports approved successfully!'
            : "{$updated} of {$selected} reports approved. The rest were skipped (already signed or not ready).";

        return back()->with('success', $message);
    }

    private function isQa(): bool
    {
        $emp = (array) session('emp_data', []);

        return in_array($emp['emp_jobtitle'] ?? null, self::QA_TITLES, true)
            || ($emp['emp_role'] ?? null) === 'esd';
    }

    private function isEngineer(): bool
    {
        $emp = (array) session('emp_data', []);

        return in_array($emp['emp_jobtitle'] ?? null, self::ENGINEER_TITLES, true)
            || ($emp['emp_role'] ?? null) === 'engineer';
    }
}
