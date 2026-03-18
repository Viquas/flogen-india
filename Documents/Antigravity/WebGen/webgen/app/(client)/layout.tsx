import type { Metadata, Viewport } from "next"

export const metadata: Metadata = {
    title: "Claim Your Website",
    description: "Your custom website is ready to claim",
}

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-white">
            {children}
        </div>
    )
}
