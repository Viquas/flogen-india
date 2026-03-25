import type { Metadata } from "next"
import { Inter } from "next/font/google"
import localFont from "next/font/local"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

const signifier = localFont({
    src: [
        { path: "../../../../public/fonts/Signifier-Light.otf", weight: "300", style: "normal" },
        { path: "../../../../public/fonts/Signifier-LightItalic.otf", weight: "300", style: "italic" },
        { path: "../../../../public/fonts/Signifier-Regular.otf", weight: "400", style: "normal" },
        { path: "../../../../public/fonts/Signifier-RegularItalic.otf", weight: "400", style: "italic" },
        { path: "../../../../public/fonts/Signifier-Medium.otf", weight: "500", style: "normal" },
        { path: "../../../../public/fonts/Signifier-Bold.otf", weight: "700", style: "normal" },
        { path: "../../../../public/fonts/Signifier-BoldItalic.otf", weight: "700", style: "italic" },
    ],
    variable: "--font-signifier",
    display: "swap",
})

export const metadata: Metadata = {
    title: "Portal Login - Flogen",
    description: "Log in to your client portal",
}

export default function PortalAuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className={`${inter.variable} ${signifier.variable} min-h-screen bg-[#f5f0ea] font-[family-name:var(--font-inter)]`}>
            {children}
        </div>
    )
}
