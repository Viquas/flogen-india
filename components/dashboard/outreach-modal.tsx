"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { MessageCircle, Mail, Send, Copy, Check, ChevronDown, AlertTriangle } from "lucide-react"

const CURRENCIES = [
    { code: "USD", symbol: "$", label: "USD ($)" },
    { code: "INR", symbol: "₹", label: "INR (₹)" },
    { code: "EUR", symbol: "€", label: "EUR (€)" },
    { code: "GBP", symbol: "£", label: "GBP (£)" },
    { code: "AUD", symbol: "A$", label: "AUD (A$)" },
    { code: "AED", symbol: "د.إ", label: "AED (د.إ)" },
]

interface OutreachModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    project: {
        id: string
        business_data: any
    }
    onApprove?: () => void
}

/**
 * Strips all non-digit characters and returns digits only.
 * Preserves a leading '+' for international format detection.
 */
const cleanPhoneNumber = (raw: string): string => raw.replace(/[^0-9+]/g, "").replace(/\++/g, "+")

/**
 * Converts any phone number format to an E.164-compatible digit string
 * suitable for wa.me (e.g. "919876543210" not "+91 98765 43210").
 */
const toWhatsAppNumber = (raw: string): string => {
    const cleaned = raw.replace(/[^0-9]/g, "")
    return cleaned
}

const extractContactInfo = (bd: any) => {
    const opContact = bd?.operationalData?.contact

    // Prefer international phone number (includes country code) for WhatsApp reliability
    // Priority: enriched international > enriched flat > enriched nested > international from Places > legacy > national (last resort)
    const phone =
        (typeof opContact?.phone === "string" ? opContact.phone : null)
        || opContact?.phone?.primary
        || bd?.internationalPhoneNumber  // stored from Google Places API
        || bd?.contactInfo?.phone
        || bd?.nationalPhoneNumber       // fallback — no country code, WhatsApp may fail
        || null

    // WhatsApp: dedicated field > fallback to phone (prefer international)
    const whatsapp =
        (typeof opContact?.whatsapp === "string" ? opContact.whatsapp : null)
        || bd?.internationalPhoneNumber
        || phone

    // Email: enriched flat string > enriched record > legacy
    const emailOp = opContact?.email
    const emailLegacy = bd?.contactInfo?.email
    const email =
        (typeof emailOp === "string" ? emailOp : null)
        || (emailOp && typeof emailOp === "object" ? (Object.values(emailOp)[0] as string) : null)
        || (typeof emailLegacy === "string" ? emailLegacy : null)
        || null

    const businessName =
        bd?.businessName
        || bd?.brandIdentity?.core?.brandName
        || bd?.business_name
        || "there"

    return { phone, whatsapp, email, businessName }
}

export function OutreachModal({ open, onOpenChange, project, onApprove }: OutreachModalProps) {
    const bd = project.business_data
    const { phone, whatsapp, email, businessName } = extractContactInfo(bd)

    const hasWhatsApp = !!whatsapp
    const hasEmail = !!email

    // Warn if the WhatsApp number is likely missing a country code (digits only, ≤10 chars)
    const whatsappDigitsOnly = whatsapp ? whatsapp.replace(/[^0-9]/g, "") : ""
    const whatsappMissingCountryCode = hasWhatsApp && !whatsapp!.includes("+") && whatsappDigitsOnly.length <= 10

    const defaultChannel = hasWhatsApp ? "whatsapp" as const : hasEmail ? "email" as const : null
    const [activeChannel, setActiveChannel] = useState<"whatsapp" | "email" | null>(defaultChannel)
    const [currency, setCurrency] = useState("USD")
    const [amount, setAmount] = useState("499")
    const [senderName, setSenderName] = useState("Team")
    const [copied, setCopied] = useState(false)
    const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (open) {
            setActiveChannel(hasWhatsApp ? "whatsapp" : hasEmail ? "email" : null)
            setCopied(false)
            setShowCurrencyDropdown(false)
        }
    }, [open, hasWhatsApp, hasEmail])

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowCurrencyDropdown(false)
            }
        }
        if (showCurrencyDropdown) {
            document.addEventListener("mousedown", handleClickOutside)
        }
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [showCurrencyDropdown])

    const previewUrl = typeof window !== "undefined"
        ? `${window.location.origin}/editor?id=${project.id}`
        : `/editor?id=${project.id}`

    const selectedCurrency = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0]

    const messageText = useMemo(() => {
        return `Hi there,

I was looking for your services on Google Maps and noticed you don't have a website yet.

I know how busy running a business gets, so my team at Overglide Studio went ahead and built a custom, working website draft for you. You can check it out here:
${previewUrl}

Having a professional site helps build trust and brings in more local leads. If you like the direction of the design, we can easily tweak it to match your exact preferences.

We're currently offering to transfer this complete setup to you for ${selectedCurrency.symbol}${amount}.

Let me know what you think of the design, or if you have any questions!

Best,
${senderName}
Overglide.studio`
    }, [previewUrl, selectedCurrency.symbol, amount, senderName])

    const handleCopy = () => {
        navigator.clipboard.writeText(messageText)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleSend = () => {
        if (activeChannel === "whatsapp" && whatsapp) {
            const cleanPhone = toWhatsAppNumber(whatsapp)
            const encoded = encodeURIComponent(messageText)
            // Use api.whatsapp.com/send — more reliable than wa.me for desktop/web clients
            const waUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`
            window.open(waUrl, "_blank", "noopener,noreferrer")
        } else if (activeChannel === "email" && email) {
            const subject = encodeURIComponent(`Custom Website Draft for ${businessName}`)
            const body = encodeURIComponent(messageText)
            // Use window.open for mailto — avoids Next.js router interception
            const mailtoUrl = `mailto:${email}?subject=${subject}&body=${body}`
            window.open(mailtoUrl, "_self")
        }

        onApprove?.()
        onOpenChange(false)
    }

    const handleApproveOnly = () => {
        onApprove?.()
        onOpenChange(false)
    }

    if (!hasWhatsApp && !hasEmail) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>No Contact Info Available</DialogTitle>
                        <DialogDescription>
                            This business doesn&apos;t have an email or phone number on file.
                            You can still approve the project.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleApproveOnly}>
                            Approve Anyway
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl">
                        Reach out to {businessName}
                    </DialogTitle>
                    <DialogDescription>
                        Send a pre-written sales pitch via WhatsApp or Email with a link to their custom website.
                    </DialogDescription>
                </DialogHeader>

                {/* Channel Selection */}
                <div className="flex gap-3 mt-2">
                    {hasWhatsApp && (
                        <button
                            onClick={() => setActiveChannel("whatsapp")}
                            className={`flex-1 flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl border-2 transition-all text-sm font-medium ${activeChannel === "whatsapp"
                                ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
                                }`}
                            aria-label="Select WhatsApp channel"
                            tabIndex={0}
                        >
                            <MessageCircle className="h-5 w-5" />
                            WhatsApp
                            <span className="text-xs font-normal opacity-70 truncate max-w-[140px]">
                                {whatsapp}
                            </span>
                        </button>
                    )}
                    {hasEmail && (
                        <button
                            onClick={() => setActiveChannel("email")}
                            className={`flex-1 flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl border-2 transition-all text-sm font-medium ${activeChannel === "email"
                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
                                }`}
                            aria-label="Select Email channel"
                            tabIndex={0}
                        >
                            <Mail className="h-5 w-5" />
                            Email
                            <span className="text-xs font-normal opacity-70 truncate max-w-[160px]">
                                {email}
                            </span>
                        </button>
                    )}
                </div>

                {/* Country code warning for WhatsApp */}
                {activeChannel === "whatsapp" && whatsappMissingCountryCode && (
                    <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                        <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-500" />
                        <span>
                            Phone number <strong>{whatsapp}</strong> may be missing a country code (e.g. +91 for India).
                            WhatsApp requires the full international number — the message may fail to open.
                        </span>
                    </div>
                )}

                {/* Pricing & Sender Controls */}
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {/* Currency Dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-200 bg-zinc-50 text-sm font-medium text-zinc-700 hover:bg-zinc-100 transition-colors"
                            aria-label="Select currency"
                            tabIndex={0}
                        >
                            {selectedCurrency.label}
                            <ChevronDown className={`h-3.5 w-3.5 text-zinc-400 transition-transform ${showCurrencyDropdown ? "rotate-180" : ""}`} />
                        </button>
                        {showCurrencyDropdown && (
                            <div className="absolute top-full mt-1 left-0 bg-white border border-zinc-200 rounded-lg shadow-lg z-50 py-1 min-w-[140px]">
                                {CURRENCIES.map(c => (
                                    <button
                                        key={c.code}
                                        onClick={() => { setCurrency(c.code); setShowCurrencyDropdown(false) }}
                                        className={`w-full text-left px-3 py-2 text-sm hover:bg-zinc-50 transition-colors ${c.code === currency ? "font-medium text-zinc-900 bg-zinc-50" : "text-zinc-600"
                                            }`}
                                    >
                                        {c.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Amount Input */}
                    <input
                        type="text"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-28 px-3 py-2 rounded-lg border border-zinc-200 bg-zinc-50 text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                        placeholder="Amount"
                        aria-label="Enter pricing amount"
                    />

                    <div className="flex-1" />

                    {/* Sender Name */}
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-zinc-500 whitespace-nowrap">
                            Sender:
                        </label>
                        <input
                            type="text"
                            value={senderName}
                            onChange={(e) => setSenderName(e.target.value)}
                            className="w-32 px-3 py-2 rounded-lg border border-zinc-200 bg-zinc-50 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                            placeholder="Your name"
                            aria-label="Enter sender name"
                        />
                    </div>
                </div>

                {/* Message Preview */}
                <div className="relative mt-1">
                    <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap max-h-[260px] overflow-y-auto font-mono text-[13px]">
                        {messageText}
                    </div>
                    <button
                        onClick={handleCopy}
                        className="absolute top-3 right-3 p-1.5 rounded-md bg-white border border-zinc-200 hover:bg-zinc-100 transition-colors"
                        aria-label="Copy message to clipboard"
                        tabIndex={0}
                    >
                        {copied
                            ? <Check className="h-4 w-4 text-emerald-500" />
                            : <Copy className="h-4 w-4 text-zinc-400" />
                        }
                    </button>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between pt-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={handleApproveOnly}>
                            Approve Only
                        </Button>
                        <Button
                            onClick={handleSend}
                            disabled={!activeChannel}
                            className={
                                activeChannel === "whatsapp"
                                    ? "bg-emerald-600 hover:bg-emerald-700 gap-2"
                                    : "bg-blue-600 hover:bg-blue-700 gap-2"
                            }
                        >
                            <Send className="h-4 w-4" />
                            {activeChannel === "whatsapp" ? "Open WhatsApp" : "Open Email"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
