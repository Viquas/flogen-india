'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { LogoUpload } from './components/logo-upload'
import { PhotoUpload } from './components/photo-upload'
import { ColorPicker } from './components/color-picker'
import { ContactForm } from './components/contact-form'
import { TextChanges } from './components/text-changes'
import { BookingSetup, type BookingPreferences } from './components/booking-setup'
import { submitCustomization } from '../claim-actions'

interface CustomizeClientProps {
    claimId: string
    plan: 'standard' | 'pro'
    slug: string
    prefill: {
        phone: string
        email: string
        address: string
        businessName: string
    }
    existingCustomization: { id: string; status: string } | null
}

export default function CustomizeClient({
    claimId,
    plan,
    slug,
    prefill,
    existingCustomization,
}: CustomizeClientProps) {
    const router = useRouter()
    const logoSectionRef = useRef<HTMLDivElement>(null)

    // Form state
    const [logoPath, setLogoPath] = useState<string | null>(null)
    const [photosPaths, setPhotosPaths] = useState<string[]>([])
    const [primaryColor, setPrimaryColor] = useState('')
    const [secondaryColor, setSecondaryColor] = useState('')
    const [contact, setContact] = useState({ phone: '', email: '', address: '', whatsapp: '' })
    const [textChanges, setTextChanges] = useState('')
    const [bookingPrefs, setBookingPrefs] = useState<BookingPreferences | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState<string | null>(null)
    const [logoError, setLogoError] = useState(false)

    const handleColorChange = (primary: string, secondary: string) => {
        setPrimaryColor(primary)
        setSecondaryColor(secondary)
    }

    const handleSubmit = async () => {
        setSubmitError(null)
        setLogoError(false)

        // Validate: logo is required
        if (!logoPath) {
            setLogoError(true)
            logoSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            return
        }

        setIsSubmitting(true)

        try {
            const result = await submitCustomization({
                claimId,
                logoUrl: logoPath,
                primaryColor,
                secondaryColor,
                phone: contact.phone,
                email: contact.email,
                address: contact.address,
                whatsapp: contact.whatsapp,
                photoUrls: photosPaths,
                notes: textChanges,
                wantsBookingSystem: plan === 'pro' && bookingPrefs !== null,
                bookingPreferences: plan === 'pro' ? bookingPrefs : null,
            })

            if (!result.success) {
                setSubmitError(result.error)
                setIsSubmitting(false)
                return
            }

            router.push(`/claim/${slug}/upsell`)
        } catch {
            setSubmitError('Something went wrong. Please try again.')
            setIsSubmitting(false)
        }
    }

    return (
        <div className="space-y-8">
            {/* 1. Logo Upload (required) */}
            <section ref={logoSectionRef}>
                <div className="mb-3 flex items-center gap-2">
                    <h2 className="text-lg font-semibold" style={{ color: '#0F172A' }}>
                        Your Logo
                    </h2>
                    <span
                        className="rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{ backgroundColor: '#FEF2F2', color: '#DC2626' }}
                    >
                        Required
                    </span>
                </div>
                {logoError && (
                    <p className="mb-2 text-sm" style={{ color: '#DC2626' }}>
                        Please upload your logo to continue.
                    </p>
                )}
                <LogoUpload claimId={claimId} value={logoPath} onChange={setLogoPath} />
            </section>

            <hr style={{ borderColor: '#E5E7EB' }} />

            {/* 2. Brand Colors (optional) */}
            <section>
                <h2 className="mb-3 text-lg font-semibold" style={{ color: '#0F172A' }}>
                    Brand Colors
                </h2>
                <ColorPicker
                    primaryColor={primaryColor}
                    secondaryColor={secondaryColor}
                    onChange={handleColorChange}
                />
            </section>

            <hr style={{ borderColor: '#E5E7EB' }} />

            {/* 3. Contact Information (pre-filled) */}
            <section>
                <h2 className="mb-3 text-lg font-semibold" style={{ color: '#0F172A' }}>
                    Contact Information
                </h2>
                <ContactForm prefill={prefill} values={contact} onChange={setContact} />
            </section>

            <hr style={{ borderColor: '#E5E7EB' }} />

            {/* 4. Photos (optional) */}
            <section>
                <div className="mb-3">
                    <h2 className="text-lg font-semibold" style={{ color: '#0F172A' }}>
                        Photos
                    </h2>
                    <p className="text-xs" style={{ color: '#9CA3AF' }}>
                        Add photos of your business, products, or team
                    </p>
                </div>
                <PhotoUpload claimId={claimId} values={photosPaths} onChange={setPhotosPaths} />
            </section>

            <hr style={{ borderColor: '#E5E7EB' }} />

            {/* 5. Text Changes (optional) */}
            <section>
                <h2 className="mb-3 text-lg font-semibold" style={{ color: '#0F172A' }}>
                    Text Changes
                </h2>
                <TextChanges value={textChanges} onChange={setTextChanges} />
            </section>

            {/* 6. Booking Setup (Pro only) */}
            {plan === 'pro' && (
                <>
                    <hr style={{ borderColor: '#E5E7EB' }} />
                    <section>
                        <BookingSetup values={bookingPrefs} onChange={setBookingPrefs} />
                    </section>
                </>
            )}

            {/* Submit button */}
            <div className="pt-4">
                {submitError && (
                    <p className="mb-3 text-sm text-center" style={{ color: '#DC2626' }}>
                        {submitError}
                    </p>
                )}
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full rounded-xl py-3.5 text-base font-semibold text-white transition-opacity disabled:opacity-60"
                    style={{ backgroundColor: '#2563EB' }}
                >
                    {isSubmitting ? (
                        <span className="flex items-center justify-center gap-2">
                            <span
                                className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"
                                style={{ borderColor: '#FFFFFF', borderTopColor: 'transparent' }}
                            />
                            Submitting...
                        </span>
                    ) : (
                        'Submit Customization'
                    )}
                </button>
            </div>
        </div>
    )
}
