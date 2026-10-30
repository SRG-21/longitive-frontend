import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { Download } from 'lucide-react'
import TrackerTabs from '../../components/journey-tracker/TrackerTabs'
import { downloadTrackerCsv, useEntries, useTracker } from '../../hooks/useJourneyTracker'
import type { TrackerEntry } from '../../types/journey-tracker'

const columnHelper = createColumnHelper<TrackerEntry>()

export default function TrackerTablePage() {
  const { id } = useParams<{ id: string }>()
  const { data: tracker } = useTracker(id)
  const { data: entries } = useEntries(id)

  const fields = useMemo(
    () => (tracker?.fields ?? []).filter((f) => f.isActive).sort((a, b) => a.sortOrder - b.sortOrder),
    [tracker],
  )

  const columns = useMemo(
    () => [
      columnHelper.accessor((row) => new Date(row.date).toLocaleDateString(), {
        id: 'date',
        header: 'Date',
      }),
      ...fields.map((field) =>
        columnHelper.accessor((row) => (row.values as Record<string, unknown>)?.[field.key], {
          id: field.key,
          header: field.unit ? `${field.label} (${field.unit})` : field.label,
          cell: (ctx) => {
            const value = ctx.getValue()
            if (typeof value === 'boolean') return value ? 'Yes' : 'No'
            if (Array.isArray(value)) return value.join(', ')
            return value != null ? String(value) : '—'
          },
        }),
      ),
      columnHelper.accessor('remark', { header: 'Remark' }),
    ],
    [fields],
  )

  const table = useReactTable({
    data: entries ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  if (!id) return null

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">{tracker?.name}</h1>
        <button
          onClick={() => downloadTrackerCsv(id)}
          className="flex items-center gap-1 rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-accent"
        >
          <Download size={16} /> Export CSV
        </button>
      </div>
      <TrackerTabs trackerId={id} />

      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-secondary">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th key={header.id} className="sticky top-0 whitespace-nowrap px-3 py-2 font-medium text-foreground">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-t border-border">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="whitespace-nowrap px-3 py-2 text-foreground">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
            {entries?.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-3 py-4 text-center text-muted-foreground">
                  No entries yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
