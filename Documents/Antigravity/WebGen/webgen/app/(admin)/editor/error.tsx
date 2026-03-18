"use client"

import { AlertCircle, RefreshCcw, LayoutDashboard } from "lucide-react"
import Link from "next/link"

export default function EditorError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-[#F9FAFB]">
            <div className="p-3 bg-red-50 rounded-full mb-4">
                <AlertCircle className="h-10 w-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 mb-2">
                Editor Error
            </h2>
            <p className="text-sm text-zinc-500 max-w-md mb-2">
                The editor encountered an unexpected error.
            </p>
            <p className="text-xs text-red-400 font-mono max-w-lg mb-6 break-all">
                {error.message}
            </p>
            <div className="flex items-center gap-3">
                <button
                    onClick={reset}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-md hover:bg-zinc-800 transition-colors"
                >
                    <RefreshCcw className="h-4 w-4" />
                    Try Again
                </button>
                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 px-4 py-2 border border-zinc-200 text-zinc-700 text-sm font-medium rounded-md hover:bg-zinc-50 transition-colors"
                >
                    <LayoutDashboard className="h-4 w-4" />
                    Back to Dashboard
                </Link>
            </div>
        </div>
    )
}
