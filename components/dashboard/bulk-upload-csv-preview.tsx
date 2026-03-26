"use client"

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface BulkUploadCSVPreviewProps {
  headers: string[]
  rows: string[][]
  columnMapping: Record<string, string>
  onMappingChange: (mapping: Record<string, string>) => void
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FIELD_OPTIONS = [
  { value: "__skip__", label: "Skip" },
  { value: "business_name", label: "Business Name" },
  { value: "location", label: "Location" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "industry", label: "Industry" },
] as const

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BulkUploadCSVPreview({
  headers,
  rows,
  columnMapping,
  onMappingChange,
}: BulkUploadCSVPreviewProps) {
  const handleMappingChange = (header: string, value: string) => {
    const next = { ...columnMapping }
    if (value === "__skip__") {
      delete next[header]
    } else {
      next[header] = value
    }
    onMappingChange(next)
  }

  return (
    <div className="space-y-3">
      {/* Mapping dropdowns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {headers.map((header) => (
          <div key={header} className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 truncate min-w-0 flex-1" title={header}>
              {header}
            </span>
            <select
              value={columnMapping[header] || "__skip__"}
              onChange={(e) => handleMappingChange(header, e.target.value)}
              className="w-[140px] h-8 text-xs rounded-md border border-zinc-200 bg-white px-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1"
            >
              {FIELD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {/* Preview table */}
      <div className="border rounded-lg overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-zinc-50 border-b">
              {headers.map((h) => (
                <th
                  key={h}
                  className="px-3 py-2 text-left font-medium text-zinc-500 whitespace-nowrap"
                >
                  {h}
                  {columnMapping[h] && (
                    <span className="ml-1 text-purple-600">
                      ({columnMapping[h].replace("_", " ")})
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => (
              <tr key={rowIdx} className="border-b last:border-b-0">
                {headers.map((_, colIdx) => (
                  <td
                    key={colIdx}
                    className="px-3 py-1.5 text-zinc-700 whitespace-nowrap max-w-[200px] truncate"
                  >
                    {row[colIdx] || "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-zinc-400">
        Showing first {rows.length} rows as preview
      </p>
    </div>
  )
}
