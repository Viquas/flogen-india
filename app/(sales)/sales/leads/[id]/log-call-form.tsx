'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { logCall } from '../../actions'
import type { CallOutcome } from '@/lib/sales/get-leads'

const OUTCOME_OPTIONS: { value: CallOutcome; label: string }[] = [
    { value: 'no_answer', label: 'No answer' },
    { value: 'wrong_number', label: 'Wrong number' },
    { value: 'interested', label: 'Interested — keep warming up' },
    { value: 'callback_scheduled', label: 'Callback scheduled' },
    { value: 'not_interested', label: 'Not interested' },
    { value: 'closed', label: 'Closed (verbally agreed)' },
    { value: 'do_not_call', label: 'Do not call' },
]

export function LogCallForm({ projectId }: { projectId: string }) {
    const [outcome, setOutcome] = useState<CallOutcome>('no_answer')
    const [notes, setNotes] = useState('')
    const [followUpAt, setFollowUpAt] = useState('')
    const [duration, setDuration] = useState('')
    const [isPending, startTransition] = useTransition()

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        if (!notes.trim()) {
            toast.error('Notes are required — even a short one helps the next person.')
            return
        }

        startTransition(async () => {
            const result = await logCall({
                projectId,
                outcome,
                notes: notes.trim(),
                followUpAt: followUpAt || undefined,
                durationSeconds: duration ? parseInt(duration, 10) * 60 : undefined,
            })

            if (result.success) {
                toast.success('Call logged')
                setNotes('')
                setFollowUpAt('')
                setDuration('')
                setOutcome('no_answer')
            } else {
                toast.error(result.error)
            }
        })
    }

    const showFollowup = outcome === 'callback_scheduled' || outcome === 'interested'

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Outcome</label>
                <select
                    value={outcome}
                    onChange={(e) => setOutcome(e.target.value as CallOutcome)}
                    className="w-full h-10 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40"
                >
                    {OUTCOME_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                            {o.label}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    placeholder="What did they say? Any objections, decision makers, timelines..."
                    className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 resize-none"
                />
            </div>

            <div className="grid grid-cols-2 gap-3">
                {showFollowup && (
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                            Follow-up at
                        </label>
                        <input
                            type="datetime-local"
                            value={followUpAt}
                            onChange={(e) => setFollowUpAt(e.target.value)}
                            className="w-full h-10 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40"
                        />
                    </div>
                )}
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                        Duration (min)
                    </label>
                    <input
                        type="number"
                        min="0"
                        max="180"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        placeholder="Optional"
                        className="w-full h-10 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40"
                    />
                </div>
            </div>

            <button
                type="submit"
                disabled={isPending}
                className="w-full rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                {isPending ? 'Logging...' : 'Log call'}
            </button>
        </form>
    )
}
