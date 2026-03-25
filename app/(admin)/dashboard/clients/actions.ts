"use server"

import { createAdminClient } from '@/lib/supabase/admin'
import { updateProjectWithCode } from '@/lib/ai/project-persistence'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/types/database'

// ---- Shared types ----

type ClaimRow = Database['public']['Tables']['claims']['Row']
type ClientRequestRow = Database['public']['Tables']['client_requests']['Row']

export type FulfillmentStatus = 'pending_customization' | 'in_progress' | 'delivered'

export interface ClientListItem {
    claimId: string
    projectId: string
    businessName: string
    clientName: string | null
    clientEmail: string | null
    plan: ClaimRow['plan']
    paidAt: string | null
    slug: string | null
    openRequestCount: number
    totalRequestCount: number
    fulfillmentStatus: FulfillmentStatus
    projectVersion: number
    projectUpdatedAt: string
}

export interface ClientRequestItem {
    id: string
    claimId: string
    projectId: string
    authUserId: string
    type: ClientRequestRow['type']
    status: ClientRequestRow['status']
    content: { description?: string; file_urls?: string[]; [key: string]: unknown }
    adminNotes: string | null
    createdAt: string
    updatedAt: string
}

// ---- Helpers ----

function deriveFulfillmentStatus(
    requests: Array<{ status: string }>
): FulfillmentStatus {
    if (requests.length === 0) return 'delivered'
    const hasInProgress = requests.some(r => r.status === 'in_progress')
    if (hasInProgress) return 'in_progress'
    const hasPending = requests.some(r => r.status === 'pending')
    if (hasPending) return 'pending_customization'
    return 'delivered'
}

// ---- Server Actions ----

export async function getClients(filters?: {
    status?: FulfillmentStatus
    plan?: ClaimRow['plan']
}): Promise<{ success: boolean; data?: ClientListItem[]; error?: string }> {
    const supabase = createAdminClient()

    let query = supabase
        .from('claims')
        .select(`
            id, project_id, plan, status, client_name, client_email, paid_at,
            projects!inner(id, business_data, slug, version, updated_at)
        `)
        .in('status', ['paid', 'customizing', 'completed'])
        .order('paid_at', { ascending: false })

    if (filters?.plan) {
        query = query.eq('plan', filters.plan)
    }

    const { data: claims, error } = await query
    if (error) return { success: false, error: error.message }
    if (!claims) return { success: true, data: [] }

    // Fetch all requests for matched projects in one query (Pitfall 3: no embedded COUNT)
    const projectIds = claims.map(c => c.project_id)
    const { data: requests } = await supabase
        .from('client_requests')
        .select('id, project_id, status')
        .in('project_id', projectIds)

    const requestsByProject = new Map<string, Array<{ id: string; status: string }>>()
    for (const r of requests ?? []) {
        const existing = requestsByProject.get(r.project_id) ?? []
        existing.push(r)
        requestsByProject.set(r.project_id, existing)
    }

    const clients: ClientListItem[] = claims.map(claim => {
        // Supabase returns the joined row as an object (inner join = always present)
        const project = claim.projects as unknown as {
            id: string
            business_data: Record<string, unknown>
            slug: string | null
            version: number
            updated_at: string
        }
        const bd = project.business_data ?? {}
        const reqs = requestsByProject.get(claim.project_id) ?? []

        return {
            claimId: claim.id,
            projectId: claim.project_id,
            businessName: (bd.businessName as string) ?? 'Unknown Business',
            clientName: claim.client_name,
            clientEmail: claim.client_email,
            plan: claim.plan,
            paidAt: claim.paid_at,
            slug: project.slug,
            openRequestCount: reqs.filter(r => r.status !== 'completed').length,
            totalRequestCount: reqs.length,
            fulfillmentStatus: deriveFulfillmentStatus(reqs),
            projectVersion: project.version,
            projectUpdatedAt: project.updated_at,
        }
    })

    // Apply fulfillment status filter client-side (derived, not in DB)
    let filtered = clients
    if (filters?.status) {
        filtered = filtered.filter(c => c.fulfillmentStatus === filters.status)
    }

    return { success: true, data: filtered }
}

export async function getClientDetail(claimId: string): Promise<{
    success: boolean
    data?: { client: ClientListItem; requests: ClientRequestItem[] }
    error?: string
}> {
    const supabase = createAdminClient()

    const { data: claim, error } = await supabase
        .from('claims')
        .select(`
            id, project_id, plan, status, client_name, client_email, paid_at,
            projects!inner(id, business_data, slug, version, updated_at)
        `)
        .eq('id', claimId)
        .in('status', ['paid', 'customizing', 'completed'])
        .single()

    if (error || !claim) {
        return { success: false, error: error?.message ?? 'Client not found' }
    }

    const project = claim.projects as unknown as {
        id: string
        business_data: Record<string, unknown>
        slug: string | null
        version: number
        updated_at: string
    }
    const bd = project.business_data ?? {}

    // Fetch all requests for this project
    const { data: rawRequests } = await supabase
        .from('client_requests')
        .select('*')
        .eq('project_id', claim.project_id)
        .order('created_at', { ascending: false })

    const requests: ClientRequestItem[] = (rawRequests ?? []).map(r => ({
        id: r.id,
        claimId: r.claim_id,
        projectId: r.project_id,
        authUserId: r.auth_user_id,
        type: r.type,
        status: r.status,
        content: (r.content ?? {}) as ClientRequestItem['content'],
        adminNotes: r.admin_notes,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
    }))

    const openCount = requests.filter(r => r.status !== 'completed').length

    const client: ClientListItem = {
        claimId: claim.id,
        projectId: claim.project_id,
        businessName: (bd.businessName as string) ?? 'Unknown Business',
        clientName: claim.client_name,
        clientEmail: claim.client_email,
        plan: claim.plan,
        paidAt: claim.paid_at,
        slug: project.slug,
        openRequestCount: openCount,
        totalRequestCount: requests.length,
        fulfillmentStatus: deriveFulfillmentStatus(requests),
        projectVersion: project.version,
        projectUpdatedAt: project.updated_at,
    }

    return { success: true, data: { client, requests } }
}

// ---- Plan 02: Editor Integration Actions ----

export interface ProjectClaimResult {
    isPurchased: boolean
    claimId?: string
    clientName?: string
    businessName?: string
    requests?: ClientRequestItem[]
}

export async function getProjectClaimAndRequests(
    projectId: string
): Promise<ProjectClaimResult> {
    const supabase = createAdminClient()

    // Check for a paid/customizing/completed claim on this project
    const { data: claim } = await supabase
        .from('claims')
        .select('id, client_name, project_id')
        .eq('project_id', projectId)
        .in('status', ['paid', 'customizing', 'completed'])
        .limit(1)
        .single()

    if (!claim) {
        return { isPurchased: false }
    }

    // Fetch project for businessName
    const { data: project } = await supabase
        .from('projects')
        .select('business_data')
        .eq('id', projectId)
        .single()

    const bd = (project?.business_data ?? {}) as Record<string, unknown>
    const businessName = (bd.businessName as string) ?? 'Unknown Business'

    // Fetch all client_requests for this project
    const { data: rawRequests } = await supabase
        .from('client_requests')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

    const requests: ClientRequestItem[] = (rawRequests ?? []).map(r => ({
        id: r.id,
        claimId: r.claim_id,
        projectId: r.project_id,
        authUserId: r.auth_user_id,
        type: r.type,
        status: r.status,
        content: (r.content ?? {}) as ClientRequestItem['content'],
        adminNotes: r.admin_notes,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
    }))

    return {
        isPurchased: true,
        claimId: claim.id,
        clientName: claim.client_name ?? undefined,
        businessName,
        requests,
    }
}

export async function updateRequestStatus(
    requestId: string,
    newStatus: 'in_progress' | 'completed',
    adminNotes?: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = createAdminClient()

    const payload: Record<string, unknown> = {
        status: newStatus,
        updated_at: new Date().toISOString(),
    }

    if (newStatus === 'completed' && adminNotes && adminNotes.trim().length > 0) {
        payload.admin_notes = adminNotes
    }

    const { error } = await supabase
        .from('client_requests')
        .update(payload)
        .eq('id', requestId)

    if (error) {
        return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/clients')
    return { success: true }
}

export async function redeployProject(
    projectId: string,
    generatedCode: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = createAdminClient()

    // Step 1: Save code, create revision snapshot, increment version
    const saveResult = await updateProjectWithCode(projectId, generatedCode)
    if (!saveResult.success) {
        return { success: false, error: saveResult.error ?? 'Failed to save project code' }
    }

    // CRITICAL: updateProjectWithCode sets status to 'review' -- override to 'deployed'
    const { error: statusError } = await supabase
        .from('projects')
        .update({ status: 'deployed', updated_at: new Date().toISOString() })
        .eq('id', projectId)

    if (statusError) {
        return { success: false, error: statusError.message }
    }

    // Step 2: Auto-complete all in-progress requests for this project
    await supabase
        .from('client_requests')
        .update({
            status: 'completed',
            admin_notes: 'Completed via redeploy',
            updated_at: new Date().toISOString(),
        })
        .eq('project_id', projectId)
        .eq('status', 'in_progress')

    // Step 3: Revalidate paths
    revalidatePath('/dashboard/clients')
    revalidatePath('/editor')

    return { success: true }
}
