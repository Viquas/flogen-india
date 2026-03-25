"use client"

import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { Check, ChevronDown, ChevronRight, FileText, Paperclip, Play, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ClientRequestItem } from "@/app/(admin)/dashboard/clients/actions"

const TYPE_LABELS: Record<string, string> = {
    text_change: 'Text Change',
    logo_upload: 'Logo Upload',
    domain_setup: 'Domain Setup',
    agent_call: 'Agent Call',
    booking_setup: 'Booking Setup',
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Pending' },
    in_progress: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'In Progress' },
    completed: { bg: 'bg-green-50', text: 'text-green-700', label: 'Completed' },
}

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp']

function isImageUrl(url: string): boolean {
    const lower = url.toLowerCase()
    return IMAGE_EXTENSIONS.some(ext => lower.includes(ext))
}

function getFileName(url: string): string {
    try {
        const parts = url.split('/')
        return decodeURIComponent(parts[parts.length - 1] ?? 'file')
    } catch {
        return 'file'
    }
}

interface CustomerRequestsTabProps {
    requests: ClientRequestItem[]
    onRequestUpdate: (requestId: string, newStatus: 'in_progress' | 'completed', adminNotes?: string) => void
}

export function CustomerRequestsTab({ requests, onRequestUpdate }: CustomerRequestsTabProps) {
    const [completingId, setCompletingId] = useState<string | null>(null)
    const [adminNotes, setAdminNotes] = useState("")
    const [showCompleted, setShowCompleted] = useState(false)

    const inProgress = requests.filter(r => r.status === 'in_progress')
    const pending = requests.filter(r => r.status === 'pending')
    const completed = requests.filter(r => r.status === 'completed')

    const handleStartComplete = (requestId: string) => {
        setCompletingId(requestId)
        setAdminNotes("")
    }

    const handleSaveComplete = (requestId: string) => {
        onRequestUpdate(requestId, 'completed', adminNotes || undefined)
        setCompletingId(null)
        setAdminNotes("")
    }

    const handleCancelComplete = () => {
        setCompletingId(null)
        setAdminNotes("")
    }

    if (requests.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-2 p-4">
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                    <Users className="h-4 w-4 text-gray-300" />
                </div>
                <p className="text-xs text-center">No customer requests</p>
            </div>
        )
    }

    return (
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {/* In Progress */}
            {inProgress.length > 0 && (
                <RequestGroup
                    title="In Progress"
                    count={inProgress.length}
                    requests={inProgress}
                    completingId={completingId}
                    adminNotes={adminNotes}
                    onAdminNotesChange={setAdminNotes}
                    onStart={(id) => onRequestUpdate(id, 'in_progress')}
                    onStartComplete={handleStartComplete}
                    onSaveComplete={handleSaveComplete}
                    onCancelComplete={handleCancelComplete}
                />
            )}

            {/* Pending */}
            {pending.length > 0 && (
                <RequestGroup
                    title="Pending"
                    count={pending.length}
                    requests={pending}
                    completingId={completingId}
                    adminNotes={adminNotes}
                    onAdminNotesChange={setAdminNotes}
                    onStart={(id) => onRequestUpdate(id, 'in_progress')}
                    onStartComplete={handleStartComplete}
                    onSaveComplete={handleSaveComplete}
                    onCancelComplete={handleCancelComplete}
                />
            )}

            {/* Completed (collapsed by default) */}
            {completed.length > 0 && (
                <div>
                    <button
                        onClick={() => setShowCompleted(!showCompleted)}
                        className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-600 transition-colors mb-2"
                    >
                        {showCompleted ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                        Completed ({completed.length})
                    </button>
                    {showCompleted && (
                        <RequestGroup
                            title=""
                            count={0}
                            requests={completed}
                            completingId={completingId}
                            adminNotes={adminNotes}
                            onAdminNotesChange={setAdminNotes}
                            onStart={() => {}}
                            onStartComplete={() => {}}
                            onSaveComplete={() => {}}
                            onCancelComplete={() => {}}
                            hideTitle
                        />
                    )}
                </div>
            )}
        </div>
    )
}

interface RequestGroupProps {
    title: string
    count: number
    requests: ClientRequestItem[]
    completingId: string | null
    adminNotes: string
    onAdminNotesChange: (v: string) => void
    onStart: (id: string) => void
    onStartComplete: (id: string) => void
    onSaveComplete: (id: string) => void
    onCancelComplete: () => void
    hideTitle?: boolean
}

function RequestGroup({
    title,
    count,
    requests,
    completingId,
    adminNotes,
    onAdminNotesChange,
    onStart,
    onStartComplete,
    onSaveComplete,
    onCancelComplete,
    hideTitle,
}: RequestGroupProps) {
    return (
        <div>
            {!hideTitle && (
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    {title} ({count})
                </p>
            )}
            <div className="space-y-2">
                {requests.map(req => (
                    <RequestCard
                        key={req.id}
                        request={req}
                        isCompleting={completingId === req.id}
                        adminNotes={adminNotes}
                        onAdminNotesChange={onAdminNotesChange}
                        onStart={() => onStart(req.id)}
                        onStartComplete={() => onStartComplete(req.id)}
                        onSaveComplete={() => onSaveComplete(req.id)}
                        onCancelComplete={onCancelComplete}
                    />
                ))}
            </div>
        </div>
    )
}

interface RequestCardProps {
    request: ClientRequestItem
    isCompleting: boolean
    adminNotes: string
    onAdminNotesChange: (v: string) => void
    onStart: () => void
    onStartComplete: () => void
    onSaveComplete: () => void
    onCancelComplete: () => void
}

function RequestCard({
    request,
    isCompleting,
    adminNotes,
    onAdminNotesChange,
    onStart,
    onStartComplete,
    onSaveComplete,
    onCancelComplete,
}: RequestCardProps) {
    const style = STATUS_STYLES[request.status] ?? STATUS_STYLES.pending
    const typeLabel = TYPE_LABELS[request.type] ?? request.type
    const description = request.content?.description ?? ''
    const fileUrls = request.content?.file_urls ?? []
    const timeAgo = formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })

    return (
        <div className="border border-gray-100 rounded-lg p-2.5 bg-white hover:bg-gray-50/50 transition-colors">
            {/* Header: type pill + status badge */}
            <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                    {typeLabel}
                </span>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${style.bg} ${style.text}`}>
                    {style.label}
                </span>
            </div>

            {/* Description */}
            {description && (
                <p className="text-[11px] text-gray-600 leading-relaxed mb-1.5 line-clamp-2">
                    {description.length > 80 ? description.slice(0, 80) + '...' : description}
                </p>
            )}

            {/* File attachments */}
            {fileUrls.length > 0 && (
                <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                    {(fileUrls as string[]).map((url, i) => (
                        isImageUrl(url) ? (
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block">
                                <img
                                    src={url}
                                    alt=""
                                    className="w-10 h-10 rounded object-cover border border-gray-200 hover:border-gray-400 transition-colors"
                                />
                            </a>
                        ) : (
                            <a
                                key={i}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-800 transition-colors"
                            >
                                <FileText className="h-3 w-3" />
                                {getFileName(url)}
                            </a>
                        )
                    ))}
                </div>
            )}

            {/* Meta: timestamp + file count */}
            <div className="flex items-center gap-2 text-[10px] text-gray-400">
                <span>{timeAgo}</span>
                {fileUrls.length > 0 && (
                    <span className="flex items-center gap-0.5">
                        <Paperclip className="h-2.5 w-2.5" />
                        {fileUrls.length}
                    </span>
                )}
            </div>

            {/* Actions */}
            {request.status === 'pending' && (
                <div className="mt-2">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={onStart}
                        className="h-6 text-[10px] px-2 gap-1"
                    >
                        <Play className="h-2.5 w-2.5" />
                        Start
                    </Button>
                </div>
            )}

            {request.status === 'in_progress' && !isCompleting && (
                <div className="mt-2">
                    <Button
                        size="sm"
                        onClick={onStartComplete}
                        className="h-6 text-[10px] px-2 gap-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                        <Check className="h-2.5 w-2.5" />
                        Complete
                    </Button>
                </div>
            )}

            {request.status === 'in_progress' && isCompleting && (
                <div className="mt-2 space-y-1.5">
                    <textarea
                        value={adminNotes}
                        onChange={(e) => onAdminNotesChange(e.target.value)}
                        placeholder="What did you do? (optional)"
                        className="w-full text-[11px] border border-gray-200 rounded-md p-2 resize-none focus:outline-none focus:ring-1 focus:ring-blue-300"
                        rows={2}
                    />
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            onClick={onSaveComplete}
                            className="h-6 text-[10px] px-2 gap-1 bg-green-600 hover:bg-green-700 text-white"
                        >
                            Save
                        </Button>
                        <button
                            onClick={onCancelComplete}
                            className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {request.status === 'completed' && (
                <div className="mt-1.5 flex items-start gap-1.5">
                    <Check className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                    {request.adminNotes ? (
                        <p className="text-[10px] text-gray-400 leading-relaxed">{request.adminNotes}</p>
                    ) : (
                        <p className="text-[10px] text-gray-300 italic">Completed</p>
                    )}
                </div>
            )}
        </div>
    )
}
