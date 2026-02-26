"use server"

import fs from "fs"
import path from "path"
import { createAdminClient } from "@/lib/supabase/admin"
import { BusinessData } from "@/lib/schemas/project"

export async function saveTemplateLocally(projectName: string, htmlContent: string, businessData?: BusinessData) {
    try {
        const directoryPath = path.join(process.cwd(), "saved_html")

        // 1. Local Save (Keep existing functionality)
        if (!fs.existsSync(directoryPath)) {
            fs.mkdirSync(directoryPath, { recursive: true })
        }

        const safeName = projectName.replace(/[^a-z0-9]/gi, '-').toLowerCase()
        const timestamp = new Date().getTime()
        const fileName = `${safeName}-${timestamp}.html`
        const filePath = path.join(directoryPath, fileName)

        fs.writeFileSync(filePath, htmlContent)

        // 2. Supabase Save (New primary persistence)
        if (businessData) {
            const supabase = createAdminClient()

            // Find or create a batch for today
            const today = new Date().toISOString().split('T')[0]
            let { data: batch, error: batchError } = await supabase
                .from('batches')
                .select('id')
                .gte('created_at', `${today}T00:00:00`)
                .lte('created_at', `${today}T23:59:59`)
                .single()

            if (batchError || !batch) {
                const { data: newBatch, error: createBatchError } = await supabase
                    .from('batches')
                    .insert({
                        source: 'workbench',
                        status: 'completed',
                        metadata: { label: 'Workbench Generation' }
                    })
                    .select()
                    .single()

                if (createBatchError) {
                    console.error("Failed to create batch for project:", createBatchError)
                    // If we can't create a batch, we can't save to Supabase. 
                    // But we'll still return success because it saved locally.
                } else {
                    batch = newBatch
                }
            }

            if (batch) {
                const { error: projectError } = await supabase
                    .from('projects')
                    .insert({
                        batch_id: batch.id,
                        business_data: businessData as any,
                        generated_code: htmlContent,
                        status: 'approved' as const,
                        version: 1
                    })

                if (projectError) {
                    console.error("Failed to save project to Supabase:", projectError)
                }
            }
        }

        return { success: true, path: filePath }
    } catch (error: any) {
        console.error("Failed to save template:", error)
        return { success: false, error: error.message }
    }
}
