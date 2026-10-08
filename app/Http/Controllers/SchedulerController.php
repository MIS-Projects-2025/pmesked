<?php

namespace App\Http\Controllers;

use App\Models\Scheduler;
use App\Models\Machine;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;

class SchedulerController extends Controller
{
    protected $datatable;

    /**
     * ✏️ Ang LANG pwedeng mag-edit ng na-save na PM Scheduler.
     * Para magdagdag ng iba pang pwede, gawing array (in_array) sa canEdit().
     */
    protected const EDITOR_EMP_ID = '1797';

    public function __construct(\App\Services\DataTableService $datatable)
    {
        $this->datatable = $datatable;
    }

    /**
     * ✏️ Server-side check — ang session ang batayan, hindi ang browser.
     */
    protected function canEdit(): bool
    {
        $empId = session('emp_data')['emp_id'] ?? null;

        return $empId !== null && (string) $empId === self::EDITOR_EMP_ID;
    }

    /**
     * ✏️ Pwede lang i-edit ang record na 100% na (kumpleto ang Tech, ESD, at Engineer).
     * Sinusuri sa totoong ack ng record, hindi sa value na galing sa browser.
     */
    protected function isEditableRecord($scheduler): bool
    {
        return $this->computeProgress($scheduler) >= 100;
    }

    /**
     * ============================================================
     *  📐 ANG PROGRESS VALUE = 4 quarters × 25% (iisang depinisyon)
     * ------------------------------------------------------------
     *  Q1 = responsible_person  (ginawa / pinunan ng nag-perform)
     *  Q2 = tech_ack            (Senior Tech)
     *  Q3 = qa_ack              (ESD / QA)
     *  Q4 = senior_ee_ack       (PM Engineer)
     *
     *  🔴 Dati: si section_ack ang nasa SQL formula imbes na tech_ack
     *  (wala palang section_ack na column sa scheduler_tbl), kaya
     *  nag-100 ang display kahit hindi pa lahat ng tatlong verifier
     *  (tech → esd → engineer) ang pumirma — at nag-error ang SQL.
     *
     *  Ang apat na condition sa ibaba ang IISANG pinagmulan para sa:
     *  • progressSql()        → display sa index()
     *  • progressExpression() → auto-repair ng stored column
     *  • computeProgress()    → store(), update() at verify()
     * ============================================================
     */
    protected function progressConditions(): array
    {
        return [
            // Q1 — ginawa/pinunan ng nag-perform
            "(CASE WHEN responsible_person IS NOT NULL AND TRIM(responsible_person) != '' THEN 1 ELSE 0 END)",
            // Q2 — Senior Tech verifier
            "(CASE WHEN tech_ack IS NOT NULL AND TRIM(tech_ack) != '' THEN 1 ELSE 0 END)",
            // Q3 — ESD / QA verifier
            "(CASE WHEN qa_ack IS NOT NULL AND TRIM(qa_ack) != '' THEN 1 ELSE 0 END)",
            // Q4 — PM Engineer verifier
            "(CASE WHEN senior_ee_ack IS NOT NULL AND TRIM(senior_ee_ack) != '' THEN 1 ELSE 0 END)",
        ];
    }

    /**
     * MySQL version — ginagamit sa display/index (0–100 scale).
     */
    protected function progressSql()
    {
        $parts = implode(' + ', $this->progressConditions());

        return DB::connection('mysql')->raw(
            "ROUND(({$parts}) * 100.0 / 4, 0) AS progress_value"
        );
    }

    /**
     * MySQL expression na gumagawa ng (0–100) na value mismo —
     * ginagamit sa auto-repair ng stored column (25 bawat quarter).
     */
    protected function progressExpression()
    {
        return implode(' + ', array_map(
            fn ($c) => "({$c}) * 25",
            $this->progressConditions()
        ));
    }

    /**
     * PHP version ng parehong computation — ginagamit sa store(), update() at verify()
     * para hindi na magkasalungat ang na-save na value vs. ang ipinapakita sa index().
     */
    protected function computeProgress($scheduler)
    {
        $filled = fn ($v) => ($v !== null && trim((string) $v) !== '') ? 1 : 0;

        return (
            $filled($scheduler->responsible_person) +
            $filled($scheduler->tech_ack) +
            $filled($scheduler->qa_ack) +
            $filled($scheduler->senior_ee_ack)
        ) * 25;
    }

    public function index(Request $request)
    {
        // 🛠 AUTO-HEAL: kung may maling stored progress_value (hal. 100 pero
        // kulang ang Tech/ESD/PM Engineer), awtomatikong inaayos bago i-fetch
        // ang data — para laging tama ang View modal, PDF, at iba pang query
        // na gumagamit ng stored column, kahit may naulit pang lumang bug.
        $this->repairAllProgress();

        // 🔹 Default sorting kung walang laman request
        if (!$request->has('sortBy')) {
            $request->merge(['sortBy' => 'id']);
        }
        if (!$request->has('sortDirection')) {
            $request->merge(['sortDirection' => 'desc']);
        }

        // 🔹 Get data via datatable service
        $result = $this->datatable->handle(
            $request,
            'mysql',
            'scheduler_tbl',
            [
                'defaultSortBy' => 'id',
                'defaultSortDirection' => 'desc',
                'dateColumn' => 'first_cycle',
                'searchColumns' => [
                    'machine_num',
                    'pmnt_no',
                    'quarter',
                    'first_cycle',
                    'pm_due',
                    'responsible_person',
                    'tech_ack',
                    'qa_ack',
                    'senior_ee_ack',
                    'progress_value',
                ],
                'selectColumns' => [
                    'id',
                    'pmnt_no',
                    'machine_num',
                    'serial',
                    'first_cycle',
                    'pm_due',
                    'responsible_person',
                    // 🐛 FIX: dagdag — dati hindi kasama si tech_ack at ang
                    // date fields, kaya blank/empty ang "Tech Verifier"
                    // at hindi nakikita kung sino/kelan nag-verify.
                    'tech_ack',
                    'tech_ack_date',
                    'qa_ack',
                    'qa_ack_date',
                    'senior_ee_ack',
                    'senior_ee_ack_date',
                    'quarter',
                    $this->progressSql(), // ✅ computed — hindi na stale na column
                ],
                'conditions' => function ($query) use ($request) {
                    return $query;
                },
                'filename' => 'scheduler_export',
                'exportColumns' => [
                    'pmnt_no',
                    'machine_num',
                    'serial',
                    'first_cycle',
                    'pm_due',
                    'responsible_person',
                    'quarter',
                ],
            ]
        );

        // 🔹 Return StreamedResponse for exports
        if ($result instanceof \Symfony\Component\HttpFoundation\StreamedResponse) {
            return $result;
        }

        // ✅ Machines para sa dropdown
        $machines = Machine::select('machine_num', 'pmnt_no', 'serial', 'machine_platform')
            ->whereNotNull('machine_num')
            ->whereNotIn('status', ['Write-Off'])
            ->where('machine_num', '!=', '')
            ->whereIn('pmnt_no', function ($query) {
                $query->select('pmnt_no')
                    ->from('machine_list')
                    ->groupBy('pmnt_no')
                    ->havingRaw('COUNT(*) = 1');
            })
            ->distinct()
            ->orderBy('machine_platform')
            ->get();

        return Inertia::render('Tnr/SchedulerTable', [
            'tableData' => $result['data'],
            'machines'  => $machines,
            'tableFilters' => $request->only([
                'search',
                'perPage',
                'sortBy',
                'sortDirection',
                'start',
                'end',
                'dropdownSearchValue',
                'dropdownFields',
                'machine_num',
                'quarter'
            ]),
            'empData' => [
                'emp_id'   => session('emp_data')['emp_id'] ?? null,
                'emp_name' => session('emp_data')['emp_name'] ?? null,
                'emp_jobtitle' => session('emp_data')['emp_jobtitle'] ?? null,
                // ✏️ para sa Edit button — ang server ang nagde-decide
                'can_edit' => $this->canEdit(),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'machine_num' => 'required|string',
            'pmnt_no' => 'required|string',
            'serial' => 'nullable|string',
            'first_cycle' => 'nullable|string',
            'pm_due' => 'nullable|string',
            'responsible_person' => 'nullable|string',
            'quarter' => 'nullable|string',
            'progress_value' => 'nullable|numeric',
            'answers' => 'nullable|json',
            'tool_life' => 'nullable|json',
        ]);

        // 🐛 FIX (performed_by bug): huwag magtiwala sa pangalang galing sa browser.
        // Ang session lang ang pinagkukunan ng totoong naka-login — kaya kahit
        // ma-pollute pa ang form ng ibang employee, hindi na ito mase-save.
        $emp = session('emp_data');
        $empName = $emp['emp_name'] ?? null;

        if ($empName) {
            $validated['responsible_person'] = $empName;
        }

        // 🐛 FIX: recompute imbes na kunin kung ano lang ang ipinadala ng JS.
        // Q1 = 25 kung may responsible_person, kung wala = 0.
        $scheduler = new Scheduler($validated);
        $scheduler->progress_value = $this->computeProgress($scheduler);
        $scheduler->save();

        return redirect()->back()->with('success', 'PM Scheduler created successfully!');
    }

    /**
     * ✏️ JSON para sa Edit modal (100% records lang) — answers + tool_life ng isang record.
     * (Hindi kasama ang mga ito sa selectColumns ng index() para gumaan ang table.)
     */
    public function editData($id)
    {
        abort_unless($this->canEdit(), 403, 'You are not allowed to edit.');

        $scheduler = Scheduler::findOrFail($id);
        abort_unless($this->isEditableRecord($scheduler), 403, 'Only 100% records can be edited.');

        return response()->json([
            'id'          => $scheduler->id,
            'machine_num' => $scheduler->machine_num,
            'first_cycle' => $scheduler->first_cycle,
            'pm_due'      => $scheduler->pm_due,
            'answers'     => $scheduler->answers ? json_decode($scheduler->answers, true) : [],
            'tool_life'   => $scheduler->tool_life ? json_decode($scheduler->tool_life, true) : [],
            // raw DB string — para hindi ma-convert ng model cast / timezone
            'tech_ack'           => $scheduler->tech_ack,
            'tech_ack_date'      => $scheduler->getRawOriginal('tech_ack_date'),
            'qa_ack'             => $scheduler->qa_ack,
            'qa_ack_date'        => $scheduler->getRawOriginal('qa_ack_date'),
            'senior_ee_ack'      => $scheduler->senior_ee_ack,
            'senior_ee_ack_date' => $scheduler->getRawOriginal('senior_ee_ack_date'),
        ]);
    }

    /**
     * ✏️ I-save ang na-edit na PM Scheduler.
     *
     * Ang pwede baguhin: first_cycle (PM Date), pm_due, answers, tool_life,
     * at ang mga verifier (tech_ack / qa_ack / senior_ee_ack + mga petsa nila).
     * HINDI ginagalaw: machine at responsible_person.
     * Ang progress_value ay nire-recompute mula sa mga ack.
     */
    public function update(Request $request, $id)
    {
        abort_unless($this->canEdit(), 403, 'You are not allowed to edit.');

        $validated = $request->validate([
            'first_cycle' => 'nullable|string',
            'pm_due'      => 'nullable|string',
            'answers'     => 'nullable|json',
            'tool_life'   => 'nullable|json',
            // ✏️ verifiers (pangalan + petsa) — pwedeng i-edit ng admin
            'tech_ack'           => 'nullable|string|max:255',
            'tech_ack_date'      => 'nullable|date_format:Y-m-d H:i:s',
            'qa_ack'             => 'nullable|string|max:255',
            'qa_ack_date'        => 'nullable|date_format:Y-m-d H:i:s',
            'senior_ee_ack'      => 'nullable|string|max:255',
            'senior_ee_ack_date' => 'nullable|date_format:Y-m-d H:i:s',
        ]);

        $scheduler = Scheduler::findOrFail($id);

        // ✏️ 100% lang ang pwede i-edit (sinusuri bago i-apply ang changes)
        if (!$this->isEditableRecord($scheduler)) {
            return back()->withErrors(['edit' => 'Only records at 100% progress can be edited.']);
        }

        $scheduler->first_cycle = $validated['first_cycle'] ?? $scheduler->first_cycle;
        $scheduler->pm_due      = $validated['pm_due'] ?? $scheduler->pm_due;
        $scheduler->answers     = $validated['answers'] ?? $scheduler->answers;
        $scheduler->tool_life   = $validated['tool_life'] ?? $scheduler->tool_life;

        // ✏️ Verifiers — i-apply lang kung ipinadala (has), para hindi masira ang ibang caller.
        // Walang pangalan = blangko ang pangalan AT petsa. May pangalan pero walang petsa =
        // gamitin ang dating petsa, o ngayon kung wala pa.
        foreach (['tech_ack', 'qa_ack', 'senior_ee_ack'] as $f) {
            if (!$request->has($f)) {
                continue;
            }

            $name = trim((string) ($validated[$f] ?? ''));
            $dateField = $f . '_date';

            if ($name === '') {
                $scheduler->{$f} = null;
                $scheduler->{$dateField} = null;
            } else {
                $scheduler->{$f} = $name;
                $scheduler->{$dateField} = !empty($validated[$dateField])
                    ? $validated[$dateField]
                    : ($scheduler->getRawOriginal($dateField) ?: now()->format('Y-m-d H:i:s'));
            }
        }

        // 🔒 Dapat sunod-sunod pa rin: tech → ESD → engineer.
        // (Bawal may Engineer na walang ESD, o ESD na walang Tech.)
        $has = fn ($v) => $v !== null && trim((string) $v) !== '';

        if ($has($scheduler->qa_ack) && !$has($scheduler->tech_ack)) {
            return back()->withErrors(['ack' => 'QA Personnel needs a Senior Technician verifier first.']);
        }
        if ($has($scheduler->senior_ee_ack) && !$has($scheduler->qa_ack)) {
            return back()->withErrors(['ack' => 'Senior Engineer needs a QA Personnel verifier first.']);
        }

        // recompute pa rin para laging consistent sa mga ack
        $scheduler->progress_value = $this->computeProgress($scheduler);
        $scheduler->save();

        return back()->with('success', 'PM Scheduler updated successfully!');
    }

    public function verify(Request $request, $id)
    {
        $scheduler = Scheduler::findOrFail($id);

        // 🐛 FIX: hindi na hinahayaan ang pangalan/date na galing sa client —
        // ang session (totoong naka-log-in) ang gagamitin.
        $emp = session('emp_data');
        $empName = $emp['emp_name'] ?? null;

        if (!$empName) {
            return back()->withErrors(['verify' => 'Session expired. Please log in again.']);
        }

        // Hindi pwedeng i-verify ng gumawa ang sarili niyang activity.
        if (
            $scheduler->responsible_person
            && trim($scheduler->responsible_person) === $empName
            && ($request->has('tech_ack') || $request->has('qa_ack')
                || $request->has('senior_ee_ack'))
        ) {
            return back()->withErrors(['verify' => 'You cannot verify your own activity.']);
        }

        // ── 1. Senior Tech ──────────────────────────────────────────
        if ($request->has('tech_ack')) {
            // 🐛 FIX: server-side duplicate guard — hindi na pwede ma-double-click
            if ($scheduler->tech_ack) {
                return back()->withErrors(['verify' => 'Already verified by Technician.']);
            }
            $scheduler->tech_ack = $empName;
            $scheduler->tech_ack_date = now();
        }

        // ── 2. ESD / QA ─────────────────────────────────────────────
        if ($request->has('qa_ack')) {
            if (!$scheduler->tech_ack) {
                return back()->withErrors(['verify' => 'Technician must verify first.']);
            }
            if ($scheduler->qa_ack) {
                return back()->withErrors(['verify' => 'Already verified by ESD.']);
            }
            $scheduler->qa_ack = $empName;
            $scheduler->qa_ack_date = now();
        }

        // ── 3. PM Engineer ─────────────────────────────────────────
        if ($request->has('senior_ee_ack')) {
            if (!$scheduler->qa_ack) {
                return back()->withErrors(['verify' => 'ESD must verify first.']);
            }
            if ($scheduler->senior_ee_ack) {
                return back()->withErrors(['verify' => 'Already verified by Engineer.']);
            }
            $scheduler->senior_ee_ack = $empName;
            $scheduler->senior_ee_ack_date = now();
        }

        // 🐛 FIX: recompute mula sa totoong estado ng mga ack —
        // HINDI na incremental (+25), kaya imposible nang lumampas
        // o umabot ng 100 kung may kulang pang verifier.
        $scheduler->progress_value = $this->computeProgress($scheduler);
        $scheduler->save();

        return back()->with('success', 'Verified successfully');
    }

    /**
     * ============================================================
     *  🛠 REPAIR PROGRESS — panlaban kung may naulit na lumang bug
     * ------------------------------------------------------------
     *  I-re-recompute nito ang STORED progress_value ng lahat ng
     *  records (o ng isa lang kung may id) para tumugma sa aktwal
     *  na mga ack/verifier. Idempotent — safe kahit paulit-ulit,
     *  hindi nagkakamali, at hindi nireremove ang ibang data.
     *
     *  Auto-heal: tinatawag sa index() tuwing magre-render ang page.
     *  Manual: "Repair Progress" button o POST /scheduler/repair-progress.
     * ============================================================
     */

    protected function repairAllProgress(): int
    {
        $expr = $this->progressExpression();

        return DB::connection('mysql')
            ->table('scheduler_tbl')
            ->whereRaw("COALESCE(progress_value, 0) <> ({$expr})")
            ->update(['progress_value' => DB::raw($expr)]);
    }

    public function repairProgress(Request $request, $id = null)
    {
        // (Optional) Kung gusto mong engineer/admin lang ang makapag-repair,
        // i-uncomment at palitan ng role na ginagamit mo sa app:
        // if (!in_array(session('emp_data')['emp_role'] ?? null, ['engineer', 'admin'])) {
        //     abort(403);
        // }

        // ── Specific record lang ──────────────────────────────────
        if ($id) {
            $scheduler = Scheduler::findOrFail($id);
            $scheduler->progress_value = $this->computeProgress($scheduler);
            $scheduler->save();

            return back()->with(
                'success',
                "Progress repaired for #{$scheduler->id} → {$scheduler->progress_value}%."
            );
        }

        // ── Lahat ng records — isang UPDATE lang ──────────────────
        $affected = $this->repairAllProgress();

        $msg = $affected > 0
            ? "Progress repaired: {$affected} record(s) updated."
            : "All progress values are already correct. 👍";

        return back()->with('success', $msg);
    }

    public function viewPdf($id)
    {
        $scheduler = Scheduler::findOrFail($id);

        // kung JSON string ang "answers", i-decode natin
        $answers = $scheduler->answers ? json_decode($scheduler->answers, true) : [];
        $tool_life = $scheduler->tool_life ? json_decode($scheduler->tool_life, true) : [];

        $pdf = Pdf::loadView('pdf.activity', [
            'scheduler' => $scheduler,
            'answers' => $answers,
            'tool_life' => $tool_life,
        ]);

        // stream para makita sa browser (may toolbar)
        return $pdf->stream("activity_$id.pdf");
    }

    public function remove($id)
    {
        DB::connection('mysql')->table('scheduler_tbl')->where('id', $id)->delete();

        return redirect()->route('tnr.schedulerTable')->with('success', 'Checklist removed successfully.');
    }
}
