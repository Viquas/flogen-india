'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, X } from 'lucide-react'

interface PhotoUploadProps {
    claimId: string
    values: string[]
    onChange: (paths: string[]) => void
}

interface PhotoEntry {
    path: string
    previewUrl: string
}

export function PhotoUpload({ claimId, values, onChange }: PhotoUploadProps) {
    const [photos, setPhotos] = useState<PhotoEntry[]>([])
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isDragOver, setIsDragOver] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    const maxPhotos = 10

    const uploadFiles = useCallback(
        async (files: File[]) => {
            setError(null)
            const remaining = maxPhotos - values.length
            const toUpload = files.slice(0, remaining)

            if (toUpload.length === 0) {
                setError('Maximum 10 photos reached')
                return
            }

            setUploading(true)
            const newPhotos: PhotoEntry[] = []
            const newPaths: string[] = []
            const errors: string[] = []

            for (const file of toUpload) {
                // Client-side checks
                if (file.size > 5 * 1024 * 1024) {
                    errors.push(`${file.name}: exceeds 5MB`)
                    continue
                }

                const allowedTypes = ['image/png', 'image/jpeg', 'image/webp']
                if (!allowedTypes.includes(file.type)) {
                    errors.push(`${file.name}: invalid type`)
                    continue
                }

                const previewUrl = URL.createObjectURL(file)

                try {
                    const formData = new FormData()
                    formData.append('file', file)
                    formData.append('claimId', claimId)
                    formData.append('type', 'photo')

                    const res = await fetch('/api/uploads', {
                        method: 'POST',
                        body: formData,
                    })

                    if (!res.ok) {
                        const data = await res.json()
                        errors.push(`${file.name}: ${data.error || 'failed'}`)
                        URL.revokeObjectURL(previewUrl)
                        continue
                    }

                    const data = await res.json()
                    newPhotos.push({ path: data.path, previewUrl })
                    newPaths.push(data.path)
                } catch {
                    errors.push(`${file.name}: upload failed`)
                    URL.revokeObjectURL(previewUrl)
                }
            }

            if (errors.length > 0) {
                setError(errors.join('; '))
            }

            if (newPaths.length > 0) {
                setPhotos((prev) => [...prev, ...newPhotos])
                onChange([...values, ...newPaths])
            }

            setUploading(false)
        },
        [claimId, values, onChange]
    )

    const handleRemove = useCallback(
        (index: number) => {
            const photo = photos[index]
            if (photo) {
                URL.revokeObjectURL(photo.previewUrl)
            }

            const newPhotos = photos.filter((_, i) => i !== index)
            const newValues = values.filter((_, i) => i !== index)
            setPhotos(newPhotos)
            onChange(newValues)
        },
        [photos, values, onChange]
    )

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault()
            setIsDragOver(false)
            const files = Array.from(e.dataTransfer.files)
            if (files.length > 0) uploadFiles(files)
        },
        [uploadFiles]
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
            const files = Array.from(e.target.files || [])
            if (files.length > 0) uploadFiles(files)
            // Reset input so the same files can be selected again
            e.target.value = ''
        },
        [uploadFiles]
    )

    const atLimit = values.length >= maxPhotos

    return (
        <div>
            {/* Photo grid */}
            {photos.length > 0 && (
                <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {photos.map((photo, index) => (
                        <div key={photo.path} className="group relative aspect-square">
                            <img
                                src={photo.previewUrl}
                                alt={`Photo ${index + 1}`}
                                className="h-full w-full rounded-lg object-cover"
                            />
                            <button
                                type="button"
                                onClick={() => handleRemove(index)}
                                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full"
                                style={{ backgroundColor: '#DC2626', color: '#FFFFFF' }}
                                aria-label={`Remove photo ${index + 1}`}
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Count */}
            <p className="mb-2 text-sm" style={{ color: '#6B7280' }}>
                {values.length}/{maxPhotos} photos
            </p>

            {/* Drop zone */}
            <div
                className="relative rounded-xl p-6 text-center cursor-pointer transition-colors"
                style={{
                    border: `2px dashed ${isDragOver ? '#2563EB' : '#D1D5DB'}`,
                    backgroundColor: isDragOver ? '#EFF6FF' : '#F9FAFB',
                    opacity: atLimit ? 0.5 : 1,
                    pointerEvents: atLimit ? 'none' : 'auto',
                }}
                onClick={() => !atLimit && inputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                role="button"
                tabIndex={atLimit ? -1 : 0}
                onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && !atLimit) {
                        e.preventDefault()
                        inputRef.current?.click()
                    }
                }}
                aria-label="Upload photos"
            >
                {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/80">
                        <div
                            className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"
                            style={{ borderColor: '#2563EB', borderTopColor: 'transparent' }}
                        />
                    </div>
                )}

                <div className="flex flex-col items-center gap-2">
                    <Upload className="h-6 w-6" style={{ color: '#9CA3AF' }} />
                    <p className="text-sm font-medium" style={{ color: '#374151' }}>
                        {atLimit ? 'Maximum photos reached' : 'Drag photos here or click to browse'}
                    </p>
                    <p className="text-xs" style={{ color: '#9CA3AF' }}>
                        PNG, JPG, or WebP (max 5MB each)
                    </p>
                </div>

                <input
                    ref={inputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    multiple
                    className="hidden"
                    onChange={handleInputChange}
                    disabled={atLimit}
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
