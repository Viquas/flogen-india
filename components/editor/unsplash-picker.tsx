"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, X, Loader2, ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface UnsplashImage {
  id: string
  urls: { small: string; regular: string }
  alt_description: string | null
  user: { name: string }
}

interface UnsplashPickerProps {
  onSelect: (url: string) => void
  onClose: () => void
  currentSrc?: string
}

export function UnsplashPicker({ onSelect, onClose, currentSrc }: UnsplashPickerProps) {
  const [query, setQuery] = useState('')
  const [images, setImages] = useState<UnsplashImage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [apiError, setApiError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { e.stopPropagation(); onClose() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleSearch = useCallback(async () => {
    const q = query.trim()
    if (!q) return
    setIsLoading(true)
    setHasSearched(true)
    setApiError(null)
    try {
      const res = await fetch(`/api/unsplash/search?q=${encodeURIComponent(q)}`)
      if (res.ok) {
        const data = await res.json()
        setImages(data.results || [])
      } else {
        const err = await res.json().catch(() => ({}))
        if (err.error === 'no_api_key') {
          setApiError('No image search API configured. Paste an image URL below instead.')
        } else {
          setApiError(err.message || `Search failed (${res.status})`)
        }
      }
    } catch (err) {
      console.error('[UnsplashPicker] Search failed:', err)
      setApiError('Network error — try pasting an image URL instead')
    } finally {
      setIsLoading(false)
    }
  }, [query])

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-8"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 rounded-2xl border border-zinc-800 w-full max-w-3xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-orange-400" />
            <span className="text-sm font-semibold text-zinc-200">Replace Image</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            className="h-7 w-7 p-0 text-zinc-500 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-zinc-800/50 space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search Unsplash photos..."
                className="pl-10 bg-zinc-800 border-zinc-700 text-zinc-200 placeholder:text-zinc-500 h-10"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={isLoading || !query.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white h-10 px-5"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
            </Button>
          </div>

          {/* Custom URL input */}
          <div className="flex gap-2">
            <Input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && urlInput.trim()) onSelect(urlInput.trim()) }}
              placeholder="Or paste an image URL..."
              className="bg-zinc-800/50 border-zinc-700/50 text-zinc-300 placeholder:text-zinc-600 h-8 text-xs"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => { if (urlInput.trim()) onSelect(urlInput.trim()) }}
              disabled={!urlInput.trim()}
              className="h-8 text-xs border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              Use URL
            </Button>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4">
          {apiError ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
              <ImageIcon className="h-8 w-8 mb-3 text-amber-500/60" />
              <p className="text-sm text-center max-w-sm">{apiError}</p>
              <p className="text-xs text-zinc-600 mt-2">Paste an image URL above to use it directly.</p>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
            </div>
          ) : images.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => onSelect(img.urls.regular)}
                  className="group relative aspect-[4/3] rounded-xl overflow-hidden bg-zinc-800 hover:ring-2 hover:ring-indigo-500 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <img
                    src={img.urls.small}
                    alt={img.alt_description || 'Photo'}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end">
                    <span className="text-[10px] text-white/80 p-2 truncate w-full">
                      by {img.user.name}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : hasSearched ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-600">
              <ImageIcon className="h-8 w-8 mb-2" />
              <p className="text-sm">No images found</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-600">
              <Search className="h-8 w-8 mb-2" />
              <p className="text-sm">Search for images to replace</p>
              {currentSrc && (
                <div className="mt-4 rounded-xl overflow-hidden border border-zinc-800 max-w-[200px]">
                  <img src={currentSrc} alt="Current" className="w-full" />
                  <div className="text-[10px] text-zinc-500 p-2 text-center">Current image</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
