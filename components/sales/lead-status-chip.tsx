import { cn } from '@/lib/utils'
import type { SalesStatus, CallOutcome } from '@/lib/sales/get-leads'

const STATUS_STYLES: Record<SalesStatus, string> = {
    new: 'bg-gray-100 text-gray-700',
    attempted: 'bg-amber-50 text-amber-700',
    in_conversation: 'bg-blue-50 text-blue-700',
    interested: 'bg-emerald-50 text-emerald-700',
    closed: 'bg-purple-50 text-purple-700',
    not_interested: 'bg-rose-50 text-rose-700',
    do_not_call: 'bg-zinc-900 text-zinc-100',
}

const STATUS_LABELS: Record<SalesStatus, string> = {
    new: 'New',
    attempted: 'Attempted',
    in_conversation: 'In conversation',
    interested: 'Interested',
    closed: 'Closed',
    not_interested: 'Not interested',
    do_not_call: 'Do not call',
}

export function LeadStatusChip({ status }: { status: SalesStatus }) {
    return (
        <span
            className={cn(
                'inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-full',
                STATUS_STYLES[status],
            )}
        >
            {STATUS_LABELS[status]}
        </span>
    )
}

const OUTCOME_STYLES: Record<CallOutcome, string> = {
    no_answer: 'bg-gray-100 text-gray-700',
    wrong_number: 'bg-amber-50 text-amber-700',
    not_interested: 'bg-rose-50 text-rose-700',
    interested: 'bg-emerald-50 text-emerald-700',
    callback_scheduled: 'bg-blue-50 text-blue-700',
    closed: 'bg-purple-50 text-purple-700',
    do_not_call: 'bg-zinc-900 text-zinc-100',
}

const OUTCOME_LABELS: Record<CallOutcome, string> = {
    no_answer: 'No answer',
    wrong_number: 'Wrong number',
    not_interested: 'Not interested',
    interested: 'Interested',
    callback_scheduled: 'Callback scheduled',
    closed: 'Closed',
    do_not_call: 'Do not call',
}

export function OutcomeChip({ outcome }: { outcome: CallOutcome }) {
    return (
        <span
            className={cn(
                'inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-full',
                OUTCOME_STYLES[outcome],
            )}
        >
            {OUTCOME_LABELS[outcome]}
        </span>
    )
}

export { STATUS_LABELS, OUTCOME_LABELS }
