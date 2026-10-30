<?php

namespace App\Http\Controllers\Ionizer;

use App\Http\Controllers\Controller;
use App\Models\IonizerChecklist;
use App\Models\IonizerChecklistItem;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Services\DataTableService;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Inertia\Inertia;

class IonizerChecklistController extends Controller
{
    protected $datatable;

    /**
     * 🔧 Constructor — ito ang nag-inject ng DataTableService.
     *    Wala ito → "Call to a member function handle() on null".
     */
    public function __construct(DataTableService $datatable)
    {
        $this->datatable = $datatable;
    }

    /**
     * ✏️ PERMISSION MAP — nasa config/ionizer_checklist.php
     *    Doon mo lang idadagdag kung sino pa ang pwedeng mag-edit.
     */
    protected function editMap(): array
    {
        return (array) config('ionizer_checklist.editable_emp_ids', []);
    }

    protected function currentEmpId(): ?string
    {
        $empId = session('emp_data')['emp_id'] ?? null;

        return $empId === null ? null : (string) $empId;
    }

    /**
     * ✏️ Pwedeng mag-edit? (server-side — session ang batayan, hindi browser)
     */
    protected function canEdit(): bool
    {
        $empId = $this->currentEmpId();
        $map   = $this->editMap();

        if ($empId === null) {
            return false;
        }

        // may entry ba — string key man o int key ang na-type sa config
        return array_key_exists($empId, $map) || in_array($empId, array_map('strval', array_keys($map)), true);
    }

    /**
     * ✏️ Section-level permission.
     *    canEditSection('items') → true kung '*' o may 'items' sa listahan.
     */
    protected function canEditSection(string $section): bool
    {
        $empId = $this->currentEmpId();

        if ($empId === null) {
            return false;
        }

        $map = $this->editMap();

        $sections = $map[$empId] ?? null;

        if ($sections === null) {
            // fallback: int key sa config
            foreach ($map as $id => $value) {
                if ((string) $id === $empId) {
                    $sections = $value;
                    break;
                }
            }
        }

        if ($sections === null) {
            return false;
        }

        $sections = is_array($sections) ? $sections : [$sections];

        return in_array('*', $sections, true) || in_array($section, $sections, true);
    }

    /** Lahat ng sections na pwedeng i-edit ng kasalukuyang user */
    protected function editableSections(): array
    {
        $all  = ['header', 'items', 'readings', 'std', 'remarks', 'signatures'];
        $open = array_values(array_filter($all, fn ($s) => $this->canEditSection($s)));

        return $open;
    }

    protected function isFullyVerified($record): bool
    {
        return trim((string) $record->tech_sign) !== ''
            && trim((string) $record->qa_sign) !== '';
    }

    /** DATE normalizer — kahit anong format ang i-submit, Y-m-d ang itatabi */
    protected function normalizeDate($value): ?string
    {
        if ($value === null || trim((string) $value) === '') {
            return null;
        }

        $raw = trim((string) $value);

        foreach (['Y-m-d', 'm/d/Y', 'n/j/Y', 'd/m/Y', 'Y/m/d', 'm-d-Y', 'd-m-Y', 'Y-m-d\TH:i:s.uP', 'Y-m-d\TH:i:sP'] as $format) {
            try {
                $date = Carbon::createFromFormat($format, $raw);
                if ($date && $date->format($format) === $raw) {
                    return $date->format('Y-m-d');
                }
            } catch (\Throwable $e) {
                // try next format
            }
        }

        try {
            return Carbon::parse($raw)->format('Y-m-d');
        } catch (\Throwable $e) {
            return null;
        }
    }

    /** Safe column check — para hindi sumabog kung wala pa ang created_by/updated_by column */
    protected function hasColumn(string $column): bool
    {
        static $cache = [];

        if (!array_key_exists($column, $cache)) {
            try {
                $cache[$column] = \Illuminate\Support\Facades\Schema::hasColumn('ionizer_checklist_tbl', $column);
            } catch (\Throwable $e) {
                $cache[$column] = false;
            }
        }

        return $cache[$column];
    }

    /** Safe na route() — walang exception kung wala ang route name */
    protected function safeRoute(string $name, array $params = []): ?string
    {
        try {
            return route($name, $params);
        } catch (\Throwable $e) {
            return null;
        }
    }

    /**
     * 🔗 Endpoints — hinahanap ang route by NAME, at kung wala ay by URI.
     *    Iwasan ang maling URL kapag walang pangalan ang route sa web.php.
     */
    protected function endpoints(): array
    {
        $pick = function (array $names, array $uris, string $default): string {
            foreach ($names as $name) {
                $url = $this->safeRoute($name);
                if ($url) {
                    return $url;
                }
            }

            // fallback: hanapin sa route collection by URI (para sa un-named routes)
            try {
                foreach ($uris as $uri) {
                    if (\Illuminate\Support\Facades\Route::has($uri)) {
                        return url($uri);
                    }

                    $route = collect(\Illuminate\Support\Facades\Route::getRoutes())
                        ->first(fn ($r) => in_array('GET', $r->methods(), true) && $r->uri() === ltrim($uri, '/'));

                    if ($route) {
                        return url($route->uri());
                    }
                }
            } catch (\Throwable $e) {
                // ignore
            }

            return $default;
        };

        return [
            'store'  => $pick(['ionizer.store'], ['ionizer-checklists'], '/ionizer-checklists'),
            'update' => $this->safeRoute('ionizer.update', ['id' => '__ID__'])
                ?? $this->safeRoute('ionizer.update', ['ionizer' => '__ID__'])
                ?? '/ionizer-checklists/__ID__',
            'pdf'    => $pick(
                ['ionizer.pdf', 'ionizer-checklist.pdf'],
                ['ionizer-checklist/__ID__/pdf'],
                '/ionizer-checklist/__ID__/pdf',
            ),
        ];
    }

    /**
     * 🔥 Hinaharap ang lahat ng posibleng hugis ng datatable payload at
     *    sinisigurong array (hindi JSON string) ang check_item /
     *    verification_reading / std_use_verification.
     */
    protected function decodeTableData($data)
    {
        $decodeRow = function ($row) {
            if (is_object($row) && method_exists($row, 'toArray')) {
                $row = $row->toArray();
            }

            if (!is_array($row)) {
                return $row;
            }

            foreach (['check_item', 'verification_reading', 'std_use_verification'] as $field) {
                $value = $row[$field] ?? null;

                if (is_string($value)) {
                    $decoded = json_decode($value, true);
                    $row[$field] = is_array($decoded) ? $decoded : [];
                } elseif (is_array($value)) {
                    $row[$field] = $value;
                } else {
                    $row[$field] = [];
                }
            }

            return $row;
        };

        // Paginator / LengthAwarePaginator
        if ($data instanceof \Illuminate\Contracts\Pagination\Paginator) {
            return $data->through($decodeRow);
        }

        // Eloquent/Support Collection
        if ($data instanceof \Illuminate\Support\Collection) {
            return $data->map($decodeRow);
        }

        // plain array na may 'data' key (manually built paginator payload)
        if (is_array($data) && isset($data['data']) && is_array($data['data'])) {
            $data['data'] = array_map($decodeRow, $data['data']);

            return $data;
        }

        // plain list ng rows
        if (is_array($data)) {
            return array_map($decodeRow, $data);
        }

        return $data;
    }

    protected function decodeFields($report)
    {
        foreach (['check_item', 'verification_reading', 'std_use_verification'] as $field) {
            $value = $report->{$field} ?? null;
            $report->{$field} = is_string($value)
                ? json_decode($value, true) ?? []
                : ($value ?? []);
        }

        return $report;
    }

    /* =====================================================================
     *  INDEX
     * ===================================================================== */
    public function index(Request $request)
    {
        $reports = IonizerChecklist::orderBy('id', 'desc')->paginate(10);
        $reports->getCollection()->transform(fn ($r) => $this->decodeFields($r));

        // 🔹 Template items para sa Add modal
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

        // 🔹 Datatable (View modal source)
        if (!$this->datatable) {
            $this->datatable = app(DataTableService::class);
        }

        $result = $this->datatable->handle(
            $request,
            'mysql',
            'ionizer_checklist_tbl',
            [
                'conditions' => fn ($query) => $query->orderBy('id', 'desc'),
                'searchColumns' => [
                    'control_no',
                    'pm_date',
                    'pm_due',
                    'performed_by',
                    'tech_sign',
                    'qa_sign',
                ],
            ]
        );

        if ($result instanceof \Symfony\Component\HttpFoundation\StreamedResponse) {
            return $result;
        }

        if (isset($result['data']) && method_exists($result['data'], 'getCollection')) {
            $result['data']->getCollection()->transform(fn ($r) => $this->decodeFields($r));
        }

        // 🔥 SAFETY NET — kahit anong uri ang ibalik ng DataTableService (array,
        //    paginator, o Collection), JSON-decoded pa rin ang 3 fields.
        $tableData = $this->decodeTableData($result['data'] ?? []);

        return Inertia::render('Ionizer/IonizerChecklist', [
            'tableData'    => $tableData,
            'reports'      => $reports,
            'items'        => $items,
            'machines'     => $machines,
            'filters'      => $request->all(),
            'tableFilters' => $request->only([
                'search', 'perPage', 'sortBy', 'sortDirection',
                'start', 'end', 'dropdownSearchValue', 'dropdownFields',
            ]),

            // 🔗 URLs — galing sa route list ng app, kaya hindi na umaasa sa
            //    Ziggy naming. Kung wala pang route name, API endpoints lang.
            'urls' => $this->endpoints(),

            // ✏️ PERMISSIONS — ito ang binabasa ng frontend
            'canEdit'          => $this->canEdit(),
            'editableSections' => $this->editableSections(),
            'pmDueDays'        => (int) config('ionizer_checklist.pm_due_days', 7),

            // 🖊️ ACTIVITY CODE legend + default template rows
            'activityCodes'    => $this->activityCodes(),
            'itemTemplate'     => $this->itemTemplate(),
            'readingTemplate'  => $this->readingTemplate(),
            'stdTemplate'      => $this->stdTemplate(),
        ]);
    }

    /* =====================================================================
     *  STORE — lahat ng value editable, kasama ang PM DATE at checklist
     * ===================================================================== */
    public function store(Request $request)
    {
        $request->validate([
            'control_no' => 'nullable|string|max:255',
            'pm_date'    => 'nullable|string',   // 🔥 pwedeng baguhin/itext kahit anong date format
            'pm_due'     => 'nullable|string',
        ]);

        $pmDate = $this->normalizeDate($request->input('pm_date')) ?? now()->format('Y-m-d');

        $pmDue = $this->normalizeDate($request->input('pm_due'))
            ?? Carbon::parse($pmDate)
                ->addDays((int) config('ionizer_checklist.pm_due_days', 7))
                ->format('Y-m-d');

        $data = [
            'description'            => $request->input('description'),
            'control_no'             => $request->input('control_no'),
            'serial'                 => $request->input('serial'),
            'frequency'              => $request->input('frequency'),
            'performed_by'           => $request->input('performed_by'),
            'pm_date'                => $pmDate,   // ✅ user-chosen date ang itatabi
            'pm_due'                 => $pmDue,
            'dthm_temp'              => $request->input('dthm_temp'),
            'dthm_rh'                => $request->input('dthm_rh'),
            'days'                   => $request->input('days'),
            'remarks'                => $request->input('remarks'),
            'check_item'             => json_encode($this->sanitizeRows($request->input('check_item', []))),
            'verification_reading'   => json_encode($this->sanitizeReadings($request->input('verification_reading', []))),
            'std_use_verification'   => json_encode($this->sanitizeRows($request->input('std_use_verification', []))),
        ];

        if ($this->hasColumn('created_by')) {
            $data['created_by'] = session('emp_data')['emp_name'] ?? null;
        }

        IonizerChecklist::create($data);

        return redirect()->route('ionizer.index')
            ->with('success', 'Ionizer checklist added successfully');
    }

    /* =====================================================================
     *  UPDATE — pwedeng ma-edit LAHAT ng value (validation section-aware)
     * ===================================================================== */
    public function update(Request $request, $id)
    {
        abort_unless($this->canEdit(), 403, 'You are not allowed to edit.');

        $checklist = IonizerChecklist::findOrFail($id);

        // 🔒 optional lock: kapag naka-off ang allow_edit_when_signed at 100% verified na
        $allowWhenSigned = (bool) config('ionizer_checklist.allow_edit_when_signed', true);

        if (!$allowWhenSigned && $this->isFullyVerified($checklist)) {
            return back()->withErrors([
                'edit' => 'This checklist is already 100% verified and is locked from editing.',
            ]);
        }

        $open = $this->editableSections();

        $request->validate([
            'pm_date'      => 'nullable|string',
            'pm_due'       => 'nullable|string',
            'tech_sign'    => 'nullable|string|max:255',
            'qa_sign'      => 'nullable|string|max:255',
            'tech_sign_date' => 'nullable|string',
            'qa_sign_date'   => 'nullable|string',
        ]);

        /* ---------------- HEADER ---------------- */
        if (in_array('header', $open, true) && $request->hasAny([
            'description', 'control_no', 'serial', 'frequency', 'performed_by',
            'pm_date', 'pm_due', 'dthm_temp', 'dthm_rh', 'days',
        ])) {
            foreach (['description', 'control_no', 'serial', 'frequency', 'performed_by', 'dthm_temp', 'dthm_rh', 'days'] as $f) {
                if ($request->has($f)) {
                    $checklist->{$f} = $request->input($f);
                }
            }

            // 🔥 DATE — pwedeng baguhin kahit kailan, kasama ang PM DATE
            if ($request->has('pm_date')) {
                $checklist->pm_date = $this->normalizeDate($request->input('pm_date'));
            }

            // PM Due: kung blangko pero may PM Date → awtomatikong +N days
            if ($request->has('pm_due')) {
                $pmDue = $this->normalizeDate($request->input('pm_due'));

                if ($pmDue === null && $checklist->pm_date) {
                    $pmDue = Carbon::parse($checklist->pm_date)
                        ->addDays((int) config('ionizer_checklist.pm_due_days', 7))
                        ->format('Y-m-d');
                }

                $checklist->pm_due = $pmDue;
            }
        }

        /* ---------------- CHECK ITEMS ---------------- */
        if (in_array('items', $open, true) && $request->has('check_item')) {
            $checklist->check_item = json_encode($this->sanitizeRows($request->input('check_item', [])));
        }

        /* ---------------- VERIFICATION READING ---------------- */
        if (in_array('readings', $open, true) && $request->has('verification_reading')) {
            $checklist->verification_reading = json_encode($this->sanitizeReadings($request->input('verification_reading', [])));
        }

        /* ---------------- STANDARD USE VERIFICATION ---------------- */
        if (in_array('std', $open, true) && $request->has('std_use_verification')) {
            $checklist->std_use_verification = json_encode($this->sanitizeRows($request->input('std_use_verification', [])));
        }

        /* ---------------- REMARKS ---------------- */
        if (in_array('remarks', $open, true) && $request->has('remarks')) {
            $checklist->remarks = $request->input('remarks');
        }

        /* ---------------- SIGNATURES ---------------- */
        if (in_array('signatures', $open, true)) {
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
        }

        // 🔒 sunod-sunod pa rin: Tech → QA
        if (trim((string) $checklist->qa_sign) !== '' && trim((string) $checklist->tech_sign) === '') {
            return back()->withErrors(['sign' => 'QA Verifier needs a Tech Verifier first.']);
        }

        if ($this->hasColumn('updated_by')) {
            $checklist->updated_by = session('emp_data')['emp_name'] ?? null;
        }

        $checklist->save();

        return redirect()->route('ionizer.index')
            ->with('success', 'Ionizer checklist updated successfully');
    }

    /* =====================================================================
     *  HELPERS
     * ===================================================================== */
    /** Linisin ang rows bago i-save (iwasan ang kalat / XSS mula sa browser) */
    protected function sanitizeRows($rows): array
    {
        if (!is_array($rows)) {
            return [];
        }

        $clean = [];

        foreach ($rows as $row) {
            if (!is_array($row)) {
                continue;
            }

            $row = array_map(function ($v) {
                return is_string($v) ? trim(strip_tags($v)) : $v;
            }, $row);

            // i-skip ang blankong row
            if (implode('', array_map(fn ($v) => is_scalar($v) ? (string) $v : '', $row)) === '') {
                continue;
            }

            $clean[] = $row;
        }

        return $clean;
    }

    /** Readings: may nested na trial_1/2/3 => ['min','max'] values */
    protected function sanitizeReadings($rows): array
    {
        if (!is_array($rows)) {
            return [];
        }

        $clean = [];

        foreach ($rows as $row) {
            if (!is_array($row)) {
                continue;
            }

            $out = [];

            foreach ($row as $key => $value) {
                if (is_array($value)) {
                    $nested = [];
                    foreach ($value as $k2 => $v2) {
                        $nested[$k2] = is_string($v2) ? trim(strip_tags($v2)) : $v2;
                    }
                    $out[$key] = $nested;
                } else {
                    $out[$key] = is_string($value) ? trim(strip_tags($value)) : $value;
                }
            }

            // i-skip ang blankong row
            $flat = trim(implode('', array_map(
                fn ($v) => is_scalar($v) ? (string) $v : implode('', array_map('strval', is_array($v) ? $v : [])),
                $out
            )));

            if ($flat === '') {
                continue;
            }

            $clean[] = $out;
        }

        return $clean;
    }

    /** ACTIVITY CODE legend (galing sa screenshot) */
    public function activityCodes(): array
    {
        return [
            ['code' => 'A', 'label' => 'Check'],
            ['code' => 'B', 'label' => 'Clean'],
            ['code' => 'C', 'label' => 'Lubricate'],
            ['code' => 'D', 'label' => 'Adjust'],
            ['code' => 'E', 'label' => 'Align'],
            ['code' => 'F', 'label' => 'Calibrate'],
            ['code' => 'G', 'label' => 'Modify'],
            ['code' => 'H', 'label' => 'Repair'],
            ['code' => 'I', 'label' => 'Replace'],
            ['code' => 'L', 'label' => 'Measure'],
        ];
    }

    /** Default checklist rows (galing sa screenshot) */
    public function itemTemplate(): array
    {
        return [
            ['asset' => 'Ionizer',              'requirement' => 'Cleaned',        'activity' => 'B',     'compliance' => true],
            ['asset' => 'Cables',               'requirement' => 'Cleaned',        'activity' => 'B',     'compliance' => true],
            ['asset' => 'Machine Location',     'requirement' => 'Cleaned',        'activity' => 'A, B',  'compliance' => true],
            ['asset' => 'Ionizing Air Blower',  'requirement' => 'Functional',     'activity' => 'A, L',  'compliance' => true],
            ['asset' => 'Ionizer emitter',      'requirement' => 'Cleaned',        'activity' => 'B',     'compliance' => true],
            ['asset' => 'Air Inlet',            'requirement' => 'Cleaned',        'activity' => 'B',     'compliance' => true],
            ['asset' => 'Air outlet',           'requirement' => 'Cleaned',        'activity' => 'B',     'compliance' => true],
            ['asset' => 'Machine grounding',    'requirement' => 'Connected',      'activity' => 'A',     'compliance' => true],
            ['asset' => 'Ion balance',          'requirement' => 'Functional',     'activity' => 'A, L',  'compliance' => true],
        ];
    }

    /** Default verification reading rows */
    public function readingTemplate(): array
    {
        return [
            [
                'description' => 'Ion balance reading',
                'specs'       => '(-)1.25 volts',
                'instrument'  => 'Ion tester',
                'trial_1'     => ['min' => '-7.0', 'max' => '4.5'],
                'trial_2'     => ['min' => '-2.4', 'max' => '9.1'],
                'trial_3'     => ['min' => '-0.5', 'max' => '1.0'],
            ],
            [
                'description' => 'Decay time reading (Charge at 1kV)',
                'specs'       => '(-)2 seconds',
                'instrument'  => 'Ion tester',
                'trial_1'     => ['min' => '1.57', 'max' => '1.72'],
                'trial_2'     => ['min' => '1.61', 'max' => '1.71'],
                'trial_3'     => ['min' => '1.47', 'max' => '1.62'],
            ],
        ];
    }

    /** Default standard use verification rows */
    public function stdTemplate(): array
    {
        return [
            ['description' => 'Identify Need / Reseat',  'instrument_1' => 'PM: 05/30/25', 'instrument_2' => 'QA', 'instrument_3' => 'QA'],
            ['description' => 'Service Tag',            'instrument_1' => 'PM',           'instrument_2' => 'QA', 'instrument_3' => 'QA'],
            ['description' => 'Control No.',            'instrument_1' => 'PM',           'instrument_2' => 'QA', 'instrument_3' => 'QA'],
            ['description' => 'Calibration date',       'instrument_1' => 'PM',           'instrument_2' => 'QA', 'instrument_3' => 'QA'],
            ['description' => 'Calibration due',        'instrument_1' => 'PM',           'instrument_2' => 'QA', 'instrument_3' => 'QA'],
        ];
    }

    /* =====================================================================
     *  DESTROY / PDF / VERIFY (hindi binago ang logic)
     * ===================================================================== */
    public function destroy($id)
    {
        IonizerChecklist::findOrFail($id)->delete();

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

        foreach (IonizerChecklist::whereIn('id', $ids)->get() as $record) {
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
