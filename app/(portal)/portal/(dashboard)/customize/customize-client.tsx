'use client'

import { useState, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import { Send, Upload, X, MessageSquare, Loader2 } from 'lucide-react'
import { RequestCard } from '@/components/portal/request-card'

interface RequestContent {
    description: string
    file_urls?: string[]
}

interface ClientRequest {
    id: string
    type: 'logo_upload' | 'text_change' | 'domain_setup' | 'agent_call' | 'booking_setup'
    status: 'pending' | 'in_progress' | 'completed'
    content: RequestContent
    created_at: string
    updated_at: string
}

interface CustomizeClientProps {
    claimId: string
    businessName: string
    requests: ClientRequest[]
}

const MAX_FILES = 3
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.pdf']

function validateFile(file: File): string | null {
    const ext = '.' + (file.name.split('.').pop()?.toLowerCase() ?? '')
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return `"${file.name}" is not a supported file type. Use PNG, JPG, WebP, or PDF.`
    }
    if (file.size > MAX_FILE_SIZE) {
        return `"${file.name}" exceeds the 5MB limit.`
    }
    return null
}

export function CustomizeClient({ claimId: _claimId, businessName: _businessName, requests: initialRequests }: CustomizeClientProps) {
    const [requests, setRequests] = useState<ClientRequest[]>(initialRequests)
    const [description, setDescription] = useState('')
    const [files, setFiles] = useState<File[]>([])
    const [submitting, setSubmitting] = useState(false)
    const [fileError, setFileError] = useState<string | null>(null)
    const [dragOver, setDragOver] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const textChangeRequests = requests.filter((r) => r.type === 'text_change')

    const addFiles = useCallback((incoming: File[]) => {
        setFileError(null)

        const combined = [...files]
        for (const f of incoming) {
            if (combined.length >= MAX_FILES) {
                setFileError(`Maximum ${MAX_FILES} files allowed.`)
                break
            }
            const err = validateFile(f)
            if (err) {
                setFileError(err)
                continue
            }
            // Avoid duplicates by name + size
            if (!combined.some((c) => c.name === f.name && c.size === f.size)) {
                combined.push(f)
            }
        }
        setFiles(combined)
    }, [files])

    const removeFile = (index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index))
        setFileError(null)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setDragOver(false)
        const dropped = Array.from(e.dataTransfer.files)
        addFiles(dropped)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const trimmed = description.trim()
        if (trimmed.length < 10) {
            toast.error('Please provide at least 10 characters describing your change.')
            return
        }

        setSubmitting(true)

        try {
            const formData = new FormData()
            formData.append('description', trimmed)
            for (const f of files) {
                formData.append('files', f)
            }

            const res = await fetch('/api/portal/requests', {
                method: 'POST',
                body: formData,
            })

            const data = await res.json()

            if (!res.ok) {
                toast.error(data.error || 'Something went wrong')
                return
            }

            // Optimistic: prepend new request
            setRequests((prev) => [data.request, ...prev])
            setDescription('')
            setFiles([])
            setFileError(null)
            toast.success('Request submitted!')
        } catch {
            toast.error('Failed to submit request. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    const descriptionLength = description.length
    const isValid = description.trim().length >= 10 && descriptionLength <= 2000

    return (
        <div className="space-y-8">
            {/* Logo upload section -- added in Plan 03 */}

            {/* Section A: Request a Change */}
            <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6">
                <h2 className="text-lg font-semibold text-gray-900">Request a Change</h2>
                <p className="text-sm text-gray-500 mt-1 mb-4">
                    Tell us what you&apos;d like to change on your website
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Description textarea */}
                    <div>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe the changes you'd like..."
                            rows={4}
                            maxLength={2000}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:ring-1 focus:ring-gray-400 focus:outline-none resize-y min-h-[100px]"
                            disabled={submitting}
                        />
                        <div className="flex items-center justify-between mt-1">
                            <span className="text-[11px] text-gray-400">
                                {descriptionLength < 10 && descriptionLength > 0 && 'Minimum 10 characters'}
                            </span>
                            <span className={`text-[11px] ${descriptionLength > 1900 ? 'text-amber-500' : 'text-gray-400'}`}>
                                {descriptionLength}/2000
                            </span>
                        </div>
                    </div>

                    {/* File attachment area */}
                    <div>
                        <div
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={handleDrop}
                            className={`relative border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                                dragOver
                                    ? 'border-gray-400 bg-gray-50'
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            <Upload className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                            <p className="text-xs text-gray-500">
                                Drag files here or{' '}
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="text-gray-700 underline underline-offset-2 hover:text-gray-900"
                                    disabled={submitting}
                                >
                                    browse files
                                </button>
                            </p>
                            <p className="text-[10px] text-gray-400 mt-0.5">
                                PNG, JPG, WebP, or PDF. Max 5MB each, up to {MAX_FILES} files.
                            </p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept=".png,.jpg,.jpeg,.webp,.pdf"
                                onChange={(e) => {
                                    if (e.target.files) {
                                        addFiles(Array.from(e.target.files))
                                    }
                                    e.target.value = ''
                                }}
                                className="hidden"
                                disabled={submitting}
                            />
                        </div>

                        {/* File error */}
                        {fileError && (
                            <p className="text-xs text-red-500 mt-1.5">{fileError}</p>
                        )}

                        {/* Selected file chips */}
                        {files.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {files.map((f, i) => (
                                    <span
                                        key={`${f.name}-${f.size}`}
                                        className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs"
                                    >
                                        <span className="truncate max-w-[140px]">{f.name}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeFile(i)}
                                            className="text-gray-400 hover:text-gray-600 min-w-[16px] min-h-[16px] flex items-center justify-center"
                                            disabled={submitting}
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Submit button */}
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={submitting || !isValid}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0F172A] text-white text-sm font-medium rounded-lg hover:bg-[#1e293b] disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
                        >
                            {submitting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                            {submitting ? 'Submitting...' : 'Submit Request'}
                        </button>
                    </div>
                </form>
            </section>

            {/* Section B: Request History */}
            <section>
                <div className="flex items-center gap-2 mb-3">
                    <h2 className="text-lg font-semibold text-gray-900">Request History</h2>
                    {textChangeRequests.length > 0 && (
                        <span className="inline-flex items-center justify-center px-2 py-0.5 text-[11px] font-medium bg-gray-100 text-gray-600 rounded-full min-w-[20px]">
                            {textChangeRequests.length}
                        </span>
                    )}
                </div>

                {textChangeRequests.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
                        <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No requests yet</p>
                        <p className="text-xs text-gray-400 mt-1">
                            Submit your first change request above
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {textChangeRequests.map((req) => (
                            <RequestCard key={req.id} request={req} />
                        ))}
                    </div>
                )}
            </section>
        </div>
    )
}
