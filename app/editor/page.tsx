"use client"

import { useState, useEffect, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, LayoutDashboard, Code2, Eye, Send, ChevronDown, Monitor, Tablet, Smartphone, AlertCircle, Settings2, FileText, MoreHorizontal, Pencil, Trash2, Check, X, PanelLeftClose, PanelLeftOpen, Star } from "lucide-react"
import { LivePreview } from "@/components/workbench/live-preview"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SettingsDialog } from "@/components/settings/settings-dialog"
import { useSearchParams } from "next/navigation"
import { getProjectById } from "@/app/dashboard/actions"
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
    const [jsonContext, setJsonContext] = useState(JSON.stringify(testBusinessData, null, 2))
    const [markdownContext, setMarkdownContext] = useState("")
    const [revisionPrompt, setRevisionPrompt] = useState("")
    const [generatedCode, setGeneratedCode] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview')
    const [deviceMode, setDeviceMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
    const [inputTab, setInputTab] = useState("json")
    const [projectName, setProjectName] = useState("Untitled Project")
    const [isEditingName, setIsEditingName] = useState(false)
    const [tempProjectName, setTempProjectName] = useState("Untitled Project")
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)
    const [activeProjectId, setActiveProjectId] = useState<string | null>("1") // Default to first mock project
    const [savedTemplates, setSavedTemplates] = useState<any[]>([])
    const [currentRating, setCurrentRating] = useState<number>(0)
    const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false)

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

    // Initialize markdown on context mount
    useEffect(() => {
        if (!markdownContext && jsonContext) {
            setMarkdownContext(jsonToMarkdown(jsonContext))
        }
    }, [])

    // Load project from ID if available
    useEffect(() => {
        if (projectId) {
            loadProject(projectId)
        }
    }, [projectId])

    const loadProject = async (id: string) => {
        console.log('[Editor] Loading project:', id)
        setIsJsonLoading(true)
        try {
            const result = await getProjectById(id)
            if (result.success && result.data) {
                console.log('[Editor] Project loaded successfully:', result.data.id)
                const project = result.data
                const businessData = project.business_data as any
                setProjectName(businessData?.businessName || businessData?.business_name || "Untitled Project")
                setJsonContext(JSON.stringify(businessData, null, 2))
                setMarkdownContext(jsonToMarkdown(JSON.stringify(businessData, null, 2)))
                setGeneratedCode(project.generated_code || null)
                setActiveProjectId(project.id)
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
        if (value === "markdown" && inputTab === "json") {
            // Syncing from JSON to Markdown
            setMarkdownContext(jsonToMarkdown(jsonContext))
        } else if (value === "json" && inputTab === "markdown") {
            // Syncing from Markdown to JSON
            setJsonContext(markdownToJson(markdownContext, jsonContext))
        }
        setInputTab(value)
    }

    const handleTestGeneration = async () => {
        setIsJsonLoading(true)
        setError(null)
        setGeneratedCode(null)

        try {
            // Validate JSON if in JSON tab
            let parsedData = null
            if (inputTab === "json") {
                try {
                    parsedData = JSON.parse(jsonContext)
                } catch (e) {
                    throw new Error("Invalid JSON in Project Context. Please fix it before generating.")
                }
            }

            // Get global rules from localStorage
            const rules = localStorage.getItem("web-factory-rules") || ""

            const response = await fetch('/api/generate/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...(parsedData || {}),
                    markdownContext: inputTab === "markdown" ? markdownContext : undefined,
                    rules,
                    mode: inputTab
                })
            })

            const result = await response.json()
            console.log('[Page] Generation result:', result.success, 'code length:', result.code?.length)

            if (result.success) {
                console.log('[Page] Setting generatedCode, first 200 chars:', result.code?.substring(0, 200))
                setGeneratedCode(result.code)
            } else {
                setError(result.error || 'Generation failed')
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Request failed')
        } finally {
            setIsJsonLoading(false)
        }
    }

    const handleRevision = async () => {
        if (!revisionPrompt.trim()) return

        setIsRevisionLoading(true)
        setError(null)

        try {
            // Get global rules from localStorage
            const rules = localStorage.getItem("web-factory-rules") || ""

            const response = await fetch('/api/generate/revision', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: revisionPrompt,
                    currentCode: generatedCode,
                    currentJson: jsonContext,
                    rules
                })
            })

            const result = await response.json()

            if (result.success) {
                if (result.updatedJson) {
                    const newJson = JSON.stringify(result.updatedJson, null, 2)
                    setJsonContext(newJson)
                    // Sync markdown if we are in markdown mode or to be safe
                    setMarkdownContext(jsonToMarkdown(newJson))
                }
                setGeneratedCode(result.code)
                setRevisionPrompt("") // Clear prompt on success
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
        setJsonContext(JSON.stringify(testBusinessData, null, 2))
        setMarkdownContext(jsonToMarkdown(JSON.stringify(testBusinessData, null, 2)))
        setProjectName("Untitled Project")
        setTempProjectName("Untitled Project")
        setRevisionPrompt("")
        setError(null)
        setIsDeleteDialogOpen(false)
    }

    const handleSelectProject = (project: ProjectHistoryItem) => {
        setActiveProjectId(project.id)
        setProjectName(project.name)
        setTempProjectName(project.name)
        setJsonContext(JSON.stringify(project.data, null, 2))
        setMarkdownContext(jsonToMarkdown(JSON.stringify(project.data, null, 2)))
        setGeneratedCode(null)
        setError(null)
        setCurrentRating(0) // Reset rating for new project
    }

    const handleApprove = () => {
        if (!generatedCode) return
        setIsApproveDialogOpen(true)
    }

    const confirmApprove = async () => {
        if (!generatedCode) return

        // Parse business data from JSON context
        let businessData = null
        try {
            businessData = JSON.parse(jsonContext)
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
            setIsApproveDialogOpen(false)
        } else {
            setError(`Failed to save locally: ${saveResult.error}`)
        }
    }

    const handleRating = (ratingValue: number) => {
        setCurrentRating(ratingValue === currentRating ? 0 : ratingValue)
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
                        <Link href="/">
                            <Button variant="ghost" size="sm" className="gap-2 text-zinc-600 hover:text-zinc-900">
                                <LayoutDashboard className="h-4 w-4" />
                                Dashboard
                            </Button>
                        </Link>
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
                />

                {/* Left Panel - Full Height Context */}
                <div className="w-80 border-r border-zinc-200 flex flex-col bg-white relative flex-shrink-0">
                    <Tabs defaultValue="json" value={inputTab} onValueChange={handleTabChange} className="flex-1 flex flex-col">
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
                                <TabsList className="bg-transparent border-none p-0 h-auto gap-4">
                                    <TabsTrigger
                                        value="json"
                                        className="p-0 text-xs font-semibold uppercase tracking-wider text-zinc-500 data-[state=active]:text-zinc-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                                    >
                                        JSON
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="markdown"
                                        className="p-0 text-xs font-semibold uppercase tracking-wider text-zinc-500 data-[state=active]:text-zinc-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                                    >
                                        Markdown
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
                            <TabsContent value="json" className="absolute inset-0 m-0 p-0">
                                <div className="h-full overflow-auto">
                                    <Textarea
                                        value={jsonContext}
                                        onChange={(e) => setJsonContext(e.target.value)}
                                        className="w-full min-h-full border-none focus-visible:ring-0 rounded-none resize-none p-4 bg-transparent font-mono text-[13px] text-zinc-600"
                                        placeholder="Enter business JSON context..."
                                        style={{ height: 'auto', minHeight: '100%' }}
                                    />
                                </div>
                            </TabsContent>
                            <TabsContent value="markdown" className="absolute inset-0 m-0 p-0">
                                <div className="h-full overflow-auto">
                                    <Textarea
                                        value={markdownContext}
                                        onChange={(e) => setMarkdownContext(e.target.value)}
                                        className="w-full min-h-full border-none focus-visible:ring-0 rounded-none resize-none p-4 bg-transparent font-sans text-[13px] text-zinc-600"
                                        placeholder="Enter business description in markdown..."
                                        style={{ height: 'auto', minHeight: '100%' }}
                                    />
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

                                <div className="flex items-center justify-end px-2">
                                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-none border border-transparent hover:border-zinc-200 transition-all cursor-pointer group/engine">
                                        <span className="text-[10px] font-bold text-zinc-400 group-hover/engine:text-zinc-900 uppercase tracking-tighter">GPT-4o Mini</span>
                                        <ChevronDown className="h-3 w-3 text-zinc-300" />
                                    </div>
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
                                <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-[0.2em]">Engine: GPT-4o</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Button
                                    onClick={handleApprove}
                                    disabled={!generatedCode || currentRating === 0}
                                    variant={currentRating > 0 ? "default" : "outline"}
                                    size="sm"
                                    className={`h-8 text-[10px] uppercase tracking-wider gap-2 px-3 transition-all ${currentRating > 0
                                        ? "bg-green-600 hover:bg-green-700 text-white font-bold border-none shadow-md shadow-green-100"
                                        : "font-bold border-zinc-200 hover:bg-zinc-50 text-zinc-700"
                                        }`}
                                >
                                    <Check className="h-3 w-3" />
                                    Approve
                                </Button>
                                <div className="flex items-center gap-1">
                                    {[1, 2, 3].map((star) => {
                                        const isFilled = currentRating >= star
                                        return (
                                            <button
                                                key={star}
                                                onClick={() => handleRating(star)}
                                                className={`transition-all hover:scale-110 active:scale-95 ${isFilled ? "text-yellow-400" : "text-zinc-200 hover:text-zinc-300"}`}
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
                    <div className="flex-1 overflow-auto relative p-8 flex justify-center bg-[#F3F4F6]">
                        {viewMode === 'preview' ? (
                            <div
                                className="h-full bg-white shadow-2xl transition-all duration-300 overflow-hidden relative"
                                style={{ width: deviceWidths[deviceMode as keyof typeof deviceWidths] }}
                            >
                                <LivePreview code={generatedCode} isLoading={isJsonLoading || isRevisionLoading} />
                            </div>
                        ) : (
                            <div className="w-full h-full overflow-auto bg-[#18181B] selection:bg-purple-500/30">
                                {generatedCode ? (
                                    <pre className="text-[13px] p-8 text-zinc-300 font-mono leading-relaxed">
                                        {generatedCode}
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

            {/* Approve Confirmation Dialog */}
            <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Confirm Approval</DialogTitle>
                        <DialogDescription>
                            Are you sure to approve the project <span className="font-semibold text-zinc-900">"{projectName}"</span>? This will save the HTML file locally.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="ghost" onClick={() => setIsApproveDialogOpen(false)}>
                            No
                        </Button>
                        <Button variant="default" className="bg-zinc-900 hover:bg-zinc-800" onClick={confirmApprove}>
                            Yes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    )
}
