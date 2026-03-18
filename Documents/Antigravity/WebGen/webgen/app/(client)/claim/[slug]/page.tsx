import { createAdminClient } from "@/lib/supabase/admin"
import { notFound } from "next/navigation"

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
