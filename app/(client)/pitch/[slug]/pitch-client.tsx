'use client'

import { useRef, useState, useTransition } from 'react'
import { CheckCircle2, Sparkles, ArrowRight, Loader2, Zap, Search, TrendingUp } from 'lucide-react'
import type { PitchContent } from '@/lib/pitch-content'
import type { AutomationPlan } from '@/lib/automation-plan/schema'
import { submitInterest, trackPitchCta } from './actions'

interface PitchClientProps {
    projectId: string
    slug: string
    content: PitchContent
    screenshotUrl: string | null
    plan: AutomationPlan | null
}

export function PitchClient({ projectId, slug, content, screenshotUrl, plan }: PitchClientProps) {
    const [showForm, setShowForm] = useState(false)
    const [done, setDone] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()
    const ctaTracked = useRef(false)
    const formRef = useRef<HTMLDivElement>(null)

    const openForm = () => {
        setShowForm(true)
        if (!ctaTracked.current) {
            ctaTracked.current = true
            trackPitchCta(slug, projectId).catch(() => {})
        }
        requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
    }

    const onSubmit = (formData: FormData) => {
        setError(null)
        startTransition(async () => {
            const res = await submitInterest({
                projectId,
                slug,
                name: String(formData.get('name') || ''),
                email: String(formData.get('email') || ''),
                phone: String(formData.get('phone') || ''),
                preferredTime: String(formData.get('preferredTime') || ''),
            })
            if (res.success) setDone(true)
            else setError(res.message || 'Something went wrong.')
        })
    }

    return (
        <main className="min-h-screen text-[#1a1614]">
            {/* Hero */}
            <section className="max-w-3xl mx-auto px-5 pt-20 pb-12 text-center">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 text-xs font-medium">
                    <Sparkles className="h-3.5 w-3.5" /> For {content.businessName}
                </span>
                <h1 className="mt-5 text-4xl sm:text-5xl font-[family-name:var(--font-signifier)] font-medium leading-[1.1] tracking-tight">
                    {content.headline}
                </h1>
                <p className="mt-5 text-lg text-[#1a1614]/60 max-w-xl mx-auto">{content.subhead}</p>
                <button
                    onClick={openForm}
                    className="mt-8 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-7 py-3.5 text-base font-semibold text-white hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20"
                >
                    {content.ctaLabel} <ArrowRight className="h-4 w-4" />
                </button>
            </section>

            {/* What we noticed */}
            {content.whatWeNoticed && (
                <section className="max-w-2xl mx-auto px-5 pb-10">
                    <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 flex gap-3">
                        <Zap className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">What we noticed</p>
                            <p className="mt-1 text-[#1a1614]/80">{content.whatWeNoticed}</p>
                        </div>
                    </div>
                </section>
            )}

            {/* Preview */}
            {screenshotUrl && (
                <section className="max-w-3xl mx-auto px-5 pb-12">
                    <div className="rounded-2xl overflow-hidden border border-black/10 shadow-xl">
                        <img src={screenshotUrl} alt={`${content.businessName} website`} className="w-full" />
                    </div>
                </section>
            )}

            {plan ? (
                <>
                    {/* We studied your business */}
                    <section className="max-w-2xl mx-auto px-5 pb-12">
                        <div className="flex items-center gap-2 justify-center">
                            <Search className="h-4 w-4 text-emerald-700" />
                            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">We studied your business</p>
                        </div>
                        <p className="mt-3 text-center text-[#1a1614]/70 leading-relaxed">{plan.business_snapshot.summary}</p>
                        <ol className="mt-6 space-y-2">
                            {plan.business_snapshot.observed_flow.map((step, i) => (
                                <li key={i} className="flex items-start gap-3 rounded-xl bg-white border border-black/5 px-4 py-2.5 text-sm text-[#1a1614]/70">
                                    <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-[#1a1614]/5 text-[11px] font-semibold flex items-center justify-center">{i + 1}</span>
                                    {step}
                                </li>
                            ))}
                        </ol>
                    </section>

                    {/* Bottlenecks */}
                    <section className="max-w-4xl mx-auto px-5 pb-12">
                        <h2 className="text-center text-2xl font-[family-name:var(--font-signifier)] font-medium">What it&rsquo;s costing you today</h2>
                        <div className="mt-6 grid gap-4 sm:grid-cols-2">
                            {plan.bottlenecks.map((b, i) => (
                                <div key={i} className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5">
                                    <h3 className="font-semibold leading-snug">{b.title}</h3>
                                    <p className="mt-2 text-sm text-[#1a1614]/60 leading-relaxed">{b.evidence}</p>
                                    <p className="mt-3 text-sm font-semibold text-amber-700">{b.cost_estimate}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* The custom plan */}
                    <section className="max-w-4xl mx-auto px-5 pb-12">
                        <h2 className="text-center text-2xl font-[family-name:var(--font-signifier)] font-medium">Your automation plan</h2>
                        <div className="mt-6 space-y-4">
                            {plan.automations.map((a, i) => (
                                <div key={i} className="rounded-2xl bg-white border border-black/5 p-6 shadow-sm">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <div className="h-9 w-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-semibold">{i + 1}</div>
                                        <h3 className="font-semibold text-lg leading-snug">{a.name}</h3>
                                        <span className="ml-auto rounded-full bg-[#1a1614]/5 px-2.5 py-1 text-[11px] font-medium text-[#1a1614]/60">
                                            ~{a.effort_weeks} week{a.effort_weeks !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                    <p className="mt-3 text-sm text-[#1a1614]/70 leading-relaxed">{a.what_it_does}</p>
                                    <ol className="mt-3 space-y-1.5">
                                        {a.how_it_works.map((step, j) => (
                                            <li key={j} className="flex items-start gap-2 text-sm text-[#1a1614]/60">
                                                <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                                                {step}
                                            </li>
                                        ))}
                                    </ol>
                                    <div className="mt-4 flex flex-wrap items-center gap-1.5">
                                        {a.tools.map((tool) => (
                                            <span key={tool} className="rounded-full border border-black/10 px-2.5 py-0.5 text-[11px] text-[#1a1614]/60">{tool}</span>
                                        ))}
                                    </div>
                                    <p className="mt-4 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-2.5 text-sm font-medium text-emerald-800">
                                        {a.impact}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Investment */}
                    <section className="max-w-2xl mx-auto px-5 pb-14">
                        <div className="rounded-2xl bg-white border border-black/5 p-6 shadow-sm text-center">
                            <div className="flex items-center gap-2 justify-center">
                                <TrendingUp className="h-4 w-4 text-emerald-700" />
                                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">The numbers</p>
                            </div>
                            <div className="mt-4 grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-[#1a1614]/40">One-time setup</p>
                                    <p className="mt-1 text-xl font-semibold">{plan.investment.setup_range}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-[#1a1614]/40">Ongoing</p>
                                    <p className="mt-1 text-xl font-semibold">{plan.investment.monthly_range}</p>
                                </div>
                            </div>
                            <p className="mt-4 text-sm text-[#1a1614]/60 leading-relaxed">{plan.investment.roi_narrative}</p>
                        </div>
                    </section>
                </>
            ) : (
                /* Outcomes (template fallback when no custom plan yet) */
                <section className="max-w-4xl mx-auto px-5 pb-14">
                    <div className="grid gap-4 sm:grid-cols-3">
                        {content.outcomes.map((o, i) => (
                            <div key={i} className="rounded-2xl bg-white border border-black/5 p-6 shadow-sm">
                                <div className="h-9 w-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-semibold">
                                    {i + 1}
                                </div>
                                <h3 className="mt-4 font-semibold text-lg leading-snug">{o.title}</h3>
                                <p className="mt-2 text-sm text-[#1a1614]/60 leading-relaxed">{o.body}</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* CTA / form */}
            <section ref={formRef} className="max-w-xl mx-auto px-5 pb-24">
                <div className="rounded-3xl bg-[#1a1614] text-white p-8 sm:p-10 text-center">
                    {done ? (
                        <div className="py-6">
                            <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto" />
                            <h2 className="mt-4 text-2xl font-[family-name:var(--font-signifier)] font-medium">You’re in.</h2>
                            <p className="mt-2 text-white/60">
                                We’ll be in touch shortly to set up the automation for {content.businessName}.
                            </p>
                        </div>
                    ) : (
                        <>
                            <h2 className="text-2xl sm:text-3xl font-[family-name:var(--font-signifier)] font-medium">
                                Ready to set it up?
                            </h2>
                            <p className="mt-2 text-white/60">
                                Leave your details and we’ll build it for you. No commitment — you only pay if you love it.
                            </p>

                            {!showForm ? (
                                <button
                                    onClick={openForm}
                                    className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-500 px-7 py-3.5 text-base font-semibold text-[#04110b] hover:bg-emerald-400 transition-colors"
                                >
                                    {content.ctaLabel} <ArrowRight className="h-4 w-4" />
                                </button>
                            ) : (
                                <form action={onSubmit} className="mt-6 space-y-3 text-left">
                                    <input
                                        name="name"
                                        placeholder="Your name"
                                        className="w-full h-11 px-4 rounded-xl bg-white/10 border border-white/15 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                                    />
                                    <input
                                        name="email"
                                        type="email"
                                        placeholder="Email"
                                        className="w-full h-11 px-4 rounded-xl bg-white/10 border border-white/15 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                                    />
                                    <input
                                        name="phone"
                                        placeholder="Mobile / WhatsApp"
                                        className="w-full h-11 px-4 rounded-xl bg-white/10 border border-white/15 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                                    />
                                    <input
                                        name="preferredTime"
                                        placeholder="Best time to reach you (optional)"
                                        className="w-full h-11 px-4 rounded-xl bg-white/10 border border-white/15 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                                    />
                                    {error && <p className="text-sm text-red-300">{error}</p>}
                                    <button
                                        type="submit"
                                        disabled={isPending}
                                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3.5 text-base font-semibold text-[#04110b] hover:bg-emerald-400 transition-colors disabled:opacity-60"
                                    >
                                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                        {isPending ? 'Sending…' : content.ctaLabel}
                                    </button>
                                    <p className="text-center text-xs text-white/40">
                                        We’ll only use this to contact you about your automation.
                                    </p>
                                </form>
                            )}
                        </>
                    )}
                </div>
                <p className="mt-6 text-center text-xs text-[#1a1614]/30">Built with care · powered by Flogen</p>
            </section>
        </main>
    )
}
