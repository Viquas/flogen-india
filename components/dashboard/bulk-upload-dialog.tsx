"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Upload, FileSpreadsheet, Loader2, ArrowRight, ArrowLeft, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { BulkUploadCSVPreview } from "./bulk-upload-csv-preview"
import { BulkUploadProgress } from "./bulk-upload-progress"

// ---------------------------------------------------------------------------
// CSV parsing
// ---------------------------------------------------------------------------

function parseCSVRow(row: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < row.length; i++) {
    const ch = row[i]
    if (inQuotes) {
      if (ch === '"' && row[i + 1] === '"') {
        current += '"'
        i++
      } else if (ch === '"') {
        inQuotes = false
      } else {
        current += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === ",") {
        result.push(current.trim())
        current = ""
      } else {
        current += ch
      }
    }
  }
  result.push(current.trim())
  return result
}

// ---------------------------------------------------------------------------
// Auto-detect Apollo/common headers
// ---------------------------------------------------------------------------

const KNOWN_MAPPINGS: Record<string, string> = {
  "company name": "business_name",
  "organization name": "business_name",
  "business name": "business_name",
  "business_name": "business_name",
  name: "business_name",
  company: "business_name",
  organization: "business_name",
  city: "location",
  location: "location",
  state: "location",
  address: "location",
  "company city": "location",
  "company state": "location",
  "company address": "location",
  email: "email",
  "email address": "email",
  "person email": "email",
  "contact email": "email",
  phone: "phone",
  "phone number": "phone",
  "company phone": "phone",
  "direct phone": "phone",
  "mobile phone": "phone",
  industry: "industry",
  sector: "industry",
  category: "industry",
}

function autoDetectMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {}
  for (const header of headers) {
    const lower = header.toLowerCase().trim()
    if (KNOWN_MAPPINGS[lower]) {
      mapping[header] = KNOWN_MAPPINGS[lower]
    }
  }
  return mapping
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface BulkUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Step = "upload" | "preview" | "confirm" | "progress"

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BulkUploadDialog({ open, onOpenChange }: BulkUploadDialogProps) {
  const router = useRouter()
  const [step, setStep] = useState<Step>("upload")
  const [isDragging, setIsDragging] = useState(false)
  const [fileName, setFileName] = useState("")
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<string[][]>([])
  const [allRows, setAllRows] = useState<string[][]>([])
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [batchId, setBatchId] = useState<string | null>(null)

  const reset = useCallback(() => {
    setStep("upload")
    setFileName("")
    setHeaders([])
    setRows([])
    setAllRows([])
    setColumnMapping({})
    setIsSubmitting(false)
    setBatchId(null)
  }, [])

  const handleClose = useCallback(
    (value: boolean) => {
      if (!value) reset()
      onOpenChange(value)
    },
    [onOpenChange, reset],
  )

  // -- File processing --------------------------------------------------------

  const processCSV = useCallback((text: string, name: string) => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
    if (lines.length < 2) {
      toast.error("CSV must have a header row and at least one data row")
      return
    }

    const parsedHeaders = parseCSVRow(lines[0])
    const parsedRows = lines.slice(1).map(parseCSVRow)

    setFileName(name)
    setHeaders(parsedHeaders)
    setRows(parsedRows.slice(0, 5)) // preview first 5
    setAllRows(parsedRows)
    setColumnMapping(autoDetectMapping(parsedHeaders))
    setStep("preview")
  }, [])

  const handleFileSelect = useCallback(
    (file: File) => {
      if (!file.name.endsWith(".csv")) {
        toast.error("Please upload a .csv file")
        return
      }
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result
        if (typeof text === "string") processCSV(text, file.name)
      }
      reader.readAsText(file)
    },
    [processCSV],
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFileSelect(file)
    },
    [handleFileSelect],
  )

  // -- Submit -----------------------------------------------------------------

  const handleSubmit = useCallback(async () => {
    // Validate mapping has at least business_name
    const hasBusinessName = Object.values(columnMapping).includes("business_name")
    if (!hasBusinessName) {
      toast.error("Please map at least one column to Business Name")
      return
    }

    setIsSubmitting(true)
    try {
      // Transform rows using mapping
      const leads = allRows.map((row) => {
        const lead: Record<string, string> = {}
        headers.forEach((header, idx) => {
          const field = columnMapping[header]
          if (field && row[idx]) {
            // If field already set (e.g. location from city+state), concatenate
            if (lead[field]) {
              lead[field] = `${lead[field]}, ${row[idx]}`
            } else {
              lead[field] = row[idx]
            }
          }
        })
        return lead
      })

      // POST to upload endpoint
      const res = await fetch("/api/bulk-upload/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leads, filename: fileName, columnMapping }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || "Upload failed")
      }

      const { batchId: newBatchId } = await res.json()

      // Start research
      await fetch(`/api/bulk-upload/${newBatchId}/research`, { method: "POST" })

      setBatchId(newBatchId)
      setStep("progress")
      toast.success(`Uploaded ${leads.length} leads — research started`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setIsSubmitting(false)
    }
  }, [allRows, headers, columnMapping, fileName])

  const handleComplete = useCallback(() => {
    handleClose(false)
    router.push(`/dashboard/bulk-uploads/${batchId}`)
    router.refresh()
  }, [handleClose, router, batchId])

  // -- Render -----------------------------------------------------------------

  const stepTitles: Record<Step, string> = {
    upload: "Upload CSV",
    preview: "Map Columns",
    confirm: "Confirm Upload",
    progress: "Research Progress",
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{stepTitles[step]}</DialogTitle>
          <DialogDescription>
            {step === "upload" && "Upload a CSV file with business leads to research"}
            {step === "preview" && "Map your CSV columns to the correct fields"}
            {step === "confirm" && `Ready to upload ${allRows.length} leads from ${fileName}`}
            {step === "progress" && "Researching your leads — this may take a few minutes"}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-2">
          {(["upload", "preview", "confirm", "progress"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium",
                  step === s
                    ? "bg-purple-600 text-white"
                    : (["upload", "preview", "confirm", "progress"].indexOf(step) > i)
                      ? "bg-purple-100 text-purple-700"
                      : "bg-zinc-100 text-zinc-400",
                )}
              >
                {(["upload", "preview", "confirm", "progress"].indexOf(step) > i)
                  ? <Check className="h-3.5 w-3.5" />
                  : i + 1}
              </div>
              {i < 3 && <div className="w-8 h-px bg-zinc-200" />}
            </div>
          ))}
        </div>

        {/* Step: Upload */}
        {step === "upload" && (
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            className={cn(
              "border-2 border-dashed rounded-lg p-12 text-center transition-colors",
              isDragging
                ? "border-purple-400 bg-purple-50"
                : "border-zinc-200 hover:border-zinc-300",
            )}
          >
            <FileSpreadsheet className="h-10 w-10 mx-auto mb-3 text-zinc-400" />
            <p className="text-sm text-zinc-600 mb-3">
              Drag and drop a .csv file here, or click to browse
            </p>
            <label>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileSelect(file)
                  e.target.value = ""
                }}
              />
              <Button variant="outline" size="sm" asChild>
                <span className="cursor-pointer gap-2">
                  <Upload className="h-4 w-4" />
                  Browse Files
                </span>
              </Button>
            </label>
          </div>
        )}

        {/* Step: Preview / Mapping */}
        {step === "preview" && (
          <div className="space-y-4">
            <BulkUploadCSVPreview
              headers={headers}
              rows={rows}
              columnMapping={columnMapping}
              onMappingChange={setColumnMapping}
            />
            <div className="flex justify-between">
              <Button variant="ghost" size="sm" onClick={() => setStep("upload")}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Button
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 text-white gap-1"
                onClick={() => setStep("confirm")}
                disabled={!Object.values(columnMapping).includes("business_name")}
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step: Confirm */}
        {step === "confirm" && (
          <div className="space-y-4">
            <div className="bg-zinc-50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">File</span>
                <span className="font-medium">{fileName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Total leads</span>
                <span className="font-medium">{allRows.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Mapped fields</span>
                <span className="font-medium">
                  {[...new Set(Object.values(columnMapping))].join(", ")}
                </span>
              </div>
            </div>
            <div className="flex justify-between">
              <Button variant="ghost" size="sm" onClick={() => setStep("preview")}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Button
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 text-white gap-1"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                Upload & Research
              </Button>
            </div>
          </div>
        )}

        {/* Step: Progress */}
        {step === "progress" && batchId && (
          <div className="space-y-4">
            <BulkUploadProgress batchId={batchId} onComplete={handleComplete} />
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleComplete}
            >
              View Batch Details
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
