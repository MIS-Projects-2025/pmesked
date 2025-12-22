<?php
// app/Http/Controllers/CalibrationReportController.php
namespace App\Http\Controllers;

use App\Models\Machine;
use App\Models\CalibrationReport;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\DB;
use App\Services\DataTableService;

class CalibrationReportController extends Controller
{

    protected $datatable;
    protected $datatable1;

    public function __construct(DataTableService $datatable)
    {
        $this->datatable = $datatable;
    }

    // 📌 Inertia page (UI)
    public function index(Request $request)
    {
        // 🔹 Machines for dropdown
        $machines = Machine::select('*')
            ->whereNotNull('machine_num')
            ->where('machine_num', '!=', '')
            ->distinct()
            ->orderBy('machine_platform', 'asc')
            ->get();

        // 🔹 Pagination & search params
        $perPage = $request->input('perPage', 10); // default 10 entries per page
        $currentPage = $request->input('page', 1);
        $search = $request->input('search', null);

        // 🔹 Base query
        $reportsQuery = DB::table('calibration_report_list')
            ->orderBy('id', 'desc');

        // 🔹 Search filter
        if ($search) {
            $reportsQuery->where(function ($q) use ($search) {
                $q->where('equipment', 'like', "%$search%")
                    ->orWhere('model', 'like', "%$search%")
                    ->orWhere('performed_by', 'like', "%$search%")
                    ->orWhere('qa_sign', 'like', "%$search%")
                    ->orWhere('review_by', 'like', "%$search%")
                    ->orWhere('calibration_date', 'like', "%$search%")
                    ->orWhere('calibration_due', 'like', "%$search%");
            });
        }

        // 🔹 Paginate results
        $reports = $reportsQuery->paginate($perPage, ['*'], 'page', $currentPage)->withQueryString();

        // 🔹 Format links for DataTable
        $links = [];
        for ($i = 1; $i <= $reports->lastPage(); $i++) {
            $links[] = [
                'url' => $i === $reports->currentPage() ? null : route('calibration.calibrationReport', array_merge($request->all(), ['page' => $i])),
                'label' => (string)$i,
                'active' => $i === $reports->currentPage(),
            ];
        }

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
            'empData' => [
                'emp_id' => session('emp_data')['emp_id'] ?? null,
                'emp_name' => session('emp_data')['emp_name'] ?? null,
                'emp_jobtitle' => session('emp_data')['emp_jobtitle'] ?? null
            ],
        ]);
    }

    // 📌 API: List (for DataTable / API use)
    public function list()
    {
        return response()->json(
            CalibrationReport::orderBy('id', 'desc')->get()
        );
    }

    // 📌 Store
    // app/Http/Controllers/CalibrationReportController.php
    public function store(Request $request)
    {
        $validated = $request->validate([
            'equipment' => 'required|string',
            'model' => 'nullable|string',
            'serial' => 'nullable|string',
            'control_no' => 'nullable|string',
            'manufacturer' => 'nullable|string',
            'calibration_date' => 'required|string',
            'calibration_due' => 'nullable|string',
            'performed_by' => 'required|string',
            'temperature' => 'nullable|string',
            'relative_humidity' => 'nullable|string',
            'specs' => 'nullable|string',
            'report_no' => 'nullable|string',
            'cal_interval' => 'nullable|string',
            'cal_std_use' => 'nullable|array',
            'cal_details' => 'nullable|array',
        ]);

        CalibrationReport::create($validated);

        return redirect()->back()->with('success', 'Calibration Report saved successfully!');
    }


    // 📌 Show
    public function show(CalibrationReport $calibrationReport)
    {
        return response()->json($calibrationReport);
    }

    // 📌 Update
    public function update(Request $request, CalibrationReport $calibrationReport)
    {
        $data = $this->validateData($request);
        $calibrationReport->update($data);

        return response()->json($calibrationReport);
    }

    // 📌 Delete
    public function destroy($id)
    {
        // Gamit ang custom connection/table
        DB::connection('mysql')->table('calibration_report_list')->where('id', $id)->delete();

        // Return Inertia redirect para hindi mag-error
        return redirect()->back()->with('success', '✅ Report removed successfully!!');
    }

    // 📌 Validation rules (shared by store & update)
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

            // ✅ allow arrays
            'cal_std_use' => 'nullable|array',
            'cal_details' => 'nullable|array',
        ]);
    }

    public function verifyQA(CalibrationReport $report)
    {
        $report->qa_sign = session('emp_data')['emp_name'] ?? null;
        $report->qa_sign_date = now();
        $report->save();

        return back()->with([
            'success' => 'Report verified by QA!',
            'updatedReport' => $report
        ]);
    }

    public function verifyReviewer(CalibrationReport $report)
    {
        $report->review_by = session('emp_data')['emp_name'] ?? null;
        $report->review_date = now();
        $report->save();

        return back()->with([
            'success' => 'Report verified by Reviewer!',
            'updatedReport' => $report
        ]);
    }

    public function viewPdf($id)
    {
        $calibration = CalibrationReport::findOrFail($id);

        $cal_std_use = $calibration->cal_std_use ? json_decode($calibration->cal_std_use, true) : [];
        $cal_details = $calibration->cal_details ? json_decode($calibration->cal_details, true) : [];

        $pdf = Pdf::loadView('pdf.calibration', [
            'report'  => $calibration,
            'calibration'  => $calibration,
            'cal_std_use'  => $cal_std_use,
            'cal_details'  => $cal_details,
        ]);

        return $pdf->stream("calibration_$id.pdf");
    }
}
