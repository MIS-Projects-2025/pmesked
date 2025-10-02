<?php

namespace App\Http\Controllers\Ionizer;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\IonizerChecklistItem;

class IonizerChecklistItemController extends Controller
{
    public function index(Request $request)
    {
        $items = IonizerChecklistItem::paginate(10);
        return inertia('Ionizer/IonizerChecklistItems', [
            'items' => $items,
            'tableFilters' => $request->only([
                'search',
                'perPage',
                'sortBy',
                'sortDirection',
                'start',
                'end',
                'dropdownSearchValue',
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
        $data = $request->validate([
            'check_item' => 'nullable|array',
            'verification_reading' => 'nullable|array',
            'std_use_verification' => 'nullable|array',
        ]);

        $data['created_by'] = session('emp_data')['emp_name'] ?? null;

        // wag na i-json_encode, array na papasok
        IonizerChecklistItem::create($data);

        return redirect()->route('ionizer-items.index')
            ->with('success', 'Checklist Item created successfully!');
    }

    public function update(Request $request, $id)
    {
        $item = IonizerChecklistItem::findOrFail($id);

        $data = $request->validate([
            'check_item' => 'nullable|array',
            'verification_reading' => 'nullable|array',
            'std_use_verification' => 'nullable|array',
        ]);

        $data['updated_by'] = session('emp_data')['emp_name'] ?? null;

        $item->update($data);

        return redirect()->route('ionizer-items.index')
            ->with('success', 'Checklist Item updated successfully!');
    }



    public function destroy($id)
    {
        $item = IonizerChecklistItem::findOrFail($id);
        $item->delete();

        return response()->json(['message' => 'Checklist Item deleted successfully']);
    }
}
