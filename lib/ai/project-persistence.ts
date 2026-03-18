// Update project with generated code and create a revision snapshot
export async function updateProjectWithCode(
    projectId: string,
    generatedCode: string,
    promptVersionId?: string | null
): Promise<{ success: boolean; error?: string }> {
    // try to save to disk first (backup)
    try {
        const { saveCodeToDisk } = await import('@/lib/file-utils')
        await saveCodeToDisk(projectId, generatedCode)
    } catch (e) {
        console.warn('Failed to save to local disk', e)
    }

    // Use admin client to bypass RLS for robust saving
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const supabase = createAdminClient()

    // 1. Fetch current project state
    const { data: currentProject } = await supabase
        .from('projects')
        .select('business_data, generated_code, version')
        .eq('id', projectId)
        .single()

    // 2. If it already has generated code, snapshot it as a revision
    let newVersion = 1;
    if (currentProject) {
        newVersion = (currentProject.version || 1) + 1;

        if (currentProject.generated_code) {
            await supabase
                .from('project_revisions')
                .insert({
                    project_id: projectId,
                    business_data: currentProject.business_data,
                    generated_code: currentProject.generated_code,
                    version: currentProject.version || 1,
                })
        }
    }

    // 3. Update the main project row
    const updateData: Record<string, unknown> = {
        generated_code: generatedCode,
        status: 'review' as const,
        version: newVersion,
        updated_at: new Date().toISOString(),
    }
    if (promptVersionId) {
        updateData.prompt_version_id = promptVersionId
    }
    const { error } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', projectId)

    if (error) {
        console.error('Failed to update project:', error)
        return { success: false, error: error.message }
    }

    return { success: true }
}
