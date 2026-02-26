"use client"

import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from '@/components/ui/resizable'
import { ProjectDataViewer } from './project-data-viewer'
import { RefinementChat } from './refinement-chat'
import { LivePreview } from './live-preview'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Code2, Eye, Database, MessageSquare, RefreshCw, History } from 'lucide-react'
import { useState } from 'react'
import { Editor, DiffEditor } from '@monaco-editor/react'
import { RevisionHistory } from './revision-history'

interface SplitWorkbenchProps {
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
    }
    onRegenerate?: () => void
    isRegenerating?: boolean
    onCodeUpdate?: (code: string) => void
}

export function SplitWorkbench({ project, onRegenerate, isRegenerating, onCodeUpdate }: SplitWorkbenchProps) {
    const [rightView, setRightView] = useState<'preview' | 'code'>('preview')
    const [diffCode, setDiffCode] = useState<string | null>(null)

    // Handle when user opts to view diff from history
    const handleViewDiff = (code: string | null) => {
        setDiffCode(code)
        if (code) {
            setRightView('code')
        }
    }

    return (
        <div className="h-[calc(100vh-12rem)] border rounded-lg overflow-hidden bg-background">
            <ResizablePanelGroup direction="horizontal">
                {/* Left Panel - Controls */}
                <ResizablePanel defaultSize={40} minSize={25} maxSize={60}>
                    <div className="h-full flex flex-col">
                        <Tabs defaultValue="data" className="flex-1 flex flex-col">
                            <div className="border-b px-4 py-2 flex items-center justify-between">
                                <TabsList className="h-8">
                                    <TabsTrigger value="data" className="text-xs">
                                        <Database className="h-3 w-3 mr-1" />
                                        Data
                                    </TabsTrigger>
                                    <TabsTrigger value="chat" className="text-xs">
                                        <MessageSquare className="h-3 w-3 mr-1" />
                                        Refine
                                    </TabsTrigger>
                                    <TabsTrigger value="history" className="text-xs">
                                        <History className="h-3 w-3 mr-1" />
                                        History
                                    </TabsTrigger>
                                </TabsList>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={onRegenerate}
                                    disabled={isRegenerating || project.status === 'generating'}
                                    className="h-7 text-xs"
                                >
                                    <RefreshCw className={`h-3 w-3 mr-1 ${isRegenerating ? 'animate-spin' : ''}`} />
                                    Regenerate
                                </Button>
                            </div>

                            <TabsContent value="data" className="flex-1 m-0 overflow-hidden">
                                <ScrollArea className="h-full p-4">
                                    <ProjectDataViewer businessData={project.business_data} />
                                </ScrollArea>
                            </TabsContent>

                            <TabsContent value="chat" className="flex-1 m-0 overflow-hidden">
                                <div className="h-full">
                                    <RefinementChat projectId={project.id} onCodeUpdate={onCodeUpdate} />
                                </div>
                            </TabsContent>

                            <TabsContent value="history" className="flex-1 m-0 overflow-hidden">
                                <div className="h-full">
                                    <RevisionHistory
                                        projectId={project.id}
                                        currentVersion={project.version || 1}
                                        onViewDiff={handleViewDiff}
                                    />
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </ResizablePanel>

                <ResizableHandle withHandle />

                {/* Right Panel - Preview */}
                <ResizablePanel defaultSize={60} minSize={40}>
                    <div className="h-full flex flex-col">
                        {/* View Toggle */}
                        <div className="border-b px-4 py-2 flex items-center justify-between bg-muted/30">
                            <div className="flex items-center gap-2">
                                <Button
                                    size="sm"
                                    variant={rightView === 'preview' ? 'default' : 'ghost'}
                                    onClick={() => setRightView('preview')}
                                    className="h-7 text-xs"
                                >
                                    <Eye className="h-3 w-3 mr-1" />
                                    Preview
                                </Button>
                                <Button
                                    size="sm"
                                    variant={rightView === 'code' ? 'default' : 'ghost'}
                                    onClick={() => setRightView('code')}
                                    className="h-7 text-xs"
                                >
                                    <Code2 className="h-3 w-3 mr-1" />
                                    {diffCode ? 'Diff View' : 'Code'}
                                </Button>
                                {diffCode && rightView === 'code' && (
                                    <span className="text-xs ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-md animate-pulse">
                                        Viewing Diff (Old vs New)
                                    </span>
                                )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                                {project.status === 'generating' ? 'Generating...' : project.status}
                            </span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-hidden">
                            {rightView === 'preview' ? (
                                <LivePreview
                                    code={project.generated_code}
                                    isLoading={project.status === 'generating'}
                                />
                            ) : (
                                <div className="h-full w-full">
                                    {project.generated_code ? (
                                        diffCode ? (
                                            <DiffEditor
                                                height="100%"
                                                language="typescript"
                                                theme="vs-dark"
                                                original={diffCode} // Old version
                                                modified={project.generated_code} // Current version
                                                options={{
                                                    readOnly: true,
                                                    minimap: { enabled: false },
                                                    wordWrap: 'on',
                                                    padding: { top: 16 }
                                                }}
                                            />
                                        ) : (
                                            <Editor
                                                height="100%"
                                                defaultLanguage="typescript"
                                                theme="vs-dark"
                                                value={project.generated_code}
                                                options={{
                                                    readOnly: true,
                                                    minimap: { enabled: false },
                                                    wordWrap: 'on',
                                                    padding: { top: 16 }
                                                }}
                                            />
                                        )
                                    ) : (
                                        <div className="p-4 text-center text-muted-foreground flex items-center justify-center h-full">
                                            No code generated yet
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    )
}
