"use client"

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface Project {
    id: string
    status: string
    generated_code: string | null
    [key: string]: any
}

export function useRealtimeProject(projectId: string, initialProject: Project) {
    const [project, setProject] = useState<Project>(initialProject)

    useEffect(() => {
        const supabase = createBrowserClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        const channel: RealtimeChannel = supabase
            .channel(`project-${projectId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'projects',
                    filter: `id=eq.${projectId}`,
                },
                (payload) => {
                    setProject(prev => ({ ...prev, ...payload.new }))
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [projectId])

    return project
}

export function useRealtimeProjects(initialProjects: Project[]) {
    const [projects, setProjects] = useState<Project[]>(initialProjects)

    useEffect(() => {
        const supabase = createBrowserClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        const channel: RealtimeChannel = supabase
            .channel('projects-updates')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'projects',
                },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setProjects(prev => [payload.new as Project, ...prev])
                    } else if (payload.eventType === 'UPDATE') {
                        setProjects(prev =>
                            prev.map(p => p.id === (payload.new as Project).id ? { ...p, ...payload.new } : p)
                        )
                    } else if (payload.eventType === 'DELETE') {
                        setProjects(prev => prev.filter(p => p.id !== (payload.old as Project).id))
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    return projects
}
