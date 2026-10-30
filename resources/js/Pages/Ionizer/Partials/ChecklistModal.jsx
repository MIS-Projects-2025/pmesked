import React, { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from '@inertiajs/react'
import {
  ClipboardList,
  Clock,
  Eye,
  FileDown,
  Info,
  ListChecks,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react'

/**
 * ChecklistModal — CREATE and VIEW (+ EDIT) in a single modal
 * ---------------------------------------------------------------
 * Layout follows the original form:
 *   • 2-column header (Description/Control No./Serial/PM Frequency on the
 *     left, PM Date/PM Due/Performed By on the right)
 *   • Check Items     : Assembly Items | Requirement | Activity | Compliance | Date | Remarks
 *   • Verification    : Verification Reading | Specs Limit | Trial 1–3 (Min/Max) + OMEGA DTHM row
 *   • Standard Use    : Description | Instrument 1–3
 *   • Duration of usage (Days) + Remarks in the footer area
 *   • Verifier fields  : VIEW mode only (no verifiers yet on create)
 */

/* ─────────────────────────── styles ─────────────────────────── */
const ACCENT = '#6B7280'

const fieldCls =
  'h-8 w-full rounded border border-slate-300 bg-white px-2 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#6B7280] focus:ring-1 focus:ring-[#6B7280]/25 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-500'

const cellCls =
  'h-7 w-full rounded border border-slate-300 bg-white px-1.5 text-xs text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-[#6B7280] focus:ring-1 focus:ring-[#6B7280]/25 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-500'

const btnPrimary =
  'inline-flex items-center gap-1.5 rounded bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60'

const btnOutline =
  'inline-flex items-center gap-1.5 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60'

const btnGhost =
  'inline-flex items-center gap-1.5 rounded px-2 py-1 text-[11px] font-medium text-slate-500 transition hover:bg-slate-100 hover:text-[#6B7280]'

const thCls =
  'border border-slate-200 bg-slate-100 px-2 py-1.5 text-center text-[10px] font-semibold uppercase leading-tight tracking-wide text-[#6B7280]'

const tdCls = 'border border-slate-200 p-0.5 align-middle'

const sectionTitle =
  'flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[#6B7280]'

/* ─────────────────────────── normalize helpers ─────────────────────────── */
const asArray = (value) => {
  if (Array.isArray(value)) return value
  if (typeof value === 'string') {
    const raw = value.trim()
    if (!raw) return []
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch (e) {
      return []
    }
  }
  return []
}

const asObject = (value) => {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value
  if (typeof value === 'string') {
    const raw = value.trim()
    if (!raw) return {}
    try {
      const parsed = JSON.parse(raw)
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
    } catch (e) {
      return {}
    }
  }
  return {}
}

const asBool = (value) => value === true || value === 1 || value === '1' || value === 'true'

/* ─────────────────────────── date helpers ─────────────────────────── */
const toYmd = (value) => {
  if (!value) return ''
  const raw = String(value).trim()
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10)

  const m = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
  if (m) return `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`

  const d = new Date(raw)
  if (!Number.isNaN(d.getTime())) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate(),
    ).padStart(2, '0')}`
  }
  return raw
}

const fmtDate = (value) => {
  const ymd = toYmd(value)
  if (!ymd) return '—'
  const d = new Date(`${ymd}T00:00:00`)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

/** Full date + time: "12/05/2025 08:42 AM" (or just "12/05/2025" when no time saved) */
const fmtDateTime = (value) => {
  if (!value) return ''
  const raw = String(value).trim().replace(' ', 'T')
  const d = new Date(raw)

  if (Number.isNaN(d.getTime())) {
    const ymd = toYmd(value)
    return ymd ? fmtDate(ymd) : ''
  }

  const date = d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  const hasTime = /[T ]\d{1,2}:\d{2}/.test(String(value))
  if (!hasTime) return date

  const time = d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })

  return `${date} ${time}`
}

const todayYmd = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`
}

const addDays = (ymd, days) => {
  if (!ymd) return ''
  const d = new Date(`${ymd}T00:00:00`)
  d.setDate(d.getDate() + Number(days || 0))
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`
}

const isDateLike = (value) => /^\d{4}-\d{2}-\d{2}$/.test(toYmd(value))

/* ─────────────────────────── row factories ─────────────────────────── */
const blankRow = () => ({
  asset: '',
  requirement: '',
  activity: '',
  compliance: false,
  date: '',
  remarks: '',
})

const blankReading = () => ({
  description: '',
  specs: '',
  instrument: '',
  trial_1: { min: '', max: '' },
  trial_2: { min: '', max: '' },
  trial_3: { min: '', max: '' },
})

const blankStd = () => ({
  description: '',
  instrument_1: '',
  instrument_2: '',
  instrument_3: '',
})

const EMPTY_FORM = {
  description: '',
  control_no: '',
  serial: '',
  frequency: '',
  performed_by: '',
  pm_date: '',
  pm_due: '',
  dthm_temp: '',
  dthm_rh: '',
  days: '',
  remarks: '',
  check_item: [],
  verification_reading: [],
  std_use_verification: [],
  tech_sign: '',
  qa_sign: '',
}

const ALL_SECTIONS = ['header', 'items', 'readings', 'std', 'remarks', 'signatures']

export default function ChecklistModal({
  open = false,
  onOpenChange,
  mode = 'create',
  record = null,
  machines = [],
  canEdit = false,
  editableSections = [],
  urls = {},
  pmDueDays = 7,
  activityCodes = [],
  itemTemplate = [],
  readingTemplate = [],
  stdTemplate = [],
}) {
  const isCreate = mode === 'create'

  /* ───────────────────────── section permissions ───────────────────────── */
  const openSections = useMemo(() => {
    const list = editableSections ?? []
    if (!list.length) return canEdit ? ALL_SECTIONS : []
    if (list.includes('*') || list.includes('all')) return ALL_SECTIONS
    return list
  }, [editableSections, canEdit])

  const can = useCallback(
    (section) => (isCreate ? true : canEdit && openSections.includes(section)),
    [isCreate, canEdit, openSections],
  )

  const canHeader = can('header')
  const canItems = can('items')
  const canReadings = can('readings')
  const canStd = can('std')
  const canRemarks = can('remarks')
  const canSign = can('signatures')

  /* ───────────────────────────── form ───────────────────────────── */
  const form = useForm({ ...EMPTY_FORM })

  const baselineRef = useRef('')
  const pmDueTouched = useRef(false)
  const [, forceRender] = useState(0)

  const buildCreateValues = useCallback(() => {
    const today = todayYmd()

    return {
      ...EMPTY_FORM,
      pm_date: today,
      pm_due: addDays(today, pmDueDays),
      check_item: asArray(itemTemplate).map((row) => ({
        ...blankRow(),
        ...asObject(row),
        compliance: asBool(asObject(row).compliance),
        date: today,
      })),
      verification_reading: asArray(readingTemplate).map((row) => {
        const item = asObject(row)
        return {
          ...blankReading(),
          ...item,
          trial_1: { min: '', max: '', ...asObject(item.trial_1) },
          trial_2: { min: '', max: '', ...asObject(item.trial_2) },
          trial_3: { min: '', max: '', ...asObject(item.trial_3) },
        }
      }),
      std_use_verification: asArray(stdTemplate).map((row) => ({
        ...blankStd(),
        ...asObject(row),
      })),
    }
  }, [itemTemplate, readingTemplate, stdTemplate, pmDueDays])

  const buildValuesFromRecord = useCallback(
    (r) => {
      if (!r) return buildCreateValues()

      return {
        description: r.description ?? '',
        control_no: r.control_no ?? '',
        serial: r.serial ?? '',
        frequency: r.frequency ?? '',
        performed_by: r.performed_by ?? '',
        pm_date: toYmd(r.pm_date),
        pm_due: toYmd(r.pm_due),
        dthm_temp: r.dthm_temp ?? '',
        dthm_rh: r.dthm_rh ?? '',
        days: r.days ?? '',
        remarks: r.remarks ?? '',
        check_item: asArray(r.check_item).map((row) => {
          const item = asObject(row)
          return {
            ...blankRow(),
            ...item,
            compliance: asBool(item.compliance),
            // legacy data: the last column used to be saved as `performed_by`
            remarks: item.remarks ?? item.performed_by ?? '',
            date: toYmd(item.date),
          }
        }),
        verification_reading: asArray(r.verification_reading).map((row) => {
          const item = asObject(row)
          return {
            ...blankReading(),
            ...item,
            trial_1: { min: '', max: '', ...asObject(item.trial_1) },
            trial_2: { min: '', max: '', ...asObject(item.trial_2) },
            trial_3: { min: '', max: '', ...asObject(item.trial_3) },
          }
        }),
        std_use_verification: asArray(r.std_use_verification).map((row) => ({
          ...blankStd(),
          ...asObject(row),
        })),
        tech_sign: r.tech_sign ?? '',
        qa_sign: r.qa_sign ?? '',
      }
    },
    [buildCreateValues],
  )

  const resetFromRecord = useCallback(() => {
    const values = record ? buildValuesFromRecord(record) : buildCreateValues()

    pmDueTouched.current = false
    baselineRef.current = JSON.stringify(values)
    form.clearErrors()
    form.setData(values)
    forceRender((v) => v + 1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [record, buildValuesFromRecord, buildCreateValues])

  useEffect(() => {
    if (open) resetFromRecord()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, record?.id])

  useEffect(() => {
    if (!open || typeof document === 'undefined') return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  useEffect(() => {
    if (!open || typeof window === 'undefined') return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') onOpenChange?.(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onOpenChange])

  /* helpers */
  const setField = (key, value) => {
    form.setData(key, value)
    forceRender((v) => v + 1)
  }

  const setMany = (patch) => {
    form.setData({ ...form.data, ...patch })
    forceRender((v) => v + 1)
  }

  const items_ = asArray(form.data.check_item)
  const readings_ = asArray(form.data.verification_reading)
  const stds_ = asArray(form.data.std_use_verification)

  const setItemCell = (index, key, value) =>
    setField(
      'check_item',
      items_.map((row, i) => (i === index ? { ...row, [key]: value } : row)),
    )

  const setReadingCell = (index, key, value) =>
    setField(
      'verification_reading',
      readings_.map((row, i) => (i === index ? { ...row, [key]: value } : row)),
    )

  const setReadingTrial = (index, trial, key, value) =>
    setField(
      'verification_reading',
      readings_.map((row, i) =>
        i === index ? { ...row, [trial]: { ...asObject(row[trial]), [key]: value } } : row,
      ),
    )

  const setStdCell = (index, key, value) =>
    setField(
      'std_use_verification',
      stds_.map((row, i) => (i === index ? { ...row, [key]: value } : row)),
    )

  const onPmDateChange = (value) => {
    setMany({
      pm_date: value,
      ...(isCreate && !pmDueTouched.current ? { pm_due: addDays(value, pmDueDays) } : {}),
    })
  }

  const onPmDueChange = (value) => {
    if (value !== addDays(form.data.pm_date, pmDueDays)) pmDueTouched.current = true
    setField('pm_due', value)
  }

  const addItemRow = () =>
    setField('check_item', [
      ...items_,
      { ...blankRow(), date: form.data.pm_date || todayYmd() },
    ])

  const removeItemRow = (i) => setField('check_item', items_.filter((_, idx) => idx !== i))

  const addReadingRow = () =>
    setField('verification_reading', [...readings_, blankReading()])

  const removeReadingRow = (i) =>
    setField('verification_reading', readings_.filter((_, idx) => idx !== i))

  const addStdRow = () => setField('std_use_verification', [...stds_, blankStd()])

  const removeStdRow = (i) =>
    setField('std_use_verification', stds_.filter((_, idx) => idx !== i))

  const pickMachine = (controlNo) => {
    const machine = (machines ?? []).find((m) => String(m.pmnt_no) === String(controlNo))

    if (!machine) {
      setField('control_no', controlNo)
      return
    }

    setMany({
      control_no: machine.pmnt_no ?? controlNo,
      description: machine.description ?? machine.machine_desc ?? form.data.description,
      serial: machine.serial ?? machine.serial_no ?? form.data.serial,
      frequency: machine.frequency ?? form.data.frequency,
      performed_by: machine.performed_by ?? form.data.performed_by,
    })
  }

  /* URL builder */
  const routeUrl = (name, params) => {
    const mapUrl = { 'ionizer.store': 'store', 'ionizer.update': 'update', 'ionizer.pdf': 'pdf' }
    const fromServer = mapUrl[name] ? urls?.[mapUrl[name]] : null

    if (fromServer) return String(fromServer).replace('__ID__', String(params ?? ''))

    try {
      if (typeof window !== 'undefined' && typeof window.route === 'function') {
        return window.route(name, params)
      }
    } catch (e) {
      /* no ziggy available */
    }

    if (name === 'ionizer.store') return '/ionizer'
    if (name === 'ionizer.pdf') return `/ionizer/${params}/pdf`
    return `/ionizer/${params}`
  }

  const submit = (e) => {
    e?.preventDefault?.()

    if (isCreate) {
      form.post(routeUrl('ionizer.store'), {
        preserveScroll: true,
        onSuccess: () => onOpenChange?.(false),
      })
      return
    }

    form.put(routeUrl('ionizer.update', record?.id), {
      preserveScroll: true,
      onSuccess: () => onOpenChange?.(false),
    })
  }

  const close = () => onOpenChange?.(false)

  const verified = !!record?.tech_sign && !!record?.qa_sign
  const errors = form.errors ?? {}
  const showSave = canEdit || isCreate
  const pdfUrl = record?.id ? routeUrl('ionizer.pdf', record.id) : ''

  const dirty = useMemo(() => {
    const snapshot = JSON.stringify(form.data)
    return snapshot !== baselineRef.current
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.data])

  if (!open) return null

  /* ───────────────────────── render ───────────────────────── */
  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/50 p-2 sm:p-6">
      <div
        role="dialog"
        aria-modal="true"
        className="mx-auto w-full max-w-[1400px] overflow-hidden rounded-md bg-white shadow-2xl ring-1 ring-black/10"
      >
        {/* ───────────── title bar ───────────── */}
        <div className="flex items-center justify-between gap-3 bg-[#6B7280] px-4 py-2">
          <div className="flex min-w-0 items-center gap-2">
            {isCreate ? (
              <Pencil className="h-3.5 w-3.5 shrink-0 text-white" />
            ) : (
              <Eye className="h-3.5 w-3.5 shrink-0 text-white" />
            )}
            <span className="text-xs font-semibold tracking-wide text-white">
              {isCreate ? 'Add New Entry' : 'View Entry'}
            </span>

            {!isCreate && (
              <span className="max-w-[220px] truncate rounded bg-white/15 px-1.5 py-0.5 text-[11px] text-white">
                {record?.control_no || '—'}
              </span>
            )}

            {!isCreate &&
              (verified ? (
                <span className="inline-flex items-center gap-1 rounded bg-emerald-500/25 px-1.5 py-0.5 text-[11px] text-emerald-50">
                  <ShieldCheck className="h-3 w-3" /> 100% verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded bg-amber-400/25 px-1.5 py-0.5 text-[11px] text-amber-50">
                  Pending
                </span>
              ))}
          </div>

          <div className="flex items-center gap-2">
            {/* PDF — keep it visible in the title bar */}
            {!isCreate && (
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded bg-red-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-white/40"
                title="Open printable PDF"
              >
                <FileDown className="h-3.5 w-3.5" /> PDF
              </a>
            )}

            <button
              type="button"
              onClick={close}
              className="rounded p-0.5 text-red-100 transition hover:bg-white/10 hover:text-white"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <form onSubmit={submit}>
          <div className="max-h-[calc(100vh-170px)] overflow-y-auto">
            {/* ═══════════ HEADER FIELDS (2 columns) ═══════════ */}
            <div className="grid grid-cols-1 gap-x-10 gap-y-2 border-b border-slate-200 px-4 py-3 md:grid-cols-2">
              <Field label="Description">
                <input
                  className={fieldCls}
                  value={form.data.description}
                  onChange={(e) => setField('description', e.target.value)}
                  disabled={!canHeader}
                  placeholder="Machine / ionizer name"
                />
              </Field>

              <Field label="PM Date">
                <input
                  type="date"
                  className={fieldCls}
                  value={form.data.pm_date}
                  onChange={(e) => onPmDateChange(e.target.value)}
                  disabled={!canHeader}
                />
              </Field>

              <Field label="Control Number">
                {isCreate && machines.length ? (
                  <select
                    className={fieldCls}
                    value={form.data.control_no}
                    onChange={(e) => pickMachine(e.target.value)}
                  >
                    <option value="">Enter / Select Control No…</option>
                    {machines.map((m, i) => (
                      <option key={m.id ?? m.pmnt_no ?? i} value={m.pmnt_no}>
                        {m.pmnt_no}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    className={fieldCls}
                    value={form.data.control_no}
                    onChange={(e) => setField('control_no', e.target.value)}
                    disabled={!canHeader}
                  />
                )}
              </Field>

              <Field label="PM Due">
                <input
                  type="date"
                  className={fieldCls}
                  value={form.data.pm_due}
                  onChange={(e) => onPmDueChange(e.target.value)}
                  disabled={!canHeader}
                />
              </Field>

              <Field label="Serial Number">
                <input
                  className={fieldCls}
                  value={form.data.serial}
                  onChange={(e) => setField('serial', e.target.value)}
                  disabled={!canHeader}
                />
              </Field>

              <Field label="Performed By">
                <input
                  className={fieldCls}
                  value={form.data.performed_by}
                  onChange={(e) => setField('performed_by', e.target.value)}
                  disabled={!canHeader}
                  placeholder="Technician name"
                />
              </Field>

              <Field label="PM Frequency">
                <input
                  className={fieldCls}
                  value={form.data.frequency}
                  onChange={(e) => setField('frequency', e.target.value)}
                  disabled={!canHeader}
                  placeholder="e.g. Weekly"
                />
              </Field>

              {/* Verifiers — VIEW mode only (none on create) */}
              {!isCreate && (
                <Field label="QA Verifier">
                  <div className="relative">
                    <input
                      className={`${fieldCls} ${
                        record?.qa_sign_date ? 'pr-[118px]' : ''
                      }`}
                      value={form.data.qa_sign}
                      onChange={(e) => setField('qa_sign', e.target.value)}
                      disabled={!canSign}
                      placeholder="—"
                    />
                    {record?.qa_sign_date ? (
                      <span
                        className="pointer-events-none absolute inset-y-0 right-2 flex items-center gap-1 text-[10px] text-slate-400"
                        title={fmtDateTime(record.qa_sign_date)}
                      >
                        <Clock className="h-3 w-3" />
                        {fmtDateTime(record.qa_sign_date)}
                      </span>
                    ) : null}
                  </div>
                </Field>
              )}

              {!isCreate && (
                <Field label="Tech Verifier">
                  <div className="relative">
                    <input
                      className={`${fieldCls} ${
                        record?.tech_sign_date ? 'pr-[118px]' : ''
                      }`}
                      value={form.data.tech_sign}
                      onChange={(e) => setField('tech_sign', e.target.value)}
                      disabled={!canSign}
                      placeholder="—"
                    />
                    {record?.tech_sign_date ? (
                      <span
                        className="pointer-events-none absolute inset-y-0 right-2 flex items-center gap-1 text-[10px] text-slate-400"
                        title={fmtDateTime(record.tech_sign_date)}
                      >
                        <Clock className="h-3 w-3" />
                        {fmtDateTime(record.tech_sign_date)}
                      </span>
                    ) : null}
                  </div>
                </Field>
              )}
            </div>

            {!isCreate && errors.sign && (
              <p className="px-4 pt-2 text-[11px] text-red-600">{errors.sign}</p>
            )}

            {/* ═══════════ CHECK ITEMS ═══════════ */}
            <section className="border-b border-slate-200">
              <div className="flex items-center justify-between px-4 pt-3">
                <h3 className={sectionTitle}>
                  <ListChecks className="h-3.5 w-3.5" /> Check Items
                </h3>
                {canItems && (
                  <button type="button" className={btnOutline} onClick={addItemRow}>
                    <Plus className="h-3 w-3" /> Add row
                  </button>
                )}
              </div>

              {/* ACTIVITY CODE legend */}
              <div className="mx-4 mb-2 mt-2 rounded border border-slate-200 bg-slate-100/70 px-3 py-1.5 text-center">
                <p className="flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">
                  <Info className="h-3 w-3" /> Activity Code
                </p>
                <p className="mt-0.5 text-[10px] leading-relaxed text-slate-600">
                  {activityCodes.map((c, i) => (
                    <span key={c.code}>
                      <span className="font-semibold text-slate-700">{c.code}</span>
                      {' – '}
                      {c.label}
                      {i < activityCodes.length - 1 ? ' ; ' : ''}
                    </span>
                  ))}
                </p>
              </div>

              <div className="overflow-x-auto px-4 pb-3">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr>
                      <th className={`${thCls} w-8`}>#</th>
                      <th className={thCls}>Assembly Items</th>
                      <th className={thCls}>Requirement</th>
                      <th className={`${thCls} w-28`}>Activity</th>
                      <th className={`${thCls} w-24`}>Compliance</th>
                      <th className={`${thCls} w-32`}>Date</th>
                      <th className={thCls}>Remarks</th>
                      {canItems && <th className={`${thCls} w-8`} />}
                    </tr>
                  </thead>

                  <tbody>
                    {items_.map((row, i) => (
                      <tr key={`ci-${i}`} className="hover:bg-slate-50/60">
                        <td className={`${tdCls} text-center text-[10px] text-slate-400`}>
                          {i + 1}
                        </td>
                        <td className={tdCls}>
                          <input
                            className={cellCls}
                            value={row.asset ?? ''}
                            onChange={(e) => setItemCell(i, 'asset', e.target.value)}
                            disabled={!canItems}
                          />
                        </td>
                        <td className={tdCls}>
                          <input
                            className={cellCls}
                            value={row.requirement ?? ''}
                            onChange={(e) => setItemCell(i, 'requirement', e.target.value)}
                            disabled={!canItems}
                          />
                        </td>
                        <td className={tdCls}>
                          <input
                            className={`${cellCls} text-center uppercase`}
                            value={row.activity ?? ''}
                            onChange={(e) =>
                              setItemCell(i, 'activity', e.target.value.toUpperCase())
                            }
                            disabled={!canItems}
                            list="ionizer-activity-codes"
                            placeholder="A, B…"
                          />
                        </td>
                        <td className={`${tdCls} text-center`}>
                          <input
                            type="checkbox"
                            className="h-3.5 w-3.5 rounded border-slate-300 text-[#6B7280] focus:ring-[#6B7280]/30 disabled:opacity-50"
                            checked={!!row.compliance}
                            onChange={(e) => setItemCell(i, 'compliance', e.target.checked)}
                            disabled={!canItems}
                          />
                        </td>
                        <td className={tdCls}>
                          <input
                            type="date"
                            className={cellCls}
                            value={row.date ?? ''}
                            onChange={(e) => setItemCell(i, 'date', e.target.value)}
                            disabled={!canItems}
                          />
                        </td>
                        <td className={tdCls}>
                          <input
                            className={`${cellCls} text-center`}
                            value={row.remarks ?? ''}
                            onChange={(e) => setItemCell(i, 'remarks', e.target.value)}
                            disabled={!canItems}
                            placeholder="PASSED"
                          />
                        </td>
                        {canItems && (
                          <td className={`${tdCls} text-center`}>
                            <button
                              type="button"
                              onClick={() => removeItemRow(i)}
                              className="rounded p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                              title="Remove row"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}

                    {!items_.length && (
                      <tr>
                        <td
                          colSpan={canItems ? 8 : 7}
                          className="border border-slate-200 py-4 text-center text-[11px] text-slate-400"
                        >
                          No check items.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                <datalist id="ionizer-activity-codes">
                  {activityCodes.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </datalist>

                {errors.check_item && (
                  <p className="mt-1 text-[11px] text-red-600">{errors.check_item}</p>
                )}
              </div>
            </section>

            {/* ═══════════ VERIFICATION READING ═══════════ */}
            <section className="border-b border-slate-200">
              <div className="flex items-center justify-between px-4 pt-3">
                <h3 className={sectionTitle}>
                  <ClipboardList className="h-3.5 w-3.5" /> Verification Reading
                </h3>
                {canReadings && (
                  <button type="button" className={btnOutline} onClick={addReadingRow}>
                    <Plus className="h-3 w-3" /> Add row
                  </button>
                )}
              </div>

              <div className="overflow-x-auto px-4 pb-3 pt-2">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr>
                      <th className={thCls}>Verification Reading</th>
                      <th className={`${thCls} w-52`}>Specs Limit</th>
                      {[1, 2, 3].map((t) => (
                        <th key={`h-${t}`} colSpan={2} className={thCls}>
                          Trial {t}
                        </th>
                      ))}
                      {canReadings && <th className={`${thCls} w-8`} />}
                    </tr>
                    <tr>
                      <th className={thCls} />
                      <th className={thCls} />
                      {[1, 2, 3].map((t) => (
                        <Fragment key={`hh-${t}`}>
                          <th className={`${thCls} w-20 font-medium normal-case`}>Min</th>
                          <th className={`${thCls} w-20 font-medium normal-case`}>Max</th>
                        </Fragment>
                      ))}
                      {canReadings && <th className={thCls} />}
                    </tr>
                  </thead>

                  <tbody>
                    {readings_.map((row, i) => (
                      <tr key={`vr-${i}`} className="hover:bg-slate-50/60">
                        <td className={tdCls}>
                          <input
                            className={cellCls}
                            value={row.description ?? ''}
                            onChange={(e) => setReadingCell(i, 'description', e.target.value)}
                            disabled={!canReadings}
                          />
                        </td>
                        <td className={tdCls}>
                          <input
                            className={cellCls}
                            value={row.specs ?? ''}
                            onChange={(e) => setReadingCell(i, 'specs', e.target.value)}
                            disabled={!canReadings}
                          />
                        </td>

                        {[1, 2, 3].map((t) => {
                          const trial = `trial_${t}`
                          const cell = asObject(row[trial])
                          return (
                            <Fragment key={`v-${i}-${t}`}>
                              <td className={tdCls}>
                                <input
                                  className={`${cellCls} text-center`}
                                  value={cell.min ?? ''}
                                  onChange={(e) => setReadingTrial(i, trial, 'min', e.target.value)}
                                  disabled={!canReadings}
                                  placeholder="Min"
                                />
                              </td>
                              <td className={tdCls}>
                                <input
                                  className={`${cellCls} text-center`}
                                  value={cell.max ?? ''}
                                  onChange={(e) => setReadingTrial(i, trial, 'max', e.target.value)}
                                  disabled={!canReadings}
                                  placeholder="Max"
                                />
                              </td>
                            </Fragment>
                          )
                        })}

                        {canReadings && (
                          <td className={`${tdCls} text-center`}>
                            <button
                              type="button"
                              onClick={() => removeReadingRow(i)}
                              className="rounded p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                              title="Remove row"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}

                    {!readings_.length && (
                      <tr>
                        <td
                          colSpan={canReadings ? 9 : 8}
                          className="border border-slate-200 py-4 text-center text-[11px] text-slate-400"
                        >
                          No readings.
                        </td>
                      </tr>
                    )}

                    {/* OMEGA DTHM row — temp / humidity */}
                    <tr className="bg-slate-50/60">
                      <td
                        colSpan={2}
                        className="border border-slate-200 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]"
                      >
                        OMEGA DTHM (resistance equipment)
                      </td>
                      <td colSpan={3} className={tdCls}>
                        <input
                          className={cellCls}
                          value={form.data.dthm_temp}
                          onChange={(e) => setField('dthm_temp', e.target.value)}
                          disabled={!canHeader}
                          placeholder="OMEGA DTHM Temp. (°C)"
                        />
                      </td>
                      <td colSpan={3} className={tdCls}>
                        <input
                          className={cellCls}
                          value={form.data.dthm_rh}
                          onChange={(e) => setField('dthm_rh', e.target.value)}
                          disabled={!canHeader}
                          placeholder="OMEGA DTHM Humidity (%RH)"
                        />
                      </td>
                      {canReadings && <td className={tdCls} />}
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* ═══════════ STANDARD USE VERIFICATION ═══════════ */}
            <section className="border-b border-slate-200">
              <div className="flex items-center justify-between px-4 pt-3">
                <h3 className={sectionTitle}>
                  <ShieldCheck className="h-3.5 w-3.5" /> Standard Use Verification
                </h3>
                {canStd && (
                  <button type="button" className={btnOutline} onClick={addStdRow}>
                    <Plus className="h-3 w-3" /> Add row
                  </button>
                )}
              </div>

              <div className="overflow-x-auto px-4 pb-3 pt-2">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr>
                      <th className={`${thCls} w-[28%]`}>Description</th>
                      <th className={thCls}>Instrument 1</th>
                      <th className={`${thCls} w-[16%]`}>Instrument 2</th>
                      <th className={`${thCls} w-[16%]`}>Instrument 3</th>
                      {canStd && <th className={`${thCls} w-8`} />}
                    </tr>
                  </thead>

                  <tbody>
                    {stds_.map((row, i) => (
                      <tr key={`std-${i}`} className="hover:bg-slate-50/60">
                        <td className={tdCls}>
                          <input
                            className={cellCls}
                            value={row.description ?? ''}
                            onChange={(e) => setStdCell(i, 'description', e.target.value)}
                            disabled={!canStd}
                          />
                        </td>
                        {[1, 2, 3].map((n) => {
                          const key = `instrument_${n}`
                          const value = row[key] ?? ''
                          const dateField = isDateLike(value)
                          return (
                            <td key={`std-${i}-${n}`} className={tdCls}>
                              <input
                                type={dateField ? 'date' : 'text'}
                                className={cellCls}
                                value={dateField ? toYmd(value) : value}
                                onChange={(e) => setStdCell(i, key, e.target.value)}
                                disabled={!canStd}
                                placeholder="N/A"
                              />
                            </td>
                          )
                        })}
                        {canStd && (
                          <td className={`${tdCls} text-center`}>
                            <button
                              type="button"
                              onClick={() => removeStdRow(i)}
                              className="rounded p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                              title="Remove row"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}

                    {!stds_.length && (
                      <tr>
                        <td
                          colSpan={canStd ? 5 : 4}
                          className="border border-slate-200 py-4 text-center text-[11px] text-slate-400"
                        >
                          No entries.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* ═══════════ DURATION + REMARKS ═══════════ */}
            <section className="grid grid-cols-1 gap-3 px-4 py-3 md:grid-cols-[260px_1fr]">
              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-slate-500">
                  Duration of usage (Days)
                </label>
                <input
                  className={fieldCls}
                  value={form.data.days}
                  onChange={(e) => setField('days', e.target.value)}
                  disabled={!canRemarks}
                  placeholder="e.g. 1016"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-slate-500">Remarks</label>
                <textarea
                  className={`${fieldCls} h-[62px] resize-y py-1.5`}
                  value={form.data.remarks}
                  onChange={(e) => setField('remarks', e.target.value)}
                  disabled={!canRemarks}
                  placeholder="e.g. RUNNING IN GOOD CONDITION"
                />
              </div>
            </section>

            {(errors.edit || errors.pm_date || errors.pm_due) && (
              <div className="mx-4 mb-3 rounded bg-red-50 px-3 py-2 text-[11px] text-red-700">
                {errors.edit || errors.pm_date || errors.pm_due}
              </div>
            )}
          </div>

          {/* ───────────── footer ───────────── */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-4 py-2.5">
            <div className="flex items-center gap-2">
              {canEdit && !isCreate && dirty && (
                <button type="button" className={btnGhost} onClick={resetFromRecord}>
                  <RotateCcw className="h-3 w-3" /> Reset
                </button>
              )}

              {canEdit && !isCreate && (
                <span className="text-[10px] text-slate-400">Edit mode — all fields are editable.</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button type="button" className={btnOutline} onClick={close}>
                Cancel
              </button>

              {showSave && (
                <button type="submit" className={btnPrimary} disabled={form.processing}>
                  <Save className="h-3.5 w-3.5" />
                  {form.processing ? 'Saving…' : isCreate ? 'Save' : 'Save Changes'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

/* label + field wrapper — fixed label width keeps the 2-column header aligned */
function Field({ label, children }) {
  return (
    <div className="grid grid-cols-[116px_1fr] items-center gap-2">
      <span className="truncate text-[11px] font-medium text-slate-500" title={label}>
        {label}
      </span>
      <span className="min-w-0">{children}</span>
    </div>
  )
}
