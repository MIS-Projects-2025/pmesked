<?php

/*
|--------------------------------------------------------------------------
| Ionizer Checklist — EDIT PERMISSION MAP
|--------------------------------------------------------------------------
| Dito mo lang idadagdag kung sino ang pwedeng mag-edit.
|
|   'EMP_ID' => ['*']                        → lahat ng section
|   'EMP_ID' => ['header']                   → header fields lang
|   'EMP_ID' => ['items', 'readings']        → checklist + readings lang
|
| Available sections:
|   header      → description, control_no, serial, frequency, pm_date, pm_due,
|                 performed_by, dthm_temp, dthm_rh, days
|   items       → check items table (asset, requirement, activity, compliance, date, performed_by)
|   readings    → verification reading table
|   std         → standard use verification table
|   remarks     → remarks
|   signatures  → tech sign / QA sign (+ dates)
|   *           → lahat ng nasa itaas
|
| NOTE: server-side ito (session emp_id). Kahit i-modify ang browser,
|       hindi mababago ang permission.
|--------------------------------------------------------------------------
*/

return [

    'editable_emp_ids' => [
        '1788' => ['*'],
        '1797' => ['*'],

        // ── dagdag dito kung may iba pang ia-assign ─────────────────────────
        // '1900' => ['items'],
        // '1901' => ['items', 'readings', 'std'],
        // '1902' => ['header', 'remarks'],
    ],

    // Default na araw para sa PM Due (PM Date + N days)
    'pm_due_days' => 7,

    // Pwedeng mag-edit kahit may pirma na? (true = oo, false = locked kapag signed)
    'allow_edit_when_signed' => true,
];
