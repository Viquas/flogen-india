/**
 * Builds the copy for an automation pitch page from a promoted project's data.
 * Template-based (no per-lead AI cost) — the specifics come from the business
 * name, its industry's niche template, and the stored pitch_angle.
 */
import { getNicheFit } from '@/lib/lead-scoring'

export interface PitchOutcome {
    title: string
    body: string
}

export interface PitchContent {
    businessName: string
    industry: string | null
    headline: string
    subhead: string
    whatWeNoticed: string | null
    outcomes: PitchOutcome[]
    ctaLabel: string
}

const OUTCOME_LIBRARY: Record<string, PitchOutcome[]> = {
    'missed-call text-back': [
        { title: 'Never lose a job to voicemail', body: 'When you can’t pick up, an instant text goes back to the caller so the lead stays warm instead of calling your competitor.' },
        { title: 'Every enquiry answered in seconds', body: 'An AI assistant replies to common questions — hours, pricing, availability — 24/7, even after hours.' },
        { title: 'More booked jobs, less phone tag', body: 'Turn missed calls and DMs into scheduled work automatically, without adding admin time.' },
    ],
    'AI booking and appointment reminders': [
        { title: '24/7 online booking', body: 'Patients book themselves in without calling — your calendar fills while you focus on care.' },
        { title: 'Automatic reminders cut no-shows', body: 'SMS and email reminders go out on their own, reducing empty slots and last-minute cancellations.' },
        { title: 'Front desk, automated', body: 'Routine questions and rescheduling are handled by an AI assistant so your team does less phone work.' },
    ],
    'AI booking': [
        { title: '24/7 online booking', body: 'Clients book themselves in anytime — no missed calls, no back-and-forth.' },
        { title: 'Fewer no-shows', body: 'Automatic reminders keep your chairs full and your day on schedule.' },
        { title: 'Rebook on autopilot', body: 'Gentle follow-ups bring clients back without you lifting a finger.' },
    ],
    'a FAQ and table-booking bot': [
        { title: 'Take bookings around the clock', body: 'Guests reserve a table straight from your page — no phone required.' },
        { title: 'Answer the same questions automatically', body: 'Hours, menu, dietary options — an AI assistant handles them instantly.' },
        { title: 'Fill quiet nights', body: 'Automated offers and follow-ups bring guests back on slower days.' },
    ],
    'a lead-capture chatbot': [
        { title: 'Capture every enquiry', body: 'A smart chat assistant qualifies visitors and captures their details 24/7.' },
        { title: 'Respond in seconds', body: 'Speed wins deals — leads get an instant, helpful reply every time.' },
        { title: 'Nurture on autopilot', body: 'Automated follow-ups keep prospects engaged until they’re ready.' },
    ],
    'a class-booking bot': [
        { title: 'Fill your classes automatically', body: 'Members book and pay for sessions online, anytime.' },
        { title: 'Cut no-shows with reminders', body: 'Automatic nudges keep attendance high and waitlists moving.' },
        { title: 'Win back lapsed members', body: 'Automated check-ins re-engage members before they drift away.' },
    ],
}

const DEFAULT_OUTCOMES: PitchOutcome[] = [
    { title: 'Never miss an enquiry', body: 'An AI assistant answers customers instantly, 24/7 — so no lead slips through.' },
    { title: 'Book more, admin less', body: 'Online booking and automated reminders keep your schedule full without the phone tag.' },
    { title: 'Follow up automatically', body: 'Automated messages bring customers back without adding to your workload.' },
]

export function buildPitchContent(project: {
    business_data: Record<string, unknown> | null
    industry?: string | null
    pitch_angle?: string | null
}): PitchContent {
    const bd = project.business_data || {}
    const businessName =
        (bd.businessName as string) || (bd.business_name as string) || 'Your business'
    const industry =
        project.industry ||
        (bd.industry as string) ||
        (bd.category as string) ||
        null

    const fit = industry ? getNicheFit(industry) : null
    const template = fit?.pitchTemplate ?? ''
    const outcomes = OUTCOME_LIBRARY[template] ?? DEFAULT_OUTCOMES

    return {
        businessName,
        industry,
        headline: `Turn ${businessName}'s website into a 24/7 booking machine`,
        subhead:
            'We build the automation for you — you only pay if you love it. Here’s what it would do for your business.',
        whatWeNoticed: project.pitch_angle ?? null,
        outcomes,
        ctaLabel: "Let's do it",
    }
}
