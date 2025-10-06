<?php

namespace App\Http\Controllers\NonTnr;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\NonTnrChecklist;
use Inertia\Inertia;

class NonTnrMassAprovedController extends Controller
{
    public function index()
    {
        $checklists = NonTnrChecklist::select(
            '*'
        )->orderByDesc('created_at')->get();

        return Inertia::render('Non-Tnr/MassApprovalNonTnr', [
            'checklists' => $checklists,
            'empData' => session('emp_data')
        ]);
    }

    public function massApprove(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'role' => 'required|string'
        ]);

        $role = $validated['role'];
        $dateNow = now();
        $empName = session('emp_data')['emp_name'] ?? 'System';

        foreach ($validated['ids'] as $id) {
            $item = NonTnrChecklist::find($id);
            if (!$item) continue;

            if ($role === 'tech' && is_null($item->tech_sign)) {
                $item->tech_sign = $empName;
                $item->tech_sign_date = $dateNow;
            } elseif ($role === 'qa' && is_null($item->qa_sign) && $item->tech_sign) {
                $item->qa_sign = $empName;
                $item->qa_sign_date = $dateNow;
            } elseif ($role === 'senior_ee' && is_null($item->senior_ee_sign) && $item->qa_sign) {
                $item->senior_ee_sign = $empName;
                $item->senior_ee_sign_date = $dateNow;
            }

            $item->save();
        }

        return redirect()->back()->with('success', 'Mass approval completed.');
    }
}
