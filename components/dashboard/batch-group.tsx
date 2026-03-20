"use client"

import { useState, useTransition } from 'react'
import { ChevronDown, ChevronRight, Search, UserPlus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { updateBatchAssignee } from '@/app/(admin)/dashboard/actions'

const TEAM_MEMBERS = [
  { name: 'Sohail', bgClass: 'bg-blue-100 text-blue-700 border-blue-200' },
  { name: 'Rupam', bgClass: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
] as const

interface BatchGroupProps {
  batchId: string
  metadata: {
    query?: string
    location?: string
    industry?: string
    entries?: number
    count?: number
  }
  source: string
  createdAt: string
  projectCount: number
  completedCount: number
  failedCount: number
  assignedTo?: string | null
  children: React.ReactNode
}

export function BatchGroup({
  batchId,
  metadata,
  source,
  createdAt,
  projectCount,
  completedCount,
  failedCount,
  assignedTo,
  children,
}: BatchGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [showAssignDropdown, setShowAssignDropdown] = useState(false)
  const [currentAssignee, setCurrentAssignee] = useState(assignedTo || null)
  const [isPending, startTransition] = useTransition()

  const label = metadata?.industry && metadata?.location
    ? `${metadata.industry} in ${metadata.location}`
    : metadata?.query || 'Batch'

  const entryCount = metadata?.entries || metadata?.count || projectCount

  // Simple batch label: "1 / 20-03-26" format
  const batchDate = new Date(createdAt)
  const dateStr = `${batchDate.getDate().toString().padStart(2, '0')}-${(batchDate.getMonth() + 1).toString().padStart(2, '0')}-${batchDate.getFullYear().toString().slice(2)}`
  // Use last 4 chars of UUID as a short numeric-ish identifier
  const batchNum = parseInt(batchId.slice(-4), 16) % 1000
  const batchLabel = `${batchNum} / ${dateStr}`

  const handleAssign = async (name: string | null, e: React.MouseEvent) => {
    e.stopPropagation()
    setShowAssignDropdown(false)
    const prevAssignee = currentAssignee
    setCurrentAssignee(name) // Optimistic update
    startTransition(async () => {
      const res = await updateBatchAssignee(batchId, name)
      if (res.success) {
        toast.success(name ? `Assigned to ${name}` : 'Unassigned')
      } else {
        setCurrentAssignee(prevAssignee) // Revert on failure
        toast.error(res.error || 'Failed to assign')
      }
    })
  }

  const assigneeMember = TEAM_MEMBERS.find(m => m.name === currentAssignee)

  return (
    <div className="space-y-3">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsExpanded(!isExpanded)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsExpanded(!isExpanded) } }}
        className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer select-none"
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-zinc-500 shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-zinc-500 shrink-0" />
        )}

        <div className="flex-1 flex items-center gap-2 min-w-0">
          <Search className="h-4 w-4 text-zinc-400 shrink-0" />
          <span className="font-semibold text-sm text-zinc-900 truncate">{label}</span>

          {/* Batch number */}
          <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded shrink-0">
            {batchLabel}
          </span>

          <span className="text-xs text-zinc-500">({entryCount} entries)</span>
        </div>

        {/* Assignee */}
        <div className="relative shrink-0" onClick={e => e.stopPropagation()}>
          {assigneeMember ? (
            <button
              onClick={(e) => { e.stopPropagation(); setShowAssignDropdown(!showAssignDropdown) }}
              className="shrink-0"
            >
              <Badge variant="outline" className={`${assigneeMember.bgClass} text-xs cursor-pointer`}>
                {assigneeMember.name}
              </Badge>
            </button>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); setShowAssignDropdown(!showAssignDropdown) }}
              className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-600 transition-colors px-2 py-1 rounded hover:bg-zinc-100"
              disabled={isPending}
            >
              <UserPlus className="h-3 w-3" />
              Assign
            </button>
          )}

          {showAssignDropdown && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg z-50 py-1 min-w-[140px]">
              {TEAM_MEMBERS.map(member => (
                <button
                  key={member.name}
                  onClick={(e) => handleAssign(member.name, e)}
                  className={`w-full text-left px-3 py-1.5 text-sm hover:bg-zinc-50 transition-colors flex items-center gap-2 ${
                    member.name === currentAssignee ? 'font-medium' : ''
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${member.bgClass.split(' ')[0]}`} />
                  {member.name}
                </button>
              ))}
              {currentAssignee && (
                <>
                  <div className="border-t border-zinc-100 my-1" />
                  <button
                    onClick={(e) => handleAssign(null, e)}
                    className="w-full text-left px-3 py-1.5 text-sm text-zinc-400 hover:bg-zinc-50 transition-colors"
                  >
                    Unassign
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs font-medium text-emerald-600">{completedCount} done</span>
          {failedCount > 0 && (
            <span className="text-xs font-medium text-red-600">{failedCount} failed</span>
          )}
          {projectCount - completedCount - failedCount > 0 && (
            <span className="text-xs text-zinc-400">
              {projectCount - completedCount - failedCount} pending
            </span>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="pl-2">
          {children}
        </div>
      )}
    </div>
  )
}
