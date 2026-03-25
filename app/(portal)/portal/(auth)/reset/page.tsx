import Image from 'next/image'
import Link from 'next/link'
import { ResetForm } from './reset-form'

export default function PortalResetPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
            <div className="mb-8">
                <Image
                    src="/sumosite-logo.svg"
                    alt="Sumosite"
                    width={100}
                    height={34}
                    priority
                />
            </div>

            <h1 className="text-2xl font-semibold text-[#0F172A] font-[family-name:var(--font-signifier)] mb-2 text-center">
                Set New Password
            </h1>
            <p className="text-sm text-gray-600 mb-8 text-center">
                Enter your new password below
            </p>

            <ResetForm />

            <div className="mt-6">
                <Link
                    href="/portal/login"
                    className="text-sm text-gray-600 hover:text-[#0F172A] hover:underline"
                >
                    Back to login
                </Link>
            </div>
        </div>
    )
}
