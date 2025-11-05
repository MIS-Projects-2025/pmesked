<?php

namespace App\Http\Controllers;

use App\Models\Machine;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TnrController extends Controller
{
    /**
     * Show extend page with scheduler details
     */
    public function fillup($id)
    {
        $scheduler = DB::connection('mysql')->table('scheduler_tbl')->where('id', $id)->first();

        if (!$scheduler) {
            abort(404, 'Scheduler not found');
        }

        $machines = Machine::select('machine_num', 'pmnt_no', 'serial', 'machine_platform')
            ->whereNotNull('machine_num')
            ->where('machine_num', '!=', '')
            ->distinct()
            ->orderBy('machine_platform')
            ->get();


        return inertia('Tnr/Fillup', [
            'machines'  => $machines,
            'scheduler' => $scheduler,

            'empData' => [
                'emp_id'   => session('emp_data')['emp_id'] ?? null,
                'emp_name' => session('emp_data')['emp_name'] ?? null,
                'emp_jobtitle' => session('emp_data')['emp_jobtitle'] ?? null
            ],
        ]);
    }

    /**
     * Handle fillup action (update PM Due date)
     */
    public function updateFillup(Request $request, $id)
    {
        $scheduler = DB::connection('mysql')->table('scheduler_tbl')->where('id', $id)->first();
        if (!$scheduler) abort(404, 'Scheduler not found');

        $validated = $request->validate([
            'pmnt_no'            => 'nullable|string',
            'machine_num'        => 'nullable|string',
            'quarter'            => 'nullable|string',
            'first_cycle'        => 'nullable|string',
            'responsible_person' => 'nullable|string',
            'serial'             => 'nullable|string',
            'pm_due'             => 'nullable|string',
            'answers'            => 'nullable|string', // from React JSON.stringify
            'progress_value'     => 'nullable|numeric',
            'status'             => 'nullable|string',
            'tech_ack'           => 'nullable|string',
            'tech_ack_date'      => 'nullable|string',
            'qa_ack'             => 'nullable|string',
            'qa_ack_date'        => 'nullable|string',
            'senior_ee_ack'      => 'nullable|string',
            'senior_ee_ack_date' => 'nullable|string',
        ]);

        $updateData = [
            'pmnt_no'            => $validated['pmnt_no'] ?? null,
            'machine_num'        => $validated['machine_num'] ?? null,
            'quarter'            => $validated['quarter'] ?? null,
            'first_cycle'        => $validated['first_cycle'] ?? null,
            'responsible_person' => $validated['responsible_person'] ?? null,
            'serial'             => $validated['serial'] ?? null,
            'pm_due'             => $validated['pm_due'] ?? null,
            'progress_value'     => $validated['progress_value'] ?? 25,
            'answers'            => isset($validated['answers'])
                ? json_decode($validated['answers'], true) // 🔹 decode JSON
                : null,
            'status'             => $validated['status'] ?? null,
            'tech_ack'           => $validated['tech_ack'] ?? null,
            'tech_ack_date'      => $validated['tech_ack_date'] ?? null,
            'qa_ack'             => $validated['qa_ack'] ?? null,
            'qa_ack_date'        => $validated['qa_ack_date'] ?? null,
            'senior_ee_ack'      => $validated['senior_ee_ack'] ?? null,
            'senior_ee_ack_date' => $validated['senior_ee_ack_date'] ?? null,
            'updated_at'         => now(),
        ];

        DB::connection('mysql')->table('scheduler_tbl')->where('id', $id)->update($updateData);

        return redirect()
            ->route('tnr.schedulerTable')
            ->with('success', '✅ PM Due successfully extended.');
    }

    public function extend($id)
    {
        $scheduler = DB::connection('mysql')->table('scheduler_tbl')->where('id', $id)->first();

        if (!$scheduler) {
            abort(404, 'Scheduler not found');
        }

        $machines = Machine::select('machine_num', 'pmnt_no', 'serial', 'machine_platform')
            ->whereNotNull('machine_num')
            ->where('machine_num', '!=', '')
            ->distinct()
            ->orderBy('machine_platform')
            ->get();


        return inertia('Tnr/Extend', [
            'machines'  => $machines,
            'scheduler' => $scheduler,

            'empData' => [
                'emp_id'   => session('emp_data')['emp_id'] ?? null,
                'emp_name' => session('emp_data')['emp_name'] ?? null,
                'emp_jobtitle' => session('emp_data')['emp_jobtitle'] ?? null
            ],
        ]);
    }
}
