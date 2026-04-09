"use client"

import { useState, useEffect, useRef, useCallback, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, LayoutDashboard, Code2, Eye, Send, ChevronDown, Monitor, Tablet, Smartphone, AlertCircle, FileText, MoreHorizontal, Pencil, Trash2, Check, X, PanelLeftClose, PanelLeftOpen, Star, GitCompare, LayoutGrid, ExternalLink, Paperclip, ImageIcon, Rocket } from "lucide-react"
import { LivePreview, StreamLogEntry } from "@/components/workbench/live-preview"
import { useSearchParams } from "next/navigation"
import { getProjectById, getRecentProjects, getBatches, approveProject } from "@/app/(admin)/dashboard/actions"
import { createClient } from "@/lib/supabase/client"
import { uploadProjectAssets } from "@/lib/supabase/storage"
import dynamic from 'next/dynamic'
const MonacoEditor = dynamic(() => import('@monaco-editor/react').then(m => m.default), { ssr: false })
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
import Image from "next/image"
import Link from "next/link"
import { saveTemplateLocally } from "@/lib/actions/save-template"
import { constructHtmlBoilerplate } from "@/lib/utils/html-boilerplate"
import { TemplateSaveSheet } from "@/components/editor/template-save-sheet"
import { ExportButton } from "@/components/editor/export-button"
import { DiffView } from "@/components/editor/diff-view"
import { EditModeOverlay } from "@/components/editor/edit-mode-overlay"
import { usePrefetchCache } from "@/hooks/use-prefetch-cache"
import { saveEditModeChanges } from "@/app/(admin)/dashboard/actions"
import { getProjectClaimAndRequests, updateRequestStatus, redeployProject } from "@/app/(admin)/dashboard/clients/actions"
import type { ClientRequestItem } from "@/app/(admin)/dashboard/clients/actions"
import { CustomerRequestsTab } from "@/components/admin/customer-requests-tab"
import { RedeployDialog } from "@/components/admin/redeploy-dialog"
import { toast } from "sonner"

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
    const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string; timestamp: number; images?: string[] }>>([])
    const chatEndRef = useRef<HTMLDivElement>(null)
    const [pendingImages, setPendingImages] = useState<{ file: File; preview: string }[]>([])
    const [isDragOver, setIsDragOver] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [generatedCode, setGeneratedCode] = useState<string | null>(null)
    const [savedCode, setSavedCode] = useState<string | null>(null) // last saved/loaded code for undo
    const [codeDirty, setCodeDirty] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [viewMode, setViewMode] = useState<'preview' | 'code' | 'diff' | 'rjson' | 'sjson' | 'md' | 'schema'>('preview')
    const [projectVersion, setProjectVersion] = useState<number>(1)
    const [deviceMode, setDeviceMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
    const [matrixView, setMatrixView] = useState(false)
    const [showEditMode, setShowEditMode] = useState(false)
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
    const [batches, setBatches] = useState<Array<{ id: string; label: string; assignedTo?: string }>>([])
    const [currentRating, setCurrentRating] = useState<number>(0)
    const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false)
    const [isApproving, setIsApproving] = useState(false)

    // Purchase/fulfillment state
    const [isPurchasedProject, setIsPurchasedProject] = useState(false)
    const [purchaseInfo, setPurchaseInfo] = useState<{ claimId: string; clientName: string; businessName: string } | null>(null)
    const [clientRequests, setClientRequests] = useState<ClientRequestItem[]>([])
    const [isRedeployDialogOpen, setIsRedeployDialogOpen] = useState(false)
    const [isRedeploying, setIsRedeploying] = useState(false)
    const [leftPanelTab, setLeftPanelTab] = useState<'chat' | 'requests'>('chat')

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

    // Persist chat messages to localStorage (per project)
    useEffect(() => {
        if (activeProjectId && chatMessages.length > 0) {
            const capped = chatMessages.slice(-50) // cap at 50 messages
            localStorage.setItem(`webgen-chat-${activeProjectId}`, JSON.stringify(capped))
        }
    }, [chatMessages, activeProjectId])

    // Load project history and batches on mount
    useEffect(() => {
        const fetchHistory = async () => {
            const result = await getRecentProjects()
            if (result.success && result.data) {
                const mapped = result.data.map((p: any) => ({
                    id: p.id,
                    name: p.business_data?.businessName || "Untitled",
                    industry: p.business_data?.industry || "Unknown",
                    date: p.created_at,
                    data: p.business_data,
                    generated_code: p.generated_code || null,
                    timestamp: p.created_at,
                    batch_id: p.batch_id || null,
                    status: p.status || 'review',
                }))
                setProjectHistory(mapped)
            }
        }
        const fetchBatches = async () => {
            const result = await getBatches()
            if (result.success && result.data) {
                setBatches(result.data.map((b: any) => ({
                    id: b.id,
                    label: b.source || b.id.slice(0, 8),
                    assignedTo: b.assigned_to || undefined,
                })))
            }
        }
        fetchHistory()
        fetchBatches()
    }, [])

    // Subscribe to real-time project updates if it's currently generating
    useEffect(() => {
        if (!activeProjectId) return;

        const supabase = createClient();

        // Check initial status (fire-and-forget, doesn't block subscription)
        supabase.from('projects').select('status, generation_phase, generated_code').eq('id', activeProjectId).single().then(({ data }) => {
            if (data?.status === 'generating' || data?.status === 'queued') {
                setIsStreaming(true);
                if (data.generation_phase) {
                    setStreamingPhase(data.generation_phase);
                    setStreamingLog(prev => [...prev, { type: 'phase', message: data.generation_phase!, timestamp: 0 }]);
                }
            }
        });

        // Subscribe synchronously so cleanup always has a channel reference
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
                            const { data: fresh } = await supabase.from('projects').select('generated_code').eq('id', activeProjectId).single();
                            if (fresh?.generated_code) {
                                setGeneratedCode(fresh.generated_code);
                                setSavedCode(fresh.generated_code);
                                setCodeDirty(false);
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
        setSavedCode(project.generated_code || null)
        setCodeDirty(false)
        setProjectVersion(project.version || 1)
        setActiveProjectId(project.id)
        setIsJsonLoading(false)

        // Load persisted chat for this project
        try {
            const saved = localStorage.getItem(`webgen-chat-${project.id}`)
            setChatMessages(saved ? JSON.parse(saved) : [])
        } catch {
            setChatMessages([])
        }
    }, [])

    /** Check if a project is a purchased project and load claim/request data */
    const checkPurchaseStatus = useCallback(async (projectIdToCheck: string) => {
        try {
            const claimResult = await getProjectClaimAndRequests(projectIdToCheck)
            if (claimResult.isPurchased) {
                setIsPurchasedProject(true)
                setPurchaseInfo({
                    claimId: claimResult.claimId!,
                    clientName: claimResult.clientName ?? '',
                    businessName: claimResult.businessName ?? 'Unknown Business',
                })
                setClientRequests(claimResult.requests ?? [])
                setLeftPanelTab('requests')
            } else {
                setIsPurchasedProject(false)
                setPurchaseInfo(null)
                setClientRequests([])
                setLeftPanelTab('chat')
            }
        } catch (e) {
            console.error('[Editor] Failed to check purchase status:', e)
            setIsPurchasedProject(false)
            setPurchaseInfo(null)
            setClientRequests([])
            setLeftPanelTab('chat')
        }
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
            checkPurchaseStatus(id)
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
                checkPurchaseStatus(id)
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

            // Final flush — use functional update to avoid stale closure
            if (codeBuffer) {
                setGeneratedCode(prev => codeBuffer !== prev ? codeBuffer : prev)
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

    const addImages = useCallback((files: FileList | File[]) => {
        const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'))
        const newImages = imageFiles.map(file => ({
            file,
            preview: URL.createObjectURL(file),
        }))
        setPendingImages(prev => [...prev, ...newImages].slice(0, 5)) // max 5 images
    }, [])

    const removeImage = useCallback((index: number) => {
        setPendingImages(prev => {
            URL.revokeObjectURL(prev[index].preview)
            return prev.filter((_, i) => i !== index)
        })
    }, [])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(false)
        if (e.dataTransfer.files.length > 0) {
            addImages(e.dataTransfer.files)
        }
    }, [addImages])

    const handleRevision = async () => {
        if (!revisionPrompt.trim() && pendingImages.length === 0) return

        const userMessage = revisionPrompt.trim()
        const imagePreviews = pendingImages.map(img => img.preview)
        setChatMessages(prev => [...prev, {
            role: 'user',
            content: userMessage || '(attached images)',
            timestamp: Date.now(),
            images: imagePreviews.length > 0 ? imagePreviews : undefined,
        }])
        setRevisionPrompt("")
        setIsRevisionLoading(true)
        setError(null)
        setRevisionStatus(null)

        // Scroll to bottom
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)

        try {
            // Upload pending images first
            let imageUrls: string[] = []
            if (pendingImages.length > 0 && activeProjectId) {
                const { urls, errors } = await uploadProjectAssets(
                    activeProjectId,
                    pendingImages.map(img => img.file)
                )
                imageUrls = urls
                if (errors.length > 0) {
                    console.error('[Chat] Image upload errors:', errors)
                }
                pendingImages.forEach(img => URL.revokeObjectURL(img.preview))
                setPendingImages([])
            }

            const rules = localStorage.getItem("web-factory-rules") || ""

            const response = await fetch('/api/generate/revision', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: userMessage,
                    currentCode: generatedCode,
                    currentJson: structuredJsonContext || rawJsonContext,
                    rules,
                    model: model !== "default" ? model : undefined,
                    projectId: activeProjectId,
                    imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
                })
            })

            const result = await response.json()

            if (result.success) {
                const data = result.data
                if (data.updatedJson) {
                    const newJson = JSON.stringify(data.updatedJson, null, 2)
                    setStructuredJsonContext(newJson)
                    setMarkdownContext(jsonToMarkdown(newJson))
                }
                setGeneratedCode(data.code)
                setProjectVersion(prev => prev + 1)

                // Build conversational reply from AI reasoning
                let replyText = data.reasoning || ''
                if (data.fallbackUsed) {
                    replyText += replyText ? '\n\n(Full rewrite applied)' : 'Applied changes via full rewrite.'
                } else if (data.patchCount) {
                    const label = `${data.patchCount} edit${data.patchCount !== 1 ? 's' : ''}`
                    replyText += replyText ? `\n\n(${label} applied)` : `Applied ${label}.`
                }
                if (!replyText) replyText = 'Changes applied.'

                setChatMessages(prev => [...prev, { role: 'assistant', content: replyText, timestamp: Date.now() }])
            } else {
                setChatMessages(prev => [...prev, { role: 'assistant', content: `I couldn't apply that change: ${result.error || 'Something went wrong.'}`, timestamp: Date.now() }])
            }
        } catch (err) {
            const errMsg = err instanceof Error ? err.message : 'Revision request failed'
            setChatMessages(prev => [...prev, { role: 'assistant', content: `Something went wrong while applying your changes. ${errMsg}`, timestamp: Date.now() }])
        } finally {
            setIsRevisionLoading(false)
            setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
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
        if (activeProjectId) {
            localStorage.removeItem(`webgen-chat-${activeProjectId}`)
        }
        setGeneratedCode(null)
        setRawJsonContext(JSON.stringify(testBusinessData, null, 2))
        setStructuredJsonContext("")
        setMarkdownContext(jsonToMarkdown(JSON.stringify(testBusinessData, null, 2)))
        setProjectName("Untitled Project")
        setTempProjectName("Untitled Project")
        setRevisionPrompt("")
        setChatMessages([])
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
        setSavedCode(project.generated_code || null)
        setCodeDirty(false)
        setError(null)
        setCurrentRating(0)

        // Load persisted chat for this project
        try {
            const saved = localStorage.getItem(`webgen-chat-${project.id}`)
            setChatMessages(saved ? JSON.parse(saved) : [])
        } catch {
            setChatMessages([])
        }

        // Check if this is a purchased project
        checkPurchaseStatus(project.id)
    }

    const handleApprove = () => {
        if (!generatedCode) return
        setIsApproveDialogOpen(true)
    }

    const handleRequestUpdate = async (requestId: string, newStatus: 'in_progress' | 'completed', adminNotes?: string) => {
        // Optimistic update
        setClientRequests(prev => prev.map(r =>
            r.id === requestId
                ? { ...r, status: newStatus, adminNotes: adminNotes || r.adminNotes, updatedAt: new Date().toISOString() }
                : r
        ))
        const result = await updateRequestStatus(requestId, newStatus, adminNotes)
        if (!result.success) {
            // Revert on error -- refetch
            if (activeProjectId) {
                const fresh = await getProjectClaimAndRequests(activeProjectId)
                if (fresh.isPurchased) setClientRequests(fresh.requests ?? [])
            }
            toast.error('Failed to update request status')
        }
    }

    const handleRedeploy = async () => {
        if (!activeProjectId || !generatedCode) return
        setIsRedeploying(true)
        try {
            const result = await redeployProject(activeProjectId, generatedCode)
            if (result.success) {
                toast.success('Site deployed successfully')
                setIsRedeployDialogOpen(false)
                // Refresh requests to show auto-completed status
                const fresh = await getProjectClaimAndRequests(activeProjectId)
                if (fresh.isPurchased) setClientRequests(fresh.requests ?? [])
            } else {
                toast.error(result.error || 'Redeploy failed')
            }
        } catch (e) {
            console.error('[Editor] Redeploy failed:', e)
            toast.error('Redeploy failed')
        } finally {
            setIsRedeploying(false)
        }
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

    const handleSendPreview = async () => {
        if (!activeProjectId) return
        setIsApproving(true)
        try {
            const previewUrl = `/preview/${activeProjectId}`
            const recipientEmail = 'lifeofpixels0707@gmail.com'
            const res = await fetch('/api/admin/send-preview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId: activeProjectId, recipientEmail, previewUrl }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Send failed')
            toast.success(`Preview sent to ${recipientEmail}`)
            setIsApproveDialogOpen(false)
        } catch (e) {
            console.error("Send preview failed:", e)
            toast.error(e instanceof Error ? e.message : "Failed to send preview email")
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
        <div className="fixed inset-0 z-50 min-h-screen bg-[#F9FAFB] text-zinc-900 font-sans selection:bg-purple-100 selection:text-purple-900">
            {/* Header */}
            <header className="border-b border-zinc-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-[1800px] mx-auto px-6 py-3 flex items-center justify-between">
                    <Link href="/dashboard" className="flex items-center gap-2 group">
                        <Image
                            src="/flogen-logo-dark.svg"
                            alt="Flogen"
                            width={110}
                            height={20}
                            className="opacity-90 group-hover:opacity-100 transition-opacity"
                        />
                    </Link>

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
                    projectHistory={projectHistory}
                    batches={batches}
                />

                {/* Left Panel - Chat */}
                <div className="w-80 border-r border-gray-200 flex flex-col bg-white relative flex-shrink-0">
                    {/* Chat Header */}
                    <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className="h-8 w-8 text-gray-400 hover:text-gray-900 rounded-lg lg:flex hidden"
                            >
                                {isSidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
                            </Button>
                            {isPurchasedProject ? (
                                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                                    <button
                                        onClick={() => setLeftPanelTab('chat')}
                                        className={`px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider transition-all ${
                                            leftPanelTab === 'chat'
                                                ? 'bg-white text-gray-700 shadow-sm'
                                                : 'text-gray-400 hover:text-gray-600'
                                        }`}
                                    >
                                        Chat
                                    </button>
                                    <button
                                        onClick={() => setLeftPanelTab('requests')}
                                        className={`px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider transition-all ${
                                            leftPanelTab === 'requests'
                                                ? 'bg-white text-gray-700 shadow-sm'
                                                : 'text-gray-400 hover:text-gray-600'
                                        }`}
                                    >
                                        Requests
                                        {clientRequests.filter(r => r.status !== 'completed').length > 0 && (
                                            <span className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full bg-blue-500 text-white text-[9px] font-bold">
                                                {clientRequests.filter(r => r.status !== 'completed').length}
                                            </span>
                                        )}
                                    </button>
                                </div>
                            ) : (
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Chat</span>
                            )}
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold text-gray-400 hover:text-gray-900 hover:bg-gray-100 uppercase tracking-tighter transition-colors">
                                    {model === 'default' ? 'Default' :
                                        model === 'gemini-3-flash-preview' ? 'Flash 3.0' :
                                            model}
                                    <ChevronDown className="h-3 w-3" />
                                </button>
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

                    {error && (
                        <div className="bg-red-50 border-b border-red-100 p-3 flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="text-[11px] font-bold text-red-700 uppercase">Error</p>
                                <p className="text-xs text-red-600 line-clamp-3">{error}</p>
                            </div>
                            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    )}

                    {/* Panel Content: Chat or Requests */}
                    {leftPanelTab === 'requests' && isPurchasedProject ? (
                        <CustomerRequestsTab
                            requests={clientRequests}
                            onRequestUpdate={handleRequestUpdate}
                        />
                    ) : (
                    <>
                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {chatMessages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                                    <Send className="h-4 w-4 text-gray-300" />
                                </div>
                                <p className="text-xs text-center">Ask for revisions to the generated website</p>
                            </div>
                        ) : (
                            chatMessages.map((msg, i) => (
                                <div
                                    key={i}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[85%] px-3 py-2 rounded-xl text-[13px] leading-relaxed whitespace-pre-line ${
                                            msg.role === 'user'
                                                ? 'bg-purple-600 text-white rounded-br-sm'
                                                : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                                        }`}
                                    >
                                        {msg.images && msg.images.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mb-1.5">
                                                {msg.images.map((src, idx) => (
                                                    <img key={idx} src={src} alt="" className="h-16 w-16 object-cover rounded-lg" />
                                                ))}
                                            </div>
                                        )}
                                        {msg.content}
                                    </div>
                                </div>
                            ))
                        )}
                        {isRevisionLoading && (
                            <div className="flex justify-start">
                                <div className="bg-gray-100 text-gray-500 px-3 py-2 rounded-xl rounded-bl-sm text-[13px] flex items-center gap-2">
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    Applying changes...
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Chat Input */}
                    <div
                        className={`border-t border-gray-100 p-3 transition-colors ${isDragOver ? 'bg-purple-50' : ''}`}
                        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
                        onDragLeave={() => setIsDragOver(false)}
                        onDrop={handleDrop}
                    >
                        {/* Pending Images */}
                        {pendingImages.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-2">
                                {pendingImages.map((img, idx) => (
                                    <div key={idx} className="relative group">
                                        <img src={img.preview} alt="" className="h-14 w-14 object-cover rounded-lg border border-gray-200" />
                                        <button
                                            onClick={() => removeImage(idx)}
                                            className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-gray-800 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="h-2.5 w-2.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {isDragOver ? (
                            <div className="flex items-center justify-center py-4 border-2 border-dashed border-purple-300 rounded-xl text-purple-500 text-xs font-medium">
                                <ImageIcon className="h-4 w-4 mr-2" />
                                Drop images here
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-2 py-1.5 focus-within:border-purple-300 focus-within:ring-1 focus-within:ring-purple-100 transition-all">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                    onChange={(e) => { if (e.target.files) addImages(e.target.files); e.target.value = '' }}
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="h-7 w-7 flex items-center justify-center text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all flex-shrink-0"
                                    title="Attach images"
                                >
                                    <Paperclip className="h-3.5 w-3.5" />
                                </button>
                                <input
                                    type="text"
                                    placeholder="Ask for revisions..."
                                    value={revisionPrompt}
                                    onChange={(e) => setRevisionPrompt(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleRevision()}
                                    className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-[13px] text-gray-700 placeholder:text-gray-400 py-1"
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all flex-shrink-0"
                                    onClick={handleRevision}
                                    disabled={isRevisionLoading || (!revisionPrompt.trim() && pendingImages.length === 0)}
                                >
                                    {isRevisionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                                </Button>
                            </div>
                        )}
                    </div>
                    </>
                    )}
                </div>

                {/* Right Panel - Large Preview */}
                <div className="flex-1 flex flex-col bg-[#F3F4F6] relative">
                    {/* Preview Header */}
                    <div className="flex items-center justify-between px-6 py-2 bg-white border-b border-gray-200 z-10">
                        <div className="flex items-center gap-4">
                            <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200/50">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setViewMode('preview')}
                                    className={`h-8 text-xs px-4 rounded-lg transition-all ${viewMode === 'preview' ? 'bg-white text-gray-900 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    <Eye className="h-3.5 w-3.5 mr-2" />
                                    Preview
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setViewMode('code')}
                                    className={`h-8 text-xs px-4 rounded-lg transition-all ${viewMode === 'code' ? 'bg-white text-gray-900 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    <Code2 className="h-3.5 w-3.5 mr-2" />
                                    Code
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setViewMode('diff')}
                                    className={`h-8 text-xs px-4 rounded-lg transition-all ${viewMode === 'diff' ? 'bg-white text-gray-900 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    <GitCompare className="h-3.5 w-3.5 mr-2" />
                                    Diff
                                </Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className={`h-8 text-xs px-3 rounded-lg transition-all ${['rjson', 'sjson', 'md', 'schema'].includes(viewMode) ? 'bg-white text-gray-900 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                            <FileText className="h-3.5 w-3.5 mr-2" />
                                            {viewMode === 'rjson' ? 'RJSON' : viewMode === 'sjson' ? 'SJSON' : viewMode === 'md' ? 'MD' : viewMode === 'schema' ? 'Schema' : 'Data'}
                                            <ChevronDown className="h-3 w-3 ml-1" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-36">
                                        <DropdownMenuItem onClick={() => setViewMode('rjson')} className={`text-xs font-medium ${viewMode === 'rjson' ? 'bg-purple-50 text-purple-700' : ''}`}>
                                            RJSON — Raw
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setViewMode('sjson')} className={`text-xs font-medium ${viewMode === 'sjson' ? 'bg-purple-50 text-purple-700' : ''}`}>
                                            SJSON — Structured
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setViewMode('md')} className={`text-xs font-medium ${viewMode === 'md' ? 'bg-purple-50 text-purple-700' : ''}`}>
                                            MD — Markdown
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setViewMode('schema')} className={`text-xs font-medium ${viewMode === 'schema' ? 'bg-purple-50 text-purple-700' : ''}`}>
                                            Schema
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
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

                            {/* Matrix View + Open in New Tab */}
                            {viewMode === 'preview' && (
                                <div className="flex items-center gap-1 ml-2">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setMatrixView(v => !v)}
                                        className={`h-8 w-8 p-0 rounded-lg transition-all ${matrixView ? 'bg-purple-100 text-purple-700' : 'text-gray-500 hover:text-gray-700'}`}
                                        title="Matrix View"
                                    >
                                        <LayoutGrid className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => {
                                            const iframe = document.querySelector('iframe[title="Preview"]') as HTMLIFrameElement
                                            const srcDoc = iframe?.srcdoc || iframe?.getAttribute('srcdoc')
                                            if (srcDoc) {
                                                const newWindow = window.open('', '_blank')
                                                if (newWindow) {
                                                    newWindow.document.write(srcDoc)
                                                    newWindow.document.close()
                                                }
                                            }
                                        }}
                                        disabled={!generatedCode}
                                        className="h-8 w-8 p-0 rounded-lg text-gray-500 hover:text-gray-700 transition-all"
                                        title="Open in New Tab"
                                    >
                                        <ExternalLink className="h-3.5 w-3.5" />
                                    </Button>
                                    <div className="h-5 w-px bg-gray-200 mx-1" />
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setShowEditMode(true)}
                                        disabled={!generatedCode}
                                        className="h-8 px-3 rounded-lg text-xs font-medium gap-1.5 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 transition-all"
                                        title="Edit text and images directly"
                                    >
                                        <Pencil className="h-3.5 w-3.5" />
                                        Edit
                                    </Button>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2 pr-6 border-r border-gray-200">
                                <span className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em]">
                                    Engine: {model === 'default' ? 'Default' : model}
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                {isPurchasedProject ? (
                                    <Button
                                        onClick={() => setIsRedeployDialogOpen(true)}
                                        disabled={!generatedCode}
                                        size="sm"
                                        className="h-8 text-[10px] uppercase tracking-wider gap-2 px-3 transition-all bg-blue-600 hover:bg-blue-700 text-white font-bold border-none shadow-md shadow-blue-100"
                                    >
                                        <Rocket className="h-3 w-3" />
                                        Redeploy
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={handleApprove}
                                        disabled={!generatedCode}
                                        size="sm"
                                        className="h-8 text-[10px] uppercase tracking-wider gap-2 px-3 transition-all bg-green-600 hover:bg-green-700 text-white font-bold border-none shadow-md shadow-green-100"
                                    >
                                        <Send className="h-3 w-3" />
                                        Send Preview
                                    </Button>
                                )}
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
                    <div className={`flex-1 overflow-auto relative ${viewMode === 'diff' ? '' : (['rjson', 'sjson', 'md', 'schema'].includes(viewMode) ? 'p-0' : 'p-8')} flex justify-center bg-[#F3F4F6]`}>
                        {viewMode === 'rjson' ? (
                            <div className="w-full h-full overflow-auto bg-white">
                                <Textarea
                                    value={rawJsonContext}
                                    onChange={(e) => setRawJsonContext(e.target.value)}
                                    className="w-full min-h-full border-none focus-visible:ring-0 rounded-none resize-none p-6 bg-transparent font-mono text-[13px] text-gray-600"
                                    placeholder="Raw JSON from Google Places API..."
                                    style={{ height: 'auto', minHeight: '100%' }}
                                />
                            </div>
                        ) : viewMode === 'sjson' ? (
                            <div className="w-full h-full overflow-auto bg-white">
                                <Textarea
                                    value={structuredJsonContext}
                                    onChange={(e) => setStructuredJsonContext(e.target.value)}
                                    className="w-full min-h-full border-none focus-visible:ring-0 rounded-none resize-none p-6 bg-transparent font-mono text-[13px] text-gray-600"
                                    placeholder="Structured/enriched JSON (auto-populated after enrichment)..."
                                    style={{ height: 'auto', minHeight: '100%' }}
                                />
                            </div>
                        ) : viewMode === 'md' ? (
                            <div className="w-full h-full overflow-auto bg-white">
                                <Textarea
                                    value={markdownContext}
                                    onChange={(e) => setMarkdownContext(e.target.value)}
                                    className="w-full min-h-full border-none focus-visible:ring-0 rounded-none resize-none p-6 bg-transparent font-sans text-[13px] text-gray-600"
                                    placeholder="Markdown description derived from JSON..."
                                    style={{ height: 'auto', minHeight: '100%' }}
                                />
                            </div>
                        ) : viewMode === 'schema' ? (
                            <div className="w-full h-full overflow-auto bg-white p-6">
                                <pre className="text-[12px] text-gray-500 font-mono whitespace-pre-wrap leading-relaxed">{schemaContent}</pre>
                            </div>
                        ) : viewMode === 'preview' ? (
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
                                    matrixView={matrixView}
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
                            <div className="w-full h-full bg-[#1e1e1e]">
                                {generatedCode ? (
                                    isStreaming ? (
                                        <div className="w-full h-full overflow-auto bg-[#18181B]">
                                            <pre className="text-[13px] p-8 text-zinc-300 font-mono leading-relaxed whitespace-pre-wrap">
                                                {generatedCode}
                                                <span className="inline-block w-2 h-4 bg-green-400 animate-pulse ml-0.5" />
                                            </pre>
                                        </div>
                                    ) : (
                                        <div className="relative w-full h-full flex flex-col">
                                            {codeDirty && (
                                                <div className="flex items-center justify-between px-4 py-2 bg-amber-50 border-b border-amber-200 shrink-0">
                                                    <span className="text-xs font-medium text-amber-700">Unsaved changes</span>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => {
                                                                if (savedCode) {
                                                                    setGeneratedCode(savedCode)
                                                                    setCodeDirty(false)
                                                                }
                                                            }}
                                                            disabled={!savedCode}
                                                            className="px-3 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
                                                        >
                                                            Undo
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                if (!activeProjectId || !generatedCode) return
                                                                try {
                                                                    await saveEditModeChanges(activeProjectId, generatedCode)
                                                                    setSavedCode(generatedCode)
                                                                    setCodeDirty(false)
                                                                    toast.success('Code saved')
                                                                } catch {
                                                                    toast.error('Failed to save code')
                                                                }
                                                            }}
                                                            className="px-3 py-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
                                                        >
                                                            Apply Edits
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                            <div className="flex-1 min-h-0">
                                                <MonacoEditor
                                                    height="100%"
                                                    language="typescriptreact"
                                                    theme="vs-dark"
                                                    value={generatedCode}
                                                    onChange={(value) => {
                                                        if (value !== undefined) {
                                                            setGeneratedCode(value)
                                                            setCodeDirty(value !== savedCode)
                                                        }
                                                    }}
                                                    options={{
                                                        minimap: { enabled: false },
                                                        fontSize: 13,
                                                        lineNumbers: 'on',
                                                        scrollBeyondLastLine: false,
                                                        wordWrap: 'on',
                                                        tabSize: 2,
                                                        automaticLayout: true,
                                                        padding: { top: 16 },
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )
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

            {/* Redeploy Dialog */}
            {isPurchasedProject && purchaseInfo && (
                <RedeployDialog
                    open={isRedeployDialogOpen}
                    onOpenChange={setIsRedeployDialogOpen}
                    businessName={purchaseInfo.businessName}
                    onConfirm={handleRedeploy}
                    isDeploying={isRedeploying}
                />
            )}

            {/* Send Preview Confirmation Dialog */}
            <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
                <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                        <DialogTitle>Send Preview Email</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to send the preview link to the client?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-zinc-500 font-medium w-20">Preview:</span>
                            <code className="text-xs bg-zinc-100 px-2 py-1 rounded font-mono">
                                {activeProjectId ? `/preview/${activeProjectId}` : '—'}
                            </code>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-zinc-500 font-medium w-20">Email to:</span>
                            <span className="font-medium text-zinc-900">lifeofpixels0707@gmail.com</span>
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="ghost" onClick={() => setIsApproveDialogOpen(false)}>Cancel</Button>
                        <Button
                            onClick={handleSendPreview}
                            disabled={isApproving}
                            className="bg-green-600 hover:bg-green-700 text-white"
                        >
                            {isApproving ? 'Sending...' : 'Send Preview'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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

            {/* Edit Mode Overlay */}
            {showEditMode && generatedCode && (
                <EditModeOverlay
                    code={generatedCode}
                    projectId={activeProjectId || ''}
                    businessName={projectName}
                    onSave={async (newCode) => {
                        // Persist to DB first, then update UI
                        if (activeProjectId) {
                            await saveEditModeChanges(activeProjectId, newCode)
                        }
                        setGeneratedCode(newCode)
                        setShowEditMode(false)
                    }}
                    onClose={() => setShowEditMode(false)}
                />
            )}
        </div >
    )
}
