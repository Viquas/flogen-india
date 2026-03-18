# Phase 9: Customization and Upsell - Research

**Researched:** 2026-03-19
**Domain:** Multi-step form with file uploads (Supabase Storage), color pickers, contact pre-fill, booking system setup, and Cal.com iframe upsell
**Confidence:** HIGH

## Summary

Phase 9 converts a paid claim into a deliverable -- the operator receives everything needed to customize and ship the final website. The phase has two distinct parts: (1) a multi-step customization form at `/claim/{slug}/customize` collecting logo, photos, colors, contact info, text changes, and Pro-only booking setup; and (2) a strategy call upsell page at `/claim/{slug}/upsell` with a Cal.com iframe embed (free for Pro, paid for Standard).

The existing codebase provides a strong foundation. Phase 6 created the `customizations` table with all needed columns (logo_url, primary_color, secondary_color, phone, email, address, tagline, about_text, photo_urls, notes, wants_booking_system, booking_preferences, wants_strategy_call, preferred_call_time, status). Phase 6 also created the `claim-uploads` private Storage bucket (5MB limit, PNG/JPEG/WebP MIME types) with a public read policy on `site-screenshots`. Phase 8 built the complete payment flow, the `confirmed/` route, and established the paid-claim redirect guard pattern. The `CustomizationRow`/`Insert`/`Update` TypeScript types already exist in `types/database.ts`.

The primary technical challenges are: (a) file uploads from unauthenticated clients to Supabase Storage -- requiring server-generated signed upload URLs with server-side file validation; (b) pre-filling contact info from the `projects.business_data` JSON (which stores Google Maps enrichment data); (c) Cal.com iframe embed without the npm package (React 19 incompatible); and (d) the conditional Razorpay payment for Standard plan strategy call upsell. No new npm dependencies are required -- all functionality uses existing stack (Supabase JS, Next.js server actions, Razorpay).

**Primary recommendation:** Build as 4 plans: (1) server-side upload API with validation + customize page scaffold with payment gate, (2) customization form steps (logo, photos, colors, contact, text, Pro booking), (3) form submission + claim status update, (4) upsell page with Cal.com iframe and Standard plan payment. The upload infrastructure must be built before the form because every file field depends on it.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CUST-01 | Customization form at `/claim/{site_slug}/customize` only accessible after verified payment (server-side check) | Server component checks `claims.status` is `paid` or `customizing`. Pattern established by `confirmed/page.tsx` paid-claim guard. Redirect to `/claim/{slug}` if not paid. |
| CUST-02 | Logo upload (required) via Supabase Storage with drag-and-drop, thumbnail preview, 5MB max, PNG/JPG/SVG | `claim-uploads` bucket already exists (5MB limit). Upload via server API route with signed URLs. Server-side magic byte validation. SVG rejected per P6 pitfall -- only PNG/JPG/WebP. Thumbnail via `URL.createObjectURL()` client-side. |
| CUST-03 | Brand color pickers (optional, default "keep current colors") with primary and secondary hex inputs | `customizations` table has `primary_color` and `secondary_color` TEXT columns. Simple hex input with color swatch preview. No dependency needed -- native `<input type="color">` or manual hex input. |
| CUST-04 | Contact info pre-filled from Google Maps data (phone, email, address, hours, WhatsApp) -- editable | `projects.business_data` JSON contains `contactInfo` from Google Places enrichment. Server component reads and passes to client form. Fields: phone, email, address (pre-filled, editable). |
| CUST-05 | Text changes textarea (1000 char limit) for headline/content modification requests | `customizations.notes` TEXT column stores free-form text. Simple `<textarea maxLength={1000}>` with character counter. Maps to `tagline` + `about_text` + `notes` columns. |
| CUST-06 | Multi-photo upload (optional, max 10 photos, 5MB each) via Supabase Storage with thumbnails and remove button | `customizations.photo_urls` JSONB column stores array of storage paths. Same upload API as logo but with multi-file support. Client-side thumbnail preview + remove button. |
| CUST-07 | Booking system setup section visible only for Pro plan (service types, available days/hours, buffer time) | `customizations.wants_booking_system` BOOLEAN + `booking_preferences` JSONB. Conditional render based on `claims.plan === 'pro'`. Structured JSON: `{ serviceTypes: string[], availableDays: string[], hours: { start, end }, bufferMinutes: number }`. |
| CUST-08 | On submit, creates customization record, updates site status to 'customizing', sends admin notification | Insert into `customizations` table, update `claims.status` to `customizing`. Admin notification deferred -- no email service. Console log for now. |
| CUST-09 | Progress indicator shows Step 1 (Payment) -> Step 2 (Customize - current) -> Step 3 (Go Live) | Simple 3-step progress bar component. Step 1 complete (green check), Step 2 active (blue), Step 3 upcoming (gray). Reuse timeline pattern from confirmation page. |
| UPSELL-01 | After customization submission, strategy call upsell appears (free for Pro, 1,999 INR / $49 for Standard) | New page at `/claim/{slug}/upsell`. Conditional messaging based on plan. Pro: "Your plan includes a free strategy call". Standard: "Add a strategy call for X". |
| UPSELL-02 | Cal.com embed (iframe) for scheduling with available slots | Iframe with `src="https://cal.com/{username}/{event}?embed=true&layout=month_view&name={name}&email={email}"`. No npm package (React 19 incompatible). Lazy-loaded. |
| UPSELL-03 | "No thanks, continue to confirmation" skip link is clearly visible and easy to find | Equal-prominence buttons: "Book Strategy Call" and "Skip to Confirmation". No dark patterns. Skip link navigates to `/claim/{slug}/confirmed`. |
| UPSELL-04 | Standard plan call fee collected via Razorpay payment link before showing calendar | Reuse `createRazorpayOrder` pattern with upsell-specific amount (199900 paise INR / 4900 cents USD). On payment success, show Cal.com iframe. Skip payment for Pro. |
</phase_requirements>

## Standard Stack

### Core (Already Installed -- No New Dependencies)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | ^2.95.3 | Storage uploads (signed URLs), database CRUD | Already installed. `createSignedUploadUrl` + `uploadToSignedUrl` for client uploads. `createAdminClient()` for server-side operations. |
| `razorpay` | ^2.9.6 | Upsell payment for Standard plan strategy call | Already installed from Phase 8. Reuse `createRazorpayOrder` server action pattern. |
| `zod` | ^4.3.6 | Form validation for customization inputs | Already installed. Validate file types, hex colors, phone formats, text lengths. |
| `lucide-react` | ^0.563.0 | Icons for form steps and upload zones | Already installed. Upload, camera, palette, phone, text icons. |

### Supporting (Already Installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `next/script` | built-in | Load Cal.com embed script (if using script approach) | Upsell page Cal.com integration |
| `react` | 19.2.3 | `useActionState` for form submission, `useState` for multi-step | Form state management |
| Native `<input type="color">` | N/A | Color picker | CUST-03 brand colors |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Server-proxy upload API route | Direct signed URL upload from client | Server-proxy eliminates CORS issues entirely (P11). Direct signed URL is faster but CORS config on Supabase bucket is fragile. **Use server-proxy.** |
| Native `<input type="color">` | `react-colorful` or `@radix-ui/colors` | Native input works on all modern browsers including mobile. No dependency added. Good enough for hex color selection. |
| Cal.com iframe | `@calcom/embed-react` npm package | npm package has React 19 peer dependency conflict (GitHub issues #20814, #20681, #20990). Iframe provides complete CSS isolation and zero dependency conflicts. **Use iframe.** |
| Multi-step form with URL segments | Client-side step state | URL segments (`/customize/step/1`) add complexity and navigation issues. Client-side step counter with per-step save is simpler and matches the single-page mobile experience. **Use client-side steps.** |

**Installation:**
```bash
# No new packages needed -- all dependencies already installed
```

**Environment Variables (NEW for Phase 9):**
```bash
NEXT_PUBLIC_CAL_LINK=username/event-type    # Cal.com booking link (e.g., "flogen/strategy-call")
```

## Architecture Patterns

### Existing Files That Phase 9 Modifies

```
webgen/
  app/(client)/claim/[slug]/
    page.tsx                    # MODIFY: redirect paid claims to /customize instead of /confirmed
    confirmed/page.tsx          # MODIFY: handle arrival from upsell skip
  types/
    database.ts                 # READ-ONLY: CustomizationRow types already complete
  scripts/
    setup-claims-schema.sql     # READ-ONLY: customizations table already created
  lib/
    claim-pricing.ts            # MODIFY: add upsell pricing constants
```

### New Files Phase 9 Creates

```
webgen/
  app/(client)/claim/[slug]/
    customize/
      page.tsx                  # Server component: payment gate, data fetch, pre-fill
      customize-client.tsx      # Client component: multi-step form orchestrator
      components/
        progress-steps.tsx      # Step 1/2/3 progress indicator
        logo-upload.tsx         # Drag-drop logo upload with preview
        photo-upload.tsx        # Multi-photo upload with thumbnails + remove
        color-picker.tsx        # Primary/secondary hex color inputs with swatches
        contact-form.tsx        # Pre-filled contact info fields
        text-changes.tsx        # Textarea with character counter
        booking-setup.tsx       # Pro-only booking system preferences
    upsell/
      page.tsx                  # Server component: plan check, upsell pricing
      upsell-client.tsx         # Client component: Cal.com iframe + skip button
    claim-actions.ts            # MODIFY: add submitCustomization, createUpsellOrder server actions
  app/api/uploads/
    signed-url/route.ts         # POST: generate signed upload URL with validation
```

### Pattern 1: Payment-Gated Server Component
**What:** Server component checks claim status before rendering the customize page.
**When to use:** `/claim/{slug}/customize` and `/claim/{slug}/upsell` pages.
**Example:**
```typescript
// app/(client)/claim/[slug]/customize/page.tsx
import { redirect, notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'

export default async function CustomizePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = createAdminClient()

  // Fetch project with business data for pre-fill
  const { data: project } = await supabase
    .from('projects')
    .select('id, business_data')
    .eq('id', slug)
    .single()

  if (!project) notFound()

  // Payment gate: find paid claim
  const { data: claim } = await supabase
    .from('claims')
    .select('id, status, plan')
    .eq('project_id', project.id)
    .in('status', ['paid', 'customizing'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!claim) redirect(`/claim/${slug}`)

  // Check if customization already submitted
  const { data: existingCustomization } = await supabase
    .from('customizations')
    .select('id, status')
    .eq('claim_id', claim.id)
    .maybeSingle()

  if (existingCustomization?.status !== 'pending' && existingCustomization) {
    redirect(`/claim/${slug}/upsell`)
  }

  // Extract pre-fill data from business_data JSON
  const businessData = project.business_data as Record<string, unknown>
  const contactInfo = (businessData?.contactInfo as Record<string, unknown>) || {}

  return (
    <CustomizeClient
      claimId={claim.id}
      plan={claim.plan}
      slug={slug}
      prefill={{
        phone: (contactInfo?.phone as string) || '',
        email: (contactInfo?.email as string) || '',
        address: (contactInfo?.address as string) || '',
      }}
      existingCustomization={existingCustomization}
    />
  )
}
```

### Pattern 2: Server-Proxy File Upload with Validation
**What:** API route that validates files server-side, generates signed upload URLs, and returns storage paths.
**When to use:** Logo and photo uploads from the customization form.
**Why server-proxy:** Eliminates CORS issues (P11), enables magic byte validation (P6), keeps service role key server-side.
**Example:**
```typescript
// app/api/uploads/signed-url/route.ts
import { createAdminClient } from '@/lib/supabase/admin'

const ALLOWED_MAGIC_BYTES: Record<string, number[]> = {
  'image/png':  [0x89, 0x50, 0x4E, 0x47],
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/webp': [0x52, 0x49, 0x46, 0x46], // RIFF header
}
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const claimId = formData.get('claimId') as string | null
  const type = formData.get('type') as 'logo' | 'photo' | null

  if (!file || !claimId || !type) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Size check
  if (file.size > MAX_FILE_SIZE) {
    return Response.json({ error: 'File exceeds 5MB limit' }, { status: 400 })
  }

  // Magic byte validation
  const buffer = await file.arrayBuffer()
  const header = new Uint8Array(buffer.slice(0, 4))
  const isValid = Object.entries(ALLOWED_MAGIC_BYTES).some(([, bytes]) =>
    bytes.every((byte, i) => header[i] === byte)
  )
  if (!isValid) {
    return Response.json({ error: 'Invalid file type. Only PNG, JPG, and WebP allowed.' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Verify claim is paid
  const { data: claim } = await supabase
    .from('claims')
    .select('status')
    .eq('id', claimId)
    .single()

  if (!claim || !['paid', 'customizing'].includes(claim.status)) {
    return Response.json({ error: 'Unauthorized' }, { status: 403 })
  }

  // Upload directly from server (bypasses CORS)
  const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const path = `${claimId}/${type}/${safeName}`

  const { error: uploadError } = await supabase.storage
    .from('claim-uploads')
    .upload(path, buffer, {
      contentType: file.type,
      cacheControl: '3600',
    })

  if (uploadError) {
    return Response.json({ error: 'Upload failed' }, { status: 500 })
  }

  return Response.json({ path, bucket: 'claim-uploads' })
}
```

### Pattern 3: Cal.com Iframe Embed with Prefill
**What:** Iframe loading Cal.com booking page with client name/email prefilled via query parameters.
**When to use:** Upsell page after customization submission.
**Example:**
```typescript
// Upsell page Cal.com iframe
const calLink = process.env.NEXT_PUBLIC_CAL_LINK || 'flogen/strategy-call'
const iframeSrc = `https://cal.com/${calLink}?embed=true&layout=month_view&name=${encodeURIComponent(clientName)}&email=${encodeURIComponent(clientEmail)}`

<iframe
  src={iframeSrc}
  style={{ width: '100%', height: '600px', border: 'none' }}
  loading="lazy"
  title="Book a Strategy Call"
/>
```

### Pattern 4: Multi-Step Form with Per-Step Save
**What:** Client-side step counter with data saved to customizations table at each step transition.
**When to use:** The customization form has multiple sections that should save progress.
**Example:**
```typescript
// customize-client.tsx core pattern
const [step, setStep] = useState(1)
const TOTAL_STEPS = 4 // Logo+Colors, Contact, Photos+Text, Booking(Pro)/Review

const handleNextStep = async (stepData: Partial<CustomizationData>) => {
  // Save current step data via server action
  await saveCustomizationStep(claimId, stepData)
  setStep(prev => prev + 1)
}
```

### Anti-Patterns to Avoid
- **NEVER use `uploadProjectAsset()` for client uploads:** It has zero validation (P6) and uses browser client with anon key. Client uploads must go through the validated server-proxy API route.
- **NEVER store signed URLs in the database:** Signed URLs expire in 2 hours (P7). Store storage paths (`{claimId}/logo/{filename}`). Generate fresh signed download URLs at render time if needed.
- **NEVER install `@calcom/embed-react`:** React 19 peer dependency conflict. Use iframe approach.
- **NEVER block the flow on upsell:** Skip button must be equally prominent as the booking button (UPSELL-03). No countdown, no dark patterns.
- **NEVER trust client-side `file.type`:** It is spoofable. Validate magic bytes server-side (P6).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| File upload validation | Custom MIME parser | Magic byte check (4 bytes) | 3 lines of code vs. full MIME library. PNG: `89 50`, JPEG: `FF D8`, WebP: `52 49 46 46`. Covers all allowed types. |
| Color picker | Full HSL color wheel component | Native `<input type="color">` + hex text input | Works on all browsers. Returns hex. Zero dependency. Optional preset swatches are just colored divs with onClick. |
| Booking calendar | Custom appointment scheduler | Cal.com iframe embed | Custom booking = timezone handling, conflict detection, email reminders. Cal.com does this for $0-12/month. |
| Multi-file upload UI | Custom drag-and-drop library | Native HTML5 drag-and-drop + `<input type="file" multiple>` | `ondrop` + `ondragover` events + `FileList` API. No library needed for a drop zone with file input fallback. |
| Form state persistence | Local storage + sync logic | Server action save per step | Database is the source of truth. If user returns, server component loads existing `customizations` row. No client-side sync needed. |
| Progress indicator | Step wizard library | 3-div flexbox with conditional colors | Three circles with connecting lines. 20 lines of JSX. No library. |

**Key insight:** Phase 9 is primarily UI work. All infrastructure (tables, types, buckets, payment) exists from Phases 6-8. The work is building forms, upload UIs, and wiring to existing database columns.

## Common Pitfalls

### Pitfall 1: CORS Blocks Direct Client Upload to Supabase Storage (P11)
**What goes wrong:** Client uploads file directly to Supabase Storage signed URL. Browser preflight OPTIONS request blocked by CORS. Upload fails silently.
**Why it happens:** Supabase Storage CORS is separate from API CORS. Multiple GitHub issues (#29421, #221, #1662) document this.
**How to avoid:** Use server-proxy upload pattern. Client sends file to `/api/uploads/signed-url` via FormData. Server uploads to Supabase using service role key (bypasses CORS entirely).
**Warning signs:** Upload works from Postman but fails from browser. Works on localhost but fails on deployed domain.

### Pitfall 2: Client-Reported File Type Is Spoofable (P6)
**What goes wrong:** Attacker renames `malware.exe` to `logo.png`. Browser reports `image/png`. File uploaded to storage.
**Why it happens:** `file.type` in JavaScript comes from the browser, which infers from extension, not content.
**How to avoid:** Validate magic bytes server-side. PNG starts with `89 50 4E 47`. JPEG starts with `FF D8 FF`. WebP starts with `52 49 46 46`. Reject everything else. Reject SVG entirely (script injection vector).
**Warning signs:** Files in bucket with unexpected content despite correct extension.

### Pitfall 3: Storing Signed URLs Instead of Storage Paths (P7)
**What goes wrong:** Signed upload URLs expire in 2 hours (fixed, non-configurable). If the operator reviews the customization after 2 hours, all file links are broken.
**Why it happens:** Developer stores the full signed URL from `createSignedUploadUrl` in the database instead of just the path.
**How to avoid:** Store only the storage path (`{claimId}/logo/1234.png`) in the `customizations` table. Generate fresh signed download URLs at operator render time using `createSignedUrl(path, 3600)`. For the `claim-uploads` private bucket, operator reads via admin client which bypasses RLS.
**Warning signs:** Broken images in operator review after a few hours.

### Pitfall 4: Next.js API Route Body Size Limit for File Uploads
**What goes wrong:** Next.js API routes have a default 4MB body size limit. A 5MB photo upload to the server-proxy route fails with "413 Payload Too Large".
**Why it happens:** Next.js App Router route handlers have a configurable body size limit.
**How to avoid:** Set `export const maxDuration = 60` and configure body size in the route segment config. For App Router, use `export const config = { api: { bodyParser: { sizeLimit: '10mb' } } }` -- but note this is a Pages Router pattern. In App Router, the body is read via `request.formData()` which handles streaming. Verify with a 5MB test file that the upload completes.
**Warning signs:** 413 errors only for larger files. Small files work fine.

### Pitfall 5: Redirect Loop Between Customize and Confirmed Pages
**What goes wrong:** After customization submission, claim status changes to `customizing`. The claim page sees `customizing` status and redirects to `/confirmed`. But the upsell page also checks status. If redirects are not ordered correctly, user bounces between pages.
**How to avoid:** Clear redirect chain: `/claim/{slug}` -> if paid, redirect to `/customize`. `/customize` -> on submit, redirect to `/upsell`. `/upsell` -> on skip or book, redirect to `/confirmed`. Status transitions: `paid` -> `customizing` (on form submit). The `page.tsx` redirect guard should check for `customizing` status and redirect to `/upsell` (not confirmed).
**Warning signs:** Browser shows "too many redirects" error.

## Code Examples

### Customization Form Data Shape (matches `customizations` table)
```typescript
// Derived from types/database.ts CustomizationInsert
interface CustomizationFormData {
  claim_id: string
  logo_url: string | null            // Storage path, not URL
  primary_color: string | null       // Hex like "#2563EB"
  secondary_color: string | null     // Hex like "#0F172A"
  phone: string | null
  email: string | null
  address: string | null
  tagline: string | null             // Headline change request
  about_text: string | null          // About section text
  photo_urls: string[]               // Array of storage paths
  notes: string | null               // Free-form text changes (1000 char)
  wants_booking_system: boolean      // Pro-only
  booking_preferences: {             // Pro-only, JSONB
    serviceTypes: string[]
    availableDays: string[]
    hours: { start: string; end: string }
    bufferMinutes: number
  } | null
  wants_strategy_call: boolean
}
```

### Business Data Contact Pre-fill Extraction
```typescript
// Extract contact info from projects.business_data JSON
// business_data shape varies but typically includes:
const businessData = project.business_data as Record<string, unknown>
const contactInfo = (businessData?.contactInfo as Record<string, unknown>) || {}

const prefill = {
  phone: (contactInfo?.phone as string) || (contactInfo?.formatted_phone_number as string) || '',
  email: (contactInfo?.email as string) || '',
  address: (contactInfo?.formatted_address as string) || (contactInfo?.address as string) || '',
  businessName: (businessData?.businessName as string) || '',
}
// Note: Google Places data uses `formatted_phone_number` and `formatted_address`
// The exact key depends on how enrichment stored the data. Check actual data shape.
```

### Drag-and-Drop Upload Zone Component Pattern
```typescript
// components/claim/logo-upload.tsx pattern
'use client'
import { useState, useCallback } from 'react'

export function LogoUpload({ claimId, onUploaded }: { claimId: string; onUploaded: (path: string) => void }) {
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = useCallback(async (file: File) => {
    // Client-side pre-checks (server validates too)
    if (file.size > 5 * 1024 * 1024) {
      setError('File must be under 5MB')
      return
    }
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setError('Only PNG, JPG, and WebP files allowed')
      return
    }

    setPreview(URL.createObjectURL(file))
    setUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('claimId', claimId)
    formData.append('type', 'logo')

    const res = await fetch('/api/uploads/signed-url', { method: 'POST', body: formData })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Upload failed')
      setPreview(null)
    } else {
      onUploaded(data.path)
    }
    setUploading(false)
  }, [claimId, onUploaded])

  return (
    <div
      onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]) }}
      onDragOver={(e) => e.preventDefault()}
      className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer"
    >
      {preview ? (
        <img src={preview} alt="Logo preview" className="max-h-24 mx-auto" />
      ) : (
        <p>Drag your logo here or click to browse</p>
      )}
      <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} className="hidden" />
      {uploading && <p className="text-sm text-gray-400 mt-2">Uploading...</p>}
      {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
    </div>
  )
}
```

### Upsell Pricing Constants
```typescript
// Addition to lib/claim-pricing.ts
export const UPSELL_PRICING = {
  strategy_call: {
    INR: 199900,   // 1,999 INR in paise
    USD: 4900,     // $49 in cents
  },
} as const

export const UPSELL_DISPLAY = {
  strategy_call: {
    INR: '1,999',
    USD: '49',
  },
} as const
```

### Redirect Chain Logic
```typescript
// Claim page redirect logic (update to page.tsx)
// Current: paid -> redirect to /confirmed
// New: paid -> redirect to /customize, customizing -> redirect to /upsell or /confirmed

if (paidClaim) {
  if (paidClaim.status === 'paid') {
    redirect(`/claim/${slug}/customize`)
  }
  // Check if customization submitted
  const { data: customization } = await supabase
    .from('customizations')
    .select('id')
    .eq('claim_id', paidClaim.id)
    .maybeSingle()

  if (customization) {
    redirect(`/claim/${slug}/confirmed`)
  }
  // customizing but no customization record yet -- still on form
  redirect(`/claim/${slug}/customize`)
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@calcom/embed-react` npm package | iframe with query param prefill | Cal.com hasn't updated for React 19 (as of March 2026) | Iframe is more reliable, zero dependency conflicts, complete CSS isolation |
| Direct client-to-storage upload via signed URL | Server-proxy upload route | Supabase CORS issues remain common | Server-proxy eliminates CORS entirely, enables server-side validation |
| `file.type` client-side MIME check | Magic byte validation server-side | Always been the correct approach | Prevents MIME spoofing attacks from unauthenticated clients |
| Multi-page form with URL-based steps | Client-side step state with per-step server save | React 19 server actions | Simpler UX on mobile, no navigation confusion, data persists via server actions |

**Deprecated/outdated:**
- `@calcom/embed-react`: React 19 incompatible. Use iframe.
- `uploadProjectAsset()` from `lib/supabase/storage.ts`: Zero validation, uses browser client with anon key. Not suitable for untrusted client uploads.
- SVG uploads: Security risk (embedded scripts). Reject entirely. Accept PNG/JPG/WebP only.

## Open Questions

1. **Business data JSON structure for contact pre-fill**
   - What we know: `projects.business_data` stores Google Places enrichment data as JSON. It contains business name, contact info, and address.
   - What's unclear: The exact key paths for phone, email, and address vary depending on how the enrichment pipeline stored them. Could be `contactInfo.phone` or `formatted_phone_number` at the top level.
   - Recommendation: During implementation, inspect a real `business_data` JSON row to determine exact paths. Add fallback chains for key lookups.

2. **Cal.com account configuration**
   - What we know: Need a Cal.com event type URL for the iframe embed.
   - What's unclear: Whether the operator has created a Cal.com account and configured an event type.
   - Recommendation: Use `NEXT_PUBLIC_CAL_LINK` environment variable. Show a placeholder message if not configured. This is an operational dependency, not a code blocker.

3. **CUST-02 says SVG is allowed but P6 says reject SVG**
   - What we know: CUST-02 lists "PNG/JPG/SVG" for logo upload. P6 pitfall explicitly warns SVG is an attack vector (embedded JavaScript).
   - What's unclear: Whether SVG support is a hard requirement.
   - Recommendation: Reject SVG. Accept only PNG, JPG, WebP. If SVG logos are truly needed, add server-side SVG sanitization in a future iteration. The `claim-uploads` bucket is already configured for PNG/JPEG/WebP only, excluding SVG.

4. **Next.js App Router body size for 5MB file uploads via server proxy**
   - What we know: Server-proxy pattern requires the file to pass through the Next.js API route. Vercel serverless functions have a default 4.5MB request body limit.
   - What's unclear: Whether `request.formData()` in App Router has the same limit or if it streams.
   - Recommendation: Test with a 5MB file during implementation. If the limit is hit, either increase the limit via route segment config or switch to a two-step approach: server generates signed URL, client uploads directly to Supabase (requires CORS config on the bucket).

## Sources

### Primary (HIGH confidence)
- Supabase Storage `createSignedUploadUrl` API reference -- method signature, 2-hour fixed expiry, RLS bypass via token
- Supabase Storage `uploadToSignedUrl` API reference -- `(path, token, fileBody, fileOptions)` signature, returns `{ path, fullPath }`
- Cal.com prefill booking form documentation -- `name` and `email` query parameters supported for iframe prefill
- Cal.com React 19 incompatibility: GitHub issues #20814, #20681, #20990 -- confirmed unresolved
- Project codebase: `scripts/setup-claims-schema.sql` -- `customizations` table DDL with all columns
- Project codebase: `types/database.ts` -- `CustomizationRow`/`Insert`/`Update` types confirmed complete
- Project codebase: `lib/supabase/storage.ts` -- zero validation confirmed (P6)
- Project codebase: Phase 8 files -- payment gate pattern, redirect guards, server action patterns

### Secondary (MEDIUM confidence)
- Supabase Storage CORS issues: GitHub discussions #29421, #221, #1662 -- server-proxy as workaround
- PNG/JPEG/WebP magic byte signatures -- well-documented binary format specifications
- Next.js App Router `request.formData()` body handling -- needs runtime verification for 5MB files on Vercel

### Tertiary (LOW confidence)
- Vercel serverless body size limit for App Router -- documentation references 4.5MB but actual behavior with `formData()` streaming needs validation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Zero new dependencies needed. All functionality uses existing installed packages.
- Architecture: HIGH - Database schema, Storage buckets, TypeScript types, and route patterns all exist from Phases 6-8. Phase 9 is primarily UI construction.
- Pitfalls: HIGH - File upload security (P6), CORS (P11), and signed URL expiry (P7) are verified against official docs and existing codebase inspection.

**Research date:** 2026-03-19
**Valid until:** 2026-04-19 (stable patterns, no fast-moving dependencies)
