'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import { Globe, Link, Search, ArrowLeft, Check, Copy, AlertCircle, Loader2, X, HelpCircle, ExternalLink } from 'lucide-react'

// ----- Types -----

type View = 'grid' | 'subdomain' | 'connect' | 'buy'
type Registrar = 'godaddy' | 'namecheap' | 'cloudflare' | 'google' | 'hostinger' | 'other'

interface DomainClientProps {
    claimId: string
    domainOption: 'subdomain' | 'existing' | 'new' | null
    domainValue: string | null
    projectSlug: string
    businessName: string
    category: string
}

interface DomainStatus {
    domain: string
    zone: string
    status: string
    summary: 'inactive' | 'active' | 'unknown'
}

interface DomainSuggestion {
    domain: string
    available: boolean
}

// ----- Registrar Instructions -----

const REGISTRAR_INSTRUCTIONS: Record<Registrar, string[]> = {
    godaddy: [
        'Log in to GoDaddy.com',
        'Go to My Products',
        'Click DNS next to your domain',
        'Click Add Record',
        'Select Type: TXT',
        'Host: @',
        'Value: {token}',
        'Save',
    ],
    namecheap: [
        'Log in to Namecheap',
        'Go to Domain List',
        'Click Manage',
        'Click Advanced DNS',
        'Add New Record',
        'Type: TXT',
        'Host: @',
        'Value: {token}',
        'Save',
    ],
    cloudflare: [
        'Log in to Cloudflare',
        'Select your domain',
        'Go to DNS',
        'Click Add Record',
        'Type: TXT',
        'Name: @',
        'Content: {token}',
        'Save',
    ],
    google: [
        'Go to domains.google.com',
        'Select your domain',
        'DNS',
        'Custom Records',
        'Create new record',
        'Type: TXT',
        'Host name: (empty)',
        'Data: {token}',
        'Save',
    ],
    hostinger: [
        'Log in to Hostinger',
        'Go to Domains',
        'Click Manage',
        'DNS / Nameservers',
        'Add Record',
        'Type: TXT',
        'Name: @',
        'Value: {token}',
        'Save',
    ],
    other: [
        'Log in to your domain registrar',
        'Navigate to DNS settings for your domain',
        'Add a new DNS record',
        'Record Type: TXT',
        'Host / Name: @',
        'Value / Content: {token}',
        'Save the record',
    ],
}

const REGISTRAR_LABELS: Record<Registrar, string> = {
    godaddy: 'GoDaddy',
    namecheap: 'Namecheap',
    cloudflare: 'Cloudflare',
    google: 'Google Domains',
    hostinger: 'Hostinger',
    other: 'Other',
}

// ----- Helpers -----

function getRegistrarPurchaseLinks(domain: string) {
    const encoded = encodeURIComponent(domain)
    return [
        { name: 'GoDaddy', url: `https://www.godaddy.com/domainsearch/find?checkAvail=1&domainToCheck=${encoded}` },
        { name: 'Namecheap', url: `https://www.namecheap.com/domains/registration/results/?domain=${encoded}` },
        { name: 'Google Domains', url: `https://domains.google.com/registrar/search?searchTerm=${encoded}` },
    ]
}

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false)

    const handleCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(text)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch {
            toast.error('Failed to copy')
        }
    }, [text])

    return (
        <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-gray-100 hover:bg-gray-200 transition-colors"
        >
            {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied' : 'Copy'}
        </button>
    )
}

function BackButton({ onClick }: { onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-4"
        >
            <ArrowLeft className="w-4 h-4" />
            Back
        </button>
    )
}

// ----- Main Component -----

export function DomainClient({
    claimId,
    domainOption: initialOption,
    domainValue: initialValue,
    projectSlug,
    businessName,
    category,
}: DomainClientProps) {
    const [view, setView] = useState<View>('grid')
    const [domainOption, setDomainOption] = useState(initialOption)
    const [domainValue, setDomainValue] = useState(initialValue)

    // Subdomain state
    const [subdomainLoading, setSubdomainLoading] = useState(false)

    // Connect state
    const [connectDomain, setConnectDomain] = useState('')
    const [connectStep, setConnectStep] = useState<1 | 2 | 3>(1)
    const [selectedRegistrar, setSelectedRegistrar] = useState<Registrar>('godaddy')
    const [verifyToken, setVerifyToken] = useState('')
    const [verifyLoading, setVerifyLoading] = useState(false)
    const [verifyResult, setVerifyResult] = useState<'pending' | 'verified' | null>(null)

    // Buy state
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<DomainStatus[]>([])
    const [searchLoading, setSearchLoading] = useState(false)
    const [suggestions, setSuggestions] = useState<DomainSuggestion[]>([])
    const [suggestLoading, setSuggestLoading] = useState(false)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Debounced domain search
    useEffect(() => {
        if (!searchQuery || searchQuery.trim().length < 2) {
            setSearchResults([])
            return
        }

        if (debounceRef.current) clearTimeout(debounceRef.current)

        debounceRef.current = setTimeout(async () => {
            setSearchLoading(true)
            try {
                const res = await fetch(`/api/portal/domain/search?query=${encodeURIComponent(searchQuery.trim())}`)
                const data = await res.json()
                if (res.ok) {
                    setSearchResults(data.results ?? [])
                } else {
                    toast.error(data.error || 'Search failed')
                }
            } catch {
                toast.error('Search failed')
            } finally {
                setSearchLoading(false)
            }
        }, 500)

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current)
        }
    }, [searchQuery])

    // ----- Handlers -----

    const handleActivateSubdomain = useCallback(async () => {
        if (!projectSlug) {
            toast.error('No project slug available')
            return
        }
        setSubdomainLoading(true)
        try {
            const res = await fetch('/api/portal/domain/subdomain', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slug: projectSlug }),
            })
            const data = await res.json()
            if (res.ok && data.success) {
                setDomainOption('subdomain')
                setDomainValue(data.subdomain)
                toast.success('Subdomain activated!')
                setView('grid')
            } else {
                toast.error(data.error || 'Failed to activate subdomain')
            }
        } catch {
            toast.error('Failed to activate subdomain')
        } finally {
            setSubdomainLoading(false)
        }
    }, [projectSlug])

    const handleStartVerification = useCallback(async () => {
        if (!connectDomain.trim()) {
            toast.error('Please enter a domain')
            return
        }
        // Fetch token by initiating a verify call (won't succeed yet, but returns token)
        setVerifyLoading(true)
        try {
            const res = await fetch('/api/portal/domain/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ domain: connectDomain.trim() }),
            })
            const data = await res.json()
            if (data.token) {
                setVerifyToken(data.token)
                setConnectStep(2)
                if (data.verified) {
                    setVerifyResult('verified')
                    setDomainOption('existing')
                    setDomainValue(connectDomain.trim())
                    setConnectStep(3)
                    toast.success('Domain verified!')
                }
            } else if (!res.ok) {
                toast.error(data.error || 'Verification failed')
            }
        } catch {
            toast.error('Verification failed')
        } finally {
            setVerifyLoading(false)
        }
    }, [connectDomain])

    const handleVerify = useCallback(async () => {
        setVerifyLoading(true)
        setVerifyResult(null)
        try {
            const res = await fetch('/api/portal/domain/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ domain: connectDomain.trim() }),
            })
            const data = await res.json()
            if (data.verified) {
                setVerifyResult('verified')
                setDomainOption('existing')
                setDomainValue(connectDomain.trim())
                setConnectStep(3)
                toast.success('Domain verified!')
            } else {
                setVerifyResult('pending')
            }
        } catch {
            toast.error('Verification check failed')
        } finally {
            setVerifyLoading(false)
        }
    }, [connectDomain])

    const handleGetSuggestions = useCallback(async () => {
        const takenDomain = searchResults.find((r) => r.summary === 'active')?.domain || searchQuery
        setSuggestLoading(true)
        setSuggestions([])
        try {
            const res = await fetch('/api/portal/domain/suggest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    businessName,
                    category,
                    unavailableDomain: takenDomain,
                }),
            })
            const data = await res.json()
            if (res.ok) {
                setSuggestions(data.suggestions ?? [])
            } else {
                toast.error(data.error || 'Suggestion failed')
            }
        } catch {
            toast.error('Failed to get suggestions')
        } finally {
            setSuggestLoading(false)
        }
    }, [searchResults, searchQuery, businessName, category])

    const resetToGrid = useCallback(() => {
        setView('grid')
        setConnectDomain('')
        setConnectStep(1)
        setVerifyToken('')
        setVerifyResult(null)
        setSearchQuery('')
        setSearchResults([])
        setSuggestions([])
    }, [])

    // ----- Render: Active Domain Status -----

    const renderActiveDomain = () => {
        if (!domainOption || !domainValue) return null

        const statusLabel = domainOption === 'subdomain' ? 'Active' :
            verifyResult === 'verified' || domainOption === 'existing' ? 'Verified' : 'Pending Verification'
        const statusColor = statusLabel === 'Pending Verification'
            ? 'bg-amber-100 text-amber-700'
            : 'bg-green-100 text-green-700'

        return (
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm mb-6">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-xs text-gray-500 mb-1">Your domain</p>
                        <div className="flex items-center gap-2">
                            <p className="text-lg font-semibold text-gray-900">{domainValue}</p>
                            <CopyButton text={domainValue} />
                        </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full ${statusColor}`}>
                        {statusLabel === 'Pending Verification' ? (
                            <AlertCircle className="w-3 h-3" />
                        ) : (
                            <Check className="w-3 h-3" />
                        )}
                        {statusLabel}
                    </span>
                </div>
                <button
                    onClick={() => setView('grid')}
                    className="mt-3 text-sm text-gray-500 hover:text-gray-700 underline transition-colors"
                >
                    Change Domain
                </button>
            </div>
        )
    }

    // ----- Render: Grid View -----

    const renderGrid = () => (
        <div>
            {renderActiveDomain()}
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Choose your domain</h2>
            <p className="text-sm text-gray-500 mb-6">Select how you want to set up your website domain</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Card 1: Free Subdomain */}
                <div className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col ${domainOption === 'subdomain' ? 'border-[#18181b]/20 ring-1 ring-[#18181b]/10' : 'border-gray-200'}`}>
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
                        <Globe className="w-5 h-5 text-gray-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">Free Subdomain</h3>
                    <p className="text-sm text-gray-500 mb-1">{projectSlug}.sumosite.com</p>
                    <p className="text-xs text-gray-400 mb-4">Included with your plan</p>
                    <div className="mt-auto">
                        {domainOption === 'subdomain' ? (
                            <div className="w-full px-4 py-2 text-sm font-medium text-[#18181b] bg-gray-100 rounded-xl text-center flex items-center justify-center gap-1.5">
                                <Check className="w-4 h-4" />
                                Active
                            </div>
                        ) : (
                            <button
                                onClick={() => setView('subdomain')}
                                className="w-full px-4 py-2 text-sm font-medium text-white bg-[#18181b] hover:bg-[#27272a] rounded-xl transition-colors"
                            >
                                Activate
                            </button>
                        )}
                    </div>
                </div>

                {/* Card 2: Connect Existing */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
                        <Link className="w-5 h-5 text-gray-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">Connect Existing Domain</h3>
                    <p className="text-sm text-gray-500 mb-1">Use a domain you already own</p>
                    <p className="text-xs text-gray-400 mb-4">DNS verification required</p>
                    <div className="mt-auto">
                        <button
                            onClick={() => setView('connect')}
                            className="w-full px-4 py-2 text-sm font-medium text-white bg-[#18181b] hover:bg-[#27272a] rounded-xl transition-colors"
                        >
                            Connect
                        </button>
                    </div>
                </div>

                {/* Card 3: Buy New */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
                        <Search className="w-5 h-5 text-gray-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">Buy New Domain</h3>
                    <p className="text-sm text-gray-500 mb-1">Find and register a new domain</p>
                    <p className="text-xs text-gray-400 mb-4">Via external registrar</p>
                    <div className="mt-auto">
                        <button
                            onClick={() => setView('buy')}
                            className="w-full px-4 py-2 text-sm font-medium text-white bg-[#18181b] hover:bg-[#27272a] rounded-xl transition-colors"
                        >
                            Search
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )

    // ----- Render: Subdomain View -----

    const renderSubdomain = () => (
        <div>
            <BackButton onClick={resetToGrid} />
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm max-w-lg mx-auto">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center mb-4">
                    <Globe className="w-5 h-5 text-gray-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Free Subdomain</h2>
                <p className="text-sm text-gray-500 mb-4">Your website will be available at:</p>

                <div className="bg-gray-50 rounded-lg p-4 mb-4 flex items-center justify-between">
                    <span className="text-base font-mono font-medium text-gray-900">{projectSlug}.sumosite.com</span>
                    <CopyButton text={`${projectSlug}.sumosite.com`} />
                </div>

                {domainOption === 'subdomain' && domainValue ? (
                    <div className="flex items-center gap-2 text-green-700 bg-green-50 rounded-lg p-3">
                        <Check className="w-4 h-4" />
                        <span className="text-sm font-medium">Subdomain is active</span>
                    </div>
                ) : (
                    <button
                        onClick={handleActivateSubdomain}
                        disabled={subdomainLoading}
                        className="w-full px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        {subdomainLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                        Activate Free Subdomain
                    </button>
                )}
            </div>
        </div>
    )

    // ----- Render: Connect View -----

    const renderConnect = () => (
        <div>
            <BackButton onClick={resetToGrid} />
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm max-w-2xl">
                <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center mb-4">
                    <Link className="w-5 h-5 text-purple-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Connect Existing Domain</h2>

                {/* Step indicators */}
                <div className="flex items-center gap-2 mb-6">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                                connectStep >= s ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-400'
                            }`}>
                                {connectStep > s ? <Check className="w-3.5 h-3.5" /> : s}
                            </div>
                            {s < 3 && <div className={`w-8 h-0.5 ${connectStep > s ? 'bg-purple-600' : 'bg-gray-200'}`} />}
                        </div>
                    ))}
                </div>

                {/* Step 1: Enter domain */}
                {connectStep === 1 && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Enter your domain</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={connectDomain}
                                onChange={(e) => setConnectDomain(e.target.value)}
                                placeholder="mybusiness.com"
                                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                            <button
                                onClick={handleStartVerification}
                                disabled={verifyLoading || !connectDomain.trim()}
                                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-2"
                            >
                                {verifyLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                Continue
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Add DNS Record */}
                {connectStep === 2 && (
                    <div>
                        <h3 className="text-sm font-medium text-gray-900 mb-3">Add a DNS TXT record at your registrar</h3>

                        {/* Registrar selector */}
                        <div className="flex flex-wrap gap-2 mb-4">
                            {(Object.keys(REGISTRAR_LABELS) as Registrar[]).map((reg) => (
                                <button
                                    key={reg}
                                    onClick={() => setSelectedRegistrar(reg)}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                                        selectedRegistrar === reg
                                            ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                            : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                                    }`}
                                >
                                    {REGISTRAR_LABELS[reg]}
                                </button>
                            ))}
                        </div>

                        {/* DNS Record Table (Vercel-style) */}
                        <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
                            <div className="text-xs text-gray-500 px-4 py-2 bg-gray-50 border-b border-gray-200">
                                The DNS records at your provider must match the following records to verify your domain.
                            </div>
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-100">
                                        <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-2.5 w-16">Type</th>
                                        <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-2.5 w-20">Name</th>
                                        <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-2.5">Value</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="px-4 py-3 text-sm font-mono font-medium text-gray-900">TXT</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-sm font-mono font-medium text-gray-900">@</span>
                                                <CopyButton text="@" />
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1.5">
                                                <code className="text-sm font-mono font-medium text-gray-900 break-all">{verifyToken}</code>
                                                <CopyButton text={verifyToken} />
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Instructions */}
                        <div className="border border-gray-200 rounded-lg p-4 mb-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">
                                Instructions for {REGISTRAR_LABELS[selectedRegistrar]}
                            </h4>
                            <ol className="space-y-1.5">
                                {REGISTRAR_INSTRUCTIONS[selectedRegistrar].map((step, i) => (
                                    <li key={i} className="text-sm text-gray-600 flex gap-2">
                                        <span className="text-gray-400 font-medium flex-shrink-0">{i + 1}.</span>
                                        <span>{step.replace('{token}', verifyToken)}</span>
                                    </li>
                                ))}
                            </ol>
                        </div>

                        {/* DNS propagation notice */}
                        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-700">
                                DNS changes can take up to 24 hours to propagate. If verification fails, wait and try again.
                            </p>
                        </div>

                        <button
                            onClick={handleVerify}
                            disabled={verifyLoading}
                            className="w-full px-4 py-2.5 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            {verifyLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                            Verify DNS Record
                        </button>

                        {verifyResult === 'pending' && (
                            <div className="mt-4 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                                <HelpCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-amber-700">DNS not detected yet</p>
                                    <p className="text-xs text-amber-600 mt-0.5">
                                        This can take up to 24 hours. Try again later.
                                    </p>
                                    <button
                                        onClick={handleVerify}
                                        disabled={verifyLoading}
                                        className="mt-2 text-xs font-medium text-amber-700 underline hover:no-underline"
                                    >
                                        Check Again
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 3: Verified */}
                {connectStep === 3 && (
                    <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                            <Check className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="font-medium text-green-800">Domain verified!</p>
                            <p className="text-sm text-green-600">{connectDomain} is now connected to your site.</p>
                        </div>
                    </div>
                )}

                {/* $49 Agent CTA */}
                {connectStep !== 3 && (
                    <div className="mt-6 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4 flex items-center justify-between gap-4">
                        <div>
                            <p className="text-sm font-medium text-gray-900">Need help with setup?</p>
                            <p className="text-xs text-gray-500 mt-0.5">Our agents can handle the DNS configuration for you</p>
                        </div>
                        <a
                            href="/portal/support"
                            className="px-4 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors whitespace-nowrap shadow-sm"
                        >
                            Get Help — $49
                        </a>
                    </div>
                )}
            </div>
        </div>
    )

    // ----- Render: Buy View -----

    const renderBuy = () => {
        const hasTakenDomain = searchResults.some((r) => r.summary === 'active')

        return (
            <div>
                <BackButton onClick={resetToGrid} />
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm max-w-2xl">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center mb-4">
                        <Search className="w-5 h-5 text-emerald-600" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-1">Find a Domain</h2>
                    <p className="text-sm text-gray-500 mb-4">Search for available domain names</p>

                    {/* Search input */}
                    <div className="relative mb-4">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="e.g. mybusiness.com"
                            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent pr-10"
                        />
                        {searchLoading && (
                            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                        )}
                    </div>

                    {/* Search results */}
                    {searchResults.length > 0 && (
                        <div className="space-y-2 mb-4">
                            {searchResults.map((result) => (
                                <div
                                    key={result.domain}
                                    className={`flex items-center justify-between p-3 rounded-lg border ${
                                        result.summary === 'inactive'
                                            ? 'border-green-200 bg-green-50'
                                            : result.summary === 'active'
                                            ? 'border-red-200 bg-red-50'
                                            : 'border-gray-200 bg-gray-50'
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        {result.summary === 'inactive' ? (
                                            <Check className="w-4 h-4 text-green-600" />
                                        ) : result.summary === 'active' ? (
                                            <X className="w-4 h-4 text-red-500" />
                                        ) : (
                                            <HelpCircle className="w-4 h-4 text-gray-400" />
                                        )}
                                        <span className={`text-sm font-medium ${
                                            result.summary === 'active' ? 'text-gray-400 line-through' : 'text-gray-900'
                                        }`}>
                                            {result.domain}
                                        </span>
                                    </div>

                                    {result.summary === 'inactive' && (
                                        <div className="flex items-center gap-1.5">
                                            {getRegistrarPurchaseLinks(result.domain).map((link) => (
                                                <a
                                                    key={link.name}
                                                    href={link.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded transition-colors"
                                                >
                                                    {link.name}
                                                    <ExternalLink className="w-3 h-3" />
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* AI Suggestions */}
                    {hasTakenDomain && (
                        <div className="border-t border-gray-100 pt-4 mb-4">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-medium text-gray-900">AI Suggestions</h3>
                                <button
                                    onClick={handleGetSuggestions}
                                    disabled={suggestLoading}
                                    className="px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1.5"
                                >
                                    {suggestLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                                    Find alternatives
                                </button>
                            </div>

                            {suggestLoading && !suggestions.length && (
                                <p className="text-sm text-gray-400 italic">Searching for available alternatives...</p>
                            )}

                            {suggestions.length > 0 && (
                                <div className="space-y-2">
                                    {suggestions.map((s) => (
                                        <div
                                            key={s.domain}
                                            className="flex items-center justify-between p-3 rounded-lg border border-green-200 bg-green-50"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Check className="w-4 h-4 text-green-600" />
                                                <span className="text-sm font-medium text-gray-900">{s.domain}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                {getRegistrarPurchaseLinks(s.domain).map((link) => (
                                                    <a
                                                        key={link.name}
                                                        href={link.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded transition-colors"
                                                    >
                                                        {link.name}
                                                        <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Disclaimer */}
                    {(searchResults.length > 0 || suggestions.length > 0) && (
                        <p className="text-xs text-gray-400 mt-3">
                            Availability may vary. Check directly at the registrar before purchasing.
                        </p>
                    )}

                    {/* $49 Agent CTA */}
                    <div className="mt-6 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4 flex items-center justify-between gap-4">
                        <div>
                            <p className="text-sm font-medium text-gray-900">Need help with setup?</p>
                            <p className="text-xs text-gray-500 mt-0.5">Our agents can handle domain registration for you</p>
                        </div>
                        <a
                            href="/portal/support"
                            className="px-4 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors whitespace-nowrap shadow-sm"
                        >
                            Get Help — $49
                        </a>
                    </div>
                </div>
            </div>
        )
    }

    // ----- Main Render -----

    return (
        <div>
            {view === 'grid' && renderGrid()}
            {view === 'subdomain' && renderSubdomain()}
            {view === 'connect' && renderConnect()}
            {view === 'buy' && renderBuy()}
        </div>
    )
}
