"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export function RealtimeProjectsListener() {
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const channel = supabase
            .channel("realtime-projects")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "projects",
                },
                (payload) => {
                    console.log("Realtime update received:", payload)
                    router.refresh()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase, router])

    return null
}
