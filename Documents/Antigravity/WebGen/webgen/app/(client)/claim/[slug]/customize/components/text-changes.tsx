'use client'

interface TextChangesProps {
    value: string
    onChange: (text: string) => void
}

export function TextChanges({ value, onChange }: TextChangesProps) {
    const charCount = value.length
    const counterColor = charCount >= 950 ? '#DC2626' : charCount >= 800 ? '#D97706' : '#9CA3AF'

    return (
        <div>
            <label
                htmlFor="text-changes"
                className="mb-1 block text-sm font-medium"
                style={{ color: '#374151' }}
            >
                Text Changes
            </label>
            <p className="mb-2 text-xs" style={{ color: '#9CA3AF' }}>
                Describe any changes you&apos;d like to the headlines, descriptions, or other text
                on your website.
            </p>
            <textarea
                id="text-changes"
                rows={4}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                maxLength={1000}
                className="w-full rounded-lg border px-3 py-2 text-sm resize-none"
                style={{ borderColor: '#D1D5DB', color: '#0F172A' }}
                placeholder="e.g., Change the headline to 'Your Trusted Local Expert'..."
            />
            <p className="mt-1 text-right text-xs" style={{ color: counterColor }}>
                {charCount.toLocaleString()}/1,000 characters
            </p>
        </div>
    )
}
