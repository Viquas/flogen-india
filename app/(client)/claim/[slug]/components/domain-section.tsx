'use client'

import { Globe, Link, Search } from 'lucide-react'

export type DomainOption = 'subdomain' | 'existing' | 'new'

interface DomainSectionProps {
    businessName: string
    selectedOption: DomainOption
    domainValue: string
    onOptionChange: (option: DomainOption) => void
    onDomainValueChange: (value: string) => void
}

function slugify(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
}

const OPTIONS = [
    {
        id: 'subdomain' as const,
        icon: Globe,
        title: 'Free Subdomain',
        badge: 'Included',
        description: 'Get started instantly with a free subdomain',
    },
    {
        id: 'existing' as const,
        icon: Link,
        title: 'Connect Your Domain',
        badge: null,
        description: 'Use a domain you already own',
    },
    {
        id: 'new' as const,
        icon: Search,
        title: 'Buy a New Domain',
        badge: null,
        description: 'Search for an available domain',
    },
] as const

export function DomainSection({
    businessName,
    selectedOption,
    domainValue,
    onOptionChange,
    onDomainValueChange,
}: DomainSectionProps) {
    const subdomainSlug = slugify(businessName)

    return (
        <section>
            <h2 className="text-xl font-bold text-[#0F172A] text-center mb-6">
                Choose Your Domain
            </h2>

            <div className="flex flex-col gap-3">
                {OPTIONS.map((option) => {
                    const isSelected = selectedOption === option.id
                    const Icon = option.icon

                    return (
                        <label
                            key={option.id}
                            className={`border rounded-xl p-4 cursor-pointer transition-all ${
                                isSelected
                                    ? 'border-[#2563EB] bg-blue-50/50 ring-1 ring-[#2563EB]/20'
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            <input
                                type="radio"
                                name="domain-option"
                                value={option.id}
                                checked={isSelected}
                                onChange={() => onOptionChange(option.id)}
                                className="sr-only"
                            />

                            <div className="flex items-start gap-3">
                                <div className="mt-0.5">
                                    <Icon className="w-5 h-5 text-[#2563EB]" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold text-[#0F172A]">
                                            {option.title}
                                        </span>
                                        {option.badge && (
                                            <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                                                {option.badge}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {option.description}
                                    </p>

                                    {/* Conditional inputs based on selection */}
                                    {isSelected && option.id === 'subdomain' && (
                                        <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm text-gray-600 font-mono mt-3">
                                            {subdomainSlug}.sumosite.com
                                        </div>
                                    )}

                                    {isSelected && option.id === 'existing' && (
                                        <input
                                            type="text"
                                            value={domainValue}
                                            onChange={(e) => onDomainValueChange(e.target.value)}
                                            onBlur={(e) => {
                                                const val = e.target.value.trim()
                                                if (val && (!val.includes('.') || val.includes(' '))) {
                                                    // Basic domain validation -- visual feedback via border
                                                    e.target.classList.add('border-red-300')
                                                } else {
                                                    e.target.classList.remove('border-red-300')
                                                }
                                            }}
                                            placeholder="yourdomain.com"
                                            className="w-full mt-3 px-4 py-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-colors"
                                        />
                                    )}

                                    {isSelected && option.id === 'new' && (
                                        <div className="mt-3">
                                            <input
                                                type="text"
                                                value={domainValue}
                                                onChange={(e) => onDomainValueChange(e.target.value)}
                                                placeholder="Search for a domain..."
                                                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-colors"
                                            />
                                            <p className="text-xs text-gray-400 mt-1">
                                                Domain availability will be checked during setup
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </label>
                    )
                })}
            </div>
        </section>
    )
}
