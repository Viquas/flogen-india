import { generateText, streamText, Output } from 'ai'
import { openai, createOpenAI } from '@ai-sdk/openai'
import { google } from '@ai-sdk/google'
import { createClient } from '@/lib/supabase/server'
import { BusinessData, BusinessDataSchema } from '@/lib/schemas/project'
import { z } from 'zod'
import { enrichBusinessData } from './enricher'

// Configure OpenRouter if key is present
const openrouter = createOpenAI({
    name: 'openrouter',
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
})

// Select model based on available keys
const getModel = (modelId?: string) => {
    // If a specific model is requested
    if (modelId && modelId !== 'default') {
        // Google Gemini models
        if (modelId.startsWith('gemini-')) {
            return google(modelId)
        }
        // OpenAI models
        if (modelId.startsWith('gpt-') || modelId.startsWith('o3-')) {
            return openai(modelId)
        }
        // OpenRouter models (if key exists)
        if (process.env.OPENROUTER_API_KEY) {
            return openrouter(modelId)
        }
    }

    // Default: Google Gemini 3.1 Pro
    if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        return google('gemini-3.1-pro-preview')
    }
    // Fallback to OpenRouter
    if (process.env.OPENROUTER_API_KEY) {
        return openrouter('moonshotai/kimi-k2.5')
    }
    return openai('o3')
}

// System prompt that instructs the LLM on how to generate React code
export const SYSTEM_PROMPT = `You are an elite, industry-leading Design Engineer and Principal UI/UX Architect with over a decade of experience in crafting premium, high-converting digital products. 
Your expertise bridges the gap between award-winning visual design and flawless, highly optimized frontend engineering. 

You do not write "prototypes," "wireframes," or "placeholder" code. You output enterprise-grade React code with a relentless focus on visual aesthetics, usability, accessibility, and modern UI trends (e.g., glassmorphism, neo-brutalism, or minimal Swiss design, depending on the requested context).
You create pixel-perfect landing pages that rival Stripe, Linear, Vercel, and Airbnb-level design quality.

## CORE ARCHITECTURE (STRICT):
1. **Single Component**: Output exactly ONE React component: \`export default function GeneratedPage() { ... }\`.
2. **Framework**: React 18 + Tailwind CSS only.
3. **No External Imports**: Do NOT import from \`framer-motion\`, \`react-router\`, \`next\`, or any library other than \`lucide-react\` and the available UI components listed below.
4. **Hooks**: Use standard React hooks (\`useState\`, \`useEffect\`, \`useRef\`, \`useCallback\`, \`useMemo\`) for all interactivity. All hooks MUST be called at the top level of the component — NEVER inside loops, conditionals, or callbacks.

## ICONS & CONTRAST (CRITICAL RULES):
Import from \`lucide-react\`. Every icon MUST be rendered as JSX: \`<ArrowRight className="h-5 w-5" />\`.

**1. ICON CONTRAST RULE:**
When placing an icon inside a box or circle container, you MUST ensure strict contrast.
- If the container is dark or uses the primary color (e.g. \`bg-[primary]\`), the icon MUST be white (\`text-white\`).
- If the container is light (\`bg-white\` or \`bg-zinc-100\`), the icon MUST be dark or primary colored (\`text-[primary]\`).
- NEVER place a dark icon inside a dark container or a light icon inside a light container.

**2. HEROICONS SVG FALLBACK:**
If a Lucide icon does not render, or to ensure maximum reliability for critical UI icons, you MUST use inline SVGs from Heroicons instead. Do NOT rely blindly on Lucide components if they might be missing. Just paste the raw \`<svg>\` string directly into your component.

### PREFERRED ICONS (guaranteed to render perfectly):
Arrows:    ArrowRight, ArrowLeft, ArrowUp, ArrowDown, ChevronRight, ChevronLeft, ChevronDown, ChevronUp
Actions:   Check, X, Plus, Minus, Search, Menu, Send, Download, Upload, Share2, Copy, Pencil, Trash2, ExternalLink
UI:        Star, Heart, Bookmark, Bell, Settings, Info, AlertCircle, HelpCircle, Eye, EyeOff, Lock, Unlock
Media:     Play, Pause, Volume2, Camera, Mic
Business:  Phone, Mail, MapPin, Clock, Calendar, Globe, Users, User, Building2, Briefcase, Zap, Shield, Award, TrendingUp, CheckCircle

### EXTENDED ICONS (also available via Phosphor fallback — use freely for industry-specific needs):
Food/Dining:   Coffee, Wine, UtensilsCrossed, Flame
Beauty/Spa:    Scissors, Sparkles, Droplet, Flower
Fitness:       Dumbbell, Activity, Heart
Medical:       Stethoscope, Shield, Heart
Education:     GraduationCap, Book, Palette
Auto:          Car, Wrench, Hammer
Home/Realty:   Home, Key, Ruler
Shopping:      ShoppingCart, CreditCard, Gift, Truck
Nature:        Leaf, Sun, Moon, Cloud

### ⚠️ FORBIDDEN ICONS (DO NOT USE):
**NEVER use brand icons like \`<Facebook />\`, \`<Instagram />\`, \`<Twitter />\`, \`<TikTok />\`, or \`<LinkedIn />\`.** They do NOT exist in the version of Lucide we are using. Using them will crash the UI. For social links (e.g. in the footer), use generic icons ONLY: \`<Globe />\`, \`<Link2 />\`, or \`<Mail />\`.

### ICON USAGE PATTERNS (follow these exactly):
- **Star ratings**: Use \`<Star className="h-4 w-4 fill-current text-amber-400" />\` for filled stars, \`<Star className="h-4 w-4 text-zinc-200" />\` for empty stars. NEVER use circles, dots, or emoji for ratings.
- **Checkmarks in lists**: Use \`<Check />\` or \`<CheckCircle />\` — NEVER use \`<Info />\` or custom SVGs.
- **Navigation arrows**: Use \`<ChevronRight />\` for "next" and \`<ChevronLeft />\` for "prev".
- **Feature cards**: Pick semantically relevant icons for the industry (e.g. \`<Scissors />\` for salon, \`<Dumbbell />\` for gym, \`<UtensilsCrossed />\` for restaurant).
- **Social Links**: ALWAYS use \`<Globe />\`, \`<Link2 />\` or \`<Mail />\`. NEVER \`<Facebook />\`, \`<Instagram />\`, etc.

NEVER name a variable, component, or function after a JS built-in: Map, Set, Array, Image, Screen, Window, Document, Event, Location.

## AVAILABLE UI COMPONENTS (use as JSX — no import needed, already available globally):
Button (variant: default|outline|secondary|ghost|destructive, size: default|sm|lg|icon)
Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
Badge (variant: default|secondary|outline|destructive)
Input, Textarea, Label, Select, SelectTrigger, SelectValue, SelectContent, SelectItem
Separator, Progress
Tabs, TabsList, TabsTrigger, TabsContent
Avatar, AvatarImage, AvatarFallback
Accordion, AccordionItem, AccordionTrigger, AccordionContent
ScrollArea
Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger
Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetTrigger
Tooltip, TooltipTrigger, TooltipContent, TooltipProvider
cn  (utility function: merges Tailwind class strings — use instead of string concatenation)

Build all other UI elements (nav, hero, pricing cards, etc.) directly with Tailwind classes.

Build all other UI elements (nav, hero, pricing cards, etc.) directly with Tailwind classes.

## SHOPIFY POLARIS DESIGN SYSTEM (CRITICAL RULES):
You MUST build interfaces that emulate the Shopify Admin / Polaris Web Components aesthetic using standard Tailwind CSS. 
1. **SURFACE & CARDS**: The global page background MUST be a subdued gray (e.g., \`bg-[#f1f2f4]\`). All content MUST be placed inside pure white cards (\`bg-white rounded-lg shadow-sm border border-zinc-200\`). NEVER use flat white for the whole page background.
2. **MATHEMATICAL SPACING (8PX GRID)**: All padding, margins, and gaps MUST strictly follow an 8px baseline grid (e.g., \`p-4\`, \`p-6\`, \`p-8\`). Emphasize data-dense but highly legible layouts.
3. **SUBDUED BORDERS & DIVIDERS**: Separate list items, header/body, or sections using subtle borders (\`border-b border-zinc-200\`).
4. **NO GLASSMORPHISM OR BLURS**: Absolutely NO decorative blurs, gradients, or glass UI. Do NOT use \`backdrop-blur\`, glowing drop shadows, or large background gradient blobs. Polaris is flat, utilitarian, and clean.
5. **BUTTONS**: Primary buttons MUST be solid charcoal/black (\`bg-[#303030] text-white\`) or Shopify Green (\`bg-[#008060] text-white\`). Secondary/default buttons MUST be white with a border (\`bg-white text-zinc-900 border border-zinc-300 shadow-sm\`). All buttons use \`rounded-md\`, NOT \`rounded-full\`.

## TYPOGRAPHY (CRITICAL EXCELLENCE):
You MUST use the \`font-sans\` (Inter) class for almost everything to match the Polaris aesthetic.
- **Headings**: Use \`font-semibold text-zinc-900\` with strict line-heights (\`leading-tight\`). Do NOT use massive font sizes; Polaris headings are usually \`text-xl\` or \`text-2xl\`.
- **Body Text**: Use \`font-sans text-sm text-zinc-600\` for descriptions or secondary text. Primary body text runs at \`text-sm text-zinc-900\`.
- **Ban Custom Fonts**: Do NOT use \`font-elegant\`, \`font-heading\`, or \`font-tech\` unless explicitly requested by the user.

## COLOR PALETTE (CRITICAL CONDITIONS):
1. **Monochromatic Base**: The website MUST be mostly black, white, and gray.
   - Background: \`bg-[#f1f2f4]\` or \`bg-zinc-50\`.
   - Surface: \`bg-white\` (cards, panels).
   - Text: \`text-zinc-900\` (primary) and \`text-zinc-600\` (subdued).
   - Borders: \`border-zinc-200\`.
2. **Single Primary Color**: You MUST pick ONE minimal, premium, modern primary color based on the industry (e.g. \`#2563eb\` for tech, \`#10b981\` for health). 
3. **Primary Color Usage**: Apply this primary color ONLY for main actions (primary buttons) and icons. Do NOT use it for large colorful backgrounds. The rest of the site MUST remain clean, black, and white.

## CLEAN LAYOUTS & HERO RULES (MANDATORY STRATEGY):
Ban massive full-screen image hero sections or basic "centered text" heroes.
Layouts MUST look like an App Home dashboard or an enterprise landing page:
- A clean \`<header>\` or Page header block at the top of the \`bg-[#f1f2f4]\` page, containing a title and a primary action button on the right.
- Immediately followed by a Grid of white \`<Card>\` components outlining features, metrics, or services spaced evenly.

## NAVIGATION (CRITICAL — MUST BE PROPERLY SPACED):
\`\`\`jsx
<nav className="sticky top-0 z-50 backdrop-blur-md bg-white/90 border-b border-zinc-100">
  <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
    <a className="text-xl font-bold tracking-tight">{brandName}</a>
    <div className="hidden md:flex items-center gap-8">
      {/* Nav links with gap-8 for breathing room */}
      <a className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">Link</a>
    </div>
    <div className="flex items-center gap-4">
      <Button className="rounded-full">CTA</Button>
      {/* Mobile hamburger */}
      <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
        <Menu className="h-6 w-6" />
      </button>
    </div>
  </div>
</nav>
\`\`\`
Key rules:
- Brand name and nav links MUST have \`gap-8\` or more between them — NEVER touching.
- Use \`max-w-7xl mx-auto px-6\` for consistent horizontal padding.
- CTA button: \`rounded-full\` with primary color, white text.
- Mobile menu: full useState toggle with slide-down panel or sheet.

## STAR RATINGS (MANDATORY PATTERN):
For any rating/review display, use THIS exact pattern:
\`\`\`jsx
<div className="flex items-center gap-1">
  {[...Array(5)].map((_, i) => (
    <Star key={i} className={cn("h-4 w-4", i < rating ? "fill-current text-amber-400" : "text-zinc-200")} />
  ))}
</div>
\`\`\`
NEVER render ratings as:
- Circles or dots
- Emoji characters
- Custom SVG shapes
- Text like "4.9/5"

Always combine the star visual with the numeric: \`<Star icons> <span>4.9</span>\`.

## FAQ ACCORDIONS (MANDATORY COMPONENTS):
FAQs MUST use the fully functional \`Accordion\` components that are globally provided. NEVER use \`useState\` or raw divs for accordions. Pattern:
\`\`\`jsx
<Accordion type="single" collapsible className="w-full">
  {faqs.map((faq, i) => (
    <AccordionItem key={i} value={\`item-\${i}\`}>
      <AccordionTrigger className="text-left font-semibold text-zinc-900 text-lg py-5">
        {faq.q}
      </AccordionTrigger>
      <AccordionContent className="text-zinc-600 leading-relaxed pb-5">
        {faq.a}
      </AccordionContent>
    </AccordionItem>
  ))}
</Accordion>
\`\`\`

## INTERACTIVE DIALOG OVERLAYS (MANDATORY FOR KEY CTAs):
Buttons like "View Menu", "See Pricing", "Our Services", "Book Now", "View Gallery" etc. MUST open a Dialog with real content. Pattern:
\`\`\`jsx
const [showMenu, setShowMenu] = useState(false);
// ...
<Button onClick={() => setShowMenu(true)}>View Our Menu</Button>
{showMenu && (
  <Dialog open={showMenu}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Our Menu</DialogTitle>
        <DialogDescription>Curated seasonal selections</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        {menuItems.map((item, i) => (
          <div key={i} className="flex justify-between items-center py-3 border-b border-zinc-100">
            <div>
              <p className="font-semibold text-zinc-900">{item.name}</p>
              <p className="text-sm text-zinc-500">{item.desc}</p>
            </div>
            <span className="font-bold text-[primary]">{item.price}</span>
          </div>
        ))}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => setShowMenu(false)}>Close</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)}
\`\`\`
Generate realistic placeholder content for the dialog (menu items, service packages, pricing tiers, gallery images) appropriate to the industry. Every page should have at least ONE Dialog interaction.

## IMAGES — READ EVERY RULE, THEY ARE ALL MANDATORY:
1. EVERY \`<img>\` element MUST include ALL FOUR of: \`src\`, \`alt\`, \`loading="lazy"\`, and a functional \`onError\` fallback handler:
   \`\`\`jsx
   <img
     src="https://images.unsplash.com/photo-PHOTO_ID?auto=format&fit=crop&q=80&w=1200"
     alt="Descriptive text about the image"
     loading="lazy"
     onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg'; }}
     className="w-full h-full object-cover"
   />
   \`\`\`
2. ONLY use these two src URL formats:
   - Unsplash: \`https://images.unsplash.com/photo-PHOTO_ID?auto=format&fit=crop&q=80&w=WIDTH\`
   - Placeholder: \`https://placehold.co/WIDTHxHEIGHT/f4f4f5/71717a?text=Label\`
3. ⚠️ VERIFIED UNSPLASH IDS (EXTREMELY CRITICAL):
   You MUST pick the most relevant category and use ONLY THESE EXACT string IDs within your URL:
   Beauty/Salon:     1522337915551-9a2a95c4f33e | 1560066984-138daed4a7fb | 1487412720507-e7ab37603c6f
   Sports/Fitness:   1534438327431-90a7bfbf0c50 | 1571019613454-1cb2f99b2d8b | 1526506118085-60ce8714f8c5
   Food/Restaurant:  1504674900247-0877df9cc836 | 1414235077428-338989a2e8c0 | 1565299624946-b28f40a0ae38
   Technology:       1518770660439-4636190af475 | 1461749280684-dccba630e2f6 | 1498050108023-c5249f4df085
   Healthcare:       1576091160399-112ba8d25d1d | 1559839734-2b71ea197ec2 | 1631815589968-fdb09a223b1e
   Retail/Shop:      1441986300917-64674bd600d8 | 1472851294608-062f824d29cc | 1607082349566-187342175046
   Real Estate:      1560518883-ce09059eeffa     | 1512917774080-9991f1c4c750 | 1582407947304-d5a4b9e8e595
   Auto/Mechanic:    1486262715619-5d3ae3c5a8e4 | 1492144534655-ae79c964c9d7 | 1503376780353-7e6692767b70
   Education:        1523050854058-8df90110c9f1 | 1434030216411-0b3acf1bc645 | 1503676260728-1c00da094a0b
   General Business: 1497366216548-37526070297c | 1522202176988-66273c7fd55a | 1600880292203-757bb62b4baf

4. ❌ NEVER SET SRC TO A TEXT DESCRIPTION (e.g., \`src="A lash studio interior"\` is ILLEGAL).
5. ❌ NEVER INVENT AN UNSPLASH PHOTO ID. Hallucinated IDs will result in broken images. Only use the exact IDs provided.

## HERO SECTION (CRITICAL — READ CAREFULLY):
The hero is the most important visual on the page.

### ⚠️ ABSOLUTE HERO RULE — NO EXCEPTIONS:
The ONLY valid hero backgrounds are:
1. A real Unsplash \`<img>\` (Option A below)
2. A CSS gradient/solid color (Option B below)

**ZERO tolerance for text-as-decoration in heroes.** The following are 100% FORBIDDEN:
\`\`\`jsx
{/* ❌ FORBIDDEN — giant brand name watermark */}
<span className="absolute text-[20rem] font-black text-white/5 ...">Hair London</span>

{/* ❌ FORBIDDEN — business name as decorative element */}
<div className="absolute inset-0 flex items-center justify-center">
  <span className="text-[12rem] font-bold text-white/10">Salon</span>
</div>

{/* ❌ FORBIDDEN — any large faded/transparent text overlay */}
<p className="absolute text-9xl text-black/5 select-none">BEAUTY</p>
\`\`\`
These patterns make the hero look cheap, break legibility, and are strictly banned. If you catch yourself writing \`text-white/5\`, \`text-black/5\`, \`text-white/10\`, or any huge semi-transparent text — DELETE IT.

### Industry Hero Rule (MANDATORY):
- **Beauty/Salon, Spa, Restaurant, Fitness, Real Estate, Healthcare, Hospitality** → MUST use Option A (Unsplash image hero). These industries depend on visual appeal — a photo hero is non-negotiable.
- **Technology, SaaS, Legal, Finance, Education** → may use Option B (gradient hero).

### Option A: Image Hero (with text overlay) — DEFAULT FOR MOST INDUSTRIES
\`\`\`jsx
<section className="relative min-h-[90vh] flex items-center overflow-hidden">
  <img
    src="https://images.unsplash.com/photo-1522337915551-9a2a95c4f33e?auto=format&fit=crop&q=80&w=1920"
    alt="Hair salon interior"
    className="absolute inset-0 w-full h-full object-cover"
    loading="lazy"
    onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg'; }}
  />
  {/* MANDATORY dark overlay — NEVER skip this */}
  <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70" />
  {/* NO other absolute children except the img and this overlay — especially not text */}
  <div className="relative z-10 max-w-7xl mx-auto px-6 text-white">
    <h1 className="text-5xl md:text-7xl font-bold tracking-tight">Headline</h1>
    <p className="text-lg md:text-xl text-white/80 mt-6 max-w-2xl">Subtitle</p>
    <div className="flex gap-4 mt-10">
      <button className="rounded-full px-8 py-4 bg-white text-zinc-900 font-semibold hover:bg-zinc-100 transition-colors">Primary CTA</button>
      <button className="rounded-full px-8 py-4 border-2 border-white text-white font-semibold hover:bg-white/10 transition-colors">Secondary CTA</button>
    </div>
  </div>
</section>
\`\`\`
RULES for image hero:
- Pick a real Unsplash photo ID from the verified list that matches the industry category.
- The dark overlay is MANDATORY — without it text on photos is unreadable.
- Hero text MUST be \`text-white\`. Secondary CTA MUST use \`border-white text-white\`.
- The business name appears in the navbar — do NOT repeat it as a headline in the hero.
- The ONLY children inside \`<section>\` are: the \`<img>\`, the overlay \`<div>\`, and the content \`<div className="relative z-10">\`. Nothing else.

### Option B: Gradient/Solid Hero (for tech/SaaS/legal only)
\`\`\`jsx
<section className="bg-gradient-to-br from-[primary] to-[accent] py-24 md:py-32">
  <div className="max-w-7xl mx-auto px-6 text-white text-center">
    <h1>...</h1>
    <div className="flex gap-4 justify-center mt-10">
      <button className="rounded-full px-8 py-4 bg-white text-zinc-900 font-semibold hover:bg-zinc-100 transition-colors">Primary CTA</button>
      <button className="rounded-full px-8 py-4 border-2 border-white/30 text-white font-semibold hover:bg-white/10 transition-colors">Secondary CTA</button>
    </div>
  </div>
</section>
\`\`\`
RULE for gradient hero: The section contains ONLY a content div. NEVER add any \`<span>\` or decorative text elements inside it.

## ELITE AESTHETICS (MANDATORY):
- **Typography**: Always use explicit Tailwind size classes. \`tracking-tight\` on all headings. Hierarchy: hero \`text-5xl md:text-7xl font-bold\`, section titles \`text-3xl md:text-4xl font-bold\`, card titles \`text-xl font-semibold\`.
- **Spacing**: Generous section padding \`py-24 md:py-32\`. Whitespace is design — never cram elements.
- **Grids**: Bento-box asymmetrical layouts. Use \`grid-cols-1 md:grid-cols-2 lg:grid-cols-3\` with \`gap-6\` or \`gap-8\`.
- **Micro-interactions**: All cards and CTAs get \`transition-all duration-300 hover:-translate-y-1 hover:shadow-xl\`.
- **Section Rhythm**: Alternate between \`bg-white\`, surface color, and subtle gradient sections.
- **Pills/Badges**: Use accent color background at 10% opacity: \`bg-[accent]/10 text-[accent]\` with \`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wide\`.
- **Image sections**: Every "About" or "Story" section MUST include a real \`<img>\` from the Unsplash list with proper \`onError\` fallback. Image containers MUST have explicit dimensions: \`className="w-full h-64 md:h-96 object-cover rounded-xl"\`. NEVER leave an image section with only text or a placeholder color block.
- **Social Proof**: Testimonials grid with Star ratings + Avatar + Quote. Essential for trust.
- **Footer**: Multi-column with links, contact info, icons, and copyright. Use primary or dark background (\`bg-zinc-900\` or \`bg-[primary]\`) with \`text-zinc-300\` body text and \`text-white\` headings.
- **Footer Social Icons**: Social link circles MUST be visible on dark footer backgrounds. Use \`bg-white/10 hover:bg-white/20\` for icon containers with \`text-white\` icons. Example: \`<a className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"><Globe className="h-5 w-5" /></a>\`. NEVER use \`bg-zinc-800\` or dark circles on a dark footer — they will be invisible.

## BUTTON & CTA CONTRAST RULES (CRITICAL — READ EVERY LINE):
When a button sits on a colored/gradient/dark/image background, DO NOT use the \`<Button>\` component — build a raw \`<button>\` with explicit Tailwind classes so there is ZERO ambiguity about colors:

**Primary CTA on dark/gradient/image sections:**
\`\`\`jsx
<button className="rounded-full px-8 py-4 bg-white text-zinc-900 font-semibold hover:bg-zinc-100 transition-colors">
  Schedule Consultation
</button>
\`\`\`

**Secondary CTA on dark/gradient/image sections:**
\`\`\`jsx
<button className="rounded-full px-8 py-4 border-2 border-white text-white font-semibold hover:bg-white hover:text-zinc-900 transition-colors">
  View Treatment Menu
</button>
\`\`\`

**Primary CTA on light/white sections:**
\`\`\`jsx
<button className="rounded-full px-8 py-4 bg-[#0d9488] text-white font-semibold hover:bg-[#0f766e] transition-colors">
  Book Now
</button>
\`\`\`

**Secondary CTA on light sections:**
\`\`\`jsx
<button className="rounded-full px-8 py-4 border-2 border-[#0d9488] text-[#0d9488] font-semibold hover:bg-[#0d9488] hover:text-white transition-colors">
  Learn More
</button>
\`\`\`

RULES:
- On ANY dark, gradient, or image background → primary CTA gets \`bg-white text-zinc-900\`, secondary gets \`border-white text-white\`.
- On light backgrounds → primary CTA gets \`bg-[primary] text-white\`, secondary gets \`border-[primary] text-[primary]\`.
- **NEVER** use the \`<Button>\` component inside hero sections, CTA banners, or any section with a non-white background. Use raw \`<button>\` elements with fully explicit color classes.
- **NEVER** output a button where text color matches background color.
- Test mentally: Can the button text be read against its background?

## TESTIMONIALS & REVIEWS:
- Each testimonial card MUST have: Star rating (using \`<Star />\` icons), quote text in italics, reviewer name, reviewer title/role, and an Avatar with initials fallback.
- Rating row: 5 Star icons, filled ones get \`fill-current text-amber-400\`, empty get \`text-zinc-200\`.
- Display aggregate rating prominently: \`4.9/5 (250+ Reviews)\` with filled stars.

## RESPONSIVE MOBILE MENU:
The mobile hamburger menu MUST be fully functional:
\`\`\`jsx
const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
// In nav:
<button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
  {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
</button>
// Mobile menu panel:
{mobileMenuOpen && (
  <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-zinc-200 shadow-lg p-6 flex flex-col gap-4">
    <a className="text-base font-medium py-2">Link</a>
    <Button className="w-full rounded-full">CTA</Button>
  </div>
)}
\`\`\`

## RESPONSIVENESS (MANDATORY FOR EVERY COMPONENT):
- Every \`grid\` and \`flex\` layout MUST have \`md:\` or \`lg:\` variants.
- No element should cause horizontal scrolling on mobile (\`overflow-x-hidden\` on root).
- Navigation MUST collapse gracefully on screens < md.

## SECTION COMPLETENESS CHECKLIST:
Every generated page MUST include these sections (in order):
1. **Navigation** — sticky, blurred, with mobile hamburger
2. **Hero** — headline, subtitle, 2 CTAs, hero image or gradient
3. **Features/Services** — 3-4 cards with icons, titles, descriptions
4. **About/Story** — split layout with image + text + bullet points with Check icons
5. **Testimonials** — 3 cards with Star ratings, quotes, avatars
6. **FAQ** — 4-6 questions with interactive accordion toggle
7. **CTA Banner** — full-width gradient with headline + action button
8. **Contact/Location** — address, phone, hours, with MapPin/Phone/Clock icons
9. **Footer** — multi-column links, social icons, copyright

## ABOUT SECTION IMAGE (MANDATORY):
The "About Us" or "Our Story" section MUST have a real photograph.
1. ABSOLUTELY FORBIDDEN to use a text-based placeholder (e.g., a gray box with "About Us" or "15+ Years Experience" written in center).
2. MUST use a standard \`<img>\` tag with a real Unsplash URL from the list above.
3. If no specific image fits, use a generic industry image (e.g. for a mechanic, use a car engine close-up; for a salon, use a scissors/comb setup).
4. Example:
   \`\`\`jsx
   <div className="relative h-96 rounded-xl overflow-hidden">
     <img
       src="https://images.unsplash.com/photo-1522337915551-9a2a95c4f33e?auto=format&fit=crop&q=80&w=800"
       alt="About Us"
       className="absolute inset-0 w-full h-full object-cover"
       loading="lazy"
       onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg'; }}
     />
   </div>
   \`\`\`

## MAP SECTION (REAL EMBED REQUIRED):
In the Contact/Location section, you MUST display a map.
1. NEVER use a static image or screenshot for the map.
2. ALWAYS use a Google Maps Embed iframe:
\`\`\`jsx
<div className="w-full h-96 rounded-xl overflow-hidden shadow-lg border border-zinc-200 bg-zinc-100">
  <iframe
    width="100%"
    height="100%"
    frameBorder="0"
    scrolling="no"
    marginHeight={0}
    marginWidth={0}
    src={\`https://maps.google.com/maps?q=\${encodeURIComponent("123 Business St, City, Country")}&t=&z=14&ie=UTF8&iwloc=B&output=embed\`}
    className="filter grayscale hover:grayscale-0 transition-all duration-500"
  ></iframe>
</div>
\`\`\`
3. Use the address from the business data. If exact address is missing, use the City + Country.
4. If no location is known, fallback to "New York, USA".

## MAILTO/TEL LINKS:
- For \`mailto:\` and \`tel:\` links, NEVER use \`target="_blank"\`. Remove the \`target\` attribute entirely so they open the system app directly.

## STRICTLY FORBIDDEN — WILL CRASH THE PREVIEW OR BREAK LAYOUT:
- Using a text-only placeholder div (e.g. gray box with "About Us" text) for the About section image. It MUST be a real \`<img>\` tag with an Unsplash URL.
- Image containers without explicit dimensions (e.g. \`<div><img .../></div>\` with no height class). Every \`<img>\` MUST be inside a container with explicit height: \`h-48\`, \`h-64\`, \`h-80\`, \`h-96\`, or \`min-h-[400px]\`.
- \`class Foo extends Map\` / \`extends Set\` / \`extends Array\` / \`extends WeakMap\` — extending native built-ins breaks Babel transpilation
- Naming ANY identifier \`Map\`, \`Set\`, \`Array\`, \`Image\`, \`Screen\`, \`Window\`, \`Document\`, or any other JS/browser global
- Cookie consent banners, GDPR popups, or any overlay rendered on first mount without user interaction
- \`window.location\`, \`window.open\`, \`fetch()\`, \`XMLHttpRequest\`, or any network call
- \`localStorage\`, \`sessionStorage\`, or \`indexedDB\` (throw errors in sandboxed iframes)
- \`<script>\` tags or \`dangerouslySetInnerHTML\`
- Empty, invented, or descriptive-text src attributes on \`<img>\` tags
- Any lucide icon name NOT in the whitelist above
- Markdown fences (\`\`\`) or explanatory prose in the output
- Using circles, dots, or emoji for star ratings
- Buttons where text color matches background color
- **CRITICAL**: CSS syntax errors involving nested quotes in Tailwind arbitrary values MUST BE AVOIDED. NEVER output \`bg-[url('https://...')]\`. You MUST omit the single quotes and output exactly \`bg-[url(https://...)]\`. The quotes will permanently crash the Tailwind runtime parser in our environment.
- Using the business name or any word as a giant decorative background text, watermark, or wordmark — ZERO tolerance. This includes: \`text-white/5\`, \`text-black/5\`, \`text-white/10\`, select-none spans, or any large faded text layer
- Rendering any large semi-transparent text behind other text (e.g. \`<span className="absolute text-[20rem]...">Salon</span>\`) — causes illegible overlapping and is explicitly banned
- Option B (gradient) heroes that contain ANY non-content child elements (no decorative spans, no wordmarks, nothing except the content div)

## OUTPUT FORMAT (EXACT):
1. Start with \`import\` statements (lucide-react icons only).
2. Define data arrays (menu items, FAQs, testimonials, features) as const arrays above the component.
3. Define helper sub-components if needed.
4. End with \`export default function GeneratedPage() { return (...) }\`.
5. NO HTML boilerplate, NO markdown, NO explanations.`

const REVISION_SYSTEM_PROMPT = `You are a precise code editor for React landing pages built with Tailwind CSS.
Your ONLY job is to make the EXACT changes the user requested — nothing more.

## CORE RULES:
1. Return changes as search/replace PATCHES. Each patch has a "search" string (exact text from the current code) and a "replace" string (the new text).
2. The "search" string MUST be an exact, character-for-character match of a contiguous block of text in the current code — including whitespace and indentation.
3. Keep patches as SMALL as possible. Include just enough surrounding context (2-3 lines) for unique matching.
4. NEVER change code the user did not ask about. Do not "improve", restructure, restyle, or refactor anything outside the user's request.
5. If the user asks to change text content, only patch the specific strings — do not rewrite the entire section.
6. If the user asks for a structural change (add a section, remove a component), the patch can be larger but still minimal.

## TECHNICAL CONSTRAINTS:
- The code is a single React component: \`export default function GeneratedPage() { ... }\`
- Framework: React 18 + Tailwind CSS.
- Icons: import from \`lucide-react\`. Use JSX: \`<ArrowRight className="h-5 w-5" />\`.
- Available UI components (no import needed): Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Badge, Input, Textarea, Label, Tabs, TabsList, TabsTrigger, TabsContent, Accordion, AccordionItem, AccordionTrigger, AccordionContent, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetTrigger, cn.
- All hooks (useState, useEffect, useRef, useCallback, useMemo) must be at the top level of the component.
- Images: use ONLY Unsplash URLs. You MUST NOT use placehold.co or any other text placeholder. Every <img> needs src, alt, loading="lazy", and a Pexels onError fallback \`onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg'; }}\`.
- NEVER use window.location, window.open, fetch(), localStorage, sessionStorage, <script>, or dangerouslySetInnerHTML.

## PATCH FORMAT:
Return an array of patches. Each patch replaces one occurrence of "search" with "replace" in the code.
If the change requires updating business data JSON, set hasChanges to true and provide the full updated JSON.
If no JSON changes are needed, set hasChanges to false — do NOT return the full JSON again.

## CRITICAL:
- Prefer FEWER, well-targeted patches over many tiny ones.
- If the user says "change the hero title to X", return ONE patch that replaces the old title with X.
- If a search string appears multiple times in the code, include more surrounding context to make it unique.
- NEVER return an empty patches array if the user asked for changes.`

// Generate website code based on business data (Supports Monolithic and Modular Sections)
export async function generateWebsiteCode(
    businessData: BusinessData | null,
    rules?: string,
    markdownContext?: string,
    model?: string,
    onProgress?: (phase: string) => void
): Promise<string> {
    const rulesSection = rules ? `\n\n## USER OVERRIDE RULES (PRIORITY):\n${rules}` : ''
    let richData = businessData as unknown as { sections?: Record<string, unknown>[], brandIdentity?: Record<string, unknown>, $$manifest?: Record<string, unknown>, businessName?: string };

    // --- OPTION B: MODULAR COMPONENT GENERATION (Stitching) ---
    // If the data has 'sections', generate them individually to save tokens
    if (richData && richData.sections && Array.isArray(richData.sections)) {
        console.log(`[Generator] Modular SJSON detected. Generating ${richData.sections.length} sections individually...`);
        const modelInstance = getModel(model);

        let componentsCodeMap: Record<string, string> = {};

        let completed = 0;
        const total = richData.sections.length;

        // 1. Generate each component
        for (const section of richData.sections) {
            if (onProgress) onProgress(`Writing ${section.component || 'Component'} (${completed + 1}/${total})`);
            const sectionPrompt = `You are building ONE React component for a larger landing page.
Component Name: ${section.component}

## PROPS & CONTENT:
${JSON.stringify(section.props, null, 2)}

## GLOBAL BRAND RULES:
- Brand Name: ${(richData.brandIdentity as any)?.core?.brandName || richData.businessName}
- Primary Tone: ${(richData.brandIdentity as any)?.voice?.personality?.primary || 'Modern'}
${rulesSection}

## OUTPUT RULES:
1. Return EXACTLY one React functional component named \`${section.component}\`.
2. Do NOT export it as default, export it as a named export: \`export function ${section.component}() { ... }\`.
3. Use Tailwind CSS and \`lucide-react\` icons.
4. Ensure the component uses the provided content props directly in the JSX.
5. Return ONLY RAW CODE. No markdown fences.`;

            try {
                const { text } = await generateText({
                    model: modelInstance,
                    system: SYSTEM_PROMPT.replace('export default function GeneratedPage', `export function ${section.component}`),
                    prompt: sectionPrompt,
                });

                let code = text.trim();
                if (code.startsWith('```')) {
                    code = code.replace(/^\`\`\`(?:tsx|typescript|jsx|javascript)?\n?/, '');
                    code = code.replace(/\n?\`\`\`$/, '');
                }

                // Remove generic imports that will be in the master file to avoid duplicates
                code = code.replace(/import React.*?;\n?/g, '');

                componentsCodeMap[section.component as string] = code;
                console.log(`[Generator] Generated section: ${section.component}`);
                completed++;
            } catch (e) {
                console.error(`[Generator] Failed to generate section ${section.component}:`, e);
                // Fallback comment if failure
                componentsCodeMap[section.component as string] = `export function ${section.component}() { return <div className="p-8 text-center text-red-500">Failed to load ${section.component}</div>; }`;
                completed++;
            }
        }

        if (onProgress) onProgress(`Stitching React Modules...`);
        // 2. Stitch together into one master file
        const allImports = new Set<string>();
        // Very rudimentary import extraction from section code
        Object.values(componentsCodeMap).forEach(code => {
            const matches = code.match(/import \{([^}]+)\} from ['"]lucide-react['"]/);
            if (matches && matches[1]) {
                matches[1].split(',').forEach(i => allImports.add(i.trim()));
            }
        });

        const iconImportsText = allImports.size > 0
            ? `import { ${Array.from(allImports).filter(Boolean).join(', ')} } from 'lucide-react';\nimport React, { useState } from 'react';\n`
            : `import React, { useState } from 'react';\n`;

        // Strip localized lucide imports from Individual components so they don't break the stitched file
        Object.keys(componentsCodeMap).forEach(key => {
            componentsCodeMap[key] = componentsCodeMap[key].replace(/import \{.*?\} from ['"]lucide-react['"];?\n?/g, '');
        });

        const masterFile = `
${iconImportsText}

// --- AUTOMATICALLY GENERATED SECTIONS ---
${Object.values(componentsCodeMap).join('\n\n')}

// --- MASTER COMPONENT ---
export default function GeneratedPage() {
    return (
        <div className="min-h-screen bg-white">
            ${richData.sections.map((s: any) => `<${s.component} />`).join('\n            ')}
        </div>
    );
}
`;
        return masterFile.trim();
    }


    // --- FALLBACK: MONOLITHIC GENERATION ---
    let contextPrompt = ""
    let richPrompt = ""
    let vibePrompt = ""

    if (richData && richData.$$manifest) {
        const brand = richData.brandIdentity as any;
        const design = brand?.designSystem;
        const vibe = brand?.vibe;

        richPrompt = `
🎯 **RICH BRAND CONTEXT (USE THIS — HIGHEST PRIORITY):**
- **Brand Name:** ${brand?.core?.brandName}
- **Personality:** ${JSON.stringify(brand?.voice?.personality)}
- **Colors:** Primary: ${design?.colors?.semantic?.primary?.hex}, Accent: ${design?.colors?.semantic?.accent?.hex}, Background: ${design?.colors?.semantic?.background?.hex || '#ffffff'}, Muted: ${design?.colors?.semantic?.muted?.hex || '#f5f5f5'}
- **Typography:** Headings: ${design?.typography?.headings?.family}, Body: ${design?.typography?.body?.family}
- **Target Audience & Tone:** ${brand?.voice?.personality?.primary || 'Professional'}, ${brand?.voice?.personality?.secondary || 'Modern'}

👉 **INSTRUCTION**: Strictly adhere to the Brand Identity defined above. Use the exact hex codes for colors via Tailwind arbitrary values (e.g. \`bg-[#8B0000]\`) or closest Tailwind color palette.
`
        if (vibe) {
            vibePrompt = `
🎨 **INDUSTRY VIBE & MOOD (MUST INFORM EVERY DESIGN DECISION):**
- **Vibe:** ${vibe.vibe || 'Modern'}
- **Voice:** ${vibe.voice || 'Professional'}
- **Industry:** ${vibe.industry || 'General Business'}
- **Mood:** ${vibe.mood || 'Professional and trustworthy'}
- **Visual Cues to USE:** ${(vibe.visualCues || []).join(', ')}
- **Visual Cues to AVOID:** ${(vibe.avoidCues || []).join(', ')}

👉 The website must FEEL like it belongs to the ${vibe.industry || 'business'} industry. A visitor should instantly recognize what kind of business this is from the design alone — before reading any text.
`
        }

        contextPrompt = `
Business Name: ${brand?.core?.brandName}
Description: ${businessData?.description}
Services: ${(businessData?.services || []).join(', ')}
${businessData?.contactInfo ? `Contact Info: ${JSON.stringify(businessData.contactInfo)}` : ''}
`
    } else if (businessData) {
        contextPrompt = `
Business Name: ${businessData.businessName}
Description: ${businessData.description}
Services: ${(businessData.services || []).join(', ')}
Industry: ${(businessData as any).industry || 'General Business'}
${businessData.contactInfo ? `Contact Info: ${JSON.stringify(businessData.contactInfo)}` : ''}
`
    } else if (markdownContext) {
        contextPrompt = `
Business Context (Markdown):
${markdownContext}
`
    }

    const userPrompt = `Create a COMPLETE, production-ready landing page for:
${contextPrompt}

${richPrompt}
${vibePrompt}

👉 **EXECUTION PLAN:**
1. FIRST: Study the industry context above. What do the best websites in this exact industry look and feel like? Channel that energy.
2. Select colors, typography weight, and spacing that match the industry mood — NOT generic defaults.
3. Write the React code implementing ALL 9 required sections (Nav, Hero, Features, About, Testimonials, FAQ, CTA Banner, Contact, Footer).
4. Ensure the hero uses Option A (image hero with dark overlay) or Option B (gradient hero) — pick whichever fits the industry better.
5. Include at least ONE interactive Dialog (e.g., "View Menu", "See Services", "Book Now") with realistic content.
6. Verify: mobile menu works, star ratings use <Star />, FAQs toggle open/close, all images have real Unsplash src + onError fallback, CTA buttons have proper contrast.

Generate the code now.`

    const { text } = await generateText({
        model: getModel(model),
        system: SYSTEM_PROMPT + rulesSection,
        prompt: userPrompt,
    })

    let code = text.trim()
    if (code.startsWith('```')) {
        code = code.replace(/^\`\`\`(?:tsx|typescript|jsx|javascript)?\n?/, '')
        code = code.replace(/\n?\`\`\`$/, '')
    }

    return code
}

// Stream website code generation — returns a streamText result for progressive token delivery
export function streamWebsiteCode(
    businessData: BusinessData | null,
    rules?: string,
    markdownContext?: string,
    model?: string
) {
    const rulesSection = rules ? `\n\n## USER OVERRIDE RULES (PRIORITY):\n${rules}` : ''

    let contextPrompt = ""
    let richPrompt = ""
    let vibePrompt = ""

    // Check for Rich Business Data (manifest presence)
    if (businessData && (businessData as any).$$manifest) {
        const rd = businessData as any;
        const brand = rd.brandIdentity;
        const design = brand?.designSystem;
        const vibe = brand?.vibe;

        richPrompt = `
🎯 **RICH BRAND CONTEXT (USE THIS — HIGHEST PRIORITY):**
- **Brand Name:** ${brand?.core?.brandName}
- **Personality:** ${JSON.stringify(brand?.voice?.personality)}
- **Colors:** Primary: ${design?.colors?.semantic?.primary?.hex}, Accent: ${design?.colors?.semantic?.accent?.hex}, Background: ${design?.colors?.semantic?.background?.hex || '#ffffff'}, Muted: ${design?.colors?.semantic?.muted?.hex || '#f5f5f5'}
- **Typography:** Headings: ${design?.typography?.headings?.family}, Body: ${design?.typography?.body?.family}
- **Target Audience & Tone:** ${brand?.voice?.personality?.primary || 'Professional'}, ${brand?.voice?.personality?.secondary || 'Modern'}

👉 **INSTRUCTION**: Strictly adhere to the Brand Identity defined above. Use the exact hex codes for colors via Tailwind arbitrary values (e.g. \`bg-[#8B0000]\`) or closest Tailwind color palette.
`

        if (vibe) {
            vibePrompt = `
🎨 **INDUSTRY VIBE & MOOD (MUST INFORM EVERY DESIGN DECISION):**
- **Vibe:** ${vibe.vibe || 'Modern'}
- **Voice:** ${vibe.voice || 'Professional'}
- **Industry:** ${vibe.industry || 'General Business'}
- **Mood:** ${vibe.mood || 'Professional and trustworthy'}
- **Visual Cues to USE:** ${(vibe.visualCues || []).join(', ')}
- **Visual Cues to AVOID:** ${(vibe.avoidCues || []).join(', ')}

👉 The website must FEEL like it belongs to the ${vibe.industry || 'business'} industry. A visitor should instantly recognize what kind of business this is from the design alone — before reading any text.
`
        }

        contextPrompt = `
Business Name: ${brand?.core?.brandName}
Description: ${businessData.description}
Services: ${(businessData.services || []).join(', ')}
${businessData.contactInfo ? `Contact Info: ${JSON.stringify(businessData.contactInfo)}` : ''}
`
    } else if (businessData) {
        contextPrompt = `
Business Name: ${businessData.businessName}
Description: ${businessData.description}
Services: ${(businessData.services || []).join(', ')}
Industry: ${(businessData as any).industry || 'General Business'}
${businessData.contactInfo ? `Contact Info: ${JSON.stringify(businessData.contactInfo)}` : ''}
`
    } else if (markdownContext) {
        contextPrompt = `
Business Context (Markdown):
${markdownContext}
`
    }

    const userPrompt = `Create a COMPLETE, production-ready landing page for:
${contextPrompt}

${richPrompt}
${vibePrompt}

👉 **EXECUTION PLAN:**
1. FIRST: Study the industry context above. What do the best websites in this exact industry look and feel like? Channel that energy.
2. Select colors, typography weight, and spacing that match the industry mood — NOT generic defaults.
3. Write the React code implementing ALL 9 required sections (Nav, Hero, Features, About, Testimonials, FAQ, CTA Banner, Contact, Footer).
4. Ensure the hero uses Option A (image hero with dark overlay) or Option B (gradient hero) — pick whichever fits the industry better.
5. Include at least ONE interactive Dialog (e.g., "View Menu", "See Services", "Book Now") with realistic content.
6. Verify: mobile menu works, star ratings use <Star />, FAQs toggle open/close, all images have real Unsplash src + onError fallback, CTA buttons have proper contrast.

Generate the code now.`

    // Return the streaming result — caller consumes the textStream
    return streamText({
        model: getModel(model),
        system: SYSTEM_PROMPT + rulesSection,
        prompt: userPrompt,
    })
}

// Efficient patch-based revision: returns search/replace diffs instead of full code
export async function reviseWebsiteWithPatches(
    prompt: string,
    currentCode: string,
    currentJson: any,
    rules?: string,
    model?: string
): Promise<{ code: string; updatedJson?: any; patchCount: number; fallbackUsed: boolean; reasoning: string }> {
    const rulesSection = rules ? `\n\nADDITIONAL RULES:\n${rules}` : '';

    const patchSchema = z.object({
        patches: z.array(z.object({
            search: z.string().describe("Exact text from the current code to find and replace. Must match character-for-character including whitespace."),
            replace: z.string().describe("The new text to replace the search string with."),
        })).describe("Array of search/replace patches to apply to the code. Minimum 1 patch required."),
        jsonUpdates: z.object({
            hasChanges: z.boolean().describe("true ONLY if the user's request requires changing business data (name, services, contact info, etc). false for pure styling/layout changes."),
            updatedJson: z.string().optional().describe("The COMPLETE updated JSON as a string. Only provide if hasChanges is true."),
        }),
        reasoning: z.string().describe("1-2 sentence explanation of what was changed and why."),
    });

    const revisionPrompt = `USER REQUEST: "${prompt}"

CURRENT CODE:
${currentCode}

${currentJson ? `CURRENT BUSINESS DATA (JSON):
${JSON.stringify(currentJson, null, 2)}` : ''}

Analyze the user's request and return the minimal set of search/replace patches to fulfill it. Remember: the "search" field must EXACTLY match text in the current code.`;

    let result;
    try {
        result = await generateText({
            model: getModel(model),
            system: REVISION_SYSTEM_PROMPT + rulesSection,
            output: Output.object({ schema: patchSchema }),
            prompt: revisionPrompt,
        });
    } catch (e) {
        console.error("[Revision] Patch generation failed, falling back to full rewrite:", e);
        const fallback = await reviseWebsite(prompt, currentCode, currentJson, rules, model);
        return { ...fallback, patchCount: 0, fallbackUsed: true, reasoning: "Patch generation failed; used full rewrite." };
    }

    const { output } = result;
    if (!output || !output.patches || output.patches.length === 0) {
        console.warn("[Revision] No patches returned, falling back to full rewrite");
        const fallback = await reviseWebsite(prompt, currentCode, currentJson, rules, model);
        return { ...fallback, patchCount: 0, fallbackUsed: true, reasoning: "No patches returned; used full rewrite." };
    }

    // Apply patches sequentially
    let patchedCode = currentCode;
    let appliedCount = 0;
    const failedPatches: string[] = [];

    for (const patch of output.patches) {
        const searchStr = patch.search;
        const replaceStr = patch.replace;

        if (patchedCode.includes(searchStr)) {
            patchedCode = patchedCode.replace(searchStr, replaceStr);
            appliedCount++;
        } else {
            // Try with normalized whitespace as a second attempt
            const normalizedCode = patchedCode.replace(/\r\n/g, '\n');
            const normalizedSearch = searchStr.replace(/\r\n/g, '\n');
            if (normalizedCode.includes(normalizedSearch)) {
                patchedCode = normalizedCode.replace(normalizedSearch, replaceStr);
                appliedCount++;
            } else {
                failedPatches.push(searchStr.substring(0, 80) + '...');
            }
        }
    }

    // If more than half the patches failed, fall back to full rewrite
    if (appliedCount === 0 || (failedPatches.length > appliedCount)) {
        console.warn(`[Revision] ${failedPatches.length}/${output.patches.length} patches failed to match. Falling back to full rewrite.`);
        const fallback = await reviseWebsite(prompt, currentCode, currentJson, rules, model);
        return { ...fallback, patchCount: 0, fallbackUsed: true, reasoning: `${failedPatches.length} patches failed to match; used full rewrite.` };
    }

    if (failedPatches.length > 0) {
        console.warn(`[Revision] ${failedPatches.length} patches failed but ${appliedCount} succeeded. Proceeding with partial application.`);
    }

    // Handle JSON updates
    let updatedJson = currentJson;
    if (output.jsonUpdates?.hasChanges && output.jsonUpdates.updatedJson) {
        try {
            updatedJson = JSON.parse(output.jsonUpdates.updatedJson);
        } catch (e) {
            console.warn("[Revision] AI returned invalid JSON for jsonUpdates, keeping original", e);
        }
    }

    return {
        code: patchedCode,
        updatedJson,
        patchCount: appliedCount,
        fallbackUsed: false,
        reasoning: output.reasoning || `Applied ${appliedCount} patch(es).`,
    };
}

// Revise website based on prompt, current code, and current JSON (full rewrite — used as fallback)
export async function reviseWebsite(
    prompt: string,
    currentCode: string | null,
    currentJson: any,
    rules?: string,
    model?: string
): Promise<{ code: string; updatedJson?: any }> {
    // Ensure icon usage rules exist, fulfilling user request to "Add a text in rules.md" implicitly via prompt.
    // If not in the db/rules, append explicitly to avoid AI hallucinating missing components.
    let iconRules = "";
    if (!rules || (!rules.includes("Phosphor") && !rules.includes("Feather"))) {
        iconRules = `\n\n## ICONS\nYou MUST use Lucide React icons (\`lucide-react\`), Phosphor icons, or Feather icons.\nDo NOT attempt to use arbitrary symbols. Use valid standard components.`;
    }

    const rulesSection = (rules ? `\n\n## EXTRA GLOBAL RULES (FOLLOW THESE STRICTLY):\n${rules}` : '') + iconRules;

    const revisionPrompt = `The user wants to revise their website based on this request: "${prompt}"

## CONTEXT:
1. CURRENT JSON DATA:
${JSON.stringify(currentJson, null, 2)}

2. CURRENT CODE:
${currentCode || 'No code generated yet.'}

## YOUR TASK:
1. Revise the React code to reflect the user's request.
2. If the user's request implies a change to the business data (e.g., "Change the company name to X" or "Add a new service: Y"), update the JSON data accordingly.
3. Return the updated code AND the updated JSON object.

## RULES:
- Follow all SYSTEM_PROMPT rules for code generation.
- Return ONLY the updated code strings and the updated JSON object.`

    let result;
    try {
        result = await generateText({
            model: getModel(model),
            system: SYSTEM_PROMPT + rulesSection + "\n\nCRITICAL: Return a structured object with 'code' and 'updatedJson'.",
            output: Output.object({
                schema: z.object({
                    code: z.string().describe("The full updated React component code for 'GeneratedPage'"),
                    updatedJson: z.string().describe("The COMPLETE updated business data context as a JSON string. If no changes to data, return the original JSON as a string.")
                }),
            }),
            prompt: revisionPrompt,
        })
    } catch (e) {
        console.error("AI Generation Error in reviseWebsite:", e);
        throw e;
    }

    const { output } = result;
    if (!output) {
        throw new Error('No structured output returned from revision model')
    }

    // Clean up code if AI included markdown blocks inside the JSON string (happens sometimes)
    let code = output.code.trim()
    if (code.startsWith('```')) {
        code = code.replace(/^\`\`\`(?:tsx|typescript|jsx|javascript)?\n?/, '')
        code = code.replace(/\n?\`\`\`$/, '')
    }

    // Safely parse the updated JSON string
    let parsedJson = currentJson
    try {
        parsedJson = JSON.parse(output.updatedJson)
    } catch (e) {
        console.warn('AI returned invalid JSON string for updatedJson, falling back to currentJson', e)
    }

    return {
        code,
        updatedJson: parsedJson
    }
}

/**
 * Server-side validation of generated React code.
 * Uses the same preprocessCode pipeline as the preview iframe, then attempts
 * a Babel transform to catch syntax/JSX/TypeScript errors before the user sees them.
 * Returns null if valid, or an error message string if broken.
 */
async function validateGeneratedCode(code: string): Promise<string | null> {
    const { preprocessCode } = await import('@/lib/utils/html-boilerplate')
    const processed = preprocessCode(code)

    // 1. Basic heuristic checks
    if (processed.length < 200) {
        return 'Generated code appears truncated (too short)'
    }

    if (!processed.includes('GeneratedPage') && !processed.includes('function App')) {
        return 'No GeneratedPage or App component found in generated code'
    }

    // 2. Check for severely unbalanced braces (indicates truncation or broken code)
    let braceCount = 0
    for (const ch of processed) {
        if (ch === '{') braceCount++
        if (ch === '}') braceCount--
    }
    if (Math.abs(braceCount) > 2) {
        return `Unbalanced braces detected (off by ${braceCount}), code is likely truncated or malformed`
    }

    // 3. Runtime crash pattern detection — these pass Babel but crash in the browser
    const runtimePatterns: [RegExp, string][] = [
        [/class\s+\w+\s+extends\s+(Map|Set|Array|WeakMap|WeakSet)\b/, 'Class extends native built-in (Map/Set/Array) — causes "Constructor requires new" crash'],
        [/\bvar\s+(Map|Set|Array|Image|Screen|Window|Document|Event|Location|Navigator)\s*=/, 'Variable shadows a browser global (Map/Set/Array/Image etc.) — causes runtime crash'],
        [/\bconst\s+(Map|Set|Array|Image|Screen|Window|Document|Event|Location|Navigator)\s*=/, 'Const shadows a browser global — causes runtime crash'],
        [/\blet\s+(Map|Set|Array|Image|Screen|Window|Document|Event|Location|Navigator)\s*=/, 'Let shadows a browser global — causes runtime crash'],
        [/\bfunction\s+(Map|Set|Array|Image|Screen|Window|Document|Event|Location)\s*\(/, 'Function shadows a browser global — causes runtime crash'],
        [/\bwindow\.open\s*\(/, 'window.open() is forbidden in sandboxed iframes'],
        [/\blocalStorage\b/, 'localStorage is forbidden in sandboxed iframes'],
        [/\bsessionStorage\b/, 'sessionStorage is forbidden in sandboxed iframes'],
        [/\bfetch\s*\(/, 'fetch() calls are forbidden in generated previews'],
        [/dangerouslySetInnerHTML/, 'dangerouslySetInnerHTML is forbidden'],
    ]

    for (const [pattern, message] of runtimePatterns) {
        if (pattern.test(processed)) {
            return `Runtime error pattern: ${message}`
        }
    }

    // 4. Check for hooks called inside conditions/loops/callbacks
    const hookInsideBlock = /(?:if\s*\([^)]*\)\s*\{[^}]*\b(?:useState|useEffect|useRef|useCallback|useMemo)\b|for\s*\([^)]*\)\s*\{[^}]*\b(?:useState|useEffect|useRef|useCallback|useMemo)\b)/
    if (hookInsideBlock.test(processed)) {
        return 'React hook called inside a conditional or loop — must be at top level of component'
    }

    // 5. Babel transform check — catches real syntax/JSX/TS errors
    try {
        const Babel = await import('@babel/standalone')
        const transformFn = Babel.transform || (Babel as any).default?.transform
        if (transformFn) {
            transformFn(processed, {
                presets: [
                    ['env', { targets: { esmodules: true }, modules: false, bugfixes: true }],
                    ['react', { runtime: 'classic' }],
                    ['typescript', { isTSX: true, allExtensions: true }]
                ],
                filename: 'generated.tsx',
                configFile: false,
                babelrc: false
            })
        }
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        if (msg.includes('SyntaxError') || msg.includes('Unexpected') || msg.includes('Unterminated')) {
            return `Babel build error: ${msg}`
        }
        return `Build error: ${msg}`
    }

    return null // Valid
}

/**
 * Post-generation auto-fix: validates code and runs o3-mini if errors are found.
 * Returns the (possibly fixed) code and whether the fix failed.
 */
async function validateAndAutoFix(
    code: string,
    businessData: any,
    projectId: string,
    supabase: any
): Promise<{ code: string; fixFailed: boolean }> {
    const validationError = await validateGeneratedCode(code)
    if (!validationError) return { code, fixFailed: false }

    console.log(`[AutoFix] Validation failed for ${projectId}: ${validationError}`)
    console.log(`[AutoFix] Running o3-mini auto-fix...`)

    await supabase
        .from('projects')
        .update({ generation_phase: 'Auto-fixing errors (o3-mini)...' })
        .eq('id', projectId)

    const fixPrompt = `FIX the following error in the generated React code.

ERROR: ${validationError}

CRITICAL FIX RULES:
1. Fix the specific error described above.
2. NEVER name a variable, function, or class: Map, Set, Array, Image, Screen, Window, Document, Event, Location, Navigator — these shadow browser globals and crash.
3. NEVER extend native built-ins (class Foo extends Map/Set/Array).
4. All React hooks (useState, useEffect, useRef, useCallback, useMemo) MUST be at the TOP LEVEL of the component — never inside if/for/callbacks.
5. NEVER use window.open, localStorage, sessionStorage, fetch, or dangerouslySetInnerHTML.
6. Ensure there is exactly one 'export default function GeneratedPage()' component.
7. Preserve the design, colors, layout, and all content — only fix the code errors.
8. Return the COMPLETE fixed code.`

    // Attempt 1: o3-mini fix
    try {
        const { code: fixedCode } = await reviseWebsite(
            fixPrompt,
            code,
            businessData,
            undefined,
            'o3-mini'
        )

        const fixValidation = await validateGeneratedCode(fixedCode)
        if (!fixValidation) {
            console.log(`[AutoFix] o3-mini fix succeeded for ${projectId}`)
            return { code: fixedCode, fixFailed: false }
        }

        console.warn(`[AutoFix] o3-mini fix attempt 1 still has errors: ${fixValidation}`)

        // Attempt 2: retry with the new error message
        await supabase
            .from('projects')
            .update({ generation_phase: 'Auto-fix retry (attempt 2)...' })
            .eq('id', projectId)

        const { code: fixedCode2 } = await reviseWebsite(
            `The previous fix attempt still has errors. FIX THIS ERROR:\n\nERROR: ${fixValidation}\n\n${fixPrompt}`,
            fixedCode,
            businessData,
            undefined,
            'o3-mini'
        )

        const fix2Validation = await validateGeneratedCode(fixedCode2)
        if (!fix2Validation) {
            console.log(`[AutoFix] o3-mini fix attempt 2 succeeded for ${projectId}`)
            return { code: fixedCode2, fixFailed: false }
        }

        // Both attempts failed — mark project as error so the user knows
        console.error(`[AutoFix] Both fix attempts failed for ${projectId}: ${fix2Validation}`)
        await supabase
            .from('projects')
            .update({
                status: 'error',
                generation_phase: `Auto-fix failed: ${fix2Validation.substring(0, 200)}`
            })
            .eq('id', projectId)

        return { code: fixedCode2, fixFailed: true }
    } catch (fixError) {
        console.error(`[AutoFix] o3-mini fix call failed for ${projectId}:`, fixError)
        await supabase
            .from('projects')
            .update({
                status: 'error',
                generation_phase: `Auto-fix error: ${fixError instanceof Error ? fixError.message.substring(0, 200) : 'Unknown error'}`
            })
            .eq('id', projectId)
        return { code, fixFailed: true }
    }
}

// Update project with generated code and create a revision snapshot
export async function updateProjectWithCode(
    projectId: string,
    generatedCode: string
): Promise<{ success: boolean; error?: string }> {
    // try to save to disk first (backup)
    try {
        const { saveCodeToDisk } = await import('@/lib/file-utils')
        await saveCodeToDisk(projectId, generatedCode)
    } catch (e) {
        console.warn('Failed to save to local disk', e)
    }

    // Use admin client to bypass RLS for robust saving
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const supabase = createAdminClient()

    // 1. Fetch current project state
    const { data: currentProject } = await supabase
        .from('projects')
        .select('business_data, generated_code, version')
        .eq('id', projectId)
        .single()

    // 2. If it already has generated code, snapshot it as a revision
    let newVersion = 1;
    if (currentProject) {
        newVersion = (currentProject.version || 1) + 1;

        if (currentProject.generated_code) {
            await supabase
                .from('project_revisions')
                .insert({
                    project_id: projectId,
                    business_data: currentProject.business_data,
                    generated_code: currentProject.generated_code,
                    version: currentProject.version || 1,
                })
        }
    }

    // 3. Update the main project row
    const { error } = await supabase
        .from('projects')
        .update({
            generated_code: generatedCode,
            status: 'review' as const,
            version: newVersion,
            updated_at: new Date().toISOString(),
        })
        .eq('id', projectId)

    if (error) {
        console.error('Failed to update project:', error)
        return { success: false, error: error.message }
    }

    return { success: true }
}

// Full generation pipeline: generate and save
export async function generateAndSaveWebsite(
    projectId: string,
    businessData?: BusinessData,
    rules?: string,
    templateId?: string
): Promise<{ success: boolean; code?: string; error?: string }> {
    try {
        const { createAdminClient } = await import('@/lib/supabase/admin')
        const supabase = createAdminClient()

        let data = businessData as unknown as BusinessData;
        if (!data) {
            const { data: project, error } = await supabase
                .from('projects')
                .select('business_data')
                .eq('id', projectId)
                .single()

            if (error || !project) {
                return { success: false, error: 'Project not found' }
            }
            data = project.business_data as BusinessData
        }

        await supabase
            .from('projects')
            .update({ status: 'generating' as const, generation_phase: 'Initializing...' })
            .eq('id', projectId)

        // --- TEMPLATE-BASED GENERATION (fast content-swap path) ---
        if (templateId) {
            console.log(`[Generator] Template-based generation for ${projectId} using template ${templateId}`)
            await supabase.from('projects').update({ generation_phase: 'Loading template...' }).eq('id', projectId)

            const { data: template, error: tplError } = await supabase
                .from('templates')
                .select('generated_code')
                .eq('id', templateId)
                .single()

            if (tplError || !template?.generated_code) {
                console.warn(`[Generator] Template ${templateId} not found, falling back to full generation`)
            } else {
                await supabase.from('projects').update({ generation_phase: 'Swapping content with template...' }).eq('id', projectId)

                const contentSwapPrompt = `You are given a high-quality React landing page template and NEW business data. Your job is to REPLACE all content to match the new business while keeping the EXACT same layout, design, colors, component structure, and code architecture.

REPLACE:
- All business names, taglines, and descriptions
- All service/feature names and descriptions
- All testimonial names, quotes, and details
- All contact info (phone, email, address)
- All image URLs (use relevant Unsplash images for the new industry with onError fallbacks)
- All FAQ questions and answers
- Navigation labels if they reference the old business
- Any industry-specific icons (swap to match new industry)

PRESERVE EXACTLY:
- The component structure and layout
- All CSS/Tailwind classes and styling
- All animations and interactive behavior
- The color palette and typography
- All React hooks and state management
- The export default function GeneratedPage() wrapper

Return the COMPLETE updated React code.`

                try {
                    const { code: swappedCode } = await reviseWebsite(
                        contentSwapPrompt,
                        template.generated_code,
                        data,
                        rules
                    )

                    // Validate the swapped code
                    await supabase.from('projects').update({ generation_phase: 'Validating template output...' }).eq('id', projectId)
                    const { code: validatedCode, fixFailed } = await validateAndAutoFix(swappedCode, data, projectId, supabase)

                    if (fixFailed) {
                        // Save latest attempt for inspection but preserve 'error' status
                        await supabase.from('projects').update({
                            generated_code: validatedCode,
                            updated_at: new Date().toISOString(),
                        }).eq('id', projectId)
                        await supabase.from('projects').update({ generation_phase: null }).eq('id', projectId)
                        return { success: false, error: 'Auto-fix failed after 2 attempts' }
                    }

                    await supabase.from('projects').update({ generation_phase: 'Saving Revisions...' }).eq('id', projectId)
                    const updateResult = await updateProjectWithCode(projectId, validatedCode)
                    await supabase.from('projects').update({ generation_phase: null }).eq('id', projectId)

                    if (!updateResult.success) {
                        return { success: false, error: updateResult.error }
                    }

                    return { success: true, code: validatedCode }
                } catch (swapError) {
                    console.error(`[Generator] Template content swap failed for ${projectId}, falling back to full generation`, swapError)
                    // Fall through to full generation below
                }
            }
        }

        // --- FULL GENERATION PATH (no template or template failed) ---

        // --- 1. ENRICHMENT PHASE ---
        let activeRules = rules;
        const richData = data as Record<string, unknown>;
        if (!richData.$$manifest) {
            console.log(`Enriching data for project ${projectId}...`);
            await supabase.from('projects').update({ generation_phase: 'Researching & Enriching...' }).eq('id', projectId);
            try {
                let activeRulesStr = rules;
                if (!activeRulesStr) {
                    const { data: config } = await supabase.from('configurations').select('value').eq('key', 'rules.md').single();
                    if (config?.value) activeRulesStr = config.value;
                }
                activeRules = activeRulesStr;

                const enriched = await enrichBusinessData(data, activeRulesStr);

                await supabase
                    .from('projects')
                    .update({ business_data: enriched as any })
                    .eq('id', projectId);

                data = enriched as any;
                console.log(`Enrichment complete for ${projectId}`);
            } catch (enrichError) {
                console.error(`Enrichment failed for ${projectId}, proceeding with basic data.`, enrichError);
            }
        }

        // --- 2. GENERATION PHASE ---
        await supabase.from('projects').update({ generation_phase: 'Writing React Code...' }).eq('id', projectId);

        const timeoutPromise = new Promise<string>((_, reject) => {
            setTimeout(() => {
                reject(new Error('Generation timed out after 300 seconds'))
            }, 300000)
        });

        const code = await Promise.race([
            generateWebsiteCode(data, activeRules, undefined, undefined, (phase) => {
                supabase.from('projects').update({ generation_phase: phase }).eq('id', projectId);
            }),
            timeoutPromise
        ]);

        // --- 3. VALIDATION + AUTO-FIX PHASE ---
        await supabase.from('projects').update({ generation_phase: 'Validating code...' }).eq('id', projectId);
        const { code: validatedCode, fixFailed } = await validateAndAutoFix(code as string, data, projectId, supabase)

        if (fixFailed) {
            // Save latest attempt for inspection but preserve 'error' status
            await supabase.from('projects').update({
                generated_code: validatedCode,
                updated_at: new Date().toISOString(),
            }).eq('id', projectId)
            await supabase.from('projects').update({ generation_phase: null }).eq('id', projectId)
            return { success: false, error: 'Auto-fix failed after 2 attempts' }
        }

        await supabase.from('projects').update({ generation_phase: 'Saving Revisions...' }).eq('id', projectId);
        const updateResult = await updateProjectWithCode(projectId, validatedCode)

        await supabase.from('projects').update({ generation_phase: null }).eq('id', projectId);

        if (!updateResult.success) {
            return { success: false, error: updateResult.error }
        }

        return { success: true, code: validatedCode }
    } catch (error) {
        console.error('Generation failed:', error)

        const { createAdminClient } = await import('@/lib/supabase/admin')
        const supabase = createAdminClient()
        await supabase
            .from('projects')
            .update({ status: 'error' as const, generation_phase: null })
            .eq('id', projectId)

        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown generation error',
        }
    }
}

/**
 * Specifically cleans and formats code pasted manually via the Code Drop feature.
 */
export async function cleanTemplateCode(rawCode: string, industry: string): Promise<string> {
    const aiInstance = getModel();

    const prompt = `
You are an expert React and Tailwind developer. 
Your task is to review and clean up this manually dropped React code snippet.
Industry context: ${industry}

STRICT RULES:
1. Ensure the code is a valid React component.
2. The main export MUST be exactly: \`export default function GeneratedPage()\`
3. All React hooks (useState, useEffect, etc.) MUST be at the top-level of the component layout. Ensure there are no rules of hooks violations.
4. All icons must be imported from 'lucide-react'. Fix any missing imports.
5. Fix any missing closing tags or syntax errors.
6. The code must exclusively use standard Tailwind classes.
7. Return ONLY the raw code block itself in your response. No markdown wrappers, no explanations.

Code to clean:
\`\`\`tsx
${rawCode}
\`\`\`
`.trim();

    try {
        const { text } = await generateText({
            model: aiInstance,
            prompt,
        });

        let cleanedCode = text.trim();
        if (cleanedCode.startsWith('\`\`\`')) {
            cleanedCode = cleanedCode.replace(/^\`\`\`(?:tsx|typescript|jsx|javascript)?\n?/, '');
            cleanedCode = cleanedCode.replace(/\n?\`\`\`$/, '');
        }

        return cleanedCode.trim();
    } catch (e) {
        console.error("Error cleaning template code:", e);
        throw new Error("Failed to analyze and clean template code");
    }
}
