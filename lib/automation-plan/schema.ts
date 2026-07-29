import { z } from 'zod'

/**
 * The custom automation plan generated per business — the automation stream's
 * deliverable. Stored on projects.automation_plan and rendered by the pitch
 * page and the presentation deck. Version bumps require a renderer fallback.
 */
export const AutomationPlanSchema = z.object({
    version: z.literal(1),
    business_snapshot: z.object({
        summary: z.string().min(20),
        // The customer journey as we observed it, step by step
        observed_flow: z.array(z.string().min(3)).min(2).max(8),
    }),
    bottlenecks: z
        .array(
            z.object({
                title: z.string().min(3),
                evidence: z.string().min(10),
                cost_estimate: z.string().min(3),
            }),
        )
        .min(1)
        .max(4),
    automations: z
        .array(
            z.object({
                name: z.string().min(3),
                what_it_does: z.string().min(10),
                how_it_works: z.array(z.string().min(3)).min(2).max(6),
                tools: z.array(z.string().min(2)).min(1).max(5),
                impact: z.string().min(10),
                effort_weeks: z.number().int().min(1).max(12),
            }),
        )
        .min(1)
        .max(3),
    rollout: z
        .array(
            z.object({
                phase: z.number().int().min(1),
                weeks: z.string().min(1),
                items: z.array(z.string().min(3)).min(1),
            }),
        )
        .min(1)
        .max(4),
    investment: z.object({
        setup_range: z.string().min(2),
        monthly_range: z.string().min(2),
        roi_narrative: z.string().min(20),
    }),
})

export type AutomationPlan = z.infer<typeof AutomationPlanSchema>

export type PlanStatus = 'queued' | 'generating' | 'ready' | 'failed'
