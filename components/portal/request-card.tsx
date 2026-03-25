'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, FileText, Image } from 'lucide-react'

interface RequestContent {
    description: string
    file_urls?: string[]
}

interface ClientRequest {
    id: string
    type: 'logo_upload' | 'text_change' | 'domain_setup' | 'agent_call' | 'booking_setup'
    status: 'pending' | 'in_progress' | 'completed'
    content: RequestContent
    created_at: string
    updated_at: string
}

interface RequestCardProps {
    request: ClientRequest
}

const TYPE_LABELS: Record<ClientRequest['type'], string> = {
    text_change: 'Text Change',
    logo_upload: 'Logo Upload',
    domain_setup: 'Domain Setup',
    agent_call: 'Agent Call',
    booking_setup: 'Booking Setup',
}

const STATUS_STYLES: Record<ClientRequest['status'], { bg: string; text: string; label: string }> = {
    pending: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Pending' },
    in_progress: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'In Progress' },
    completed: { bg: 'bg-green-50', text: 'text-green-700', label: 'Completed' },
}

function getRelativeTime(dateStr: string): string {
    const now = Date.now()
    const then = new Date(dateStr).getTime()
    const diffMs = now - then

    const seconds = Math.floor(diffMs / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return 'Just now'
}

function isImageUrl(url: string): boolean {
    const lower = url.toLowerCase()
    return lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.webp')
}

export function RequestCard({ request }: RequestCardProps) {
    const [expanded, setExpanded] = useState(false)

    const statusStyle = STATUS_STYLES[request.status]
    const content = request.content
    const fileUrls = content.file_urls ?? []

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Collapsed header -- always visible */}
            <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors min-h-[44px]"
            >
                <div className="flex items-center gap-3 min-w-0">
                    <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium bg-gray-100 text-gray-600 rounded-md whitespace-nowrap">
                        {TYPE_LABELS[request.type]}
                    </span>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                        {getRelativeTime(request.created_at)}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-md ${statusStyle.bg} ${statusStyle.text}`}>
                        {statusStyle.label}
                    </span>
                    {expanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                    )}
                </div>
            </button>

            {/* Expanded content */}
            <div
                className="transition-all duration-200 ease-in-out overflow-hidden"
                style={{ maxHeight: expanded ? '600px' : '0px', opacity: expanded ? 1 : 0 }}
            >
                <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                    {/* Description */}
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {content.description}
                    </p>

                    {/* File previews */}
                    {fileUrls.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                            {fileUrls.map((url) => {
                                if (isImageUrl(url)) {
                                    return (
                                        <a
                                            key={url}
                                            href={url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 hover:border-gray-400 transition-colors"
                                        >
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={url}
                                                alt="Attachment"
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">
                                                <Image className="w-3 h-3 text-white opacity-0 hover:opacity-100" />
                                            </div>
                                        </a>
                                    )
                                }

                                // PDF or other file type
                                const filename = url.split('/').pop() ?? 'file'
                                return (
                                    <a
                                        key={url}
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-100 hover:border-gray-300 transition-colors min-h-[44px]"
                                    >
                                        <FileText className="w-4 h-4 text-gray-400" />
                                        <span className="truncate max-w-[120px]">{filename}</span>
                                    </a>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
