'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload } from 'lucide-react'

interface LogoUploadProps {
    claimId: string
    value: string | null
    onChange: (path: string | null) => void
}

export function LogoUpload({ claimId, value, onChange }: LogoUploadProps) {
    const [preview, setPreview] = useState<string | null>(null)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isDragOver, setIsDragOver] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    const handleFile = useCallback(
        async (file: File) => {
            setError(null)

            // Client-side pre-checks
            if (file.size > 5 * 1024 * 1024) {
                setError('File must be under 5MB')
                return
            }

            const allowedTypes = ['image/png', 'image/jpeg', 'image/webp']
            if (!allowedTypes.includes(file.type)) {
                setError('Only PNG, JPG, and WebP files are allowed')
                return
            }

            // Show preview immediately
            const objectUrl = URL.createObjectURL(file)
            setPreview(objectUrl)
            setUploading(true)

            try {
                const formData = new FormData()
                formData.append('file', file)
                formData.append('claimId', claimId)
                formData.append('type', 'logo')

                const res = await fetch('/api/uploads', {
                    method: 'POST',
                    body: formData,
                })

                if (!res.ok) {
                    const data = await res.json()
                    throw new Error(data.error || 'Upload failed')
                }

                const data = await res.json()
                onChange(data.path)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Upload failed')
                setPreview(null)
                onChange(null)
            } finally {
                setUploading(false)
            }
        },
        [claimId, onChange]
    )

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault()
            setIsDragOver(false)
            const file = e.dataTransfer.files[0]
            if (file) handleFile(file)
        },
        [handleFile]
    )

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(true)
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(false)
    }, [])

    const handleInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
        },
        [handleFile]
    )

    const hasLogo = value && preview

    return (
        <div>
            <div
                className="relative rounded-xl p-8 text-center cursor-pointer transition-colors"
                style={{
                    border: `2px dashed ${isDragOver ? '#2563EB' : error ? '#DC2626' : '#D1D5DB'}`,
                    backgroundColor: isDragOver ? '#EFF6FF' : '#F9FAFB',
                }}
                onClick={() => inputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        inputRef.current?.click()
                    }
                }}
                aria-label="Upload logo"
            >
                {/* Spinner overlay */}
                {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/80">
                        <div
                            className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"
                            style={{ borderColor: '#2563EB', borderTopColor: 'transparent' }}
                        />
                    </div>
                )}

                {hasLogo ? (
                    <div className="flex flex-col items-center gap-3">
                        <img
                            src={preview}
                            alt="Logo preview"
                            className="h-20 w-20 rounded-lg object-contain"
                        />
                        <span
                            className="text-sm font-medium"
                            style={{ color: '#2563EB' }}
                        >
                            Change logo
                        </span>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2">
                        <Upload className="h-8 w-8" style={{ color: '#9CA3AF' }} />
                        <p className="text-sm font-medium" style={{ color: '#374151' }}>
                            Drag and drop your logo here
                        </p>
                        <p className="text-xs" style={{ color: '#9CA3AF' }}>
                            PNG, JPG, or WebP (max 5MB)
                        </p>
                    </div>
                )}

                <input
                    ref={inputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleInputChange}
                />
            </div>

            {error && (
                <p className="mt-2 text-sm" style={{ color: '#DC2626' }}>
                    {error}
                </p>
            )}
        </div>
    )
}
