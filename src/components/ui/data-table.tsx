import * as React from "react"
import { cn } from "@/lib/utils"

export interface DataTableProps<T> {
  data: T[]
  columns: {
    header: string
    accessorKey: keyof T | string
    cell?: (item: T) => React.ReactNode
  }[]
  keyExtractor: (item: T) => string
  className?: string
  emptyMessage?: string
}

export function DataTable<T>({ 
  data, 
  columns, 
  keyExtractor,
  className,
  emptyMessage = "No data available."
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="flex p-8 items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-[var(--color-neutral-200)] text-[var(--color-neutral-500)] text-[var(--text-body-sm-size)]">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className={cn("w-full overflow-auto", className)}>
      {/* Desktop Table View */}
      <table className="hidden md:table w-full caption-bottom text-sm">
        <thead className="[&_tr]:border-b [&_tr]:border-[var(--color-neutral-200)]">
          <tr className="border-b border-[var(--color-neutral-200)] transition-colors hover:bg-[var(--color-secondary-50)]/50 data-[state=selected]:bg-[var(--color-secondary-50)]">
            {columns.map((col, i) => (
              <th 
                key={i}
                className="h-12 px-4 text-left align-middle font-medium text-[var(--color-neutral-500)] [&:has([role=checkbox])]:pr-0"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="[&_tr:last-child]:border-0">
          {data.map((item) => (
            <tr 
              key={keyExtractor(item)}
              className="border-b border-[var(--color-neutral-200)] transition-colors hover:bg-[var(--color-secondary-50)]/50 data-[state=selected]:bg-[var(--color-secondary-50)]"
            >
              {columns.map((col, i) => (
                <td key={i} className="p-4 align-middle [&:has([role=checkbox])]:pr-0">
                  {col.cell ? col.cell(item) : (item as any)[col.accessorKey as string]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile Stacked Card View */}
      <div className="flex flex-col space-y-4 md:hidden">
        {data.map((item) => (
          <div 
            key={keyExtractor(item)}
            className="flex flex-col space-y-2 rounded-[var(--radius-lg)] border border-[var(--color-neutral-200)] p-4 shadow-sm"
          >
            {columns.map((col, i) => (
              <div key={i} className="flex justify-between items-start space-x-2">
                <span className="text-[var(--text-caption-size)] font-medium text-[var(--color-neutral-500)]">
                  {col.header}
                </span>
                <div className="text-[var(--text-body-sm-size)] text-right">
                  {col.cell ? col.cell(item) : (item as any)[col.accessorKey as string]}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
