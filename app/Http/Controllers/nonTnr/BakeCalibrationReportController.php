<?php

namespace App\Http\Controllers\nonTnr;

use App\Http\Controllers\Controller;
use App\Services\DataTableService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;

class BakeCalibrationReportController extends Controller
{
    protected $datatable;

    public function __construct(DataTableService $datatable)
    {
        $this->datatable = $datatable;
    }

    /**
     * Display the Bake Oven Calibration Report table with filters and machines dropdown
     */
    public function index(Request $request)
    {
        // Fetch table data for DataTable
        $result = $this->datatable->handle(
            $request,
            'mysql', // Connection for main table
            'calibration_bake_report_list',
            [
                'searchColumns' => [
                    'machine_num',
                    'control_no',
                    'serial_no',
                    'performed_by',
                    'date_performed',
                    'due_date',
                ],
            ]
        );

        // Fetch machines from another server for dropdown
        $machines = DB::connection('server25')
            ->table('machine_list')
            ->select('machine_num', 'cn_no', 'serial', 'machine_platform')
            ->whereNotNull('machine_num')
            ->where('machine_num', '!=', '')
            ->where('machine_num', '!=', 'N/A')
            ->distinct()
            ->orderBy('machine_platform', 'asc')
            ->get();

        // Handle CSV export
        if ($result instanceof \Symfony\Component\HttpFoundation\StreamedResponse) {
            return $result;
        }

        return Inertia::render('Non-Tnr/BakeCalibrationReport', [
            'tableData' => $result['data'],
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
            'machines' => $machines, // Pass machines for dropdown
        ]);
    }

    /**
     * Store a new Bake Oven Calibration Report entry
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'machine_num' => 'required|string|max:50',
            'control_no' => 'required|string|max:50',
            'serial_no' => 'required|string|max:50',
            'performed_by' => 'required|string|max:100',
            'date_performed' => 'required|date',
            'due_date' => 'required|date',
            'note' => 'nullable|string|max:1000',
            'oven_set_point1' => 'nullable|array',
            'oven_set_point2' => 'nullable|array',
            'oven_set_point3' => 'nullable|array',
        ]);

        // 🔧 Recursively replace empty/null with "N/A", but exclude 'id'
        $replaceEmptyRecursive = function (&$array) use (&$replaceEmptyRecursive) {
            foreach ($array as $key => &$value) {
                if ($key === 'id') continue; // don't replace id
                if (is_array($value)) {
                    $replaceEmptyRecursive($value);
                } else {
                    if ($value === null || $value === '') $value = 'N/A';
                }
            }
        };

        $replaceEmptyRecursive($validated); // ✅ apply to validated array

        DB::connection('mysql')
            ->table('calibration_bake_report_list')
            ->insert([
                'machine_num' => $validated['machine_num'],
                'control_no' => $validated['control_no'],
                'serial_no' => $validated['serial_no'],
                'performed_by' => $validated['performed_by'],
                'date_performed' => $validated['date_performed'],
                'due_date' => $validated['due_date'],
                'note' => $validated['note'] ?? 'N/A',
                'oven_set_point1' => json_encode($validated['oven_set_point1'] ?? ['N/A']),
                'oven_set_point2' => json_encode($validated['oven_set_point2'] ?? ['N/A']),
                'oven_set_point3' => json_encode($validated['oven_set_point3'] ?? ['N/A']),
            ]);

        return back()->with('success', 'New report added successfully!');
    }

    public function update(Request $request, $id)
    {
        // Validate data
        $validated = $request->validate([
            'machine_num' => 'required|string|max:255',
            'control_no' => 'nullable|string|max:255',
            'serial_no' => 'nullable|string|max:255',
            'performed_by' => 'required|string|max:255',
            'date_performed' => 'required|date',
            'due_date' => 'required|date',
            'note' => 'nullable|string',
            'oven_set_point1' => 'nullable|string', // JSON string
            'oven_set_point2' => 'nullable|string',
            'oven_set_point3' => 'nullable|string',
        ]);

        // Update using DB facade
        DB::connection('mysql')->table('calibration_bake_report_list')
            ->where('id', $id)
            ->update([
                'machine_num' => $validated['machine_num'],
                'control_no' => $validated['control_no'],
                'serial_no' => $validated['serial_no'],
                'performed_by' => $validated['performed_by'],
                'date_performed' => $validated['date_performed'],
                'due_date' => $validated['due_date'],
                'note' => $validated['note'] ?? null,
                'oven_set_point1' => $validated['oven_set_point1'] ?? null,
                'oven_set_point2' => $validated['oven_set_point2'] ?? null,
                'oven_set_point3' => $validated['oven_set_point3'] ?? null,
            ]);

        return back()->with('success', 'New report added successfully!');
    }





    /**
     * Optional: remove admin (if needed)
     */
    public function removeAdmin(Request $request)
    {
        $id = $request->input('id'); // Ensure $request is used inside the method
        DB::connection('mysql')
            ->table('calibration_bake_report_list')
            ->where('emp_id', $id)
            ->delete();

        return back()->with('success', 'Admin removed successfully.');
    }

    public function viewPdf($id)
    {
        $report = DB::connection('mysql')
            ->table('calibration_bake_report_list')
            ->where('id', $id)
            ->first(); // ← kailangan ito

        if (!$report) {
            abort(404, "Report not found.");
        }

        $pdf = Pdf::loadView('pdf.BakeCalibrationReport', [
            'report' => $report
        ])->setPaper('A4', 'portrait');

        return $pdf->stream("Bake_Calibration_Report_$id.pdf");
    }
}
