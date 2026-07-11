/**
 * Automation plan generator — the automation stream's deliverable.
 *
 * Studies the business (Places data + website audit signals + niche fit) and
 * produces a custom, evidence-grounded automation plan as strict JSON
 * (AutomationPlanSchema). Runs on the existing queue as job_type='automation_plan'.
 *
 * Drives projects.plan_status (queued → generating → ready | failed) and NEVER
 * touches projects.status — plan jobs must not disturb the website lifecycle
 * or the sales workspace status filters.
 */
import { createAdminClient } from '@/lib/supabase/admin'
import { trackedGenerateText } from '@/lib/ai/gateway'
import { getModel } from '@/lib/ai/model-config'
import { getNicheFit } from '@/lib/lead-scoring'
import { notifyProjectRep } from '@/lib/sales/notifications'
import { logger } from '@/lib/logger'
import { AutomationPlanSchema, type AutomationPlan } from './schema'

const PLAN_MODEL = process.env.PLAN_MODEL || 'gemini-2.5-flash'

function stripCodeFences(text: string): string {
    return text
        .replace(/^\s*```(?:json)?\s*/i, '')
        .replace(/\s*```\s*$/, '')
        .trim()
}

function buildPlanPrompt(input: {
    businessData: Record<string, unknown>
    industry: string | null
    pitchAngle: string | null
    auditSignals: Record<string, unknown> | null
    nicheScore: number | null
}): string {
    const { businessData, industry, pitchAngle, auditSignals, nicheScore } = input
    const fit = industry ? getNicheFit(industry) : null

    return `You are a senior automation consultant at Esso Digital. Study this real business and produce a custom automation plan that will be presented to the owner to win them as a client.

## The business (real data from Google Places)
${JSON.stringify(businessData, null, 2)}

## Industry / niche
${industry || 'unknown'}${fit ? ` — known automation fit: ${fit.pitchTemplate} (niche weight ${fit.weight})` : ''}${nicheScore != null ? `, automation fit score ${nicheScore}/100` : ''}

## What our website audit observed
${auditSignals ? JSON.stringify(auditSignals, null, 2) : 'No audit data — the business may not have a website.'}

## Our salesperson's angle
${pitchAngle || 'none recorded'}

## Your task
Return ONLY a JSON object (no markdown, no commentary) with this exact shape:

{
  "version": 1,
  "business_snapshot": {
    "summary": "<2-3 sentences describing THIS business and how customers currently reach it, grounded in the data above>",
    "observed_flow": ["<step 1 of their current customer journey>", "..."]  // 2-8 steps
  },
  "bottlenecks": [  // 1-4 items, each grounded in evidence from the data
    { "title": "...", "evidence": "<cite the specific signal: no booking widget, N reviews mention waiting, closed after 5pm, etc.>", "cost_estimate": "<plain-language cost, e.g. '5-10 missed jobs a month'>" }
  ],
  "automations": [  // 1-3 items, most impactful first
    {
      "name": "...",
      "what_it_does": "...",
      "how_it_works": ["<step>", "..."],  // 2-6 steps, concrete
      "tools": ["<tool or channel>"],      // 1-5, real tools (Twilio, WhatsApp Business, Calendly, a website chatbot, etc.)
      "impact": "<expected outcome in the owner's language>",
      "effort_weeks": <1-12>
    }
  ],
  "rollout": [ { "phase": 1, "weeks": "1-2", "items": ["..."] } ],  // 1-4 phases
  "investment": {
    "setup_range": "<one-time range in INR or AUD matching the business's country>",
    "monthly_range": "<ongoing range>",
    "roi_narrative": "<2-3 sentences: payback logic using their numbers (rating, review count, category economics)>"
  }
}

Rules:
- Ground every claim in the provided data. If a signal is missing, do not invent it.
- Write for a busy owner: short sentences, their vocabulary, zero jargon.
- Prices: sensible ranges for a small ${industry || 'local'} business; never absurd.
- The plan must feel custom to THIS business — use its name, its hours, its review profile.`
}

export interface PlanGenerationResult {
    success: boolean
    error?: string
}

export async function generateAutomationPlan(projectId: string): Promise<PlanGenerationResult> {
    const supabase = createAdminClient() as any

    const { data: project, error } = await supabase
        .from('projects')
        .select('id, business_data, industry, pitch_angle, niche_score, audit_signals, lead_list_id')
        .eq('id', projectId)
        .single()

    if (error || !project) {
        return { success: false, error: `Project not found: ${error?.message}` }
    }

    // audit_signals lives on lead_lists for older promotions — fall back to the join
    let auditSignals = (project.audit_signals as Record<string, unknown> | null) ?? null
    if (!auditSignals && project.lead_list_id) {
        const { data: leadRow } = await supabase
            .from('lead_lists')
            .select('audit_signals')
            .eq('id', project.lead_list_id)
            .maybeSingle()
        auditSignals = (leadRow?.audit_signals as Record<string, unknown> | null) ?? null
    }

    await supabase.from('projects').update({ plan_status: 'generating' }).eq('id', projectId)

    try {
        const prompt = buildPlanPrompt({
            businessData: (project.business_data as Record<string, unknown>) || {},
            industry: (project.industry as string | null) ?? null,
            pitchAngle: (project.pitch_angle as string | null) ?? null,
            auditSignals,
            nicheScore: (project.niche_score as number | null) ?? null,
        })

        const { result } = await trackedGenerateText({
            model: getModel(PLAN_MODEL),
            prompt,
            maxOutputTokens: 4000,
            temperature: 0.4,
            callType: 'automation_plan',
        })

        const parsed = JSON.parse(stripCodeFences(result.text))
        const plan: AutomationPlan = AutomationPlanSchema.parse(parsed)

        await supabase
            .from('projects')
            .update({
                automation_plan: plan,
                plan_status: 'ready',
                updated_at: new Date().toISOString(),
            })
            .eq('id', projectId)

        await notifyProjectRep(projectId, 'deliverable_ready', { deliverable: 'automation_plan' })

        logger.queue.info('Automation plan generated', { projectId })
        return { success: true }
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        await supabase
            .from('projects')
            .update({ plan_status: 'failed', updated_at: new Date().toISOString() })
            .eq('id', projectId)
        logger.queue.error('Automation plan generation failed', { projectId, error: message })
        return { success: false, error: message }
    }
}
