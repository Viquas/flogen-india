"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { X, Save, Pencil, ImageIcon, PanelRightClose, PanelRightOpen, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { constructHtmlBoilerplate } from '@/lib/utils/html-boilerplate'
import { UnsplashPicker } from './unsplash-picker'
import { PropertiesPanel, DesignToken, FontEntry, ColorEntry, DesignChange, SelectedElement } from './properties-panel'

// ---- Types ----

interface EditChange {
  type: 'text' | 'image'
  editId: string
  oldValue: string
  newValue: string
}

interface CatalogImage {
  editId: string
  src: string
  alt: string
  sectionHint: string
}

interface EditModeOverlayProps {
  code: string
  projectId: string
  businessName?: string
  onSave: (newCode: string) => Promise<void> | void
  onClose: () => void
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Google Fonts URL builder
function googleFontUrl(family: string): string {
  return `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@300;400;500;600;700;800&display=swap`
}

export function EditModeOverlay({
  code,
  projectId,
  businessName,
  onSave,
  onClose,
}: EditModeOverlayProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Core edit state
  const [changes, setChanges] = useState<EditChange[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [imagePicker, setImagePicker] = useState<{ editId: string; currentSrc: string } | null>(null)

  // Panel state
  const [imageCatalog, setImageCatalog] = useState<CatalogImage[]>([])
  const [showPanel, setShowPanel] = useState(true)
  const [panelTab, setPanelTab] = useState<string>('images')

  // Design data state
  const [tokens, setTokens] = useState<DesignToken[]>([])
  const [fonts, setFonts] = useState<FontEntry[]>([])
  const [colors, setColors] = useState<ColorEntry[]>([])
  const [designChanges, setDesignChanges] = useState<DesignChange[]>([])

  // Selection state
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null)

  // Undo stack — each entry records how to reverse an operation
  type UndoEntry =
    | { kind: 'text'; editId: string; oldValue: string; newValue: string }
    | { kind: 'image'; editId: string; oldSrc: string; newSrc: string }
    | { kind: 'color'; oldColor: string; newColor: string }
    | { kind: 'element-color'; editId: string; property: string; oldColor: string; newColor: string }
    | { kind: 'font'; oldFamily: string; newFamily: string }
    | { kind: 'token'; name: string; oldValue: string; newValue: string }
  const undoStackRef = useRef<UndoEntry[]>([])
  const handleUndoRef = useRef<(() => void) | null>(null)

  // Build editable srcDoc
  const editableSrcDoc = useMemo(() => {
    if (!code) return null
    const baseHtml = constructHtmlBoilerplate(code)
    const loader = `<script>
(function(){
  var u='/edit-mode.js';
  try{u=window.parent.location.origin+u}catch(e){try{u=window.location.origin+u}catch(e2){}}
  var s=document.createElement('script');s.src=u;document.body.appendChild(s);
})();
<\/script>`
    return baseHtml.replace('</body>', loader + '</body>')
  }, [code])

  // Listen for postMessage events from iframe
  useEffect(() => {
    const expectedOrigin = window.location.origin

    function handleMessage(e: MessageEvent) {
      if (e.origin !== expectedOrigin && e.origin !== 'null') return
      const d = e.data
      if (!d || !d.type) return

      if (d.type === 'edit-mode-ready') {
        setIsReady(true)
      } else if (d.type === 'edit-change') {
        setChanges(d.changes || [])
        // Track latest change for undo
        if (d.latestChange) {
          const lc = d.latestChange
          if (lc.type === 'text') {
            undoStackRef.current.push({ kind: 'text', editId: lc.editId, oldValue: lc.oldValue, newValue: lc.newValue })
          } else if (lc.type === 'image') {
            undoStackRef.current.push({ kind: 'image', editId: lc.editId, oldSrc: lc.oldValue, newSrc: lc.newValue })
          }
        }
      } else if (d.type === 'image-clicked') {
        setImagePicker({ editId: d.editId, currentSrc: d.currentSrc })
      } else if (d.type === 'image-catalog') {
        setImageCatalog(d.images || [])
      } else if (d.type === 'design-data') {
        // Merge extracted data — preserve originalValue for tokens/colors
        setTokens(prev => {
          const prevMap = new Map(prev.map(t => [t.name, t]))
          return (d.tokens || []).map((t: { name: string; value: string; category: string }) => ({
            ...t,
            originalValue: prevMap.get(t.name)?.originalValue ?? t.value,
          }))
        })
        setFonts(d.fonts || [])
        setColors(prev => {
          const prevMap = new Map(prev.map(c => [c.color, c]))
          return (d.colors || []).map((c: { color: string; usageCount: number; properties: string[] }) => ({
            ...c,
            originalColor: prevMap.get(c.color)?.originalColor ?? c.color,
          }))
        })
      } else if (d.type === 'element-selected') {
        setSelectedElement({
          editId: d.editId,
          tagName: d.tagName,
          colors: d.colors || [],
          classes: d.classes || '',
        })
      } else if (d.type === 'element-deselected') {
        setSelectedElement(null)
      } else if (d.type === 'request-undo') {
        // Cmd+Z pressed inside iframe — forward to our undo handler
        undoStackRef.current.length > 0 && handleUndoRef.current?.()
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  // Send message to iframe
  const postToIframe = useCallback((msg: object) => {
    iframeRef.current?.contentWindow?.postMessage(msg, '*')
  }, [])

  // Image selection
  const handleImageSelect = useCallback((imageUrl: string) => {
    if (!imagePicker) return
    postToIframe({ type: 'replace-image', editId: imagePicker.editId, newSrc: imageUrl })
    setImagePicker(null)
  }, [imagePicker, postToIframe])

  const handlePanelImageClick = useCallback((img: CatalogImage) => {
    setImagePicker({ editId: img.editId, currentSrc: img.src })
  }, [])

  // Design property updates (with undo tracking)
  const handleUpdateToken = useCallback((name: string, value: string) => {
    const original = tokens.find(t => t.name === name)
    const oldVal = original?.value ?? ''
    undoStackRef.current.push({ kind: 'token', name, oldValue: oldVal, newValue: value })
    postToIframe({ type: 'update-token', name, value })
    setDesignChanges(prev => {
      const existing = prev.find(c => c.type === 'token' && c.target === name)
      if (existing) {
        return prev.map(c => c === existing ? { ...c, newValue: value } : c)
      }
      return [...prev, { type: 'token', target: name, oldValue: original?.originalValue ?? '', newValue: value }]
    })
  }, [postToIframe, tokens])

  const handleResetToken = useCallback((name: string) => {
    const original = tokens.find(t => t.name === name)
    if (original) {
      postToIframe({ type: 'update-token', name, value: original.originalValue })
      setDesignChanges(prev => prev.filter(c => !(c.type === 'token' && c.target === name)))
    }
  }, [postToIframe, tokens])

  const handleUpdateFont = useCallback((oldFamily: string, newFamily: string) => {
    undoStackRef.current.push({ kind: 'font', oldFamily, newFamily })
    const stylesheetUrl = googleFontUrl(newFamily)
    postToIframe({ type: 'update-font', oldFamily, newFamily, stylesheetUrl })
    setDesignChanges(prev => {
      const existing = prev.find(c => c.type === 'font' && c.target === oldFamily)
      if (existing) {
        return prev.map(c => c === existing ? { ...c, newValue: newFamily, extra: { stylesheetUrl } } : c)
      }
      return [...prev, { type: 'font', target: oldFamily, oldValue: oldFamily, newValue: newFamily, extra: { stylesheetUrl } }]
    })
  }, [postToIframe])

  const handleUpdateColor = useCallback((oldColor: string, newColor: string) => {
    undoStackRef.current.push({ kind: 'color', oldColor, newColor })
    postToIframe({ type: 'update-color', oldColor, newColor })
    setDesignChanges(prev => {
      const existing = prev.find(c => c.type === 'color' && c.target === oldColor)
      if (existing) {
        return prev.map(c => c === existing ? { ...c, newValue: newColor } : c)
      }
      return [...prev, { type: 'color', target: oldColor, oldValue: oldColor, newValue: newColor }]
    })
  }, [postToIframe])

  // Per-element color change
  const handleUpdateElementColor = useCallback((editId: string, property: string, oldColor: string, newColor: string) => {
    undoStackRef.current.push({ kind: 'element-color', editId, property, oldColor, newColor })
    postToIframe({ type: 'update-element-color', editId, property, newColor })
    setDesignChanges(prev => [
      ...prev,
      { type: 'element-color', target: editId, oldValue: oldColor, newValue: newColor, extra: { editId, property } },
    ])
  }, [postToIframe])

  // Total change count
  const totalChanges = changes.length + designChanges.length
  const hasChanges = totalChanges > 0

  // Save: apply all changes to source code
  const handleSave = useCallback(async () => {
    if (!hasChanges) return
    setIsSaving(true)
    setSaveError(null)

    try {
      let newCode = code

      // Apply text/image changes
      for (const change of changes) {
        const pattern = new RegExp(escapeRegex(change.oldValue), 'g')
        newCode = newCode.replace(pattern, change.newValue)
      }

      // Apply design changes
      for (const dc of designChanges) {
        if (dc.type === 'font') {
          // Replace font family references in source
          const pattern = new RegExp(escapeRegex(dc.oldValue), 'g')
          newCode = newCode.replace(pattern, dc.newValue)
        } else if (dc.type === 'color') {
          // Replace color hex values in source
          const pattern = new RegExp(escapeRegex(dc.oldValue), 'gi')
          newCode = newCode.replace(pattern, dc.newValue)
        }
        // Token changes are CSS-variable based — they're reflected in the live DOM
        // but don't map to source code changes (generated code uses Tailwind classes, not CSS vars)
      }

      await onSave(newCode)
    } catch (err) {
      console.error('[EditMode] Save failed:', err)
      setSaveError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setIsSaving(false)
    }
  }, [changes, designChanges, hasChanges, code, onSave])

  // Undo handler
  const handleUndo = useCallback(() => {
    const entry = undoStackRef.current.pop()
    if (!entry) return

    switch (entry.kind) {
      case 'text':
        // Revert text in iframe
        postToIframe({ type: 'undo-text', editId: entry.editId, originalText: entry.oldValue })
        break
      case 'image':
        // Revert image src
        postToIframe({ type: 'replace-image', editId: entry.editId, newSrc: entry.oldSrc })
        break
      case 'token':
        postToIframe({ type: 'update-token', name: entry.name, value: entry.oldValue })
        setDesignChanges(prev => prev.filter(c => !(c.type === 'token' && c.target === entry.name)))
        break
      case 'font':
        // Reverse font swap
        const revertUrl = googleFontUrl(entry.oldFamily)
        postToIframe({ type: 'update-font', oldFamily: entry.newFamily, newFamily: entry.oldFamily, stylesheetUrl: revertUrl })
        setDesignChanges(prev => prev.filter(c => !(c.type === 'font' && c.target === entry.oldFamily)))
        break
      case 'color':
        // Reverse global color change
        postToIframe({ type: 'update-color', oldColor: entry.newColor, newColor: entry.oldColor })
        setDesignChanges(prev => prev.filter(c => !(c.type === 'color' && c.target === entry.oldColor)))
        break
      case 'element-color':
        postToIframe({ type: 'update-element-color', editId: entry.editId, property: entry.property, newColor: entry.oldColor })
        setDesignChanges(prev => prev.filter(c => !(c.type === 'element-color' && c.target === entry.editId && c.extra?.property === entry.property)))
        break
    }
  }, [postToIframe])

  // Keep ref in sync so iframe's request-undo message can call it
  handleUndoRef.current = handleUndo

  // Keyboard handling — Escape to close, Cmd+Z to undo
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !imagePicker) onClose()
      if (e.key === 'z' && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
        e.preventDefault()
        handleUndo()
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose, imagePicker, handleUndo])

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      {/* ---- Top bar ---- */}
      <div className="flex items-center justify-between px-6 h-12 bg-zinc-900 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2 text-indigo-400 shrink-0">
            <Pencil className="h-3.5 w-3.5" />
            <span className="text-xs font-bold uppercase tracking-wider">Edit</span>
          </div>
          <div className="h-4 w-px bg-zinc-700 shrink-0" />
          <span className="text-sm text-zinc-400 truncate">
            {businessName || 'Untitled Project'}
          </span>
          {!isReady && (
            <span className="text-[10px] text-zinc-600 animate-pulse shrink-0">Preparing...</span>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Panel toggle */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowPanel(v => !v)}
            className={`h-8 px-2.5 text-xs gap-1.5 rounded-lg transition-all ${showPanel ? 'bg-zinc-800 text-zinc-300' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            {showPanel ? <PanelRightClose className="h-3.5 w-3.5" /> : <PanelRightOpen className="h-3.5 w-3.5" />}
          </Button>
          <div className="h-5 w-px bg-zinc-800" />
          {saveError && <span className="text-[11px] text-red-400">{saveError}</span>}
          {hasChanges && (
            <span className="text-[11px] text-zinc-500 tabular-nums">
              {totalChanges} change{totalChanges !== 1 ? 's' : ''}
            </span>
          )}
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="h-8 px-4 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white border-none disabled:opacity-30"
          >
            <Save className="h-3.5 w-3.5 mr-1.5" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
          <div className="h-5 w-px bg-zinc-800" />
          <Button size="sm" variant="ghost" onClick={onClose} className="h-8 w-8 p-0 text-zinc-500 hover:text-white hover:bg-zinc-800">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ---- Hint bar ---- */}
      <div className="flex items-center justify-center gap-6 px-4 h-7 bg-zinc-900/60 border-b border-zinc-800/40 shrink-0">
        <span className="text-[10px] text-zinc-600">Click text to edit</span>
        <span className="text-[10px] text-zinc-700">|</span>
        <span className="text-[10px] text-zinc-600">Click images to replace</span>
        <span className="text-[10px] text-zinc-700">|</span>
        <span className="text-[10px] text-zinc-600">Use the panel for fonts, colors &amp; images</span>
        <span className="text-[10px] text-zinc-700">|</span>
        <span className="text-[10px] text-zinc-600">Esc to close</span>
      </div>

      {/* ---- Main content: iframe + tabbed panel ---- */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editable iframe */}
        <div className="flex-1 overflow-hidden">
          <iframe
            ref={iframeRef}
            srcDoc={editableSrcDoc || ''}
            className="w-full h-full border-0 bg-white"
            title="Edit Mode Preview"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>

        {/* ---- Collapsible Tabbed Panel ---- */}
        {showPanel && (
          <div className="w-80 bg-zinc-900 border-l border-zinc-800 flex flex-col shrink-0">
            <Tabs value={panelTab} onValueChange={setPanelTab} className="flex-1 flex flex-col min-h-0">
              <TabsList className="mx-3 mt-2 mb-0 bg-zinc-800/80 h-8 shrink-0 border border-zinc-700/50">
                <TabsTrigger value="images" className="text-[11px] gap-1.5 text-zinc-400 hover:text-zinc-200 data-[state=active]:bg-zinc-700 data-[state=active]:text-white">
                  <ImageIcon className="h-3 w-3" />
                  Images
                  {imageCatalog.length > 0 && (
                    <span className="text-[9px] tabular-nums opacity-60">{imageCatalog.length}</span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="properties" className="text-[11px] gap-1.5 text-zinc-400 hover:text-zinc-200 data-[state=active]:bg-zinc-700 data-[state=active]:text-white">
                  <SlidersHorizontal className="h-3 w-3" />
                  Properties
                  {designChanges.length > 0 && (
                    <span className="text-[9px] text-indigo-400 tabular-nums">{designChanges.length}</span>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* Images tab */}
              <TabsContent value="images" className="flex-1 overflow-y-auto p-3 space-y-2 m-0">
                {imageCatalog.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-zinc-600">
                    <ImageIcon className="h-6 w-6 mb-2" />
                    <p className="text-[11px]">No images detected</p>
                  </div>
                ) : (
                  imageCatalog.map((img) => (
                    <button
                      key={img.editId}
                      onClick={() => handlePanelImageClick(img)}
                      className="group w-full rounded-xl overflow-hidden bg-zinc-800 hover:ring-2 hover:ring-indigo-500 transition-all text-left focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <div className="relative aspect-[16/9] overflow-hidden">
                        <img src={img.src} alt={img.alt} className="w-full h-full object-cover" loading="lazy" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center">
                          <span className="text-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-600 px-3 py-1.5 rounded-lg">
                            Replace
                          </span>
                        </div>
                      </div>
                      <div className="px-3 py-2">
                        <p className="text-[11px] text-zinc-400 truncate">{img.sectionHint}</p>
                      </div>
                    </button>
                  ))
                )}
              </TabsContent>

              {/* Properties tab */}
              <TabsContent value="properties" className="flex-1 overflow-hidden m-0">
                <PropertiesPanel
                  tokens={tokens}
                  fonts={fonts}
                  colors={colors}
                  selectedElement={selectedElement}
                  onUpdateToken={handleUpdateToken}
                  onUpdateFont={handleUpdateFont}
                  onUpdateColor={handleUpdateColor}
                  onUpdateElementColor={handleUpdateElementColor}
                  onResetToken={handleResetToken}
                />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>

      {/* ---- Unsplash image picker overlay ---- */}
      {imagePicker && (
        <UnsplashPicker
          onSelect={handleImageSelect}
          onClose={() => setImagePicker(null)}
          currentSrc={imagePicker.currentSrc}
        />
      )}
    </div>
  )
}
