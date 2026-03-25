'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, Loader2, Check, RotateCcw, AlertTriangle } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

type UploadState = 'idle' | 'uploading' | 'uploaded' | 'removing' | 'preview' | 'saving' | 'saved'

interface LogoUploadProps {
    claimId: string
    projectId: string
    authUserId: string
    currentLogoUrl: string | null
}

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg']

export function LogoUpload({ currentLogoUrl }: LogoUploadProps) {
    const [state, setState] = useState<UploadState>(currentLogoUrl ? 'saved' : 'idle')
    const [originalUrl, setOriginalUrl] = useState<string | null>(currentLogoUrl)
    const [processedUrl, setProcessedUrl] = useState<string | null>(null)
    const [savedUrl, setSavedUrl] = useState<string | null>(currentLogoUrl)
    const [hasAlpha, setHasAlpha] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [agentFallback, setAgentFallback] = useState(false)
    const [dragOver, setDragOver] = useState(false)
    const [fileName, setFileName] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const resetToIdle = useCallback(() => {
        setState('idle')
        setOriginalUrl(null)
        setProcessedUrl(null)
        setHasAlpha(false)
        setError(null)
        setAgentFallback(false)
        setFileName(null)
    }, [])

    const validateFile = (file: File): string | null => {
        if (!ACCEPTED_TYPES.includes(file.type)) {
            return 'Only PNG and JPEG files are allowed.'
        }
        if (file.size > MAX_FILE_SIZE) {
            return 'File exceeds the 5MB limit.'
        }
        return null
    }

    const handleUpload = useCallback(async (file: File) => {
        const validationError = validateFile(file)
        if (validationError) {
            setError(validationError)
            return
        }

        setError(null)
        setAgentFallback(false)
        setFileName(file.name)
        setState('uploading')

        try {
            const formData = new FormData()
            formData.append('file', file)

            const res = await fetch('/api/portal/logo/upload', {
                method: 'POST',
                body: formData,
            })

            const data = await res.json()
            if (!res.ok) {
                setError(data.error || 'Upload failed')
                setState('idle')
                return
            }

            setOriginalUrl(data.url)
            setHasAlpha(data.hasAlpha)

            // Transparent PNGs skip bg removal entirely -- auto-save
            if (data.hasAlpha) {
                setState('saving')
                await saveLogoRequest(data.url, data.url, null)
            } else {
                setState('uploaded')
            }
        } catch {
            setError('Upload failed. Please try again.')
            setState('idle')
        }
    }, [])

    const handleRemoveBg = useCallback(async () => {
        if (!originalUrl) return
        setState('removing')
        setError(null)

        try {
            const res = await fetch('/api/portal/logo/remove-bg', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ logoUrl: originalUrl }),
            })

            const data = await res.json()

            if (data.success) {
                setProcessedUrl(data.processedUrl)
                setState('preview')
            } else {
                setAgentFallback(data.agentRequestCreated ?? false)
                setError(data.error || 'Background removal failed.')
                setState('uploaded')
            }
        } catch {
            setError('Background removal failed. Please try again.')
            setState('uploaded')
        }
    }, [originalUrl])

    const saveLogoRequest = async (chosenUrl: string, origUrl: string | null, procUrl: string | null) => {
        setState('saving')

        try {
            const formData = new FormData()
            formData.append('description', 'Logo uploaded')
            formData.append('type', 'logo_upload')
            formData.append('metadata', JSON.stringify({
                logo_url: chosenUrl,
                original_url: origUrl,
                processed_url: procUrl,
            }))

            const res = await fetch('/api/portal/requests', {
                method: 'POST',
                body: formData,
            })

            if (!res.ok) {
                const data = await res.json()
                setError(data.error || 'Failed to save logo')
                setState('uploaded')
                return
            }

            setSavedUrl(chosenUrl)
            setState('saved')
        } catch {
            setError('Failed to save logo. Please try again.')
            setState('uploaded')
        }
    }

    const handleSaveChoice = (url: string) => {
        saveLogoRequest(url, originalUrl, processedUrl)
    }

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setDragOver(false)
        const file = e.dataTransfer.files[0]
        if (file) handleUpload(file)
    }, [handleUpload])

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) handleUpload(file)
        e.target.value = ''
    }, [handleUpload])

    return (
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6">
            <h2 className="text-lg font-semibold text-gray-900">Your Logo</h2>
            <p className="text-sm text-gray-500 mt-1 mb-4">
                Upload your business logo for your website
            </p>

            {/* Idle: Drop zone or current logo */}
            {state === 'idle' && (
                <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                        dragOver
                            ? 'border-gray-400 bg-gray-50'
                            : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                        Drag & drop your logo here
                    </p>
                    <p className="text-xs text-gray-400 mt-1">or</p>
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-2 inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                        Browse files
                    </button>
                    <p className="text-[10px] text-gray-400 mt-2">
                        PNG or JPEG, max 5MB
                    </p>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".png,.jpg,.jpeg"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                </div>
            )}

            {/* Uploading: Progress */}
            {state === 'uploading' && (
                <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg">
                    <Loader2 className="w-5 h-5 text-gray-500 animate-spin flex-shrink-0" />
                    <div className="min-w-0">
                        <p className="text-sm text-gray-700 truncate">{fileName}</p>
                        <p className="text-xs text-gray-400">Uploading...</p>
                    </div>
                </div>
            )}

            {/* Uploaded: Background detection decision */}
            {state === 'uploaded' && originalUrl && (
                <div className="space-y-4">
                    <div className="flex justify-center p-4 bg-gray-50 rounded-lg">
                        <Image
                            src={originalUrl}
                            alt="Uploaded logo"
                            width={200}
                            height={200}
                            className="max-h-[200px] w-auto object-contain"
                            unoptimized
                        />
                    </div>

                    {/* Agent fallback message */}
                    {agentFallback && (
                        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-amber-700">
                                Background removal failed. Our agents will do this manually.
                            </p>
                        </div>
                    )}

                    {!agentFallback && !hasAlpha && (
                        <>
                            <p className="text-sm text-gray-600">
                                We detected a background in your logo. Would you like us to remove it?
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleRemoveBg}
                                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-[#0F172A] rounded-lg hover:bg-[#1e293b] transition-colors"
                                >
                                    Remove Background
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleSaveChoice(originalUrl)}
                                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Use Original
                                </button>
                            </div>
                        </>
                    )}

                    {agentFallback && (
                        <button
                            type="button"
                            onClick={() => handleSaveChoice(originalUrl)}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Use Original
                        </button>
                    )}

                    {/* Inline $49 agent CTA */}
                    <p className="text-sm text-muted-foreground">
                        Need help with your logo?{' '}
                        <Link
                            href="/portal/support"
                            className="text-primary underline underline-offset-2"
                        >
                            Our agents can handle this for you for $49
                        </Link>
                    </p>
                </div>
            )}

            {/* Removing: Processing spinner */}
            {state === 'removing' && (
                <div className="flex flex-col items-center gap-3 p-8">
                    <Loader2 className="w-8 h-8 text-gray-500 animate-spin" />
                    <p className="text-sm text-gray-600">Removing background...</p>
                    <p className="text-xs text-gray-400">This may take a moment</p>
                </div>
            )}

            {/* Preview: Side-by-side before/after */}
            {state === 'preview' && originalUrl && processedUrl && (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Original */}
                        <div>
                            <p className="text-xs font-medium text-gray-500 mb-2">Original</p>
                            <div className="flex justify-center p-4 bg-gray-50 rounded-lg min-h-[160px] items-center">
                                <Image
                                    src={originalUrl}
                                    alt="Original logo"
                                    width={180}
                                    height={180}
                                    className="max-h-[180px] w-auto object-contain"
                                    unoptimized
                                />
                            </div>
                        </div>
                        {/* Processed with checkerboard */}
                        <div>
                            <p className="text-xs font-medium text-gray-500 mb-2">Processed</p>
                            <div
                                className="flex justify-center p-4 rounded-lg min-h-[160px] items-center"
                                style={{
                                    backgroundImage:
                                        'linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)',
                                    backgroundSize: '16px 16px',
                                    backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                                }}
                            >
                                <Image
                                    src={processedUrl}
                                    alt="Processed logo"
                                    width={180}
                                    height={180}
                                    className="max-h-[180px] w-auto object-contain"
                                    unoptimized
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => handleSaveChoice(processedUrl)}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                        >
                            <Check className="w-4 h-4 mr-1.5" />
                            Use Processed
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSaveChoice(originalUrl)}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Use Original
                        </button>
                    </div>
                </div>
            )}

            {/* Saving */}
            {state === 'saving' && (
                <div className="flex items-center gap-3 p-4">
                    <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />
                    <p className="text-sm text-gray-600">Saving logo...</p>
                </div>
            )}

            {/* Saved: Confirmation with replace */}
            {state === 'saved' && savedUrl && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <p className="text-sm font-medium text-green-700">Logo saved!</p>
                    </div>
                    <div className="flex justify-center p-4 bg-gray-50 rounded-lg">
                        <Image
                            src={savedUrl}
                            alt="Saved logo"
                            width={200}
                            height={200}
                            className="max-h-[200px] w-auto object-contain"
                            unoptimized
                        />
                    </div>
                    <button
                        type="button"
                        onClick={resetToIdle}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Replace
                    </button>
                </div>
            )}

            {/* Error display */}
            {error && !agentFallback && (
                <p className="text-xs text-red-500 mt-2">{error}</p>
            )}
        </section>
    )
}
