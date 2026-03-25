'use client'

import { useState } from 'react'
import Link from 'next/link'
import { format, formatDistanceToNow } from 'date-fns'
import {
    ArrowLeft,
    ExternalLink,
    Pencil,
    ChevronDown,
    ChevronUp,
    FileText,
    Image as ImageIcon,
    Inbox,
} from 'lucide-react'
import type { ClientListItem, ClientRequestItem, FulfillmentStatus } from '../actions'

interface ClientDetailProps {
    client: ClientListItem
    requests: ClientRequestItem[]
}

const FULFILLMENT_STYLES: Record<FulfillmentStatus, { bg: string; text: string; label: string }> = {
    pending_customization: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Pending Customization' },
    in_progress: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'In Progress' },
    delivered: { bg: 'bg-green-50', text: 'text-green-700', label: 'Delivered' },
}

const PLAN_STYLES: Record<ClientListItem['plan'], { bg: string; text: string; label: string }> = {
    standard: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Standard' },
    pro: { bg: 'bg-purple-50', text: 'text-purple-700', label: 'Pro' },
}

// Matches portal/request-card.tsx constants
const TYPE_LABELS: Record<ClientRequestItem['type'], string> = {
    text_change: 'Text Change',
    logo_upload: 'Logo Upload',
    domain_setup: 'Domain Setup',
    agent_call: 'Agent Call',
    booking_setup: 'Booking Setup',
}

const REQUEST_STATUS_STYLES: Record<ClientRequestItem['status'], { bg: string; text: string; label: string }> = {
    pending: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Pending' },
    in_progress: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'In Progress' },
    completed: { bg: 'bg-green-50', text: 'text-green-700', label: 'Completed' },
}

function isImageUrl(url: string): boolean {
    const lower = url.toLowerCase()
    return lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.webp')
}

// ---- Request Item (expand/collapse) ----

function RequestItem({ request }: { request: ClientRequestItem }) {
    const [expanded, setExpanded] = useState(false)

    const statusStyle = REQUEST_STATUS_STYLES[request.status]
    const description = request.content?.description ?? ''
    const fileUrls = request.content?.file_urls ?? []
    const preview = description.length > 100 ? description.slice(0, 100) + '...' : description

    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors min-h-[44px]"
            >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium bg-gray-100 text-gray-600 rounded-md whitespace-nowrap">
                        {TYPE_LABELS[request.type]}
                    </span>
                    <span className="text-xs text-gray-500 truncate">{preview}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {fileUrls.length > 0 && (
                        <span className="text-[10px] text-gray-400">
                            {fileUrls.length} file{fileUrls.length > 1 ? 's' : ''}
                        </span>
                    )}
                    <span className="text-[10px] text-gray-400">
                        {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-md ${statusStyle.bg} ${statusStyle.text}`}>
                        {statusStyle.label}
                    </span>
                    {expanded
                        ? <ChevronUp className="w-4 h-4 text-gray-400" />
                        : <ChevronDown className="w-4 h-4 text-gray-400" />
                    }
                </div>
            </button>

            {/* Expanded content */}
            <div
                className="transition-all duration-200 ease-in-out overflow-hidden"
                style={{ maxHeight: expanded ? '600px' : '0px', opacity: expanded ? 1 : 0 }}
            >
                <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
                    {description && (
                        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                            {description}
                        </p>
                    )}

                    {/* File attachments */}
                    {fileUrls.length > 0 && (
                        <div className="flex flex-wrap gap-2">
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
                                                <ImageIcon className="w-3 h-3 text-white opacity-0 hover:opacity-100" />
                                            </div>
                                        </a>
                                    )
                                }

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

                    {/* Admin notes (if any) */}
                    {request.adminNotes && (
                        <div className="text-xs text-gray-400 italic border-t border-gray-100 pt-2">
                            Admin note: {request.adminNotes}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// ---- Status group section ----

function RequestGroup({
    title,
    requests,
    defaultCollapsed = false,
}: {
    title: string
    requests: ClientRequestItem[]
    defaultCollapsed?: boolean
}) {
    const [collapsed, setCollapsed] = useState(defaultCollapsed)

    if (requests.length === 0) return null

    return (
        <div>
            <button
                type="button"
                onClick={() => setCollapsed(!collapsed)}
                className="flex items-center gap-2 mb-2 group"
            >
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    {title} ({requests.length})
                </h4>
                {collapsed
                    ? <ChevronDown className="w-3 h-3 text-gray-400 group-hover:text-gray-600" />
                    : <ChevronUp className="w-3 h-3 text-gray-400 group-hover:text-gray-600" />
                }
            </button>
            {!collapsed && (
                <div className="space-y-2">
                    {requests.map(r => <RequestItem key={r.id} request={r} />)}
                </div>
            )}
        </div>
    )
}

// ---- Main Component ----

export function ClientDetail({ client, requests }: ClientDetailProps) {
    const statusStyle = FULFILLMENT_STYLES[client.fulfillmentStatus]
    const planStyle = PLAN_STYLES[client.plan]

    // Group requests by status: In Progress first, Pending second, Completed third (collapsed)
    const inProgressRequests = requests.filter(r => r.status === 'in_progress')
    const pendingRequests = requests.filter(r => r.status === 'pending')
    const completedRequests = requests.filter(r => r.status === 'completed')

    // Build preview URL: prefer slug, fallback to project ID
    const previewUrl = client.slug
        ? `/sites/${client.slug}`
        : `/preview/${client.projectId}`

    return (
        <div className="space-y-6">
            {/* Back link */}
            <Link
                href="/dashboard/clients"
                className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Clients
            </Link>

            {/* Client summary card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="space-y-3 flex-1">
                        {/* Business name + plan */}
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-bold text-gray-900">
                                {client.businessName}
                            </h1>
                            <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full ${planStyle.bg} ${planStyle.text}`}>
                                {planStyle.label}
                            </span>
                        </div>

                        {/* Client contact */}
                        <div className="text-sm text-gray-600 space-y-0.5">
                            {client.clientName && <p>{client.clientName}</p>}
                            {client.clientEmail && (
                                <a
                                    href={`mailto:${client.clientEmail}`}
                                    className="text-blue-600 hover:text-blue-700 hover:underline"
                                >
                                    {client.clientEmail}
                                </a>
                            )}
                        </div>

                        {/* Meta row */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
                            {client.paidAt && (
                                <span>Purchased {format(new Date(client.paidAt), 'MMM d, yyyy')}</span>
                            )}
                            <span>v{client.projectVersion}</span>
                            <span>
                                Last updated{' '}
                                {formatDistanceToNow(new Date(client.projectUpdatedAt), { addSuffix: true })}
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-md ${statusStyle.bg} ${statusStyle.text}`}>
                                {statusStyle.label}
                            </span>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                        <a
                            href={previewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition-colors"
                        >
                            <ExternalLink className="h-3.5 w-3.5" />
                            View Live Site
                        </a>
                        <Link
                            href={`/editor?id=${client.projectId}`}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors shadow-sm"
                        >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit Site
                        </Link>
                    </div>
                </div>
            </div>

            {/* Requests section */}
            <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900">
                    Requests ({requests.length})
                </h3>

                {requests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-xl border border-gray-200">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                            <Inbox className="h-5 w-5 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-500">No requests yet</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <RequestGroup title="In Progress" requests={inProgressRequests} />
                        <RequestGroup title="Pending" requests={pendingRequests} />
                        <RequestGroup
                            title="Completed"
                            requests={completedRequests}
                            defaultCollapsed
                        />
                    </div>
                )}
            </div>
        </div>
    )
}
