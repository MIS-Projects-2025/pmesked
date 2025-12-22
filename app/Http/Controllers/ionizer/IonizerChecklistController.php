<?php

namespace App\Http\Controllers\Ionizer;

use App\Http\Controllers\Controller;
use App\Models\IonizerChecklist;
use App\Models\IonizerChecklistItem;
use App\Models\Machine;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Services\DataTableService;
use Illuminate\Support\Facades\DB;


class IonizerChecklistController extends Controller
{

    protected $datatable;
    protected $datatable1;

    public function __construct(DataTableService $datatable)
    {
        $this->datatable = $datatable;
    }

    //old code 12052025
    // Sa IonizerChecklistController@index
    public function index(Request $request)
    {
        // Paginated IonizerChecklist (10 per page)
        $reports = IonizerChecklist::orderBy('id', 'desc')->paginate(10);

        // Template items for Add modal
        $items = IonizerChecklistItem::orderBy('id', 'desc')->get();

        // Machines list
        $machines = DB::connection('server25')->table('machine_list')->select('*')
            ->whereNotNull('pmnt_no')
            ->whereIn('machine_type', ['IONIZER', 'Air Ionizer'])
            ->orderBy('machine_type')
            ->distinct()
            ->get();

        // Decode JSON fields safely
        $reports->getCollection()->transform(function ($report) {
            $report->check_item = is_string($report->check_item)
                ? json_decode($report->check_item, true) ?? []
                : ($report->check_item ?? []);

            $report->verification_reading = is_string($report->verification_reading)
                ? json_decode($report->verification_reading, true) ?? []
                : ($report->verification_reading ?? []);

            $report->std_use_verification = is_string($report->std_use_verification)
                ? json_decode($report->std_use_verification, true) ?? []
                : ($report->std_use_verification ?? []);

            return $report;
        });

        return inertia('Ionizer/IonizerChecklist', [
            'reports' => $reports,      // paginated data
            'items' => $items,          // template items for Add modal
            'machines' => $machines,
            'filters' => $request->all(),
            'tableFilters' => $request->only([
                'search',
                'perPage',
                'sortBy',
                'sortDirection',
                'start',
                'end',
                'dropdownSearchValue',
                'dropdownFields',
            ]),
            'empData' => [
                'emp_id' => session('emp_data')['emp_id'] ?? null,
                'emp_name' => session('emp_data')['emp_name'] ?? null,
                'emp_jobtitle' => session('emp_data')['emp_jobtitle'] ?? null,
            ],
        ]);
    }









    public function store(Request $request)
    {
        $data = $request->all();

        // Encode JSON fields bago i-save
        $data['check_item'] = json_encode($request->check_item ?? []);
        $data['verification_reading'] = json_encode($request->verification_reading ?? []);
        $data['std_use_verification'] = json_encode($request->std_use_verification ?? []);
        $data['created_by'] = session('emp_data')['emp_name'] ?? null;

        IonizerChecklist::create($data);

        return redirect()->route('ionizer.index')
            ->with('success', 'Ionizer checklist added successfully');
    }

    public function update(Request $request, $id)
    {
        $checklist = IonizerChecklist::findOrFail($id);

        $data = $request->all();

        // Encode JSON fields bago i-update
        $data['check_item'] = json_encode($request->check_item ?? []);
        $data['verification_reading'] = json_encode($request->verification_reading ?? []);
        $data['std_use_verification'] = json_encode($request->std_use_verification ?? []);
        $data['updated_by'] = session('emp_data')['emp_name'] ?? null;

        $checklist->update($data);

        return redirect()->route('ionizer.index')
            ->with('success', 'Ionizer checklist updated successfully');
    }

    public function destroy($id)
    {
        $checklist = IonizerChecklist::findOrFail($id);
        $checklist->delete();

        return redirect()->route('ionizer.index')
            ->with('success', 'Ionizer checklist deleted successfully');
    }

    public function generatePdf($id)
    {
        $record = IonizerChecklist::findOrFail($id);

        $checkItems = is_string($record->check_item)
            ? json_decode($record->check_item, true)
            : ($record->check_item ?? []);

        $verificationReadings = is_string($record->verification_reading)
            ? json_decode($record->verification_reading, true)
            : ($record->verification_reading ?? []);

        $stdUseVerifications = is_string($record->std_use_verification)
            ? json_decode($record->std_use_verification, true)
            : ($record->std_use_verification ?? []);

        $pdf = Pdf::loadView('pdf.ionizer_checklist', compact(
            'record',
            'checkItems',
            'verificationReadings',
            'stdUseVerifications'
        ));

        return $pdf->stream("ionizer_checklist_{$record->id}.pdf");
    }

    public function verify(Request $request, $id)
    {
        $record = IonizerChecklist::findOrFail($id);

        if ($request->type === 'tech' && empty($record->tech_sign)) {
            $record->tech_sign = session('emp_data')['emp_name'] ?? null;
            $record->tech_sign_date = now();
        }

        if ($request->type === 'qa' && !empty($record->tech_sign) && empty($record->qa_sign)) {
            $record->qa_sign = session('emp_data')['emp_name'] ?? null;
            $record->qa_sign_date = now();
        }

        $record->save();

        return response()->json(['success' => true, 'message' => 'Verification successful']);
    }

    public function bulkVerify(Request $request)
    {
        $ids = $request->input('ids', []);
        $type = $request->input('type');

        $records = IonizerChecklist::whereIn('id', $ids)->get();

        foreach ($records as $record) {
            if ($type === 'tech' && empty($record->tech_sign)) {
                $record->tech_sign = session('emp_data')['emp_name'] ?? null;
                $record->tech_sign_date = now();
            }

            if ($type === 'qa' && !empty($record->tech_sign) && empty($record->qa_sign)) {
                $record->qa_sign = session('emp_data')['emp_name'] ?? null;
                $record->qa_sign_date = now();
            }

            $record->save();
        }

        return response()->json(['success' => true]);
    }
}
