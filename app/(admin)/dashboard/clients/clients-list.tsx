'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { Filter, Users, ChevronDown } from 'lucide-react'
import { getClients, type ClientListItem, type FulfillmentStatus } from './actions'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

interface ClientsListProps {
    initialClients: ClientListItem[]
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

const STATUS_OPTIONS: Array<{ value: FulfillmentStatus; label: string }> = [
    { value: 'pending_customization', label: 'Pending Customization' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'delivered', label: 'Delivered' },
]

const PLAN_OPTIONS: Array<{ value: ClientListItem['plan']; label: string }> = [
    { value: 'standard', label: 'Standard' },
    { value: 'pro', label: 'Pro' },
]

export function ClientsList({ initialClients }: ClientsListProps) {
    const [clients, setClients] = useState(initialClients)
    const [statusFilter, setStatusFilter] = useState<FulfillmentStatus | null>(null)
    const [planFilter, setPlanFilter] = useState<ClientListItem['plan'] | null>(null)
    const [isPending, startTransition] = useTransition()

    function applyFilters(status: FulfillmentStatus | null, plan: ClientListItem['plan'] | null) {
        setStatusFilter(status)
        setPlanFilter(plan)
        startTransition(async () => {
            const result = await getClients({
                status: status ?? undefined,
                plan: plan ?? undefined,
            })
            if (result.success && result.data) {
                setClients(result.data)
            }
        })
    }

    const activeFilterCount = (statusFilter ? 1 : 0) + (planFilter ? 1 : 0)

    return (
        <div className="space-y-4">
            {/* Header bar with count + filters */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                        {clients.length} {clients.length === 1 ? 'client' : 'clients'}
                    </span>
                    {isPending && (
                        <span className="text-xs text-gray-400 animate-pulse">Updating...</span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* Status filter */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-gray-200 bg-white hover:bg-gray-50 transition-colors">
                                <Filter className="h-3 w-3" />
                                Status
                                {statusFilter && (
                                    <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-purple-100 text-purple-700 rounded-full">
                                        1
                                    </span>
                                )}
                                <ChevronDown className="h-3 w-3 ml-0.5" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => applyFilters(null, planFilter)}>
                                <span className={!statusFilter ? 'font-semibold' : ''}>All statuses</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {STATUS_OPTIONS.map(opt => (
                                <DropdownMenuItem
                                    key={opt.value}
                                    onClick={() => applyFilters(opt.value, planFilter)}
                                >
                                    <span className={statusFilter === opt.value ? 'font-semibold' : ''}>
                                        {opt.label}
                                    </span>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Plan filter */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-gray-200 bg-white hover:bg-gray-50 transition-colors">
                                Plan
                                {planFilter && (
                                    <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-purple-100 text-purple-700 rounded-full">
                                        1
                                    </span>
                                )}
                                <ChevronDown className="h-3 w-3 ml-0.5" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => applyFilters(statusFilter, null)}>
                                <span className={!planFilter ? 'font-semibold' : ''}>All plans</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {PLAN_OPTIONS.map(opt => (
                                <DropdownMenuItem
                                    key={opt.value}
                                    onClick={() => applyFilters(statusFilter, opt.value)}
                                >
                                    <span className={planFilter === opt.value ? 'font-semibold' : ''}>
                                        {opt.label}
                                    </span>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Clear all filters */}
                    {activeFilterCount > 0 && (
                        <button
                            onClick={() => applyFilters(null, null)}
                            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Card grid */}
            {clients.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                        <Users className="h-6 w-6 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-600">No purchased clients yet</p>
                    <p className="text-xs text-gray-400 mt-1">
                        Clients will appear here after a successful purchase
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {clients.map(client => {
                        const statusStyle = FULFILLMENT_STYLES[client.fulfillmentStatus]
                        const planStyle = PLAN_STYLES[client.plan]

                        return (
                            <Link
                                key={client.claimId}
                                href={`/dashboard/clients/${client.claimId}`}
                                className="block bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 hover:shadow-sm transition-all"
                            >
                                {/* Top row: business name + plan badge */}
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <h3 className="text-sm font-semibold text-gray-900 truncate flex-1">
                                        {client.businessName}
                                    </h3>
                                    <span className={`shrink-0 inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full ${planStyle.bg} ${planStyle.text}`}>
                                        {planStyle.label}
                                    </span>
                                </div>

                                {/* Client info */}
                                <div className="text-xs text-gray-500 mb-3 space-y-0.5">
                                    {client.clientName && (
                                        <p className="truncate">{client.clientName}</p>
                                    )}
                                    {client.clientEmail && (
                                        <p className="truncate text-gray-400">{client.clientEmail}</p>
                                    )}
                                </div>

                                {/* Bottom row: date, request count, status */}
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-[11px] text-gray-400">
                                        {client.paidAt
                                            ? format(new Date(client.paidAt), 'MMM d, yyyy')
                                            : 'No date'}
                                    </span>

                                    <div className="flex items-center gap-2">
                                        {/* Open request count */}
                                        <span
                                            className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded-md ${
                                                client.openRequestCount > 0
                                                    ? 'bg-red-50 text-red-600'
                                                    : 'bg-gray-50 text-gray-400'
                                            }`}
                                        >
                                            {client.openRequestCount} open
                                        </span>

                                        {/* Fulfillment status */}
                                        <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-md ${statusStyle.bg} ${statusStyle.text}`}>
                                            {statusStyle.label}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
