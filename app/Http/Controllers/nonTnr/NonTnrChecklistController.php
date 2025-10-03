<?php

namespace App\Http\Controllers\nonTnr;

use App\Http\Controllers\Controller;
use App\Models\Machine;
use App\Models\NonTnrChecklist;
use App\Models\NonTnrChecklistItem;
use Illuminate\Http\Request;
use Inertia\Inertia;

class NonTnrChecklistController extends Controller
{
    // ✅ Index page
    public function index()
    {
        // Reports with pagination
        $reports = NonTnrChecklist::orderByDesc('id')->paginate(10);

        return Inertia::render('Non-Tnr/NonTnrChecklists', [
            'reports' => [
                'data'        => $reports->items(),
                'from'        => $reports->firstItem(),
                'to'          => $reports->lastItem(),
                'total'       => $reports->total(),
                'links'       => $reports->linkCollection(), // mas clean kaysa links()
                'currentPage' => $reports->currentPage(),
                'lastPage'    => $reports->lastPage(),
            ],
            'templates' => NonTnrChecklistItem::orderByDesc('id')->get(),
            'machines'  => Machine::query()
                ->whereNotNull('pmnt_no')
                ->where('machine_type', 'NON T&R')
                ->orderBy('machine_type')
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
    public function verify(Request $request, $id)
    {
        $checklist = NonTnrChecklist::findOrFail($id);
        $type = $request->input('type');

        if ($type === 'tech') {
            $checklist->update([
                'tech_sign' => session('emp_data')['emp_name'] ?? null,
                'tech_sign_date' => now(),
            ]);
        } elseif ($type === 'qa') {
            $checklist->update([
                'qa_sign' => session('emp_data')['emp_name'] ?? null,
                'qa_sign_date' => now(),
            ]);
        }

        return back()->with('success', ucfirst($type) . ' verified successfully!');
    }
}
