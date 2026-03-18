'use client'

import { useEffect, useState, useCallback } from 'react'

interface ContactValues {
    phone: string
    email: string
    address: string
    whatsapp: string
}

interface ContactFormProps {
    prefill: {
        phone: string
        email: string
        address: string
        businessName: string
    }
    values: ContactValues
    onChange: (values: ContactValues) => void
}

export function ContactForm({ prefill, values, onChange }: ContactFormProps) {
    const [sameAsPhone, setSameAsPhone] = useState(false)

    // Pre-fill on mount if values are empty
    useEffect(() => {
        if (!values.phone && !values.email && !values.address) {
            onChange({
                phone: prefill.phone,
                email: prefill.email,
                address: prefill.address,
                whatsapp: '',
            })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleChange = useCallback(
        (field: keyof ContactValues, fieldValue: string) => {
            const updated = { ...values, [field]: fieldValue }

            // Sync WhatsApp if "same as phone" is checked
            if (field === 'phone' && sameAsPhone) {
                updated.whatsapp = fieldValue
            }

            onChange(updated)
        },
        [values, onChange, sameAsPhone]
    )

    const handleSameAsPhone = useCallback(
        (checked: boolean) => {
            setSameAsPhone(checked)
            if (checked) {
                onChange({ ...values, whatsapp: values.phone })
            }
        },
        [values, onChange]
    )

    return (
        <div className="space-y-4">
            {/* Phone */}
            <div>
                <label
                    htmlFor="contact-phone"
                    className="mb-1 block text-sm font-medium"
                    style={{ color: '#374151' }}
                >
                    Phone
                </label>
                <input
                    id="contact-phone"
                    type="tel"
                    value={values.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    style={{ borderColor: '#D1D5DB', color: '#0F172A' }}
                    placeholder="+91 98765 43210"
                    maxLength={20}
                />
            </div>

            {/* Email */}
            <div>
                <label
                    htmlFor="contact-email"
                    className="mb-1 block text-sm font-medium"
                    style={{ color: '#374151' }}
                >
                    Email
                </label>
                <input
                    id="contact-email"
                    type="email"
                    value={values.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    style={{ borderColor: '#D1D5DB', color: '#0F172A' }}
                    placeholder="hello@yourbusiness.com"
                />
            </div>

            {/* Address */}
            <div>
                <label
                    htmlFor="contact-address"
                    className="mb-1 block text-sm font-medium"
                    style={{ color: '#374151' }}
                >
                    Address
                </label>
                <textarea
                    id="contact-address"
                    rows={2}
                    value={values.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-sm resize-none"
                    style={{ borderColor: '#D1D5DB', color: '#0F172A' }}
                    placeholder="Your business address"
                    maxLength={500}
                />
            </div>

            {/* WhatsApp */}
            <div>
                <div className="mb-1 flex items-center justify-between">
                    <label
                        htmlFor="contact-whatsapp"
                        className="text-sm font-medium"
                        style={{ color: '#374151' }}
                    >
                        WhatsApp
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={sameAsPhone}
                            onChange={(e) => handleSameAsPhone(e.target.checked)}
                            className="h-3.5 w-3.5 rounded"
                            style={{ accentColor: '#2563EB' }}
                        />
                        <span className="text-xs" style={{ color: '#6B7280' }}>
                            Same as phone
                        </span>
                    </label>
                </div>
                <input
                    id="contact-whatsapp"
                    type="tel"
                    value={values.whatsapp}
                    onChange={(e) => handleChange('whatsapp', e.target.value)}
                    disabled={sameAsPhone}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    style={{
                        borderColor: '#D1D5DB',
                        color: '#0F172A',
                        opacity: sameAsPhone ? 0.6 : 1,
                    }}
                    placeholder="+91 98765 43210"
                    maxLength={20}
                />
            </div>
        </div>
    )
}
