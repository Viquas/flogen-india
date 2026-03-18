"use client"

import { SplitWorkbench } from '@/components/workbench/split-workbench'
import { regenerateProject } from '@/app/(admin)/dashboard/actions'
import { useTransition } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft } from 'lucide-react'
import { format, parseISO } from 'date-fns'

interface WorkbenchClientProps {
    project: {
        id: string
        version: number
        business_data: {
            businessName: string
            description?: string
            services?: string[]
            contactInfo?: Record<string, string>
        }
        generated_code: string | null
        status: string
        created_at: string
    }
}

export function WorkbenchClient({ project }: WorkbenchClientProps) {
    const [isPending, startTransition] = useTransition()

    const handleRegenerate = () => {
        startTransition(async () => {
            await regenerateProject(project.id)
            // Reload to get fresh data
            window.location.reload()
        })
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                </Link>
                <div className="flex-1">
                    <h1 className="text-xl font-bold">{project.business_data?.businessName || 'Project'}</h1>
                    <p className="text-xs text-muted-foreground">
                        Created {format(parseISO(project.created_at), 'MMM d, yyyy h:mm a')}
                    </p>
                </div>
                <Badge>{project.status}</Badge>
            </div>

            {/* Workbench */}
            <SplitWorkbench
                project={project}
                onRegenerate={handleRegenerate}
                isRegenerating={isPending}
            />
        </div>
    )
}
