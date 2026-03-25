import Image from 'next/image'
import { LayoutDashboard, MessageSquare, Globe } from 'lucide-react'
import { LoginForm } from './login-form'

const features = [
    {
        icon: LayoutDashboard,
        title: 'Preview your website',
        description: 'See your live site anytime',
    },
    {
        icon: MessageSquare,
        title: 'Request changes',
        description: 'Tell us what to update',
    },
    {
        icon: Globe,
        title: 'Manage your domain',
        description: 'Connect your custom domain',
    },
]

export default function PortalLoginPage() {
    return (
        <div className="min-h-screen flex">
            {/* Left brand panel -- hidden on mobile */}
            <div className="hidden md:flex md:w-1/2 lg:w-[45%] bg-[#ebe5db] flex-col justify-center items-center px-12 lg:px-16">
                <div className="max-w-sm w-full">
                    <Image
                        src="/sumosite-logo.svg"
                        alt="Sumosite"
                        width={120}
                        height={40}
                        className="mb-12"
                        priority
                    />

                    <h1 className="text-2xl font-semibold text-[#0F172A] font-[family-name:var(--font-signifier)] mb-2">
                        Your Client Portal
                    </h1>
                    <p className="text-sm text-gray-600 mb-10">
                        Everything you need to manage your website, all in one place.
                    </p>

                    <div className="space-y-6">
                        {features.map((feature) => (
                            <div key={feature.title} className="flex items-start gap-4">
                                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#f5f0ea] flex items-center justify-center">
                                    <feature.icon className="h-5 w-5 text-[#0F172A]" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-[#0F172A]">{feature.title}</p>
                                    <p className="text-sm text-gray-500">{feature.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right form panel */}
            <div className="flex-1 flex flex-col justify-center items-center px-6 py-12">
                {/* Mobile logo -- visible only on mobile */}
                <div className="md:hidden mb-8">
                    <Image
                        src="/sumosite-logo.svg"
                        alt="Sumosite"
                        width={100}
                        height={34}
                        priority
                    />
                </div>

                <LoginForm />
            </div>
        </div>
    )
}
