"use client"

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Send, Loader2, Sparkles, ImagePlus, X, Upload } from 'lucide-react'
import { uploadProjectAssets } from '@/lib/supabase/storage'
import { QualitySuggestions } from './quality-suggestions'

interface Message {
    role: 'user' | 'assistant'
    content: string
    attachments?: string[]
}

interface RefinementChatProps {
    projectId: string
    currentCode?: string | null
    onCodeUpdate?: (code: string) => void
}

export function RefinementChat({ projectId, currentCode, onCodeUpdate }: RefinementChatProps) {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: "Hi! I can help you refine this landing page. What would you like to change? You can also drag & drop images to add them to the page.\n\nExamples:\n• \"Make the hero section darker\"\n• \"Add these images to the gallery\"\n• \"Change the primary color to blue\""
        }
    ])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [pendingImages, setPendingImages] = useState<{ file: File; preview: string }[]>([])
    const [isDragOver, setIsDragOver] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(false)

        const files = Array.from(e.dataTransfer.files).filter(f =>
            f.type.startsWith('image/')
        )

        if (files.length > 0) {
            const newImages = files.map(file => ({
                file,
                preview: URL.createObjectURL(file)
            }))
            setPendingImages(prev => [...prev, ...newImages])
        }
    }, [])

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []).filter(f =>
            f.type.startsWith('image/')
        )

        if (files.length > 0) {
            const newImages = files.map(file => ({
                file,
                preview: URL.createObjectURL(file)
            }))
            setPendingImages(prev => [...prev, ...newImages])
        }
    }

    const removeImage = (index: number) => {
        setPendingImages(prev => {
            const newImages = [...prev]
            URL.revokeObjectURL(newImages[index].preview)
            newImages.splice(index, 1)
            return newImages
        })
    }

    const submitMessage = async (directMessage?: string) => {
        const messageText = directMessage ?? input.trim()
        if ((!messageText && pendingImages.length === 0) || isLoading) return

        setInput('')
        setIsLoading(true)

        // Upload images first if any
        let imageUrls: string[] = []
        if (pendingImages.length > 0) {
            const { urls, errors } = await uploadProjectAssets(
                projectId,
                pendingImages.map(img => img.file)
            )
            imageUrls = urls
            if (errors.length > 0) {
                console.error('Upload errors:', errors)
            }
            // Clear pending images
            pendingImages.forEach(img => URL.revokeObjectURL(img.preview))
            setPendingImages([])
        }

        // Add user message to UI
        const newUserMessage: Message = {
            role: 'user',
            content: messageText || (imageUrls.length > 0 ? 'Added images' : ''),
            attachments: imageUrls.length > 0 ? imageUrls : undefined,
        }
        setMessages(prev => [...prev, newUserMessage])

        try {
            // Call the refinement API
            const response = await fetch('/api/chat/refine', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId,
                    message: messageText,
                    imageUrls,
                }),
            })

            const result = await response.json()

            if (result.success && result.code) {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: "I've updated the landing page with your changes. Check the preview on the right!"
                }])
                onCodeUpdate?.(result.code)
            } else {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: result.error || "Sorry, I couldn't process that request. Please try again."
                }])
            }
        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "An error occurred while processing your request. Please try again."
            }])
        } finally {
            setIsLoading(false)
        }
    }

    const handleSuggestionClick = (prompt: string) => {
        submitMessage(prompt)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        submitMessage()
    }

    return (
        <Card className="flex flex-col h-full">
            <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Refinement Chat
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                <ScrollArea className="flex-1 px-4">
                    <div className="space-y-4 py-4">
                        {messages.map((message, idx) => (
                            <div
                                key={idx}
                                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`rounded-lg px-3 py-2 max-w-[85%] text-sm ${message.role === 'user'
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted'
                                        }`}
                                >
                                    <p className="whitespace-pre-wrap">{message.content}</p>
                                    {message.attachments && message.attachments.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {message.attachments.map((url, i) => (
                                                <img
                                                    key={i}
                                                    src={url}
                                                    alt={`Attachment ${i + 1}`}
                                                    className="w-16 h-16 object-cover rounded"
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-muted rounded-lg px-3 py-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                {/* Pending Images Preview */}
                {pendingImages.length > 0 && (
                    <div className="border-t px-4 py-2">
                        <div className="flex flex-wrap gap-2">
                            {pendingImages.map((img, idx) => (
                                <div key={idx} className="relative">
                                    <img
                                        src={img.preview}
                                        alt={`Pending ${idx + 1}`}
                                        className="w-12 h-12 object-cover rounded border"
                                    />
                                    <button
                                        onClick={() => removeImage(idx)}
                                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Quality Suggestions */}
                <QualitySuggestions code={currentCode ?? null} onSuggestionClick={handleSuggestionClick} />

                {/* Drop Zone / Input */}
                <div
                    className={`border-t p-4 transition-colors ${isDragOver ? 'bg-primary/10' : ''}`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleDrop}
                >
                    {isDragOver ? (
                        <div className="flex items-center justify-center py-4 border-2 border-dashed border-primary rounded-lg">
                            <Upload className="h-6 w-6 mr-2 text-primary" />
                            <span className="text-primary font-medium">Drop images here</span>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="flex gap-2">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isLoading}
                            >
                                <ImagePlus className="h-4 w-4" />
                            </Button>
                            <Input
                                placeholder="Describe what to change..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                disabled={isLoading}
                                className="flex-1"
                            />
                            <Button type="submit" size="icon" disabled={isLoading || (!input.trim() && pendingImages.length === 0)}>
                                <Send className="h-4 w-4" />
                            </Button>
                        </form>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
