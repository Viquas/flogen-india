'use client'

import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { MessageSquare, X, Mail, Building2, User } from 'lucide-react'

interface Submission {
    id: string
    name: string
    email: string
    business_name: string | null
    message: string
    source: string
    read: boolean
    created_at: string
}

interface QueriesClientProps {
    submissions: Submission[]
}

export function QueriesClient({ submissions }: QueriesClientProps) {
    const [selected, setSelected] = useState<Submission | null>(null)

    const sourceLabel = (source: string) => {
        switch (source) {
            case 'contact_form': return 'Get in touch form'
            default: return source
        }
    }

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Queries</h1>
                <p className="text-muted-foreground">
                    Form submissions from the website.
                </p>
            </div>

            {submissions.length === 0 ? (
                <div className="rounded-lg border border-dashed border-zinc-300 p-12 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                    <MessageSquare className="mx-auto mb-3 h-10 w-10 text-zinc-300 dark:text-zinc-600" />
                    <p>No submissions yet.</p>
                    <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                        Submissions from the contact form will appear here.
                    </p>
                </div>
            ) : (
                <div className="rounded-lg border divide-y">
                    {submissions.map((sub) => (
                        <button
                            key={sub.id}
                            onClick={() => setSelected(sub)}
                            className="w-full flex items-center gap-4 px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                        >
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className={`font-medium text-sm ${!sub.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                                        {sub.name}
                                    </span>
                                    {!sub.read && (
                                        <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground truncate mt-0.5">
                                    {sub.message}
                                </p>
                            </div>
                            <span className="shrink-0 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 px-2.5 py-0.5 text-[11px] font-medium">
                                {sourceLabel(sub.source)}
                            </span>
                            <span className="shrink-0 text-xs text-muted-foreground whitespace-nowrap">
                                {format(parseISO(sub.created_at), 'MMM d, HH:mm')}
                            </span>
                        </button>
                    ))}
                </div>
            )}

            {/* Detail Modal */}
            {selected && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/50"
                        onClick={() => setSelected(null)}
                    />
                    <div className="relative bg-white dark:bg-zinc-900 rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white dark:bg-zinc-900 px-6 py-4 border-b flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold">Submission Details</h2>
                                <span className="rounded-full bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 px-2.5 py-0.5 text-[11px] font-medium">
                                    {sourceLabel(selected.source)}
                                </span>
                            </div>
                            <button
                                onClick={() => setSelected(null)}
                                className="p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="px-6 py-5 space-y-5">
                            <div className="flex items-start gap-3">
                                <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Name</p>
                                    <p className="text-sm font-medium">{selected.name}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Mail className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Email</p>
                                    <a href={`mailto:${selected.email}`} className="text-sm font-medium text-blue-600 hover:underline">
                                        {selected.email}
                                    </a>
                                </div>
                            </div>

                            {selected.business_name && (
                                <div className="flex items-start gap-3">
                                    <Building2 className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Business Name</p>
                                        <p className="text-sm font-medium">{selected.business_name}</p>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-start gap-3">
                                <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Message</p>
                                    <p className="text-sm whitespace-pre-wrap leading-relaxed mt-1">
                                        {selected.message}
                                    </p>
                                </div>
                            </div>

                            <div className="pt-3 border-t">
                                <p className="text-xs text-muted-foreground">
                                    Submitted {format(parseISO(selected.created_at), 'MMMM d, yyyy \'at\' HH:mm')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
