"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Map, Globe, AlertCircle, Search, Eye, Sparkles, Loader2, Check,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { BulkUploadDataModal } from "./bulk-upload-data-modal"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Lead {
  id: string
  business_name: string
  location: string | null
  email: string | null
  phone: string | null
  industry: string | null
  research_source: "google_maps" | "web_search" | "not_found" | null
  research_status: "pending" | "researching" | "found" | "not_found" | "failed"
  project_id: string | null
  raw_data: Record<string, unknown> | null
}

interface BulkUploadLeadTableProps {
  batchId: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TABS = [
  { key: "all", label: "All" },
  { key: "found", label: "Found" },
  { key: "pending", label: "Pending" },
  { key: "not_found", label: "Not Found" },
  { key: "failed", label: "Failed" },
] as const

const SOURCE_BADGES: Record<string, { icon: typeof Map; className: string; label: string }> = {
  google_maps: { icon: Map, className: "bg-emerald-50 text-emerald-700", label: "Maps" },
  web_search: { icon: Globe, className: "bg-blue-50 text-blue-700", label: "Web" },
  not_found: { icon: AlertCircle, className: "bg-zinc-100 text-zinc-500", label: "None" },
}

const STATUS_BADGES: Record<string, string> = {
  pending: "bg-zinc-100 text-zinc-600",
  researching: "bg-purple-100 text-purple-700",
  found: "bg-emerald-100 text-emerald-700",
  not_found: "bg-zinc-100 text-zinc-500",
  failed: "bg-red-100 text-red-600",
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BulkUploadLeadTable({ batchId }: BulkUploadLeadTableProps) {
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [viewData, setViewData] = useState<{ data: Record<string, unknown>; title: string } | null>(null)
  const [generating, setGenerating] = useState(false)

  // -- Fetch leads -----------------------------------------------------------

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (activeTab !== "all") params.set("status", activeTab)
      if (search.trim()) params.set("search", search.trim())

      const res = await fetch(`/api/bulk-upload/${batchId}/leads?${params}`)
      if (!res.ok) throw new Error("Failed to fetch leads")
      const data: Lead[] = await res.json()
      setLeads(data)
    } catch {
      toast.error("Failed to load leads")
    } finally {
      setLoading(false)
    }
  }, [batchId, activeTab, search])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  // -- Selection -------------------------------------------------------------

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === leads.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(leads.map((l) => l.id)))
    }
  }

  // -- Generate selected leads ------------------------------------------------

  const handleGenerate = async (leadIds: string[]) => {
    if (leadIds.length === 0) return
    setGenerating(true)
    try {
      const res = await fetch("/api/bulk-upload/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadIds }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || "Generate failed")
      }
      const { generated } = await res.json()
      toast.success(`Started generation for ${generated} lead${generated !== 1 ? "s" : ""}`)
      setSelected(new Set())
      fetchLeads()
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate")
    } finally {
      setGenerating(false)
    }
  }

  // -- Render ----------------------------------------------------------------

  return (
    <div className="space-y-4">
      {/* Filter tabs + search */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex bg-zinc-100 rounded-lg p-0.5 gap-0.5">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => { setActiveTab(tab.key); setSelected(new Set()) }}
              className={cn(
                "px-3 py-1 rounded-md text-xs font-medium transition-colors",
                activeTab === tab.key
                  ? "bg-white shadow-sm text-zinc-900"
                  : "text-zinc-500 hover:text-zinc-700",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
          <Input
            placeholder="Search leads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-zinc-50 border-b">
              <th className="px-3 py-2 w-8">
                <input
                  type="checkbox"
                  checked={leads.length > 0 && selected.size === leads.length}
                  onChange={toggleAll}
                  className="rounded border-zinc-300"
                />
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">Business</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">Location</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">Industry</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">Source</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">Status</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-zinc-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-zinc-400 text-sm">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto mb-1" />
                  Loading leads...
                </td>
              </tr>
            ) : leads.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-zinc-400 text-sm">
                  No leads found
                </td>
              </tr>
            ) : (
              leads.map((lead) => {
                const source = lead.research_source ? SOURCE_BADGES[lead.research_source] : null
                const SourceIcon = source?.icon

                return (
                  <tr key={lead.id} className="border-b last:border-b-0 hover:bg-zinc-50/50">
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={selected.has(lead.id)}
                        onChange={() => toggleSelect(lead.id)}
                        className="rounded border-zinc-300"
                      />
                    </td>
                    <td className="px-3 py-2 font-medium text-zinc-900 max-w-[200px] truncate">
                      {lead.business_name}
                    </td>
                    <td className="px-3 py-2 text-zinc-500 max-w-[150px] truncate">
                      {lead.location || "—"}
                    </td>
                    <td className="px-3 py-2 text-zinc-500 max-w-[120px] truncate">
                      {lead.industry || "—"}
                    </td>
                    <td className="px-3 py-2">
                      {source && SourceIcon ? (
                        <span className={cn("inline-flex items-center gap-1 text-xs rounded-full px-2 py-0.5", source.className)}>
                          <SourceIcon className="h-3 w-3" />
                          {source.label}
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <Badge className={STATUS_BADGES[lead.research_status] || STATUS_BADGES.pending}>
                        {lead.research_status.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {lead.raw_data && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            title="View Data"
                            onClick={() =>
                              setViewData({
                                data: lead.raw_data!,
                                title: lead.business_name,
                              })
                            }
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {lead.research_status === "found" && !lead.project_id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-purple-600 hover:text-purple-700"
                            title="Generate Website"
                            onClick={() => handleGenerate([lead.id])}
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {lead.project_id && (
                          <Badge className="bg-purple-100 text-purple-700 text-[10px]">
                            <Check className="h-2.5 w-2.5 mr-0.5" />
                            Generated
                          </Badge>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Floating bulk action bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-zinc-900 text-white rounded-xl px-5 py-3 shadow-2xl flex items-center gap-4 z-50">
          <span className="text-sm font-medium">
            {selected.size} lead{selected.size !== 1 ? "s" : ""} selected
          </span>
          <Button
            size="sm"
            className="bg-purple-600 hover:bg-purple-700 text-white gap-1.5"
            disabled={generating}
            onClick={() => handleGenerate(Array.from(selected))}
          >
            {generating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            Generate
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-zinc-400 hover:text-white"
            onClick={() => setSelected(new Set())}
          >
            Clear
          </Button>
        </div>
      )}

      {/* Data modal */}
      <BulkUploadDataModal
        open={!!viewData}
        onOpenChange={(open) => { if (!open) setViewData(null) }}
        data={viewData?.data || {}}
        title={viewData?.title || ""}
      />
    </div>
  )
}
