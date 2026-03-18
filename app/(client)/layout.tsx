import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

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
        <div className={`${inter.variable} min-h-screen bg-white font-[family-name:var(--font-inter)]`}>
            {children}
        </div>
    )
}
