import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Head, router } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { CalendarClock, Eye, PencilLine, Plus, Search, ShieldCheck } from 'lucide-react'

import ChecklistModal from './Partials/ChecklistModal'

/**
 * Ionizer Checklist — list page (Inertia + React)
 * ---------------------------------------------------------------
 * Editing is handled inside the table's VIEW action. If `canEdit === true`
 * (server-side, from config/ionizer_checklist.php), all values inside the
 * View modal can be modified and saved.
 */

/* ─────────────── shared class names (compact, theme-matched) ─────────────── */
const btnPrimary =
  'inline-flex items-center gap-1.5 rounded bg-slate-800 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60'

const btnOutline =
  'inline-flex items-center justify-center rounded border border-slate-300 bg-white text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50'

const thCls =
  'border-b border-slate-200 px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500'

export default function IonizerChecklist({
  tableData = { data: [], links: [] },
  reports = { data: [] },
  machines = [],
  items = [],
  filters = {},
  tableFilters = {},
  canEdit = false,
  editableSections = [],
  pmDueDays = 7,
  urls = {},
  activityCodes = [],
  itemTemplate = [],
  readingTemplate = [],
  stdTemplate = [],
}) {
  const rows = tableData?.data ?? reports?.data ?? []

  const links = useMemo(
    () =>
      (tableData?.links ?? []).filter(
        (l) => l.label !== '&laquo; Previous' && l.label !== 'Next &raquo;',
      ),
    [tableData?.links]
  )

  /* --------------------------------- search -------------------------------- */
  const [search, setSearch] = useState(tableFilters?.search ?? '')
  const timerRef = useRef(null)

  const onSearchChange = (value) => {
    setSearch(value)

    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(() => {
      router.get(
        window.location.pathname,
        { search: value || undefined },
        { preserveState: true, preserveScroll: true, replace: true },
      )
    }, 350)
  }

  useEffect(() => () => timerRef.current && clearTimeout(timerRef.current), [])

  /* --------------------------------- modal --------------------------------- */
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('create')
  const [activeRecord, setActiveRecord] = useState(null)

  const openCreate = () => {
    setActiveRecord(null)
    setModalMode('create')
    setModalOpen(true)
  }

  const openView = (row) => {
    setActiveRecord(row)
    setModalMode('view')
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setActiveRecord(null)
  }

  /* -------------------------------- helpers -------------------------------- */
  const fmtDate = (value) => {
    if (!value) return '—'
    const raw = String(value).slice(0, 10)
    const d = new Date(`${raw}T00:00:00`)
    if (Number.isNaN(d.getTime())) return value
    return d.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    })
  }

  const isVerified = (row) => !!row?.tech_sign && !!row?.qa_sign

  return (
    <AuthenticatedLayout>
      <Head title="Ionizer Checklist" />

      <div className="py-4">
        <div className="mx-auto max-w-7xl px-2 sm:px-4 lg:px-6">
          {/* ───────── toolbar (title + search + Add) ─────────
              This is inside the page content — not in the `header` prop,
              because some layouts do not render the `header`. */}
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold leading-tight text-gray-800">
                Ionizer Checklist
              </h2>
              <p className="text-xs text-gray-500">
                Preventive maintenance records — click{' '}
                <span className="font-medium text-gray-700">View</span> to see (and, if
                allowed, edit) the complete checklist.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search control no., date, name…"
                  className="h-8 w-56 rounded border border-gray-300 bg-white pl-8 pr-2 text-xs text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:ring-1 focus:ring-gray-300"
                />
              </div>

              <button
                type="button"
                className={btnPrimary}
                onClick={openCreate}
                title="New ionizer checklist entry"
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </button>
            </div>
          </div>
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50">
                    <th className={`${thCls} w-[130px]`}>Control No.</th>
                    <th className={`${thCls} w-[110px]`}>PM Date</th>
                    <th className={`${thCls} w-[110px]`}>PM Due</th>
                    <th className={thCls}>Performed By</th>
                    <th className={thCls}>Tech Sign</th>
                    <th className={thCls}>QA Sign</th>
                    <th className={`${thCls} w-[100px]`}>Status</th>
                    <th className={`${thCls} w-[110px] text-right`}>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50/70">
                      <td className="px-3 py-2 font-medium text-gray-800">
                        {row.control_no || '—'}
                      </td>
                      <td className="px-3 py-2 text-gray-600">{fmtDate(row.pm_date)}</td>
                      <td className="px-3 py-2">
                        <span className="inline-flex items-center gap-1 text-gray-600">
                          <CalendarClock className="h-3.5 w-3.5 text-gray-400" />
                          {fmtDate(row.pm_due)}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gray-600">{row.performed_by || '—'}</td>
                      <td className="px-3 py-2 text-gray-600">{row.tech_sign || '—'}</td>
                      <td className="px-3 py-2 text-gray-600">{row.qa_sign || '—'}</td>
                      <td className="px-3 py-2">
                        {isVerified(row) ? (
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-emerald-200">
                            <ShieldCheck className="h-3 w-3" /> 100%
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 ring-1 ring-gray-200">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => openView(row)}
                          className={`${btnPrimary} gap-1 px-2 py-1`}
                        >
                          <Eye className="h-3 w-3" />
                          View
                          {canEdit && <PencilLine className="h-3 w-3 opacity-70" />}
                        </button>
                      </td>
                    </tr>
                  ))}

                  {!rows.length && (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-xs text-gray-400">
                        No records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* pagination */}
          {!!links.length && (
            <div className="mt-3 flex flex-wrap items-center gap-1">
              {links.map((link, i) => (
                <button
                  key={`${link.label}-${i}`}
                  type="button"
                  disabled={!link.url}
                  onClick={() =>
                    link.url &&
                    router.get(link.url, {}, { preserveState: true, preserveScroll: true })
                  }
                  className={`${btnOutline} h-7 min-w-7 px-2 ${
                    link.active ? '!border-slate-800 !bg-slate-800 !text-white' : ''
                  }`}
                  dangerouslySetInnerHTML={{ __html: link.label }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <ChecklistModal
        open={modalOpen}
        onOpenChange={(v) => (v ? setModalOpen(true) : closeModal())}
        mode={modalMode}
        record={activeRecord}
        machines={machines}
        canEdit={canEdit}
        editableSections={editableSections}
        urls={urls}
        pmDueDays={pmDueDays}
        activityCodes={activityCodes}
        itemTemplate={itemTemplate}
        readingTemplate={readingTemplate}
        stdTemplate={stdTemplate}
      />
    </AuthenticatedLayout>
  )
}
