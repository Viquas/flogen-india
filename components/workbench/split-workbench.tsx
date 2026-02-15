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
import { Code2, Eye, Database, MessageSquare, RefreshCw } from 'lucide-react'
import { useState } from 'react'

interface SplitWorkbenchProps {
    project: {
        id: string
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
                                    Code
                                </Button>
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
                                <ScrollArea className="h-full">
                                    {project.generated_code ? (
                                        <pre className="text-xs p-4 bg-zinc-900 text-zinc-100 min-h-full">
                                            {project.generated_code}
                                        </pre>
                                    ) : (
                                        <div className="p-4 text-center text-muted-foreground">
                                            No code generated yet
                                        </div>
                                    )}
                                </ScrollArea>
                            )}
                        </div>
                    </div>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    )
}
