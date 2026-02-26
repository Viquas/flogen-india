"use client"

import { Component, type ReactNode } from "react"
import { AlertCircle, RefreshCcw } from "lucide-react"

interface ErrorBoundaryProps {
    children: ReactNode
    fallbackTitle?: string
}

interface ErrorBoundaryState {
    hasError: boolean
    error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("[ErrorBoundary]", error, errorInfo)
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null })
    }

    render() {
        if (!this.state.hasError) {
            return this.props.children
        }

        return (
            <div className="flex flex-col items-center justify-center min-h-[40vh] p-8 text-center">
                <div className="p-3 bg-red-50 rounded-full mb-4">
                    <AlertCircle className="h-8 w-8 text-red-500" />
                </div>
                <h2 className="text-xl font-bold tracking-tight text-zinc-900 mb-2">
                    {this.props.fallbackTitle || "Something went wrong"}
                </h2>
                <p className="text-sm text-zinc-500 max-w-md mb-1">
                    An unexpected error occurred. You can try refreshing the page.
                </p>
                <p className="text-xs text-red-400 font-mono max-w-lg mb-6 break-all">
                    {this.state.error?.message}
                </p>
                <button
                    onClick={this.handleReset}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-md hover:bg-zinc-800 transition-colors"
                >
                    <RefreshCcw className="h-4 w-4" />
                    Try Again
                </button>
            </div>
        )
    }
}
