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
 */
class CalibrationReportController extends Controller
{
    /**
     * DataTable service instance.
     */
    protected $datatable;

    /**
     * Create a new controller instance.
     *
     * @param DataTableService $datatable
     */
    public function __construct(DataTableService $datatable)
    {
        $this->datatable = $datatable;
    }

    /**
     * Display the calibration reports index page.
     *
     * @param Request $request
     * @return \Inertia\Response
     */
    public function index(Request $request)
    {
        try {
            // Get machines for dropdown (only active machines with unique pmnt_no)
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

            // Pagination and search parameters
            $perPage = $request->input('perPage', 10);
            $currentPage = $request->input('page', 1);
            $search = $request->input('search', null);

            // Base query for calibration reports
            $reportsQuery = DB::table('calibration_report_list')
                ->orderBy('id', 'desc');

            // Apply search filter
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

            // Paginate results
            $reports = $reportsQuery->paginate($perPage, ['*'], 'page', $currentPage)->withQueryString();

            // Format links for DataTable
            $links = [];
            for ($i = 1; $i <= $reports->lastPage(); $i++) {
                $links[] = [
                    'url' => $i === $reports->currentPage() ? null : route('calibration.calibrationReport', array_merge($request->all(), ['page' => $i])),
                    'label' => (string)$i,
                    'active' => $i === $reports->currentPage(),
                ];
            }

            // Get employee data from session
            $empData = [
                'emp_id' => session('emp_data')['emp_id'] ?? null,
                'emp_name' => session('emp_data')['emp_name'] ?? null,
                'emp_jobtitle' => session('emp_data')['emp_jobtitle'] ?? null,
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
     *
     * @return \Illuminate\Http\JsonResponse
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
     *
     * @param Request $request
     * @return \Illuminate\Http\RedirectResponse
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
            CalibrationReport::create($validated);
            return redirect()->back()->with('success', 'Calibration Report saved successfully!');
        } catch (\Exception $e) {
            Log::error('Error in CalibrationReportController@store: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to save calibration report')->withInput();
        }
    }

    /**
     * Display the specified calibration report.
     *
     * @param CalibrationReport $calibrationReport
     * @return \Illuminate\Http\JsonResponse
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
     * Update the specified calibration report.
     *
     * @param Request $request
     * @param CalibrationReport $calibrationReport
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, CalibrationReport $calibrationReport)
    {
        $data = $this->validateData($request);

        try {
            $calibrationReport->update($data);
            return response()->json($calibrationReport);
        } catch (\Exception $e) {
            Log::error('Error in CalibrationReportController@update: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to update report'], 500);
        }
    }

    /**
     * Remove the specified calibration report.
     *
     * @param int $id
     * @return \Illuminate\Http\RedirectResponse
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
     * Validate request data for store/update.
     *
     * @param Request $request
     * @return array
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
     *
     * @param CalibrationReport $report
     * @return \Illuminate\Http\RedirectResponse
     */
    public function verifyQA(CalibrationReport $report)
    {
        try {
            $report->qa_sign = session('emp_data')['emp_name'] ?? null;
            $report->qa_sign_date = now();
            $report->save();

            return back()->with([
                'success' => 'Report verified by QA!',
                'updatedReport' => $report
            ]);
        } catch (\Exception $e) {
            Log::error('Error in CalibrationReportController@verifyQA: ' . $e->getMessage());
            return back()->with('error', 'Failed to verify report by QA');
        }
    }

    /**
     * Verify the calibration report by Reviewer.
     *
     * @param CalibrationReport $report
     * @return \Illuminate\Http\RedirectResponse
     */
    public function verifyReviewer(CalibrationReport $report)
    {
        try {
            $report->review_by = session('emp_data')['emp_name'] ?? null;
            $report->review_date = now();
            $report->save();

            return back()->with([
                'success' => 'Report verified by Reviewer!',
                'updatedReport' => $report
            ]);
        } catch (\Exception $e) {
            Log::error('Error in CalibrationReportController@verifyReviewer: ' . $e->getMessage());
            return back()->with('error', 'Failed to verify report by Reviewer');
        }
    }

    /**
     * Generate and view PDF for a calibration report.
     *
     * @param int $id
     * @return \Symfony\Component\HttpFoundation\StreamedResponse
     */
    public function viewPdf($id)
    {
        try {
            $calibration = CalibrationReport::findOrFail($id);

            $cal_std_use = $calibration->cal_std_use ? json_decode($calibration->cal_std_use, true) : [];
            $cal_details = $calibration->cal_details ? json_decode($calibration->cal_details, true) : [];

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
