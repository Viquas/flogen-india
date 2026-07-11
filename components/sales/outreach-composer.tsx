'use client'

import { useMemo, useState, useTransition } from 'react'
import { Mail, MessageCircle, Loader2, Check, AlertTriangle, Ban } from 'lucide-react'
import { cn } from '@/lib/utils'
import { sendLeadEmail, logWhatsappTouch, suppressContact } from '@/app/(sales)/sales/leads/[id]/outreach-actions'

interface OutreachComposerProps {
    projectId: string
    businessName: string
    phone: string | null
    phoneDigits: string
    slug: string | null
    pool: 'website' | 'automation' | null
    senderName: string
    initialWhatsappCount: number
    whatsappCap: number
}

export function OutreachComposer({
    projectId,
    businessName,
    phone,
    phoneDigits,
    slug,
    pool,
    senderName,
    initialWhatsappCount,
    whatsappCap,
}: OutreachComposerProps) {
    const [tab, setTab] = useState<'email' | 'whatsapp'>(phone ? 'whatsapp' : 'email')
    const deliverablePath = slug ? (pool === 'automation' ? `/pitch/${slug}` : `/claim/${slug}`) : null

    return (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-900">Outreach</h2>
                <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50">
                    <button
                        onClick={() => setTab('email')}
                        className={cn(
                            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
                            tab === 'email' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700',
                        )}
                    >
                        <Mail className="h-3.5 w-3.5" /> Email
                    </button>
                    <button
                        onClick={() => setTab('whatsapp')}
                        className={cn(
                            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
                            tab === 'whatsapp' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700',
                        )}
                    >
                        <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                    </button>
                </div>
            </div>

            {tab === 'email' ? (
                <EmailTab
                    projectId={projectId}
                    businessName={businessName}
                    senderName={senderName}
                    deliverablePath={deliverablePath}
                    pool={pool}
                />
            ) : (
                <WhatsappTab
                    projectId={projectId}
                    businessName={businessName}
                    phone={phone}
                    phoneDigits={phoneDigits}
                    deliverablePath={deliverablePath}
                    pool={pool}
                    initialCount={initialWhatsappCount}
                    cap={whatsappCap}
                />
            )}
        </div>
    )
}

function absolute(path: string | null): string {
    if (!path) return ''
    if (typeof window === 'undefined') return path
    return `${window.location.origin}${path}`
}

function EmailTab({
    projectId,
    businessName,
    senderName,
    deliverablePath,
    pool,
}: {
    projectId: string
    businessName: string
    senderName: string
    deliverablePath: string | null
    pool: 'website' | 'automation' | null
}) {
    const [to, setTo] = useState('')
    const [subject, setSubject] = useState(
        pool === 'automation'
            ? `A quick idea for ${businessName}`
            : `A website for ${businessName}`,
    )
    const [body, setBody] = useState(
        pool === 'automation'
            ? `Hi,\n\nI came across ${businessName} and put together a quick plan for how a bit of automation (online booking, instant replies, missed-call text-back) could save you time and win more customers.\n\nTake a look — no commitment, you only pay if you love it.\n\nBest,\n${senderName}`
            : `Hi,\n\nI noticed ${businessName} doesn't have a website yet, so I built a working draft to show what's possible.\n\nHave a look and let me know what you think.\n\nBest,\n${senderName}`,
    )
    const [result, setResult] = useState<{ ok: boolean; error?: string } | null>(null)
    const [isPending, startTransition] = useTransition()

    const send = () => {
        setResult(null)
        startTransition(async () => {
            const res = await sendLeadEmail({
                projectId,
                to,
                subject,
                bodyText: body,
                ctaUrl: deliverablePath ? absolute(deliverablePath) : undefined,
                ctaLabel: pool === 'automation' ? 'See the plan' : 'View your website',
            })
            setResult(res)
        })
    }

    return (
        <div className="space-y-3">
            <input
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="Recipient email"
                type="email"
                className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
            <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject"
                className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
            <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={7}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 resize-y"
            />
            <p className="text-[11px] text-gray-400">
                A compliant footer (sender name, ABN, address, one-click unsubscribe) and open/click
                tracking are added automatically.
            </p>
            <button
                onClick={send}
                disabled={isPending || !to.trim()}
                className={cn(
                    'inline-flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-semibold transition-colors',
                    !isPending && to.trim() ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed',
                )}
            >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                {isPending ? 'Sending…' : 'Send email'}
            </button>
            {result && (
                <p className={cn('text-sm', result.ok ? 'text-emerald-600' : 'text-red-600')}>
                    {result.ok ? 'Sent.' : result.error}
                </p>
            )}
        </div>
    )
}

function WhatsappTab({
    projectId,
    businessName,
    phone,
    phoneDigits,
    deliverablePath,
    pool,
    initialCount,
    cap,
}: {
    projectId: string
    businessName: string
    phone: string | null
    phoneDigits: string
    deliverablePath: string | null
    pool: 'website' | 'automation' | null
    initialCount: number
    cap: number
}) {
    const [count, setCount] = useState(initialCount)
    const [message, setMessage] = useState(
        pool === 'automation'
            ? `Hi! I put together a quick plan showing how automation could help ${businessName} win more customers — mind if I send it over?`
            : `Hi! I built a free website draft for ${businessName} — want me to send you the link?`,
    )
    const [error, setError] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    const waHref = useMemo(() => {
        const text = deliverablePath ? `${message}\n\n${absolute(deliverablePath)}` : message
        return `https://wa.me/${phoneDigits}?text=${encodeURIComponent(text)}`
    }, [message, deliverablePath, phoneDigits])

    const overCap = count >= cap

    const openAndLog = () => {
        if (!phone) return
        setError(null)
        // Open WhatsApp immediately (user gesture), then log the touch.
        window.open(waHref, '_blank', 'noopener,noreferrer')
        startTransition(async () => {
            const res = await logWhatsappTouch({ projectId, to: phone, body: message })
            if (res.ok && typeof res.count === 'number') setCount(res.count)
            else if (!res.ok) setError(res.error || 'Could not log the touch.')
        })
    }

    if (!phone) {
        return <p className="text-sm text-gray-400">No phone number on this lead.</p>
    }

    return (
        <div className="space-y-3">
            <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 resize-y"
            />
            <div className="flex items-center justify-between">
                <span
                    className={cn(
                        'inline-flex items-center gap-1.5 text-xs',
                        overCap ? 'text-red-600' : count >= cap * 0.8 ? 'text-amber-600' : 'text-gray-400',
                    )}
                >
                    {overCap && <AlertTriangle className="h-3.5 w-3.5" />}
                    {count}/{cap} new contacts today
                </span>
            </div>
            {overCap && (
                <p className="text-xs text-red-600 flex items-start gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    You’ve hit today’s soft cap. Going further risks your WhatsApp number — consider stopping.
                </p>
            )}
            <button
                onClick={openAndLog}
                disabled={isPending}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-60"
            >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
                Open in WhatsApp
            </button>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <SuppressRow projectId={projectId} contact={phone} />
        </div>
    )
}

function SuppressRow({ projectId, contact }: { projectId: string; contact: string }) {
    const [done, setDone] = useState(false)
    const [isPending, startTransition] = useTransition()
    if (done) {
        return (
            <p className="text-xs text-gray-400 flex items-center gap-1">
                <Check className="h-3.5 w-3.5" /> Marked do-not-contact.
            </p>
        )
    }
    return (
        <button
            onClick={() =>
                startTransition(async () => {
                    const res = await suppressContact({ projectId, contact, channel: 'any' })
                    if (res.ok) setDone(true)
                })
            }
            disabled={isPending}
            className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-red-600 transition-colors"
        >
            <Ban className="h-3.5 w-3.5" /> They replied STOP — suppress
        </button>
    )
}
