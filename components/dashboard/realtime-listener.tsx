"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export function RealtimeProjectsListener() {
    const router = useRouter()
    const supabaseRef = useRef(createClient())

    useEffect(() => {
        const supabase = supabaseRef.current
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
                    const newRecord = payload.new as { status?: string; business_name?: string }
                    const businessName = newRecord?.business_name ?? "Unknown project"

                    if (newRecord?.status === "review") {
                        toast.success("Website ready for review", { description: businessName })
                    } else if (newRecord?.status === "error") {
                        toast.error("Generation failed", { description: businessName })
                    } else if (newRecord?.status === "approved") {
                        toast.info("Website approved", { description: businessName })
                    }

                    router.refresh()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [router])

    return null
}
