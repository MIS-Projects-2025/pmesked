<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Scheduler; // or Activity model kung iba pangalan
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class MassApprovalController extends Controller
{
    public function index()
    {
        $empData = session('emp_data');
        $role = $empData['emp_jobtitle'] ?? null;
        $currentEmp = $empData['emp_name'] ?? null; // or emp_id if numeric

        // Base query: lahat ng hindi 100% progress
        $query = Scheduler::orderBy('id', 'desc')
            ->where('progress_value', '!=', '100')
            ->where('responsible_person', '!=', $currentEmp); // exclude own activity

        // Role-based filtering
        if (in_array($role, [
            'Senior Equipment Technician',
            'Equipment Technician 1',
            'Equipment Technician 2',
            'Equipment Technician 3',
            'PM Technician 1',
            'PM Technician 2',
        ])) {
            $query->where(function ($q) {
                $q->whereNull('tech_ack')
                    ->orWhere('tech_ack', '');
            });
        } elseif (in_array($role, [
            'ESD Technician 1',
            'ESD Technician 2',
            'Senior QA Engineer',
            'DIC Clerk 1',
        ])) {
            $query->where(function ($q) {
                $q->whereNotNull('tech_ack')
                    ->where('tech_ack', '!=', '');
            })->where(function ($q) {
                $q->whereNull('qa_ack')
                    ->orWhere('qa_ack', '');
            });
        } elseif (in_array($role, [
            'Equipment Engineer',
            'Supervisor - Equipment Technician',
            'Senior Equipment Engineer',
            'Sr. Equipment Engineer',
            'Equipment Engineering Section Head',
            'Section Head - Equipment Engineering',
        ])) {
            $query->where(function ($q) {
                $q->whereNotNull('tech_ack')
                    ->where('tech_ack', '!=', '');
            })->where(function ($q) {
                $q->whereNotNull('qa_ack')
                    ->where('qa_ack', '!=', '');
            })->where(function ($q) {
                $q->whereNull('senior_ee_ack')
                    ->orWhere('senior_ee_ack', '');
            });
        }

        $activities = $query->get();

        return Inertia::render('Tnr/MassApproved', [
            'activities' => $activities,
            'empData'    => $empData,
        ]);
    }




    // MassApprovalController

    // public function approved(Request $request)
    // {
    //     $request->validate([
    //         'ids' => 'required|array',
    //         'ids.*' => 'integer|exists:scheduler_tbl,id',
    //     ]);

    //     // Kunin empData from session
    //     $empData = session('emp_data');
    //     if (!$empData) {
    //         return back()->with('error', 'No employee data found in session.');
    //     }

    //     $empName = $empData['emp_name'] ?? 'Unknown';

    //     foreach ($request->ids as $id) {
    //         $activity = Scheduler::find($id);
    //         if (!$activity) continue;

    //         // ✅ Technician approval
    //         if ($this->isTech($empData) && empty($activity->tech_ack)) {
    //             $activity->tech_ack = $empName;
    //             $activity->progress_value = +25;
    //             $activity->tech_ack_date = now();
    //             $activity->save();
    //         }

    //         // ✅ QA approval
    //         if ($this->isQA($empData) && !empty($activity->tech_ack) && empty($activity->qa_ack)) {
    //             $activity->qa_ack = $empName;
    //             $activity->progress_value = +25;
    //             $activity->qa_ack_date = now();
    //             $activity->save();
    //         }

    //         // ✅ Engineer approval
    //         if ($this->isEngineer($empData) && !empty($activity->qa_ack) && empty($activity->senior_ee_ack)) {
    //             $activity->senior_ee_ack = $empName;
    //             $activity->progress_value = +25;
    //             $activity->senior_ee_ack_date = now();
    //             $activity->save();
    //         }
    //     }

    //     return back()->with('success', 'Selected activities approved!');
    // }

    public function approved(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:scheduler_tbl,id',
        ]);

        // Kunin empData from session
        $empData = session('emp_data');
        if (!$empData) {
            return back()->with('error', 'No employee data found in session.');
        }

        $empName = $empData['emp_name'] ?? 'Unknown';

        foreach ($request->ids as $id) {
            $activity = Scheduler::find($id);
            if (!$activity) continue;

            // ✅ Technician approval
            if ($this->isTech($empData) && empty($activity->tech_ack)) {
                $activity->tech_ack = $empName;
                $activity->progress_value = ($activity->progress_value ?? 0) + 25;
                $activity->tech_ack_date = now();
                $activity->save();
            }

            // ✅ QA approval
            if ($this->isQA($empData) && !empty($activity->tech_ack) && empty($activity->qa_ack)) {
                $activity->qa_ack = $empName;
                $activity->progress_value = ($activity->progress_value ?? 0) + 25;
                $activity->qa_ack_date = now();
                $activity->save();
            }

            // ✅ Engineer approval
            if ($this->isEngineer($empData) && !empty($activity->qa_ack) && empty($activity->senior_ee_ack)) {
                $activity->senior_ee_ack = $empName;
                $activity->progress_value = ($activity->progress_value ?? 0) + 25;
                $activity->senior_ee_ack_date = now();
                $activity->save();
            }
        }

        return back()->with('success', 'Selected activities approved!');
    }


    // Helpers (session-based)
    private function isTech($empData)
    {
        return in_array($empData['emp_jobtitle'] ?? '', [
            "Senior Equipment Technician",
            "Equipment Technician 1",
            "Equipment Technician 2",
            "Equipment Technician 3",
            "PM Technician 1",
            "PM Technician 2",
        ]);
    }

    private function isQA($empData)
    {
        return in_array($empData['emp_jobtitle'] ?? '', [
            "ESD Technician 1",
            "ESD Technician 2",
            "Senior QA Engineer",
            "DIC Clerk 1",
        ]);
    }

    private function isEngineer($empData)
    {
        return in_array($empData['emp_jobtitle'] ?? '', [
            "Equipment Engineer",
            "Supervisor - Equipment Technician",
            "Senior Equipment Engineer",
            "Sr. Equipment Engineer",
            "Equipment Engineering Section Head",
            "Section Head - Equipment Engineering",
        ]);
    }
}
