import { createAdminClient } from "@/lib/supabase/admin"
import { notFound } from "next/navigation"
import { constructHtmlBoilerplate } from "@/lib/utils/html-boilerplate"
import { injectCtaBar } from "@/lib/cta-injector"
import { CLAIM_WINDOW_DAYS } from "@/lib/claim-pricing"
import { addDays } from "date-fns"

interface ClaimPageProps {
    params: Promise<{ slug: string }>
}

export default async function ClaimPage({ params }: ClaimPageProps) {
    const { slug } = await params
    const supabase = createAdminClient()

    // Look up project by ID (using UUID as slug for now per research recommendation)
    const { data: project } = await supabase
        .from("projects")
        .select("id, business_data, generated_code, claim_expires_at, status")
        .eq("id", slug)
        .single()

    if (!project) {
        notFound()
    }

    const businessData = project.business_data as Record<string, unknown>
    const businessName = (businessData?.businessName as string) || "Your Business"

    // If the project has generated code, render it with CTA bar
    if (project.generated_code) {
        const baseHtml = constructHtmlBoilerplate(project.generated_code)
        // Use claim_expires_at if set, otherwise default to CLAIM_WINDOW_DAYS from now
        const expiresAt = project.claim_expires_at
            || addDays(new Date(), CLAIM_WINDOW_DAYS).toISOString()
        const injectedHtml = injectCtaBar(baseHtml, {
            businessName,
            claimUrl: `/claim/${project.id}`,
            expiresAt,
        })

        return (
            <div className="w-full h-screen">
                <iframe
                    srcDoc={injectedHtml}
                    className="w-full h-full border-0"
                    title={`Website preview for ${businessName}`}
                    sandbox="allow-scripts allow-same-origin"
                />
            </div>
        )
    }

    // Fallback: no generated code yet (should be rare)
    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Claim Your Website
            </h1>
            <p className="text-gray-600 mb-4">
                A website has been created for <strong>{businessName}</strong>
            </p>
            <p className="text-sm text-gray-400">
                Full pricing coming in Phase 7
            </p>
        </div>
    )
}
