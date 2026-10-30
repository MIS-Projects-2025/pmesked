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
use Carbon\Carbon;
use Inertia\Inertia;


class IonizerChecklistController extends Controller
{

    protected $datatable;
    protected $datatable1;

    /**
     * ✏️ Ang LANG pwedeng mag-edit ng na-save na checklist (at 100% verified lang).
     */
    protected const EDITOR_EMP_ID = '1797';

    public function __construct(DataTableService $datatable)
    {
        $this->datatable = $datatable;
    }

    /**
     * ✏️ Server-side check — session ang batayan, hindi ang browser.
     */
    protected function canEdit(): bool
    {
        $empId = session('emp_data')['emp_id'] ?? null;

        return $empId !== null && (string) $empId === self::EDITOR_EMP_ID;
    }

    /**
     * ✏️ 100% = may Tech sign AT QA sign na.
     */
    protected function isFullyVerified($record): bool
    {
        return trim((string) $record->tech_sign) !== ''
            && trim((string) $record->qa_sign) !== '';
    }

    //old code 04272026
    // public function index(Request $request)
    // {
    //     // Paginated IonizerChecklist (10 per page)
    //     $reports = IonizerChecklist::orderBy('id', 'desc')->paginate(10);

    //     // Template items for Add modal
    //     $items = IonizerChecklistItem::orderBy('id', 'desc')->get();

    //     // Machines list
    //     $machines = DB::connection('server201')
    //         ->table('machine_list')
    //         ->whereNotNull('pmnt_no')
    //         ->whereIn('status', ['Active', 'ACTIVE', 'active'])
    //         ->whereIn('machine_type', ['IONIZER', 'Air Ionizer'])
    //         ->whereIn('pmnt_no', function ($query) {
    //             $query->select('pmnt_no')
    //                 ->from('machine_list')
    //                 ->groupBy('pmnt_no')
    //                 ->havingRaw('COUNT(*) = 1');
    //         })
    //         ->orderBy('pmnt_no', 'asc')
    //         ->get();


    //     // Decode JSON fields safely
    //     $reports->getCollection()->transform(function ($report) {
    //         $report->check_item = is_string($report->check_item)
    //             ? json_decode($report->check_item, true) ?? []
    //             : ($report->check_item ?? []);

    //         $report->verification_reading = is_string($report->verification_reading)
    //             ? json_decode($report->verification_reading, true) ?? []
    //             : ($report->verification_reading ?? []);

    //         $report->std_use_verification = is_string($report->std_use_verification)
    //             ? json_decode($report->std_use_verification, true) ?? []
    //             : ($report->std_use_verification ?? []);

    //         return $report;
    //     });

    //     return inertia('Ionizer/IonizerChecklist', [
    //         'reports' => $reports,      // paginated data
    //         'items' => $items,          // template items for Add modal
    //         'machines' => $machines,
    //         'filters' => $request->all(),
    //         'tableFilters' => $request->only([
    //             'search',
    //             'perPage',
    //             'sortBy',
    //             'sortDirection',
    //             'start',
    //             'end',
    //             'dropdownSearchValue',
    //             'dropdownFields',
    //         ]),
    //         'empData' => [
    //             'emp_id' => session('emp_data')['emp_id'] ?? null,
    //             'emp_name' => session('emp_data')['emp_name'] ?? null,
    //             'emp_jobtitle' => session('emp_data')['emp_jobtitle'] ?? null,
    //         ],
    //     ]);
    // }



    public function index(Request $request)
    {
        // 🔹 Paginated IonizerChecklist (for other usage)
        $reports = IonizerChecklist::orderBy('id', 'desc')->paginate(10);

        // 🔹 Template items for Add modal
        $items = IonizerChecklistItem::orderBy('id', 'desc')->get();

        // 🔹 Machines list
        $machines = DB::connection('server201')
            ->table('machine_list')
            ->select('*')
            ->whereNotNull('pmnt_no')
            ->whereIn('machine_type', ['IONIZER', 'Air Ionizer'])
            ->orderBy('machine_type')
            ->distinct()
            ->get();

        // 🔥 FUNCTION: reusable JSON decoder
        $decodeFields = function ($report) {
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
        };

        // 🔹 Decode $reports (pagination)
        $reports->getCollection()->transform($decodeFields);

        // 🔹 Datatable result (THIS is used in View Modal)
        $result = $this->datatable->handle(
            $request,
            'mysql',
            'ionizer_checklist_tbl',
            [
                'conditions' => function ($query) {
                    return $query->orderBy('id', 'desc');
                },
                'searchColumns' => [
                    'control_no',
                    'pm_date',
                    'pm_due',
                    'performed_by',
                    'tech_sign',
                    'qa_sign'
                ],
            ]
        );

        // 🔥 VERY IMPORTANT: decode tableData
        if (isset($result['data']) && method_exists($result['data'], 'getCollection')) {
            $result['data']->getCollection()->transform($decodeFields);
        }

        // 🔹 CSV export handling
        if ($result instanceof \Symfony\Component\HttpFoundation\StreamedResponse) {
            return $result;
        }

        // 🔹 Return to Inertia
        return Inertia::render('Ionizer/IonizerChecklist', [
            'tableData' => $result['data'],   // ✅ FIXED (now decoded)
            'reports' => $reports,
            'items' => $items,
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
            // ✏️ para sa Edit button — ang server ang nagde-decide
            'canEdit' => $this->canEdit(),
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
        // ✏️ 1797 lang, at 100% verified lang ang pwedeng i-edit
        abort_unless($this->canEdit(), 403, 'You are not allowed to edit.');

        $checklist = IonizerChecklist::findOrFail($id);

        if (!$this->isFullyVerified($checklist)) {
            return back()->withErrors(['edit' => 'Only fully verified (100%) checklists can be edited.']);
        }

        $request->validate([
            'tech_sign'      => 'nullable|string|max:255',
            'tech_sign_date' => 'nullable|date_format:Y-m-d H:i:s',
            'qa_sign'        => 'nullable|string|max:255',
            'qa_sign_date'   => 'nullable|date_format:Y-m-d H:i:s',
        ]);

        $data = $request->all();

        // Verifiers — hiwalay ang handling (hindi sumasama sa mass update)
        unset($data['tech_sign'], $data['tech_sign_date'], $data['qa_sign'], $data['qa_sign_date']);

        // Encode JSON fields bago i-update
        $data['check_item'] = json_encode($request->check_item ?? []);
        $data['verification_reading'] = json_encode($request->verification_reading ?? []);
        $data['std_use_verification'] = json_encode($request->std_use_verification ?? []);
        $data['updated_by'] = session('emp_data')['emp_name'] ?? null;

        $checklist->fill($data);

        // ✏️ Verifiers (pangalan + petsa). Walang pangalan = blangko rin ang petsa.
        // May pangalan pero walang petsa = dating petsa, o ngayon kung wala pa.
        foreach (['tech_sign', 'qa_sign'] as $f) {
            if (!$request->has($f)) {
                continue;
            }

            $name = trim((string) $request->input($f));
            $dateField = $f . '_date';

            if ($name === '') {
                $checklist->{$f} = null;
                $checklist->{$dateField} = null;
            } else {
                $checklist->{$f} = $name;
                $checklist->{$dateField} = $request->filled($dateField)
                    ? $request->input($dateField)
                    : ($checklist->getRawOriginal($dateField) ?: now()->format('Y-m-d H:i:s'));
            }
        }

        // 🔒 Dapat sunod-sunod pa rin: Tech → QA
        if (trim((string) $checklist->qa_sign) !== '' && trim((string) $checklist->tech_sign) === '') {
            return back()->withErrors(['sign' => 'QA Verifier needs a Tech Verifier first.']);
        }

        $checklist->save();

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
