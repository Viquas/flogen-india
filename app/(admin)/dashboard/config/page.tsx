"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Save, AlertCircle, Loader2, Info } from "lucide-react"
import { getConfiguration, saveConfiguration } from "./actions"

const DEFAULT_RULES = `# WebGen AI Rules — Default Configuration
# Edit this file and click "Save Rules" to apply globally to all generations.

## ICONS
- Use ONLY verified lucide-react icon names from this whitelist:
  Core: ArrowRight, ArrowLeft, ArrowUp, ArrowDown, ChevronRight, ChevronLeft, ChevronDown, ChevronUp,
  Check, X, Plus, Minus, Search, Menu, Send, Download, Upload, Share2, Copy, Pencil, Trash2, ExternalLink,
  Star, Heart, Bookmark, Bell, Settings, Info, AlertCircle, HelpCircle, Eye, EyeOff, Lock, Unlock,
  Play, Pause, Volume2, Camera, Mic,
  Phone, Mail, MapPin, Clock, Calendar, Globe, Users, User, Building2, Briefcase, Zap, Shield, Award, TrendingUp, CheckCircle
  Industry: Scissors, Sparkles, Sparkle, Droplet, Flower, Brush, Gem, Crown, Bath, SprayCan, Flower2,
  Coffee, Wine, UtensilsCrossed, Utensils, Flame, Dumbbell, Activity, Stethoscope, Smile,
  GraduationCap, Book, BookOpen, Palette, Car, Wrench, Hammer, HardHat, Home, Key, Ruler,
  ShoppingCart, CreditCard, Gift, Truck, Scale, Gavel, Wallet, Calculator,
  Plane, Ship, Luggage, Aperture, Headphones, PawPrint, Dog, Cat, Leaf, Sun, Moon, Cloud, Wind, TreePine, Timer
- NEVER use: ArrowUpCircle, ArrowDownCircle, LogIn, LogOut, Edit, or any icon outside the list.
- NEVER name any variable, component, or function: Map, Set, Array, Image, Screen, Window, or any browser global.
- HEROICONS FALLBACK: If a Lucide icon does not render or is missing, fall back to writing raw inline SVGs from heroicons.com into the component.
- ICON CONTRAST: When placing an icon in a container, ensure high contrast (e.g. \\\`text-white\\\` inside a dark/primary container).

## IMAGES
- Every <img> MUST include src, alt, loading="lazy", and a Pexels onError fallback (e.g. \\\`https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg\\\`).
- Use ONLY verified Unsplash photo IDs for the main src. Never invent photo IDs. You MUST NOT use placehold.co.
- Verified Unsplash IDs:
  Beauty:     1522337915551-9a2a95c4f33e | 1560066984-138daed4a7fb | 1487412720507-e7ab37603c6f
  Sports:     1534438327431-90a7bfbf0c50 | 1571019613454-1cb2f99b2d8b | 1526506118085-60ce8714f8c5
  Food:       1504674900247-0877df9cc836 | 1414235077428-338989a2e8c0 | 1565299624946-b28f40a0ae38
  Tech:       1518770660439-4636190af475 | 1461749280684-dccba630e2f6 | 1498050108023-c5249f4df085
  Healthcare: 1576091160399-112ba8d25d1d | 1559839734-2b71ea197ec2 | 1631815589968-fdb09a223b1e
  Retail:     1441986300917-64674bd600d8 | 1472851294608-062f824d29cc | 1607082349566-187342175046
  Real Est.:  1560518883-ce09059eeffa    | 1512917774080-9991f1c4c750 | 1582407947304-d5a4b9e8e595
  Auto:       1486262715619-5d3ae3c5a8e4 | 1492144534655-ae79c964c9d7 | 1503376780353-7e6692767b70
  Business:   1497366216548-37526070297c | 1522202176988-66273c7fd55a | 1600880292203-757bb62b4baf

## LAYOUT & COLOR
- Follow the AESTHETIC DIRECTION from the system prompt — do NOT override with a single palette.
- Card backgrounds MUST match their section: dark cards on dark sections, light cards on light sections. NEVER use bg-white on a dark section.
- Single Primary Color: Pick ONE accent color based on industry. Apply it for main CTAs and key highlights only.
- No cookie consent banners, GDPR popups, or overlays rendered on first mount.
- Navigation: sticky, backdrop-blur, collapses to hamburger on mobile.
- Generous spacing: py-24 md:py-32 on all major sections.
- Footer: multi-column with links, contact info, and copyright.

## TYPOGRAPHY
- Hero headline: text-5xl md:text-7xl font-semibold tracking-tighter (NOT font-bold — too heavy for premium)
- Section title: text-3xl md:text-4xl font-semibold tracking-tight
- Card title: text-lg font-medium
- Body: text-base font-normal leading-relaxed (text color matches section: text-zinc-600 on light, text-zinc-300 on dark)
- WEIGHT RULE: Prefer font-medium over font-semibold. Prefer font-semibold over font-bold. Use font-bold ONLY for bold-energy direction. Never use font-extrabold except for bold-energy hero headlines.

## ABOUT SECTION IMAGE (MANDATORY)
- The "About Us" section MUST have a real photograph (Unsplash <img>).
- ABSOLUTELY FORBIDDEN to use text-based placeholders.

## MAP SECTION
- Contact/Location section MUST use a Google Maps Embed iframe.
- NEVER use a static image or screenshot for the map.

## LINKS
- For mailto: and tel: links, NEVER use target="_blank".

## FORBIDDEN (WILL CRASH PREVIEW)
- class Foo extends Map / Set / Array / WeakMap
- localStorage, sessionStorage, fetch(), window.open, window.location
- <script> tags or dangerouslySetInnerHTML
- Markdown fences in output
`

export default function ConfigPage() {
    const [rules, setRules] = useState("")
    const [initialRules, setInitialRules] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)

    useEffect(() => {
        const loadRules = async () => {
            const res = await getConfiguration('rules.md')
            if (res.success && res.value) {
                setRules(res.value)
                setInitialRules(res.value)
            } else {
                // Check if they have rules in localStorage and migrate them
                const localRules = localStorage.getItem("web-factory-rules")
                if (localRules) {
                    setRules(localRules)
                } else {
                    // No DB record and no localStorage — pre-populate with the default template
                    setRules(DEFAULT_RULES)
                }
            }
            setIsLoading(false)
        }
        loadRules()
    }, [])

    const handleSave = async () => {
        setIsSaving(true)
        setStatus(null)

        const res = await saveConfiguration('rules.md', rules)

        if (res.success) {
            setStatus({ type: 'success', message: 'Configuration saved successfully.' })
            setInitialRules(rules)
            // Still sync to localStorage for backwards compatibility with any un-migrated client components
            localStorage.setItem("web-factory-rules", rules)
        } else {
            setStatus({ type: 'error', message: res.error || 'Failed to save configuration.' })
        }
        setIsSaving(false)
    }

    const hasChanges = rules !== initialRules

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
        )
    }

    return (
        <div className="max-w-4xl space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight pb-2 border-b">System Configuration</h1>
                <p className="text-muted-foreground mt-2">
                    Manage global settings, AI instructions, and system parameters.
                </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
                <div className="p-6 space-y-4">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 text-purple-600" />
                                rules.md (The Brain)
                            </h2>
                            <p className="text-sm text-zinc-500">
                                This markdown is injected into the AI system prompts as the absolute highest priority design authority.
                                Use it to enforce typography, strict color palettes, tone of voice, or component libraries.
                            </p>
                        </div>
                        <Button
                            onClick={handleSave}
                            disabled={isSaving || !hasChanges}
                            className="bg-blue-600 hover:bg-blue-700 gap-2 shrink-0"
                        >
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            Save Rules
                        </Button>
                    </div>

                    <div className="bg-blue-50 text-blue-800 text-sm p-3 rounded-lg flex items-center gap-3">
                        <Info className="h-5 w-5 shrink-0" />
                        <p>
                            Historically, these rules lived in localStorage. We have upgraded to a global database-backed
                            knowledge graph. Saving here ensures all team members execute Discovery jobs with unified branding.
                        </p>
                    </div>

                    <Textarea
                        value={rules}
                        onChange={(e) => setRules(e.target.value)}
                        placeholder="Write your system rules here..."
                        className="min-h-[500px] font-mono text-sm bg-zinc-50 outline-none"
                    />

                    {status && (
                        <div className={`p-3 rounded-md text-sm font-medium ${status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {status.message}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
