<?php

namespace App\Http\Controllers;

use App\Models\Scheduler;
use App\Models\Machine;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;

use function Laravel\Prompts\progress;

class SchedulerController extends Controller
{
    protected $datatable;

    public function __construct(\App\Services\DataTableService $datatable)
    {
        $this->datatable = $datatable;
    }

    public function index(Request $request)
    {

        // 🔹 Default sorting kung walang laman request
        if (!$request->has('sortBy')) {
            $request->merge(['sortBy' => 'id']);
        }
        if (!$request->has('sortDirection')) {
            $request->merge(['sortDirection' => 'desc']);
        }

        // 🔹 Compute progress_value sa SQL
        $progress_value = DB::connection('mysql')->raw("ROUND((
        (CASE WHEN responsible_person IS NOT NULL AND TRIM(responsible_person) != '' THEN 1 ELSE 0 END) +
        (CASE WHEN qa_ack IS NOT NULL AND TRIM(qa_ack) != '' THEN 1 ELSE 0 END) +
        (CASE WHEN senior_ee_ack IS NOT NULL AND TRIM(senior_ee_ack) != '' THEN 1 ELSE 0 END) +
        (CASE WHEN section_ack IS NOT NULL AND TRIM(section_ack) != '' THEN 1 ELSE 0 END)
        ) * 100.0 / 4, 0) AS progress_value");

        // 🔹 Get data via datatable service
        $result = $this->datatable->handle(
            $request,
            'mysql',
            'scheduler_tbl',
            [
                'defaultSortBy' => 'id',
                'defaultSortDirection' => 'desc',
                'dateColumn' => 'first_cycle',
                'searchColumns' => [
                    'machine_num',
                    'pmnt_no',
                    'quarter',
                    'first_cycle',
                    'pm_due',
                    'responsible_person',
                    'tech_ack',
                    'qa_ack',
                    'senior_ee_ack',
                    'progress_value',
                ],
                'selectColumns' => [
                    'id',
                    'pmnt_no',
                    'machine_num',
                    'serial',
                    'first_cycle',
                    'pm_due',
                    'responsible_person',
                    'qa_ack',
                    'senior_ee_ack',
                    'section_ack',
                    'quarter',
                    $progress_value, // ✅ alias as progress_value
                ],
                'conditions' => function ($query) use ($request) {
                    return $query;
                },
                'filename' => 'scheduler_export',
                'exportColumns' => [
                    'pmnt_no',
                    'machine_num',
                    'serial',
                    'first_cycle',
                    'pm_due',
                    'responsible_person',
                    'quarter',
                ],
            ]
        );

        // 🔹 Return StreamedResponse for exports
        if ($result instanceof \Symfony\Component\HttpFoundation\StreamedResponse) {
            return $result;
        }



        // ✅ Machines para sa dropdown
        $machines = Machine::select('machine_num', 'pmnt_no', 'serial', 'machine_platform')
            ->whereNotNull('machine_num')
            ->where('machine_num', '!=', '')
            ->distinct()
            ->orderBy('machine_platform')
            ->get();

        return Inertia::render('Tnr/SchedulerTable', [
            'tableData' => $result['data'],
            'machines'  => $machines,
            'tableFilters' => $request->only([
                'search',
                'perPage',
                'sortBy',
                'sortDirection',
                'start',
                'end',
                'dropdownSearchValue',
                'dropdownFields',
                'machine_num',
                'quarter'
            ]),
            'empData' => [
                'emp_id'   => session('emp_data')['emp_id'] ?? null,
                'emp_name' => session('emp_data')['emp_name'] ?? null,
                'emp_jobtitle' => session('emp_data')['emp_jobtitle'] ?? null
            ],
        ]);
    }


    public function store(Request $request)
    {
        $validated = $request->validate([
            'machine_num' => 'required|string',
            'pmnt_no' => 'required|string',
            'serial' => 'nullable|string',
            'first_cycle' => 'nullable|string',
            'pm_due' => 'nullable|string',
            'responsible_person' => 'nullable|string',
            'quarter' => 'nullable|string',
            'progress_value' => 'nullable|numeric', // 🔹 mas ok kung numeric
            'answers' => 'nullable|json',
            'tool_life' => 'nullable|json',
        ]);


        Scheduler::create($validated);

        return redirect()->back()->with('success', 'PM Scheduler created successfully!');
    }

    public function verify(Request $request, $id)
    {
        $scheduler = Scheduler::findOrFail($id);

        $progress = $scheduler->progress_value ?? 0;

        if ($request->has('tech_ack')) {
            $scheduler->tech_ack = $request->tech_ack;
            $scheduler->tech_ack_date = $request->tech_ack_date;
            $progress += 25;
        }

        if ($request->has('qa_ack')) {
            $scheduler->qa_ack = $request->qa_ack;
            $scheduler->qa_ack_date = $request->qa_ack_date;
            $progress += 25;
        }

        if ($request->has('senior_ee_ack')) {
            $scheduler->senior_ee_ack = $request->senior_ee_ack;
            $scheduler->senior_ee_ack_date = $request->senior_ee_ack_date;
            $progress += 25;
        }

        if ($request->has('section_ack')) {
            $scheduler->section_ack = $request->section_ack;
            $scheduler->section_ack_date = $request->section_ack_date;
            $progress += 25;
        }

        $scheduler->progress_value = min(100, $progress);
        $scheduler->save();

        return back()->with('success', 'Verified successfully');
    }

    public function viewPdf($id)
    {
        $scheduler = Scheduler::findOrFail($id);

        // kung JSON string ang "answers", i-decode natin
        $answers = $scheduler->answers ? json_decode($scheduler->answers, true) : [];
        $tool_life = $scheduler->tool_life ? json_decode($scheduler->tool_life, true) : [];

        $pdf = Pdf::loadView('pdf.activity', [
            'scheduler' => $scheduler,
            'answers' => $answers,
            'tool_life' => $tool_life,
        ]);

        // stream para makita sa browser (may toolbar)
        return $pdf->stream("activity_$id.pdf");
    }

    public function remove($id)
    {
        DB::connection('mysql')->table('scheduler_tbl')->where('id', $id)->delete();

        return redirect()->route('tnr.schedulerTable')->with('success', 'Checklist removed successfully.');
    }
}
