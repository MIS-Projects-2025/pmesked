<?php

namespace App\Http\Controllers\nonTnr;

use App\Http\Controllers\Controller;
use App\Models\NonTnrChecklistItem;
use Illuminate\Http\Request;
use Inertia\Inertia;

class NonTnrChecklistItemController extends Controller
{
    // ✅ List page
    public function index()
    {
        $items = NonTnrChecklistItem::orderByDesc('id')->paginate(10);

        return Inertia::render('Non-Tnr/NonTnrChecklistItems', [
            'items' => $items,
        ]);
    }

    // ✅ Store new item
    public function store(Request $request)
    {
        $data = $request->validate([
            'platform' => 'required|string',
            'check_item' => 'nullable|array',
            'std_use_verification' => 'nullable|array',
            'tool_life' => 'nullable|array',
        ]);

        NonTnrChecklistItem::create([
            'platform' => $data['platform'],
            'items' => json_encode($data['check_item']),
            'std_use_verification' => json_encode($data['std_use_verification']),
            'tool_life' => json_encode($data['tool_life']),
            'created_by' => session('emp_data')['emp_name'] ?? null,
        ]);

        return back()->with('success', 'Non-TNR Checklist Item created successfully!');
    }

    // ✅ Update
    public function update(Request $request, $id)
    {
        $item = NonTnrChecklistItem::findOrFail($id);

        $data = $request->validate([
            'platform' => 'required|string',
            'check_item' => 'nullable|array',
            'std_use_verification' => 'nullable|array',
            'tool_life' => 'nullable|array',
        ]);

        $item->update([
            'platform' => $data['platform'],
            'items' => json_encode($data['check_item']),
            'std_use_verification' => json_encode($data['std_use_verification']),
            'tool_life' => json_encode($data['tool_life']),
            'updated_by' => session('emp_data')['emp_name'] ?? null,
        ]);

        return back()->with('success', 'Non-TNR Checklist Item updated successfully!');
    }

    // ✅ Delete
    public function destroy($id)
    {
        $item = NonTnrChecklistItem::findOrFail($id);
        $item->delete();

        return back()->with('success', 'Checklist Item deleted!');
    }
}
