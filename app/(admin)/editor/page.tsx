"use client"

import { useState, useEffect, useRef, useCallback, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, LayoutDashboard, Code2, Eye, Send, ChevronDown, Monitor, Tablet, Smartphone, AlertCircle, Settings2, FileText, MoreHorizontal, Pencil, Trash2, Check, X, PanelLeftClose, PanelLeftOpen, Star, GitCompare } from "lucide-react"
import { LivePreview, StreamLogEntry } from "@/components/workbench/live-preview"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SettingsDialog } from "@/components/settings/settings-dialog"
import { useSearchParams } from "next/navigation"
import { getProjectById, getRecentProjects, approveProject } from "@/app/(admin)/dashboard/actions"
import { createClient } from "@/lib/supabase/client"
import { OutreachModal } from "@/components/dashboard/outreach-modal"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { jsonToMarkdown, markdownToJson } from "@/lib/converters"
import { HistorySidebar } from "@/components/navigation/history-sidebar"
import { ProjectHistoryItem } from "@/lib/mock-data"
import Link from "next/link"
import { saveTemplateLocally } from "@/lib/actions/save-template"
import { constructHtmlBoilerplate } from "@/lib/utils/html-boilerplate"
import { TemplateSaveSheet } from "@/components/editor/template-save-sheet"
import { ExportButton } from "@/components/editor/export-button"
import { DiffView } from "@/components/editor/diff-view"
import { usePrefetchCache } from "@/hooks/use-prefetch-cache"

const testBusinessData = {
    businessName: "TechVentures Inc",
    description: "A cutting-edge technology consulting firm specializing in AI solutions and digital transformation.",
    services: ["AI Consulting", "Cloud Migration", "Custom Software Development", "Data Analytics"],
    contactInfo: {
        email: "hello@techventures.com",
        phone: "+1-555-TECH",
        website: "https://techventures.com"
    }
}

export default function EditorPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <EditorContent />
        </Suspense>
    )
}

function EditorContent() {
    const searchParams = useSearchParams()
    const projectId = searchParams.get('id')
    const [isJsonLoading, setIsJsonLoading] = useState(false)
    const [isRevisionLoading, setIsRevisionLoading] = useState(false)
    const [rawJsonContext, setRawJsonContext] = useState(JSON.stringify(testBusinessData, null, 2))
    const [structuredJsonContext, setStructuredJsonContext] = useState("")
    const [markdownContext, setMarkdownContext] = useState("")
    const [revisionPrompt, setRevisionPrompt] = useState("")
    const [revisionStatus, setRevisionStatus] = useState<{ message: string; type: 'info' | 'warn' } | null>(null)
    const [generatedCode, setGeneratedCode] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [viewMode, setViewMode] = useState<'preview' | 'code' | 'diff'>('preview')
    const [projectVersion, setProjectVersion] = useState<number>(1)
    const [deviceMode, setDeviceMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
    const [model, setModel] = useState<string>("default")
    const [inputTab, setInputTab] = useState("rjson")

    // Streaming state
    const [isStreaming, setIsStreaming] = useState(false)
    const [streamingLog, setStreamingLog] = useState<StreamLogEntry[]>([])
    const [streamingPhase, setStreamingPhase] = useState<string>("")
    const [tokenCount, setTokenCount] = useState(0)
    const [elapsedTime, setElapsedTime] = useState(0)
    const elapsedTimerRef = useRef<NodeJS.Timeout | null>(null)

    // Schema reference (read-only)
    const schemaContent = `# RichBusinessData Schema Reference

## Root Fields (Legacy Compat)
- businessName: string (required)
- description: string (required)
- services: string[] (required)
- contactInfo?: { email, phone, address, website }
- industry?: string

## $$manifest
- version, generator, generatedAt, entityId

## globalConfiguration
- localization: { defaultLocale, supportedLocales, direction, currency }
- technical: { pwa, analytics }

## brandIdentity
- core: { legalName, brandName, branchName, foundingDate, taxonomies }
- voice: { personality, writingGuidelines }
- designSystem: { colors: { semantic, contrastRatios }, typography: { headings, body } }

## contentRepository
- media: { heroVideo, logo: { vector, raster, favicon } }
- navigation: { header, footer }
- pages: Record<string, any>

## operationalData
- geo: { latitude, longitude, placeId, address }
- contact: { phone, email, social }
- schedules: { timezone, standard, exceptions }
- accessibility

## integrations
- Record<string, any> (analytics IDs, booking URLs, etc.)`
    const [projectName, setProjectName] = useState("Untitled Project")
    const [isEditingName, setIsEditingName] = useState(false)
    const [tempProjectName, setTempProjectName] = useState("Untitled Project")
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)
    const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
    const [savedTemplates, setSavedTemplates] = useState<any[]>([])
    const [projectHistory, setProjectHistory] = useState<any[]>([])
    const [currentRating, setCurrentRating] = useState<number>(0)
    const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false)
    const [isApproving, setIsApproving] = useState(false)

    // Prefetch cache for instant project loading
    const { getCached, prefetchNext, addToCache } = usePrefetchCache(5)

    // Initialize from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('webgen-saved-templates')
        if (saved) {
            try {
                setSavedTemplates(JSON.parse(saved))
            } catch (e) {
                console.error("Failed to parse saved templates", e)
            }
        }
    }, [])

    // Persist to localStorage
    useEffect(() => {
        localStorage.setItem('webgen-saved-templates', JSON.stringify(savedTemplates))
    }, [savedTemplates])

    // Load project history on mount
    useEffect(() => {
        const fetchHistory = async () => {
            const result = await getRecentProjects()
            if (result.success && result.data) {
                // Map DB projects to ProjectHistoryItem format
                const mapped = result.data.map((p: any) => ({
                    id: p.id,
                    name: p.business_data?.businessName || "Untitled",
                    industry: p.business_data?.industry || "Unknown",
                    date: p.created_at,
                    data: p.business_data,
                    generated_code: p.generated_code || null,
                    timestamp: p.created_at
                }))
                setProjectHistory(mapped)
            }
        }
        fetchHistory()
    }, [])

    // Subscribe to real-time project updates if it's currently generating
    useEffect(() => {
        if (!activeProjectId) return;

        const checkStatusLoop = async () => {
            const supabase = createClient();

            // Check initial status
            const { data } = await supabase.from('projects').select('status, generation_phase, generated_code').eq('id', activeProjectId).single();
            if (data?.status === 'generating' || data?.status === 'queued') {
                setIsStreaming(true);
                if (data.generation_phase) {
                    setStreamingPhase(data.generation_phase);
                    setStreamingLog(prev => [...prev, { type: 'phase', message: data.generation_phase!, timestamp: 0 }]);
                }
            }

            const channel = supabase.channel(`editor_project_${activeProjectId}`)
                .on(
                    'postgres_changes',
                    { event: 'UPDATE', schema: 'public', table: 'projects', filter: `id=eq.${activeProjectId}` },
                    async (payload) => {
                        if (payload.new) {
                            if (payload.new.generation_phase) {
                                setStreamingPhase(payload.new.generation_phase);
                                setStreamingLog(prev => [...prev, { type: 'phase', message: payload.new.generation_phase, timestamp: Date.now() }]);
                            }
                            if (payload.new.status === 'review' || payload.new.status === 'error') {
                                // Supabase Realtime drops large columns out of the payload. Fetch it directly to ensure we have it.
                                const { data: fresh } = await supabase.from('projects').select('generated_code').eq('id', activeProjectId).single();
                                if (fresh?.generated_code) {
                                    setGeneratedCode(fresh.generated_code);
                                }
                                setIsStreaming(false);
                            }
                        }
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        };

        const cleanupPromise = checkStatusLoop();

        return () => {
            cleanupPromise.then(cleanup => cleanup && cleanup());
        };
    }, [activeProjectId]);

    // Initialize markdown from default JSON context on mount
    const isInitialized = useRef(false)
    useEffect(() => {
        if (isInitialized.current) return
        isInitialized.current = true
        if (rawJsonContext) {
            setMarkdownContext(jsonToMarkdown(rawJsonContext))
        }
    }, [rawJsonContext])

    // Load project from ID if available
    useEffect(() => {
        if (projectId) {
            loadProject(projectId)
        }
    }, [projectId])

    /** Apply project data to editor state (shared by cache-hit and fresh-load paths) */
    const applyProjectData = useCallback((project: any) => {
        const businessData = project.business_data as any
        setProjectName(businessData?.businessName || businessData?.business_name || "Untitled Project")
        const jsonStr = JSON.stringify(businessData, null, 2)

        // If data has $$manifest or brandIdentity, it's enriched -> put in SJSON
        if (businessData?.$$manifest || businessData?.brandIdentity || businessData?.BrandIdentity) {
            setStructuredJsonContext(jsonStr)
            setRawJsonContext("{}")
            setInputTab("sjson")
        } else {
            setRawJsonContext(jsonStr)
            setStructuredJsonContext("")
            setInputTab("rjson")
        }
        setMarkdownContext(jsonToMarkdown(jsonStr))
        setGeneratedCode(project.generated_code || null)
        setProjectVersion(project.version || 1)
        setActiveProjectId(project.id)
        setIsJsonLoading(false)
    }, [])

    /** Trigger background prefetch of the next projects in the list */
    const triggerPrefetch = useCallback((currentId: string) => {
        let projectIds = projectHistory.map((p: any) => p.id)
        // Try to use the dashboard's filtered order for more accurate prefetching
        try {
            const stored = localStorage.getItem('webgen-project-order')
            if (stored) {
                const parsed = JSON.parse(stored)
                if (Array.isArray(parsed) && parsed.length > 0) {
                    projectIds = parsed
                }
            }
        } catch (e) { /* localStorage may be unavailable */ }
        prefetchNext(currentId, projectIds)
    }, [projectHistory, prefetchNext])

    const loadProject = async (id: string) => {
        console.log('[Editor] Loading project:', id)

        // Check prefetch cache first for instant loading
        const cached = getCached(id)
        if (cached) {
            console.log('[Editor] Loaded from prefetch cache:', id)
            applyProjectData(cached)
            triggerPrefetch(id)
            return
        }

        // Cache miss: fetch from database
        setIsJsonLoading(true)
        try {
            const result = await getProjectById(id)
            if (result.success && result.data) {
                console.log('[Editor] Project loaded successfully:', result.data.id)
                const project = result.data
                applyProjectData(project)
                // Add to cache for potential back-navigation
                addToCache({ ...(project as any), cachedAt: Date.now() })
                // Trigger prefetch for next projects
                triggerPrefetch(id)
            } else {
                console.error('[Editor] Failed to load project:', result.error)
                setError(result.error || "Failed to load project")
            }
        } catch (e) {
            console.error('[Editor] Load error:', e)
            setError("Critical error loading project")
        }
        setIsJsonLoading(false)
    }

    const handleTabChange = (value: string) => {
        const activeJson = structuredJsonContext || rawJsonContext
        if (value === "md") {
            // Derive markdown from SJSON if available, else RJSON
            setMarkdownContext(jsonToMarkdown(activeJson))
        } else if (value === "sjson" && inputTab === "md") {
            // Sync back from MD to SJSON
            setStructuredJsonContext(markdownToJson(markdownContext, activeJson))
        } else if (value === "rjson" && inputTab === "md") {
            // Sync back from MD to RJSON
            setRawJsonContext(markdownToJson(markdownContext, activeJson))
        }
        setInputTab(value)
    }

    const handleTestGeneration = async () => {
        setIsJsonLoading(true)
        setIsStreaming(true)
        setError(null)
        setGeneratedCode(null)
        setStreamingLog([])
        setStreamingPhase("Preparing...")
        setTokenCount(0)
        setElapsedTime(0)

        // Start elapsed timer
        const startTime = Date.now()
        elapsedTimerRef.current = setInterval(() => {
            setElapsedTime(Math.floor((Date.now() - startTime) / 1000))
        }, 1000)

        try {
            // Validate JSON — prefer SJSON if available, else RJSON
            let parsedData = null
            if (inputTab === "rjson" || inputTab === "sjson") {
                const jsonSrc = inputTab === "sjson" ? structuredJsonContext : rawJsonContext
                try {
                    parsedData = JSON.parse(jsonSrc)
                } catch (e) {
                    throw new Error("Invalid JSON in Project Context. Please fix it before generating.")
                }
            } else if (inputTab === "md") {
                // Markdown mode — no JSON parsing needed
            }

            const rules = localStorage.getItem("web-factory-rules") || ""

            const addLog = (type: StreamLogEntry['type'], message: string) => {
                setStreamingLog(prev => [...prev, {
                    type,
                    message,
                    timestamp: Date.now() - startTime
                }])
            }

            addLog('phase', 'Starting generation pipeline')
            addLog('info', `Model: ${model === 'default' ? 'Gemini 3.1 Pro (default)' : model}`)
            addLog('info', `Mode: ${inputTab.toUpperCase()}`)

            const response = await fetch('/api/generate/stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...(parsedData || {}),
                    markdownContext: inputTab === "md" ? markdownContext : undefined,
                    rules,
                    mode: (inputTab === "rjson" || inputTab === "sjson") ? "json" : inputTab,
                    model: model !== "default" ? model : undefined
                })
            })

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}))
                throw new Error(errData.error || `HTTP ${response.status}`)
            }

            const reader = response.body?.getReader()
            if (!reader) throw new Error('No response stream')

            const decoder = new TextDecoder()
            let buffer = ''
            let codeBuffer = ''
            let lastCodeUpdate = 0
            let chunkCount = 0

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                buffer += decoder.decode(value, { stream: true })

                // Parse SSE events from buffer
                const lines = buffer.split('\n')
                buffer = lines.pop() || '' // Keep incomplete line in buffer

                let currentEvent = ''
                for (const line of lines) {
                    if (line.startsWith('event: ')) {
                        currentEvent = line.slice(7)
                    } else if (line.startsWith('data: ') && currentEvent) {
                        try {
                            const data = JSON.parse(line.slice(6))

                            switch (currentEvent) {
                                case 'phase':
                                    setStreamingPhase(data.message)
                                    addLog('phase', data.message)
                                    break
                                case 'delta':
                                    codeBuffer += data.text
                                    setTokenCount(data.tokenCount)
                                    chunkCount++
                                    // Batch code updates every 20 chunks for performance
                                    const now = Date.now()
                                    if (now - lastCodeUpdate > 100 || chunkCount % 20 === 0) {
                                        setGeneratedCode(codeBuffer)
                                        lastCodeUpdate = now
                                    }
                                    // Log milestones
                                    if (data.tokenCount === 1 || chunkCount === 1) {
                                        addLog('info', 'First tokens received')
                                    }
                                    if (chunkCount % 200 === 0) {
                                        addLog('info', `${data.tokenCount.toLocaleString()} characters written...`)
                                    }
                                    break
                                case 'done':
                                    setGeneratedCode(data.code)
                                    setStreamingPhase('Complete')
                                    addLog('phase', `Generation complete — ${data.tokenCount?.toLocaleString()} chars total`)
                                    if (data.projectId) {
                                        addLog('info', `Saved to project ${data.projectId}`)
                                    }
                                    break
                                case 'error':
                                    throw new Error(data.message)
                            }
                        } catch (parseErr) {
                            if (currentEvent === 'error') throw parseErr
                            console.warn('[Stream] Parse error:', parseErr)
                        }
                        currentEvent = ''
                    }
                }
            }

            // Final flush
            if (codeBuffer && codeBuffer !== generatedCode) {
                setGeneratedCode(codeBuffer)
            }

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Stream failed')
            setStreamingPhase('')
        } finally {
            setIsJsonLoading(false)
            setIsStreaming(false)
            if (elapsedTimerRef.current) {
                clearInterval(elapsedTimerRef.current)
                elapsedTimerRef.current = null
            }
        }
    }

    const handleRevision = async () => {
        if (!revisionPrompt.trim()) return

        setIsRevisionLoading(true)
        setError(null)
        setRevisionStatus(null)

        try {
            const rules = localStorage.getItem("web-factory-rules") || ""

            const response = await fetch('/api/generate/revision', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: revisionPrompt,
                    currentCode: generatedCode,
                    currentJson: structuredJsonContext || rawJsonContext,
                    rules,
                    model: model !== "default" ? model : undefined
                })
            })

            const result = await response.json()

            if (result.success) {
                if (result.updatedJson) {
                    const newJson = JSON.stringify(result.updatedJson, null, 2)
                    setStructuredJsonContext(newJson)
                    setMarkdownContext(jsonToMarkdown(newJson))
                }
                setGeneratedCode(result.code)
                setRevisionPrompt("")

                if (result.fallbackUsed) {
                    setRevisionStatus({ message: "Full rewrite used", type: 'warn' })
                } else if (result.patchCount) {
                    setRevisionStatus({ message: `${result.patchCount} edit${result.patchCount !== 1 ? 's' : ''} applied`, type: 'info' })
                }

                // Auto-clear status after 4 seconds
                setTimeout(() => setRevisionStatus(null), 4000)
            } else {
                setError(result.error || 'Revision failed')
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Revision request failed')
        } finally {
            setIsRevisionLoading(false)
        }
    }

    const handleSaveName = () => {
        setProjectName(tempProjectName)
        setIsEditingName(false)
    }

    const handleCancelEditName = () => {
        setTempProjectName(projectName)
        setIsEditingName(false)
    }

    const handleDeleteProject = () => {
        setGeneratedCode(null)
        setRawJsonContext(JSON.stringify(testBusinessData, null, 2))
        setStructuredJsonContext("")
        setMarkdownContext(jsonToMarkdown(JSON.stringify(testBusinessData, null, 2)))
        setProjectName("Untitled Project")
        setTempProjectName("Untitled Project")
        setRevisionPrompt("")
        setError(null)
        setIsDeleteDialogOpen(false)
        setInputTab("rjson")
    }

    const handleSelectProject = (project: ProjectHistoryItem) => {
        setActiveProjectId(project.id)
        setProjectName(project.name)
        setTempProjectName(project.name)
        const jsonStr = JSON.stringify(project.data, null, 2)

        // If data has $$manifest or brandIdentity, it's enriched → put in SJSON
        if (project.data?.$$manifest || project.data?.brandIdentity || project.data?.BrandIdentity) {
            setStructuredJsonContext(jsonStr)
            setRawJsonContext("{}")
            setInputTab("sjson")
        } else {
            setRawJsonContext(jsonStr)
            setStructuredJsonContext("")
            setInputTab("rjson")
        }

        setMarkdownContext(jsonToMarkdown(jsonStr))
        setGeneratedCode(project.generated_code || null)
        setError(null)
        setCurrentRating(0)
    }

    const handleApprove = () => {
        if (!generatedCode) return
        setIsApproveDialogOpen(true)
    }

    const saveProjectLocally = async () => {
        if (!generatedCode) return

        // Parse business data from JSON context
        let businessData = null
        try {
            businessData = JSON.parse(structuredJsonContext || rawJsonContext)
        } catch (e) {
            console.error("Failed to parse business data for saving:", e)
        }

        // Wrap code in full HTML boilerplate for export
        const fullHtml = constructHtmlBoilerplate(generatedCode)

        const newTemplate = {
            id: Math.random().toString(36).substr(2, 9),
            name: projectName,
            code: fullHtml,
            rating: currentRating,
            timestamp: new Date().toISOString(),
            industry: businessData?.industry || 'General'
        }

        // Save locally to saved_html directory AND Supabase
        const saveResult = await saveTemplateLocally(projectName, fullHtml, businessData)

        if (saveResult.success) {
            setSavedTemplates(prev => [...prev, newTemplate])
        } else {
            setError(`Failed to save locally: ${saveResult.error}`)
        }
    }

    const handleOutreachApprove = async () => {
        if (!activeProjectId) return
        setIsApproving(true)
        try {
            await approveProject(activeProjectId)
            await saveProjectLocally()
        } catch (e) {
            console.error("Approval failed:", e)
            setError("Failed to approve project")
        } finally {
            setIsApproving(false)
        }
    }

    const [isTemplateSaveOpen, setIsTemplateSaveOpen] = useState(false)

    const handleRating = (ratingValue: number) => {
        const newRating = ratingValue === currentRating ? 0 : ratingValue
        setCurrentRating(newRating)
        if (newRating > 0 && generatedCode) {
            setIsTemplateSaveOpen(true)
        }
    }

    // Device Widths
    const deviceWidths = {
        desktop: '100%',
        tablet: '768px',
        mobile: '375px'
    }

    return (
        <div className="min-h-screen bg-[#F9FAFB] text-zinc-900 font-sans selection:bg-purple-100 selection:text-purple-900">
            {/* Header */}
            <header className="border-b border-zinc-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-[1800px] mx-auto px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-tr from-purple-600 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-200">
                            <Code2 className="h-5 w-5 text-white" />
                        </div>
                        <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-zinc-900 to-zinc-600 bg-clip-text text-transparent">
                            WebGen V1
                        </h1>
                    </div>

                    {/* Project Name Area - Moved to Main Header */}
                    <div className="flex-1 flex items-center justify-center gap-2 px-8 max-w-xl">
                        {isEditingName ? (
                            <div className="flex items-center gap-1 bg-zinc-100 rounded-lg px-2 py-1 border border-zinc-200">
                                <input
                                    autoFocus
                                    value={tempProjectName}
                                    onChange={(e) => setTempProjectName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSaveName()
                                        if (e.key === 'Escape') handleCancelEditName()
                                    }}
                                    className="bg-transparent border-none focus:ring-0 text-sm font-medium text-zinc-900 w-48"
                                />
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-500" onClick={handleSaveName}>
                                    <Check className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-500" onClick={handleCancelEditName}>
                                    <X className="h-3 w-3" />
                                </Button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 group max-w-full overflow-hidden">
                                <h2 className="text-sm font-medium text-zinc-900 tracking-tight truncate">
                                    {projectName}
                                </h2>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-900 rounded-lg flex-shrink-0">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="center" className="w-40">
                                        <DropdownMenuItem onClick={() => {
                                            setTempProjectName(projectName)
                                            setIsEditingName(true)
                                        }} className="gap-2 text-xs">
                                            <Pencil className="h-3.5 w-3.5" />
                                            Edit Name
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="gap-2 text-xs text-red-600 focus:text-red-700 focus:bg-red-50">
                                            <Trash2 className="h-3.5 w-3.5" />
                                            Delete Project
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <Link href="/dashboard">
                            <Button variant="ghost" size="sm" className="gap-2 text-zinc-600 hover:text-zinc-900">
                                <LayoutDashboard className="h-4 w-4" />
                                Dashboard
                            </Button>
                        </Link>
                        <ExportButton
                            projectId={activeProjectId || ''}
                            disabled={!activeProjectId || !generatedCode}
                        />
                        <SettingsDialog />
                    </div>
                </div>
            </header>

            <div className="flex h-[calc(100vh-57px)] overflow-hidden">
                {/* History Sidebar */}
                <HistorySidebar
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                    onSelectProject={handleSelectProject}
                    activeProjectId={activeProjectId}
                    savedTemplates={savedTemplates}
                    projectHistory={projectHistory}
                />

                {/* Left Panel - Full Height Context */}
                <div className="w-80 border-r border-zinc-200 flex flex-col bg-white relative flex-shrink-0">
                    <Tabs defaultValue="rjson" value={inputTab} onValueChange={handleTabChange} className="flex-1 flex flex-col">
                        <div className="px-4 py-2 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                    className="h-8 w-8 text-zinc-400 hover:text-zinc-900 rounded-lg lg:flex hidden"
                                >
                                    {isSidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
                                </Button>
                                <TabsList className="bg-transparent border-none p-0 h-auto gap-3">
                                    <TabsTrigger
                                        value="rjson"
                                        className="p-0 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 data-[state=active]:text-zinc-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                                    >
                                        RJSON
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="sjson"
                                        className="p-0 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 data-[state=active]:text-zinc-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                                    >
                                        SJSON
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="md"
                                        className="p-0 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 data-[state=active]:text-zinc-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                                    >
                                        MD
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="schema"
                                        className="p-0 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 data-[state=active]:text-zinc-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                                    >
                                        Schema
                                    </TabsTrigger>
                                </TabsList>
                            </div>
                            <Button
                                variant="default"
                                size="icon"
                                className="h-8 w-8 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center"
                                onClick={handleTestGeneration}
                                disabled={isJsonLoading}
                            >
                                {isJsonLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="h-4 w-4" />
                                )}
                            </Button>
                        </div>

                        {error && (
                            <div className="bg-red-50 border-b border-red-100 p-3 flex items-start gap-2">
                                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                    <p className="text-[11px] font-bold text-red-700 uppercase">Error</p>
                                    <p className="text-xs text-red-600 line-clamp-3">{error}</p>
                                </div>
                                <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
                                    <ChevronDown className="h-3 w-3 rotate-45" />
                                </button>
                            </div>
                        )}

                        <div className="flex-1 overflow-hidden relative">
                            <TabsContent value="rjson" className="absolute inset-0 m-0 p-0">
                                <div className="h-full overflow-auto">
                                    <Textarea
                                        value={rawJsonContext}
                                        onChange={(e) => setRawJsonContext(e.target.value)}
                                        className="w-full min-h-full border-none focus-visible:ring-0 rounded-none resize-none p-4 bg-transparent font-mono text-[13px] text-zinc-600"
                                        placeholder="Raw JSON from Google Places API..."
                                        style={{ height: 'auto', minHeight: '100%' }}
                                    />
                                </div>
                            </TabsContent>
                            <TabsContent value="sjson" className="absolute inset-0 m-0 p-0">
                                <div className="h-full overflow-auto">
                                    <Textarea
                                        value={structuredJsonContext}
                                        onChange={(e) => setStructuredJsonContext(e.target.value)}
                                        className="w-full min-h-full border-none focus-visible:ring-0 rounded-none resize-none p-4 bg-transparent font-mono text-[13px] text-zinc-600"
                                        placeholder="Structured/enriched JSON (auto-populated after enrichment)..."
                                        style={{ height: 'auto', minHeight: '100%' }}
                                    />
                                </div>
                            </TabsContent>
                            <TabsContent value="md" className="absolute inset-0 m-0 p-0">
                                <div className="h-full overflow-auto">
                                    <Textarea
                                        value={markdownContext}
                                        onChange={(e) => setMarkdownContext(e.target.value)}
                                        className="w-full min-h-full border-none focus-visible:ring-0 rounded-none resize-none p-4 bg-transparent font-sans text-[13px] text-zinc-600"
                                        placeholder="Markdown description derived from JSON..."
                                        style={{ height: 'auto', minHeight: '100%' }}
                                    />
                                </div>
                            </TabsContent>
                            <TabsContent value="schema" className="absolute inset-0 m-0 p-0">
                                <div className="h-full overflow-auto p-4">
                                    <pre className="text-[12px] text-zinc-500 font-mono whitespace-pre-wrap leading-relaxed">{schemaContent}</pre>
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>

                    {/* Revision Bar - Integrated in Sidebar Bottom */}
                    <div className="bg-white relative group/revision border-t border-zinc-100">
                        <div className="relative transition-all duration-300">
                            {/* Mode selector floating above */}
                            <div className="absolute -top-10 right-2 flex bg-zinc-100/80 backdrop-blur-sm p-0.5 rounded-sm border border-zinc-200 shadow-sm opacity-0 group-hover/revision:opacity-100 transition-opacity duration-300">
                                <button className="px-2 py-0.5 rounded-sm text-[9px] font-bold text-zinc-900 bg-white shadow-sm border border-zinc-200">Default</button>
                                <button className="px-2 py-0.5 rounded-sm text-[9px] font-bold text-zinc-400">Edits</button>
                            </div>

                            <div className="bg-white/95 backdrop-blur-2xl border-none rounded-none shadow-lg transition-all p-2 flex flex-col gap-2">
                                <div className="flex items-center gap-2 px-1">
                                    <input
                                        type="text"
                                        placeholder="Ask for revisions..."
                                        value={revisionPrompt}
                                        onChange={(e) => setRevisionPrompt(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleRevision()}
                                        className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-[13px] text-zinc-700 placeholder:text-zinc-400 py-1"
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-none hover:bg-transparent text-zinc-900 transition-all hover:scale-110 active:scale-90 flex-shrink-0 relative z-30 flex items-center justify-center pt-0 shadow-none border-none"
                                        onClick={handleRevision}
                                        disabled={isRevisionLoading}
                                    >
                                        {isRevisionLoading ? <Loader2 className="h-4 w-4 animate-spin text-zinc-900" /> : <Send className="h-4 w-4" style={{ transform: 'rotate(15deg) translateY(-1px) translateX(2px)' }} />}
                                    </Button>
                                </div>

                                <div className="flex items-center justify-between px-2">
                                    {revisionStatus ? (
                                        <span className={`text-[10px] font-medium transition-opacity duration-300 ${revisionStatus.type === 'warn' ? 'text-amber-500' : 'text-emerald-500'}`}>
                                            {revisionStatus.message}
                                        </span>
                                    ) : <span />}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-none border border-transparent hover:border-zinc-200 transition-all cursor-pointer group/engine">
                                                <span className="text-[10px] font-bold text-zinc-400 group-hover/engine:text-zinc-900 uppercase tracking-tighter">
                                                    {model === 'default' ? 'Default' :
                                                        model === 'gemini-3-flash-preview' ? 'Flash 3.0' :
                                                            model}
                                                </span>
                                                <ChevronDown className="h-3 w-3 text-zinc-300" />
                                            </div>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-32">
                                            <DropdownMenuItem onClick={() => setModel("default")} className="text-xs font-medium">
                                                Default
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setModel("gemini-3-flash-preview")} className="text-xs font-medium">
                                                Gemini 3.0 Flash
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setModel("gemini-3.1-pro-preview")} className="text-xs font-medium">
                                                Gemini 3.1 Pro
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel - Large Preview */}
                <div className="flex-1 flex flex-col bg-[#F3F4F6] relative">
                    {/* Preview Header */}
                    <div className="flex items-center justify-between px-6 py-2 bg-white border-b border-zinc-200 z-10">
                        <div className="flex items-center gap-4">
                            <div className="flex bg-zinc-100 p-1 rounded-xl border border-zinc-200/50">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setViewMode('preview')}
                                    className={`h-8 text-xs px-4 rounded-lg transition-all ${viewMode === 'preview' ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200' : 'text-zinc-500 hover:text-zinc-700'}`}
                                >
                                    <Eye className="h-3.5 w-3.5 mr-2" />
                                    Preview
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setViewMode('code')}
                                    className={`h-8 text-xs px-4 rounded-lg transition-all ${viewMode === 'code' ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200' : 'text-zinc-500 hover:text-zinc-700'}`}
                                >
                                    <Code2 className="h-3.5 w-3.5 mr-2" />
                                    Code
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setViewMode('diff')}
                                    className={`h-8 text-xs px-4 rounded-lg transition-all ${viewMode === 'diff' ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200' : 'text-zinc-500 hover:text-zinc-700'}`}
                                >
                                    <GitCompare className="h-3.5 w-3.5 mr-2" />
                                    Diff
                                </Button>
                            </div>

                            {viewMode === 'preview' && (
                                <div className="flex bg-zinc-100 p-1 rounded-xl border border-zinc-200/50">
                                    <div className="relative group/device">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setDeviceMode('desktop')}
                                            className={`h-8 w-10 p-0 rounded-lg transition-all ${deviceMode === 'desktop' ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200' : 'text-zinc-500'}`}
                                        >
                                            <Monitor className="h-4 w-4" />
                                        </Button>
                                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[9px] px-2 py-1 rounded-sm opacity-0 group-hover/device:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                                            Desktop - 100%
                                        </div>
                                    </div>

                                    <div className="relative group/device">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setDeviceMode('tablet')}
                                            className={`h-8 w-10 p-0 rounded-lg transition-all ${deviceMode === 'tablet' ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200' : 'text-zinc-500'}`}
                                        >
                                            <Tablet className="h-4 w-4" />
                                        </Button>
                                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[9px] px-2 py-1 rounded-sm opacity-0 group-hover/device:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                                            Tablet - 768px
                                        </div>
                                    </div>

                                    <div className="relative group/device">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setDeviceMode('mobile')}
                                            className={`h-8 w-10 p-0 rounded-lg transition-all ${deviceMode === 'mobile' ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200' : 'text-zinc-500'}`}
                                        >
                                            <Smartphone className="h-4 w-4" />
                                        </Button>
                                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[9px] px-2 py-1 rounded-sm opacity-0 group-hover/device:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                                            Mobile - 375px
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2 pr-6 border-r border-zinc-200">
                                <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-[0.2em]">
                                    Engine: {model === 'default' ? 'Default' : model}
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Button
                                    onClick={handleApprove}
                                    disabled={!generatedCode}
                                    size="sm"
                                    className="h-8 text-[10px] uppercase tracking-wider gap-2 px-3 transition-all bg-green-600 hover:bg-green-700 text-white font-bold border-none shadow-md shadow-green-100"
                                >
                                    <Check className="h-3 w-3" />
                                    Approve
                                </Button>
                                <div className="h-5 w-px bg-zinc-200" />
                                <div className="flex items-center gap-1" title="Rate & save as template">
                                    {[1, 2, 3].map((star) => {
                                        const isFilled = currentRating >= star
                                        return (
                                            <button
                                                key={star}
                                                onClick={() => handleRating(star)}
                                                className={`transition-all hover:scale-110 active:scale-95 ${isFilled ? "text-yellow-400" : "text-zinc-200 hover:text-zinc-300"}`}
                                                aria-label={`Rate ${star} star${star > 1 ? "s" : ""} and save as template`}
                                                tabIndex={0}
                                            >
                                                <Star className={`h-4 w-4 ${isFilled ? "fill-current" : ""}`} />
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Preview Content */}
                    <div className={`flex-1 overflow-auto relative ${viewMode === 'diff' ? '' : 'p-8'} flex justify-center bg-[#F3F4F6]`}>
                        {viewMode === 'preview' ? (
                            <div
                                className="h-full bg-white shadow-2xl transition-all duration-300 overflow-hidden relative"
                                style={{ width: deviceWidths[deviceMode as keyof typeof deviceWidths] }}
                            >
                                <LivePreview
                                    code={generatedCode}
                                    isLoading={isJsonLoading || isRevisionLoading}
                                    isStreaming={isStreaming}
                                    streamingLog={streamingLog}
                                    streamingPhase={streamingPhase}
                                    tokenCount={tokenCount}
                                    elapsedTime={elapsedTime}
                                />
                            </div>
                        ) : viewMode === 'diff' ? (
                            activeProjectId ? (
                                <div className="w-full h-full bg-white">
                                    <DiffView
                                        projectId={activeProjectId}
                                        currentCode={generatedCode}
                                        currentVersion={projectVersion}
                                    />
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-full text-zinc-400 text-sm">
                                    Load a project to view revision diffs
                                </div>
                            )
                        ) : (
                            <div className="w-full h-full overflow-auto bg-[#18181B] selection:bg-purple-500/30">
                                {generatedCode ? (
                                    <pre className="text-[13px] p-8 text-zinc-300 font-mono leading-relaxed whitespace-pre-wrap">
                                        {generatedCode}
                                        {isStreaming && (
                                            <span className="inline-block w-2 h-4 bg-green-400 animate-pulse ml-0.5" />
                                        )}
                                    </pre>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center">
                                            <Code2 className="h-6 w-6 text-zinc-700" />
                                        </div>
                                        <p className="text-sm font-medium italic">Execute generation to see code</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Delete Project</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <span className="font-semibold text-zinc-900">"{projectName}"</span>?
                            This action will reset all context and code. This cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteProject}>
                            Delete Project
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Outreach Modal */}
            {activeProjectId && (
                <OutreachModal
                    open={isApproveDialogOpen}
                    onOpenChange={setIsApproveDialogOpen}
                    project={{
                        id: activeProjectId,
                        business_data: (() => {
                            try {
                                return JSON.parse(structuredJsonContext || rawJsonContext)
                            } catch {
                                return {}
                            }
                        })()
                    }}
                    onApprove={handleOutreachApprove}
                />
            )}

            {/* Template Save Sheet */}
            {generatedCode && (
                <TemplateSaveSheet
                    open={isTemplateSaveOpen}
                    onOpenChange={setIsTemplateSaveOpen}
                    rating={currentRating}
                    projectName={projectName}
                    generatedCode={generatedCode}
                    businessData={(() => {
                        try {
                            return JSON.parse(structuredJsonContext || rawJsonContext)
                        } catch {
                            return {}
                        }
                    })()}
                    sourceProjectId={activeProjectId}
                />
            )}
        </div >
    )
}
