import Link from 'next/link'

interface HeroSectionProps {
    businessName: string
    screenshotUrl: string | null
    previewUrl?: string
}

export function HeroSection({ businessName, screenshotUrl, previewUrl }: HeroSectionProps) {
    const screenshotContent = screenshotUrl ? (
        <img
            src={screenshotUrl}
            alt={`Website preview for ${businessName}`}
            className="w-full rounded-xl shadow-lg"
            loading="eager"
        />
    ) : (
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl h-64 sm:h-80 flex items-center justify-center">
            <span className="text-2xl font-bold text-[#2563EB] px-4 text-center">
                {businessName}
            </span>
        </div>
    )

    return (
        <section className="px-4 pt-6 pb-4">
            {previewUrl ? (
                <Link href={previewUrl} target="_blank" className="block group relative">
                    {screenshotContent}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-xl flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 text-gray-900 text-sm font-medium px-4 py-2 rounded-lg shadow">
                            View live website
                        </span>
                    </div>
                </Link>
            ) : (
                screenshotContent
            )}

            <div className="mt-4 text-center">
                <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A]">
                    {businessName}
                </h1>
                <p className="mt-2 text-gray-500">
                    A professional website has been built just for you
                </p>
            </div>
        </section>
    )
}
