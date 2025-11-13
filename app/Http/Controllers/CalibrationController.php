<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\CheckList;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class CalibrationController extends Controller
{
    public function index()
    {
        $checklist = CheckList::select('platform', 'manufacturer')
            ->distinct()
            ->orderBy('platform', 'asc')
            ->get();

        return Inertia::render('Calibration/Index', [
            'checklist' => $checklist,
        ]);
    }

    public function create()
    {
        $platforms = DB::connection('server25')->table('machine_list')
            ->whereNotNull('machine_platform')
            ->where('machine_platform', '!=', '')   // alisin ang empty string
            ->pluck('machine_platform')
            ->unique()
            ->values();

        $manufacturers = DB::connection('server25')->table('machine_list')
            ->whereNotNull('machine_manufacturer')
            ->where('machine_manufacturer', '!=', '') // alisin din ang empty string
            ->pluck('machine_manufacturer')
            ->unique()
            ->values();

        return Inertia::render('Calibration/Form', [
            'platforms' => $platforms,
            'manufacturers' => $manufacturers,
        ]);
    }



    public function store(Request $request)
    {
        $empName = session('emp_data.emp_id', 'system');

        $validated = $request->validate([
            'platform' => 'required|string',
            'manufacturer' => 'nullable|string',
            'checklistGroups' => 'required|array',
            'checklistGroups.*.assy_item' => 'required|string',
            'checklistGroups.*.rows' => 'required|array',
            'checklistGroups.*.rows.*.description' => 'required|string',
            'checklistGroups.*.rows.*.requirements' => 'required|string',
            'checklistGroups.*.rows.*.activity_1' => 'required|string',
            'checklistGroups.*.rows.*.activity_2' => 'nullable|string',
        ]);

        foreach ($validated['checklistGroups'] as $group) {
            foreach ($group['rows'] as $row) {
                \App\Models\CheckList::create([
                    'platform' => $validated['platform'],
                    'manufacturer' => $validated['manufacturer'] ?? '',
                    'assy_item' => $group['assy_item'],
                    'description' => $row['description'],
                    'requirements' => $row['requirements'],
                    'activity_1' => $row['activity_1'],
                    'activity_2' => $row['activity_2'] ?? '',
                    'created_by' => $empName,
                ]);
            }
        }

        return redirect()->back()->with('success', 'Checklist saved successfully!');
    }



    public function show($platform, $manufacturer)
    {
        $items = CheckList::where('platform', $platform)
            ->where('manufacturer', $manufacturer)
            ->get();

        return response()->json(['items' => $items]);
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'assy_item' => 'required|string',
            'description' => 'required|string',
            'requirements' => 'required|string',
            'activity_1' => 'required|string',
            'activity_2' => 'nullable|string',
        ]);

        $checklist = CheckList::findOrFail($id);
        $checklist->update($validated);

        return redirect()->route('calibration.index')
            ->with('success', '✅ Updated successfully!');
    }


    public function destroy($id)
    {
        $checklist = CheckList::findOrFail($id);
        $checklist->delete();

        return redirect()->back()->with('success', 'Checklist deleted successfully!');
    }
}
