<?php

namespace App\Http\Controllers\Ionizer;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Dthm;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;

class DthmController extends Controller
{
    public function index(Request $request)
    {
        $records = Dthm::orderBy('id', 'desc')->paginate(10);

        return Inertia::render('Calibration/DthmPage', [
            'records' => $records,
            'filters' => $request->all(),
            'empData' => [
                'emp_id' => session('emp_data')['emp_id'] ?? null,
                'emp_name' => session('emp_data')['emp_name'] ?? null,
                'emp_jobtitle' => session('emp_data')['emp_jobtitle'] ?? null,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'control_no' => 'nullable|string|max:45',
            'ip_address' => 'nullable|string|max:45',
            'location' => 'nullable|string|max:45',
            'performed_by' => 'nullable|string|max:45',
            'cal_date' => 'nullable|string|max:45',
            'cal_due' => 'nullable|string|max:45',
            'recording_interval' => 'nullable|string|max:45',
            'temp_offset' => 'nullable|string|max:45',
            'rh_offset' => 'nullable|string|max:45',
            'sample_frequency' => 'nullable|string|max:45',
            'master_temp' => 'nullable|string|max:45',
            'master_humidity' => 'nullable|string|max:45',
            'test_temp' => 'nullable|string|max:45',
            'test_humidity' => 'nullable|string|max:45',
            'expand_temp' => 'nullable|string|max:45',
            'expand_humidity' => 'nullable|string|max:45',
            'qa_sign' => 'nullable|string|max:45',
            'qa_sign_date' => 'nullable|string|max:45',
        ]);

        $validated['created_at'] = now();
        $validated['updated_at'] = now();

        Dthm::create($validated);

        return redirect()->back()->with('success', '✅ Record added successfully!');
    }

    public function qaVerify(Request $request)
    {
        $request->validate([
            'id' => 'required|integer|exists:dthm_tbl,id',
        ]);

        $record = Dthm::findOrFail($request->id);

        $record->update([
            'qa_sign' => session('emp_data')['emp_name'] ?? 'QA',
            'qa_sign_date' => now()->format('m/d/Y h:i A'),
        ]);

        // return response()->json([
        //     'success' => true,
        //     'message' => 'QA verification completed.',
        // ]);
        return redirect()->back()->with('success', 'Calibration Report saved successfully!');
    }

    public function generatePdf($id)
    {
        // ✅ Get the calibration record
        $record = Dthm::findOrFail($id);

        // ✅ Pass data to the PDF view
        $pdf = Pdf::loadView('pdf.dthm', [
            'record' => $record
        ])->setPaper('A4', 'portrait');

        // ✅ Output (download or stream)
        return $pdf->stream('Thermohygrometer_Calibration_' . $record->control_no . '.pdf');
    }
}
