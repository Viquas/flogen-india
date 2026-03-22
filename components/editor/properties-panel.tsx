"use client"

import { useState, useCallback, useMemo } from 'react'
import { ChevronDown, ChevronRight, Search, RotateCcw, Type, Palette, SlidersHorizontal, MousePointer2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

// ---- Types ----

export interface DesignToken {
  name: string
  value: string
  originalValue: string
  category: string
}

export interface FontEntry {
  family: string
  usageCount: number
  weights: string[]
}

export interface ColorEntry {
  color: string
  usageCount: number
  originalColor: string
  properties: string[]
}

export interface DesignChange {
  type: 'token' | 'font' | 'color' | 'element-color'
  target: string
  oldValue: string
  newValue: string
  extra?: { stylesheetUrl?: string; editId?: string; property?: string }
}

export interface SelectedElement {
  editId: string
  tagName: string
  colors: { property: string; value: string; label: string }[]
  classes: string
}

interface PropertiesPanelProps {
  tokens: DesignToken[]
  fonts: FontEntry[]
  colors: ColorEntry[]
  selectedElement: SelectedElement | null
  onUpdateToken: (name: string, value: string) => void
  onUpdateFont: (oldFamily: string, newFamily: string) => void
  onUpdateColor: (oldColor: string, newColor: string) => void
  onUpdateElementColor: (editId: string, property: string, oldColor: string, newColor: string) => void
  onResetToken: (name: string) => void
}

// Curated Google Fonts list
const POPULAR_FONTS = [
  'Inter', 'Roboto', 'Open Sans', 'Montserrat', 'Lato', 'Poppins', 'Raleway',
  'Oswald', 'Merriweather', 'Playfair Display', 'Source Sans 3', 'Nunito',
  'Ubuntu', 'Rubik', 'Work Sans', 'DM Sans', 'Outfit', 'Space Grotesk',
  'Fira Sans', 'Barlow', 'Mulish', 'Quicksand', 'Josefin Sans', 'Bitter',
  'Libre Baskerville', 'Crimson Text', 'Lora', 'Cormorant Garamond',
  'Archivo', 'Manrope', 'Plus Jakarta Sans', 'Sora', 'Urbanist', 'Figtree',
]

// ---- Main Component ----

export function PropertiesPanel({
  tokens, fonts, colors, selectedElement,
  onUpdateToken, onUpdateFont, onUpdateColor, onUpdateElementColor, onResetToken,
}: PropertiesPanelProps) {
  const [expanded, setExpanded] = useState({ tokens: true, fonts: true, colors: true })
  const [tokenFilter, setTokenFilter] = useState('')
  const [fontPicker, setFontPicker] = useState<string | null>(null)
  const [fontSearch, setFontSearch] = useState('')
  const [editingColor, setEditingColor] = useState<string | null>(null)
  const [colorInput, setColorInput] = useState('')
  const [showAllColors, setShowAllColors] = useState(false)

  // Selection color editing
  const [editingSelColor, setEditingSelColor] = useState<string | null>(null) // property name
  const [selColorInput, setSelColorInput] = useState('')

  const toggleSection = useCallback((key: 'tokens' | 'fonts' | 'colors') => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const filteredTokens = useMemo(() => {
    if (!tokenFilter) return tokens
    const q = tokenFilter.toLowerCase()
    return tokens.filter(t => t.name.toLowerCase().includes(q) || t.value.toLowerCase().includes(q))
  }, [tokens, tokenFilter])

  const groupedTokens = useMemo(() => {
    const groups: Record<string, DesignToken[]> = {}
    filteredTokens.forEach(t => {
      if (!groups[t.category]) groups[t.category] = []
      groups[t.category].push(t)
    })
    return groups
  }, [filteredTokens])

  const filteredFonts = useMemo(() => {
    if (!fontSearch) return POPULAR_FONTS
    const q = fontSearch.toLowerCase()
    return POPULAR_FONTS.filter(f => f.toLowerCase().includes(q))
  }, [fontSearch])

  const colorGroups = useMemo(() => {
    const primary = colors.slice(0, 4)
    const accent = colors.slice(4, 8)
    const rest = colors.slice(8)
    return { primary, accent, rest }
  }, [colors])

  // Should we show selection colors instead of global?
  const showSelectionColors = selectedElement && selectedElement.colors.length > 0 && !showAllColors

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-1">
        {/* ========= DESIGN TOKENS ========= */}
        <SectionHeader
          label="Design Tokens"
          icon={<SlidersHorizontal className="h-3.5 w-3.5" />}
          count={tokens.length}
          expanded={expanded.tokens}
          onToggle={() => toggleSection('tokens')}
        />
        {expanded.tokens && (
          <div className="space-y-2 pb-3">
            {tokens.length > 5 && (
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-500" />
                <Input
                  value={tokenFilter}
                  onChange={e => setTokenFilter(e.target.value)}
                  placeholder="Filter tokens..."
                  className="h-7 pl-7 text-[11px] bg-zinc-800 border-zinc-700 text-zinc-300 placeholder:text-zinc-600"
                />
              </div>
            )}
            {tokens.length === 0 ? (
              <p className="text-[11px] text-zinc-600 px-1 py-4 text-center">No CSS custom properties found</p>
            ) : (
              Object.entries(groupedTokens).map(([cat, items]) => (
                <div key={cat}>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 px-1 mb-1">{cat}</p>
                  {items.map(token => (
                    <TokenRow key={token.name} token={token} onUpdate={onUpdateToken} onReset={onResetToken} />
                  ))}
                </div>
              ))
            )}
          </div>
        )}

        {/* ========= TYPOGRAPHY ========= */}
        <SectionHeader
          label="Typography"
          icon={<Type className="h-3.5 w-3.5" />}
          count={fonts.length}
          expanded={expanded.fonts}
          onToggle={() => toggleSection('fonts')}
        />
        {expanded.fonts && (
          <div className="space-y-1 pb-3">
            {fonts.length === 0 ? (
              <p className="text-[11px] text-zinc-600 px-1 py-4 text-center">No fonts detected</p>
            ) : (
              fonts.map(f => (
                <div key={f.family}>
                  <button
                    onClick={() => setFontPicker(fontPicker === f.family ? null : f.family)}
                    className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-lg text-zinc-400 w-7 text-center shrink-0" style={{ fontFamily: f.family }}>Aa</span>
                      <span className="text-[11px] text-zinc-300 truncate">{f.family}</span>
                    </div>
                    <span className="text-[9px] text-zinc-600 shrink-0 tabular-nums">{f.usageCount}</span>
                  </button>
                  {fontPicker === f.family && (
                    <div className="ml-2 mr-1 mb-2 p-2 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                      <Input
                        value={fontSearch}
                        onChange={e => setFontSearch(e.target.value)}
                        placeholder="Search fonts..."
                        className="h-7 text-[11px] bg-zinc-800 border-zinc-700 text-zinc-300 placeholder:text-zinc-600 mb-2"
                        autoFocus
                      />
                      <div className="max-h-40 overflow-y-auto space-y-0.5">
                        {filteredFonts.map(font => (
                          <button
                            key={font}
                            onClick={() => { onUpdateFont(f.family, font); setFontPicker(null); setFontSearch('') }}
                            className="w-full text-left px-2 py-1 rounded text-[11px] text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 transition-colors truncate"
                          >
                            {font}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* ========= COLORS (Selection-aware) ========= */}
        {showSelectionColors ? (
          // ---- SELECTION COLORS MODE ----
          <>
            <div className="flex items-center justify-between px-2 py-2">
              <div className="flex items-center gap-2">
                <MousePointer2 className="h-3.5 w-3.5 text-indigo-400" />
                <span className="text-[11px] font-semibold text-zinc-300">
                  Selection
                </span>
                <span className="text-[10px] text-zinc-500 font-mono bg-zinc-800 px-1.5 py-0.5 rounded">
                  &lt;{selectedElement.tagName}&gt;
                </span>
              </div>
              <button
                onClick={() => setShowAllColors(true)}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Show all
              </button>
            </div>
            <div className="space-y-1 px-1 pb-3">
              {selectedElement.colors.map((sc, i) => (
                <button
                  key={`${sc.property}-${i}`}
                  onClick={() => { setEditingSelColor(sc.property); setSelColorInput(sc.value) }}
                  className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg transition-colors text-left ${editingSelColor === sc.property ? 'bg-zinc-800 ring-1 ring-indigo-500/30' : 'hover:bg-zinc-800/50'}`}
                >
                  <div
                    className="w-8 h-8 rounded-lg border-2 border-zinc-700 shrink-0"
                    style={{ backgroundColor: sc.value }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-zinc-300">{sc.label}</p>
                    <p className="text-[10px] text-zinc-500 font-mono">{sc.value}</p>
                  </div>
                  <span className="text-[10px] text-zinc-600 shrink-0">Edit</span>
                </button>
              ))}

              {/* Inline editor for selected element color */}
              {editingSelColor && (
                <div className="mx-1 p-3 bg-zinc-800 rounded-xl border border-zinc-700 space-y-2.5">
                  {/* Color swatch + hex input row */}
                  <div className="flex items-center gap-2">
                    <label className="relative shrink-0 cursor-pointer">
                      <div className="w-9 h-9 rounded-lg border-2 border-zinc-600" style={{ backgroundColor: selColorInput }} />
                      <input
                        type="color"
                        value={selColorInput}
                        onChange={e => setSelColorInput(e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                    </label>
                    <Input
                      value={selColorInput}
                      onChange={e => setSelColorInput(e.target.value)}
                      className="h-8 flex-1 text-[11px] bg-zinc-900 border-zinc-600 text-zinc-300 font-mono"
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          const sc = selectedElement.colors.find(c => c.property === editingSelColor)
                          if (sc) onUpdateElementColor(selectedElement.editId, editingSelColor, sc.value, selColorInput)
                          setEditingSelColor(null)
                        }
                        if (e.key === 'Escape') setEditingSelColor(null)
                      }}
                      autoFocus
                    />
                  </div>
                  {/* Opacity slider */}
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-zinc-500 w-10 shrink-0">Opacity</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      defaultValue="100"
                      onChange={e => {
                        const alpha = parseInt(e.target.value) / 100
                        // Convert hex to rgba
                        const hex = selColorInput.replace('#', '')
                        const r = parseInt(hex.substring(0, 2), 16)
                        const g = parseInt(hex.substring(2, 4), 16)
                        const b = parseInt(hex.substring(4, 6), 16)
                        setSelColorInput(`rgba(${r},${g},${b},${alpha})`)
                      }}
                      className="flex-1 h-1.5 rounded-full appearance-none bg-zinc-700 accent-indigo-500 cursor-pointer"
                    />
                    <span className="text-[9px] text-zinc-500 w-7 text-right tabular-nums">100%</span>
                  </div>
                  {/* Apply buttons — always visible */}
                  <div className="flex gap-2 pt-0.5">
                    <Button
                      size="sm"
                      onClick={() => {
                        const sc = selectedElement.colors.find(c => c.property === editingSelColor)
                        if (sc) onUpdateElementColor(selectedElement.editId, editingSelColor, sc.value, selColorInput)
                        setEditingSelColor(null)
                      }}
                      className="h-7 flex-1 text-[10px] font-medium bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      This element
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        const sc = selectedElement.colors.find(c => c.property === editingSelColor)
                        if (sc) onUpdateColor(sc.value, selColorInput)
                        setEditingSelColor(null)
                      }}
                      className="h-7 flex-1 text-[10px] font-medium bg-zinc-700 hover:bg-zinc-600 text-zinc-200 border border-zinc-600"
                    >
                      All matching
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          // ---- GLOBAL COLORS MODE ----
          <>
            <SectionHeader
              label="Colors"
              icon={<Palette className="h-3.5 w-3.5" />}
              count={colors.length}
              expanded={expanded.colors}
              onToggle={() => toggleSection('colors')}
            />
            {selectedElement && showAllColors && (
              <button
                onClick={() => setShowAllColors(false)}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 px-2 mb-1 transition-colors"
              >
                ← Back to selection
              </button>
            )}
            {expanded.colors && (
              <div className="pb-3">
                {colors.length === 0 ? (
                  <p className="text-[11px] text-zinc-600 px-1 py-4 text-center">No colors detected</p>
                ) : (
                  <>
                    {colorGroups.primary.length > 0 && (
                      <ColorGroup label="Primary" colors={colorGroups.primary} editingColor={editingColor} colorInput={colorInput}
                        onStartEdit={(c) => { setEditingColor(c.color); setColorInput(c.color) }}
                        onInputChange={setColorInput}
                        onApply={(oldColor) => { onUpdateColor(oldColor, colorInput); setEditingColor(null) }}
                        onCancel={() => setEditingColor(null)}
                      />
                    )}
                    {colorGroups.accent.length > 0 && (
                      <ColorGroup label="Accent" colors={colorGroups.accent} editingColor={editingColor} colorInput={colorInput}
                        onStartEdit={(c) => { setEditingColor(c.color); setColorInput(c.color) }}
                        onInputChange={setColorInput}
                        onApply={(oldColor) => { onUpdateColor(oldColor, colorInput); setEditingColor(null) }}
                        onCancel={() => setEditingColor(null)}
                      />
                    )}
                    {colorGroups.rest.length > 0 && (
                      <ColorGroup label="Other" colors={colorGroups.rest} editingColor={editingColor} colorInput={colorInput}
                        onStartEdit={(c) => { setEditingColor(c.color); setColorInput(c.color) }}
                        onInputChange={setColorInput}
                        onApply={(oldColor) => { onUpdateColor(oldColor, colorInput); setEditingColor(null) }}
                        onCancel={() => setEditingColor(null)}
                      />
                    )}
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </ScrollArea>
  )
}

// ---- Sub-components ----

function SectionHeader({ label, icon, count, expanded, onToggle }: {
  label: string; icon: React.ReactNode; count: number; expanded: boolean; onToggle: () => void
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-2 py-2 rounded-lg hover:bg-zinc-800/50 transition-colors"
    >
      <div className="flex items-center gap-2">
        {expanded ? <ChevronDown className="h-3 w-3 text-zinc-500" /> : <ChevronRight className="h-3 w-3 text-zinc-500" />}
        <span className="text-zinc-400">{icon}</span>
        <span className="text-[11px] font-semibold text-zinc-300">{label}</span>
      </div>
      <span className="text-[9px] text-zinc-600 tabular-nums">{count}</span>
    </button>
  )
}

function TokenRow({ token, onUpdate, onReset }: {
  token: DesignToken; onUpdate: (name: string, val: string) => void; onReset: (name: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(token.value)
  const isColor = /^#[0-9a-f]{3,8}$/i.test(token.value.trim()) || /^rgb/i.test(token.value.trim())
  const isDirty = token.value !== token.originalValue

  return (
    <div className="flex items-center gap-1.5 px-1 py-0.5 rounded hover:bg-zinc-800/30 group">
      <span className="text-[10px] font-mono text-zinc-500 truncate flex-1 min-w-0" title={token.name}>
        {token.name.replace(/^--/, '')}
      </span>
      <div className="flex items-center gap-1 shrink-0">
        {isColor && (
          <div className="w-4 h-4 rounded border border-zinc-600 shrink-0" style={{ backgroundColor: token.value }} />
        )}
        {editing ? (
          <input
            type={isColor ? 'color' : 'text'}
            value={val}
            onChange={e => setVal(e.target.value)}
            onBlur={() => { onUpdate(token.name, val); setEditing(false) }}
            onKeyDown={e => {
              if (e.key === 'Enter') { onUpdate(token.name, val); setEditing(false) }
              if (e.key === 'Escape') { setVal(token.value); setEditing(false) }
            }}
            className="h-5 w-20 px-1 text-[10px] bg-zinc-800 border border-zinc-600 rounded text-zinc-300 outline-none focus:border-indigo-500"
            autoFocus
          />
        ) : (
          <button
            onClick={() => { setVal(token.value); setEditing(true) }}
            className="text-[10px] text-zinc-400 hover:text-zinc-200 px-1 py-0.5 rounded hover:bg-zinc-700 transition-colors truncate max-w-[80px]"
            title={token.value}
          >
            {token.value}
          </button>
        )}
        {isDirty && (
          <button onClick={() => onReset(token.name)} className="opacity-0 group-hover:opacity-100 transition-opacity" title="Reset to original">
            <RotateCcw className="h-3 w-3 text-zinc-600 hover:text-zinc-400" />
          </button>
        )}
      </div>
    </div>
  )
}

function ColorGroup({ label, colors, editingColor, colorInput, onStartEdit, onInputChange, onApply, onCancel }: {
  label: string; colors: ColorEntry[]; editingColor: string | null; colorInput: string
  onStartEdit: (c: ColorEntry) => void; onInputChange: (val: string) => void
  onApply: (oldColor: string) => void; onCancel: () => void
}) {
  return (
    <div className="mb-3">
      <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 px-2 mb-1.5">{label}</p>
      <div className="grid grid-cols-4 gap-1.5 px-1">
        {colors.map(c => (
          <div key={c.color} className="relative flex flex-col items-center">
            <button
              onClick={() => onStartEdit(c)}
              className={`w-10 h-10 rounded-lg border-2 transition-all hover:scale-110 ${editingColor === c.color ? 'border-indigo-500 ring-2 ring-indigo-500/30' : 'border-zinc-700 hover:border-zinc-500'}`}
              style={{ backgroundColor: c.color }}
              title={`${c.color} (${c.usageCount} uses)`}
            />
            <span className="text-[8px] text-zinc-600 mt-0.5 tabular-nums">{c.usageCount}</span>
            {editingColor === c.color && (
              <div className="absolute top-12 left-1/2 -translate-x-1/2 z-10 p-2 bg-zinc-800 rounded-lg border border-zinc-700 shadow-xl w-44">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <input type="color" value={colorInput} onChange={e => onInputChange(e.target.value)} className="w-8 h-6 rounded cursor-pointer border-0 bg-transparent" />
                  <Input value={colorInput} onChange={e => onInputChange(e.target.value)}
                    className="h-6 w-20 text-[10px] bg-zinc-900 border-zinc-600 text-zinc-300 font-mono"
                    onKeyDown={e => { if (e.key === 'Enter') onApply(c.color); if (e.key === 'Escape') onCancel() }}
                    autoFocus
                  />
                </div>
                <div className="flex gap-1">
                  <Button size="sm" onClick={() => onApply(c.color)} className="h-5 text-[9px] px-2 bg-indigo-600 hover:bg-indigo-700 text-white">Apply all</Button>
                  <Button size="sm" variant="ghost" onClick={onCancel} className="h-5 text-[9px] px-2 text-zinc-500">Cancel</Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
