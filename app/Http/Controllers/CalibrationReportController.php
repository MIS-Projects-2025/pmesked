<?php

namespace App\Http\Controllers;

use App\Models\Machine;
use App\Models\CalibrationReport;
use App\Services\DataTableService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

/**
 * CalibrationReportController
 *
 * Handles CRUD operations for calibration reports, including:
 * - Listing reports with pagination and search
 * - Creating and updating reports
 * - Generating PDF reports
 * - QA and Reviewer verification
 * - Admin edit (emp_id 1797 lang)
 */
class CalibrationReportController extends Controller
{
    /**
     * Isang employee lang ang pwedeng mag-edit ng report.
     */
    private const EDIT_EMP_ID = '1797';

    /**
     * DataTable service instance.
     */
    protected $datatable;

    public function __construct(DataTableService $datatable)
    {
        $this->datatable = $datatable;
    }

    /**
     * Si 1797 lang ang pwede mag-edit. Server ang nagde-decide.
     */
    protected function canEdit(): bool
    {
        return (string) (session('emp_data')['emp_id'] ?? '') === self::EDIT_EMP_ID;
    }

    /**
     * Gawing JSON string ang array columns KUNG walang array cast ang model.
     * (viewPdf mo kasi nagjson_decode, so malamang string ang laman ng DB column.)
     */
    protected function withJsonColumns(array $data, CalibrationReport $model): array
    {
        foreach (['cal_std_use', 'cal_details'] as $col) {
            if (array_key_exists($col, $data) && is_array($data[$col]) && !$model->hasCast($col)) {
                $data[$col] = json_encode(array_values($data[$col]));
            }
        }
        return $data;
    }

    /**
     * Array o JSON string -> array.
     */
    protected function decodeJson($value): array
    {
        if (is_array($value)) {
            return $value;
        }
        if (is_string($value) && $value !== '') {
            $decoded = json_decode($value, true);
            return is_array($decoded) ? $decoded : [];
        }
        return [];
    }

    /**
     * Display the calibration reports index page.
     */
    public function index(Request $request)
    {
        try {
            // Active machines with unique pmnt_no
            $machines = Machine::select('*')
                ->whereNotNull('machine_num')
                ->where('machine_num', '!=', '')
                ->whereIn('status', ['Active', 'ACTIVE', 'active'])
                ->whereIn('pmnt_no', function ($query) {
                    $query->select('pmnt_no')
                        ->from('machine_list')
                        ->groupBy('pmnt_no')
                        ->havingRaw('COUNT(*) = 1');
                })
                ->distinct()
                ->orderBy('id', 'desc')
                ->get();

            // Pagination and search (clamped para di ma-abuse ang perPage)
            $perPage = (int) $request->input('perPage', 10);
            $perPage = max(1, min($perPage, 100));
            $currentPage = max(1, (int) $request->input('page', 1));
            $search = $request->input('search', null);

            $reportsQuery = DB::table('calibration_report_list')
                ->orderBy('id', 'desc');

            if ($search) {
                $reportsQuery->where(function ($q) use ($search) {
                    $q->where('equipment', 'like', "%{$search}%")
                        ->orWhere('model', 'like', "%{$search}%")
                        ->orWhere('performed_by', 'like', "%{$search}%")
                        ->orWhere('qa_sign', 'like', "%{$search}%")
                        ->orWhere('review_by', 'like', "%{$search}%")
                        ->orWhere('calibration_date', 'like', "%{$search}%")
                        ->orWhere('calibration_due', 'like', "%{$search}%");
                });
            }

            $reports = $reportsQuery->paginate($perPage, ['*'], 'page', $currentPage)->withQueryString();

            // ✏️ Links for DataTable — standard Laravel format: Previous + numbers + Next.
            // Dati puro numbers lang, walang Previous/Next kaya walang mapuntahan ang arrow.
            $current = $reports->currentPage();
            $last = $reports->lastPage();
            $pageUrl = fn (int $p) => route('calibration.calibrationReport', array_merge($request->all(), ['page' => $p]));

            $links = [[
                'url' => $current > 1 ? $pageUrl($current - 1) : null,
                'label' => '&laquo; Previous',
                'active' => false,
            ]];
            for ($i = 1; $i <= $last; $i++) {
                $links[] = [
                    'url' => $i === $current ? null : $pageUrl($i),
                    'label' => (string) $i,
                    'active' => $i === $current,
                ];
            }
            $links[] = [
                'url' => $current < $last ? $pageUrl($current + 1) : null,
                'label' => 'Next &raquo;',
                'active' => false,
            ];

            // Employee data from session
            $empData = [
                'emp_id' => session('emp_data')['emp_id'] ?? null,
                'emp_name' => session('emp_data')['emp_name'] ?? null,
                'emp_jobtitle' => session('emp_data')['emp_jobtitle'] ?? null,
                // ✏️ Dati wala 'to — kaya hindi gumagana yung isQA / isEngineer sa frontend
                // (assumption: nasa session('emp_data') din ang emp_role)
                'emp_role' => session('emp_data')['emp_role'] ?? null,
                // ✏️ Ito yung binabasa ng frontend para ipakita ang Edit button
                'can_edit' => $this->canEdit(),
            ];

            return Inertia::render('Calibration/CalibrationReport', [
                'machines' => $machines,
                'reports' => [
                    'data' => $reports->items(),
                    'from' => $reports->firstItem(),
                    'to' => $reports->lastItem(),
                    'total' => $reports->total(),
                    'links' => $links,
                    'current_page' => $reports->currentPage(),
                    'last_page' => $reports->lastPage(),
                    'per_page' => $reports->perPage(),
                ],
                'tableFilters' => $request->only([
                    'search',
                    'perPage',
                    'sortBy',
                    'sortDirection',
                    'start',
                    'end',
                    'dropdownSearchValue',
                    'dropdownFields',
                ]),
                'empData' => $empData,
            ]);
        } catch (\Exception $e) {
            Log::error('Error in CalibrationReportController@index: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to load calibration reports');
        }
    }

    /**
     * Get calibration reports as JSON (for API/DataTable).
     */
    public function list()
    {
        try {
            $reports = CalibrationReport::orderBy('id', 'desc')->get();
            return response()->json($reports);
        } catch (\Exception $e) {
            Log::error('Error in CalibrationReportController@list: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch reports'], 500);
        }
    }

    /**
     * Store a new calibration report.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'equipment' => 'required|string|max:255',
            'model' => 'nullable|string|max:255',
            'serial' => 'nullable|string|max:255',
            'control_no' => 'nullable|string|max:255',
            'manufacturer' => 'nullable|string|max:255',
            'calibration_date' => 'required|string|max:255',
            'calibration_due' => 'nullable|string|max:255',
            'performed_by' => 'required|string|max:255',
            'temperature' => 'nullable|string|max:255',
            'relative_humidity' => 'nullable|string|max:255',
            'specs' => 'nullable|string|max:255',
            'report_no' => 'nullable|string|max:255',
            'cal_interval' => 'nullable|string|max:255',
            'cal_std_use' => 'nullable|array',
            'cal_details' => 'nullable|array',
        ]);

        try {
            $report = new CalibrationReport();
            $report->forceFill($this->withJsonColumns($validated, $report))->save();

            return redirect()->back()->with('success', 'Calibration Report saved successfully!');
        } catch (\Exception $e) {
            Log::error('Error in CalibrationReportController@store: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to save calibration report')->withInput();
        }
    }

    /**
     * Display the specified calibration report.
     */
    public function show(CalibrationReport $calibrationReport)
    {
        try {
            return response()->json($calibrationReport);
        } catch (\Exception $e) {
            Log::error('Error in CalibrationReportController@show: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch report'], 500);
        }
    }

    /**
     * Update the specified calibration report (JSON/API).
     */
    public function update(Request $request, CalibrationReport $calibrationReport)
    {
        $data = $this->validateData($request);

        try {
            $calibrationReport->forceFill($this->withJsonColumns($data, $calibrationReport))->save();
            return response()->json($calibrationReport);
        } catch (\Exception $e) {
            Log::error('Error in CalibrationReportController@update: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to update report'], 500);
        }
    }

    /**
     * ✏️ Admin edit — emp_id 1797 lang. Lahat ng data editable (pati verifiers).
     * Order pa rin ang rule: QA → Reviewer.
     */
    public function adminUpdate(Request $request, CalibrationReport $calibrationReport)
    {
        if (!$this->canEdit()) {
            abort(403, 'You are not allowed to edit calibration reports.');
        }

        // Walang verification restriction — pwede i-edit lahat ng report ni 1797,
        // kahit hindi pa fully verified.

        $data = $request->validate([
            'equipment' => 'required|string|max:255',
            'manufacturer' => 'nullable|string|max:255',
            'control_no' => 'nullable|string|max:255',
            'performed_by' => 'required|string|max:255',
            'model' => 'nullable|string|max:255',
            'serial' => 'nullable|string|max:255',
            'calibration_date' => 'required|string|max:255',
            'calibration_due' => 'nullable|string|max:255',
            'temperature' => 'nullable|string|max:255',
            'relative_humidity' => 'nullable|string|max:255',
            'specs' => 'nullable|string|max:255',
            'report_no' => 'nullable|string|max:255',
            'cal_interval' => 'nullable|string|max:255',
            'cal_std_use' => 'nullable|array',
            'cal_std_use.*' => 'array',
            'cal_details' => 'nullable|array',
            'cal_details.*' => 'array',
            'qa_sign' => 'nullable|string|max:255',
            'qa_sign_date' => 'nullable|date',
            'review_by' => 'nullable|string|max:255',
            'review_date' => 'nullable|date',
        ]);

        // Verifiers — blangko ang pangalan = tanggal ang verification.
        // Kapag walang QA, automatic na walang Reviewer din (QA → Reviewer order).
        $qa = trim((string) ($data['qa_sign'] ?? ''));
        $rv = trim((string) ($data['review_by'] ?? ''));

        if ($qa === '') {
            $qa = null;
            $qaDate = null;
            $rv = null;
            $rvDate = null;
        } else {
            $qaDate = !empty($data['qa_sign_date']) ? $data['qa_sign_date'] : now();
            if ($rv === '') {
                $rv = null;
                $rvDate = null;
            } else {
                $rvDate = !empty($data['review_date']) ? $data['review_date'] : now();
            }
        }

        $data['qa_sign'] = $qa;
        $data['qa_sign_date'] = $qaDate;
        $data['review_by'] = $rv;
        $data['review_date'] = $rvDate;

        try {
            $calibrationReport->forceFill($this->withJsonColumns($data, $calibrationReport))->save();

            Log::info('Calibration report #' . $calibrationReport->id . ' edited by emp_id ' . (session('emp_data')['emp_id'] ?? 'unknown'));

            return back()->with('success', 'Calibration Report updated successfully!');
        } catch (\Exception $e) {
            Log::error('Error in CalibrationReportController@adminUpdate: ' . $e->getMessage());
            return back()->with('error', 'Failed to update calibration report');
        }
    }

    /**
     * Remove the specified calibration report.
     */
    public function destroy($id)
    {
        try {
            DB::connection('mysql')->table('calibration_report_list')->where('id', $id)->delete();
            return redirect()->back()->with('success', 'Report removed successfully!');
        } catch (\Exception $e) {
            Log::error('Error in CalibrationReportController@destroy: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to delete report');
        }
    }

    /**
     * Validate request data for update.
     */
    protected function validateData(Request $request)
    {
        return $request->validate([
            'equipment' => 'required|string|max:255',
            'model' => 'nullable|string|max:255',
            'serial' => 'nullable|string|max:255',
            'manufacturer' => 'nullable|string|max:255',
            'control_no' => 'nullable|string|max:255',
            'calibration_date' => 'nullable|string|max:255',
            'calibration_due' => 'nullable|string|max:255',
            'performed_by' => 'nullable|string|max:255',
            'temperature' => 'nullable|string|max:255',
            'relative_humidity' => 'nullable|string|max:255',
            'specs' => 'nullable|string|max:255',
            'report_no' => 'nullable|string|max:255',
            'cal_interval' => 'nullable|string|max:255',
            'cal_std_use' => 'nullable|array',
            'cal_details' => 'nullable|array',
        ]);
    }

    /**
     * Verify the calibration report by QA.
     */
    public function verifyQA(CalibrationReport $report)
    {
        try {
            // Guard: wag ma-overwrite kung may QA na
            if (trim((string) $report->qa_sign) !== '') {
                return back()->with('error', 'Report is already verified by QA.');
            }

            $report->qa_sign = session('emp_data')['emp_name'] ?? null;
            $report->qa_sign_date = now();
            $report->save();

            return back()->with('success', 'Report verified by QA!');
        } catch (\Exception $e) {
            Log::error('Error in CalibrationReportController@verifyQA: ' . $e->getMessage());
            return back()->with('error', 'Failed to verify report by QA');
        }
    }

    /**
     * Verify the calibration report by Reviewer.
     */
    public function verifyReviewer(CalibrationReport $report)
    {
        try {
            // Guard: QA muna bago Reviewer, at wag ma-overwrite
            if (trim((string) $report->qa_sign) === '') {
                return back()->with('error', 'QA verification is required first.');
            }
            if (trim((string) $report->review_by) !== '') {
                return back()->with('error', 'Report is already verified by Reviewer.');
            }

            $report->review_by = session('emp_data')['emp_name'] ?? null;
            $report->review_date = now();
            $report->save();

            return back()->with('success', 'Report verified by Reviewer!');
        } catch (\Exception $e) {
            Log::error('Error in CalibrationReportController@verifyReviewer: ' . $e->getMessage());
            return back()->with('error', 'Failed to verify report by Reviewer');
        }
    }

    /**
     * Generate and view PDF for a calibration report.
     */
    public function viewPdf($id)
    {
        try {
            $calibration = CalibrationReport::findOrFail($id);

            $cal_std_use = $this->decodeJson($calibration->cal_std_use);
            $cal_details = $this->decodeJson($calibration->cal_details);

            $pdf = Pdf::loadView('pdf.calibration', [
                'report' => $calibration,
                'calibration' => $calibration,
                'cal_std_use' => $cal_std_use,
                'cal_details' => $cal_details,
            ]);

            return $pdf->stream("calibration_{$id}.pdf");
        } catch (\Exception $e) {
            Log::error('Error in CalibrationReportController@viewPdf: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to generate PDF');
        }
    }
}
