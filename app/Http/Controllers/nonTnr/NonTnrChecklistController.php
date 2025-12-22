<?php

namespace App\Http\Controllers\nonTnr;

use App\Http\Controllers\Controller;
use App\Models\Machine;
use App\Models\NonTnrChecklist;
use App\Models\NonTnrChecklistItem;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

use App\Services\DataTableService;

class NonTnrChecklistController extends Controller
{

    protected $datatable;
    protected $datatable1;

    public function __construct(DataTableService $datatable)
    {
        $this->datatable = $datatable;
    }

    // ✅ Index page
    public function index(Request $request)
    {
        // Get filter values from request
        $search = $request->input('search', '');
        $perPage = $request->input('perPage', 10);
        $sortBy = $request->input('sortBy', 'id');
        $sortDirection = $request->input('sortDirection', 'desc');

        // Base query
        $query = DB::connection('mysql')->table('non_tnr_checklist_tbl');

        // Apply search filters
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('platform', 'like', "%{$search}%")
                    ->orWhere('control_no', 'like', "%{$search}%")
                    ->orWhere('pm_date', 'like', "%{$search}%")
                    ->orWhere('pm_due', 'like', "%{$search}%")
                    ->orWhere('performed_by', 'like', "%{$search}%")
                    ->orWhere('tech_sign', 'like', "%{$search}%")
                    ->orWhere('qa_sign', 'like', "%{$search}%")
                    ->orWhere('senior_ee_sign', 'like', "%{$search}%");
            });
        }

        // Apply sorting
        $query->orderBy($sortBy, $sortDirection);

        // Paginate results
        $reports = $query->paginate($perPage)->appends($request->all());

        // Render Inertia page
        return Inertia::render('Non-Tnr/NonTnrChecklists', [
            'reports' => $reports,
            'filters' => $request->only([
                'search',
                'perPage',
                'sortBy',
                'sortDirection',
                'page',
            ]),
            'templates' => NonTnrChecklistItem::orderByDesc('id')->get(),
            'machines' => Machine::whereNotNull('pmnt_no')
                ->where('machine_type', 'NON T&R')
                ->distinct()
                ->get(),
            'empData' => [
                'emp_id' => session('emp_data')['emp_id'] ?? null,
                'emp_name' => session('emp_data')['emp_name'] ?? null,
                'emp_jobtitle' => session('emp_data')['emp_jobtitle'] ?? null,
            ],
        ]);
    }





    // ✅ Store
    public function store(Request $request)
    {
        $data = $request->validate([
            'platform' => 'required|string|max:45',
            'control_no' => 'required|string|max:45',
            'description' => 'required|string|max:45',
            'serial' => 'nullable|string|max:45',
            'frequency' => 'nullable|string|max:45',
            'pm_date' => 'nullable|string|max:45',
            'pm_due' => 'nullable|string|max:45',
            'performed_by' => 'nullable|string|max:45',
            'check_item' => 'nullable|array',
            'std_use_verification' => 'nullable|array',
            'tool_life' => 'nullable|array',
        ]);

        NonTnrChecklist::create(array_merge($data, [
            'created_by' => session('emp_data')['emp_name'] ?? null,
        ]));

        return back()->with('success', 'Non-TNR Checklist created successfully!');
    }

    // ✅ Update
    public function update(Request $request, $id)
    {
        $checklist = NonTnrChecklist::findOrFail($id);

        $data = $request->validate([
            'platform' => 'required|string|max:45',
            'control_no' => 'required|string|max:45',
            'description' => 'required|string|max:45',
            'serial' => 'nullable|string|max:45',
            'frequency' => 'nullable|string|max:45',
            'pm_date' => 'nullable|string|max:45',
            'pm_due' => 'nullable|string|max:45',
            'performed_by' => 'nullable|string|max:45',
            'check_item' => 'nullable|array',
            'std_use_verification' => 'nullable|array',
            'tool_life' => 'nullable|array',
        ]);

        $checklist->update(array_merge($data, [
            'updated_by' => session('emp_data')['emp_name'] ?? null,
        ]));

        return back()->with('success', 'Non-TNR Checklist updated successfully!');
    }

    // ✅ Delete
    public function destroy($id)
    {
        $checklist = NonTnrChecklist::findOrFail($id);
        $checklist->delete();

        return back()->with('success', 'Checklist deleted successfully!');
    }

    // ✅ Verification (tech / qa)
    // public function verify(Request $request, $id)
    // {
    //     $checklist = NonTnrChecklist::findOrFail($id);
    //     $type = $request->input('type');

    //     if ($type === 'tech') {
    //         $checklist->update([
    //             'tech_sign' => session('emp_data')['emp_name'] ?? null,
    //             'tech_sign_date' => now(),
    //         ]);
    //     } elseif ($type === 'qa') {
    //         $checklist->update([
    //             'qa_sign' => session('emp_data')['emp_name'] ?? null,
    //             'qa_sign_date' => now(),
    //         ]);
    //     }

    //     return back()->with('success', ucfirst($type) . ' verified successfully!');
    // }

    public function verify($id)
    {
        $user = session('emp_data');
        $jobTitle = $user['emp_jobtitle'] ?? null;
        $name = $user['emp_name'] ?? null;

        $report = NonTnrChecklist::findOrFail($id);

        // Define roles
        $techRoles = [
            "Senior Equipment Technician",
            "Equipment Technician 1",
            "Equipment Technician 2",
            "Equipment Technician 3",
            "PM Technician 1",
            "PM Technician 2",
            "Trainee - Equipment Technician 1"
        ];

        $qaRoles = ["ESD Technician 1", "ESD Technician 2", "Senior QA Engineer", "DIC Clerk 1"];

        $seniorRoles = [
            "Equipment Engineer",
            "Supervisor - Equipment Technician",
            "Senior Equipment Engineer",
            "Sr. Equipment Engineer",
            "Equipment Engineering Section Head",
            "Section Head - Equipment Engineering"
        ];

        // ✅ Verification Logic with Date Tracking
        if (in_array($jobTitle, $techRoles) && !$report->tech_sign) {
            $report->tech_sign = $name;
            $report->tech_sign_date = now();
        } elseif (in_array($jobTitle, $qaRoles) && $report->tech_sign && !$report->qa_sign) {
            $report->qa_sign = $name;
            $report->qa_sign_date = now();
        } elseif (in_array($jobTitle, $seniorRoles) && $report->tech_sign && $report->qa_sign && !$report->senior_ee_sign) {
            $report->senior_ee_sign = $name;
            $report->senior_ee_sign_date = now();
        } else {
            return back()->with('error', 'Verification not allowed.');
        }

        $report->save();

        return back()->with('success', 'Verified successfully.');
    }

    public function viewPdf($id)
    {
        $checklist = NonTnrChecklist::findOrFail($id);

        // Decode arrays kung JSON string pa rin
        $checkItems = is_string($checklist->check_item)
            ? json_decode($checklist->check_item, true)
            : $checklist->check_item;

        $stdVerifications = is_string($checklist->std_use_verification)
            ? json_decode($checklist->std_use_verification, true)
            : $checklist->std_use_verification;

        $toolLife = is_string($checklist->tool_life)
            ? json_decode($checklist->tool_life, true)
            : $checklist->tool_life;

        $pdf = Pdf::loadView('pdf.non_tnr_checklist', [
            'checklist' => $checklist,
            'checkItems' => $checkItems,
            'stdVerifications' => $stdVerifications,
            'toolLife' => $toolLife,

        ]);

        return $pdf->stream("non_tnr_checklist_$id.pdf");
    }
}
