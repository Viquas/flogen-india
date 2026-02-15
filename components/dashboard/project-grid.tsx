"use client"

import { useState, useTransition } from 'react'
import { ProjectCard } from './project-card'
import { BatchActions } from './batch-actions'
import { regenerateProjects, deployProjects } from '@/app/dashboard/actions'

interface Project {
    id: string
    business_data: {
        businessName: string
        industry?: string
        description?: string
        services?: string[]
    }
    status: string
    created_at: string
    updated_at: string
}

interface ProjectGridProps {
    projects: Project[]
}

export function ProjectGrid({ projects }: ProjectGridProps) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [isPending, startTransition] = useTransition()

    const handleSelect = (id: string, selected: boolean) => {
        setSelectedIds(prev => {
            const next = new Set(prev)
            if (selected) {
                next.add(id)
            } else {
                next.delete(id)
            }
            return next
        })
    }

    const handleSelectAll = () => {
        setSelectedIds(new Set(projects.map(p => p.id)))
    }

    const handleDeselectAll = () => {
        setSelectedIds(new Set())
    }

    const handleRegenerateSelected = () => {
        startTransition(async () => {
            await regenerateProjects(Array.from(selectedIds))
            setSelectedIds(new Set())
        })
    }

    const handleDeploySelected = () => {
        startTransition(async () => {
            await deployProjects(Array.from(selectedIds))
            setSelectedIds(new Set())
        })
    }

    return (
        <div className="space-y-4">
            {projects.length > 0 && (
                <BatchActions
                    selectedCount={selectedIds.size}
                    totalCount={projects.length}
                    onSelectAll={handleSelectAll}
                    onDeselectAll={handleDeselectAll}
                    onRegenerateSelected={handleRegenerateSelected}
                    onDeploySelected={handleDeploySelected}
                    isProcessing={isPending}
                />
            )}

            {projects.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {projects.map((project) => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            isSelected={selectedIds.has(project.id)}
                            onSelect={handleSelect}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="text-muted-foreground">
                        <p className="text-lg font-medium">No projects found</p>
                        <p className="text-sm">
                            Send data via the webhook to get started.
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}
