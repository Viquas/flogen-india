import {
    Globe,
    Smartphone,
    Search,
    Zap,
    Shield,
    Palette,
    MessageSquare,
    Clock,
    type LucideIcon,
} from 'lucide-react'

interface Feature {
    icon: LucideIcon
    title: string
    description: string
}

const FEATURES: Feature[] = [
    {
        icon: Globe,
        title: 'Custom Domain',
        description: 'Connect your own domain or use a free subdomain',
    },
    {
        icon: Smartphone,
        title: 'Mobile Responsive',
        description: 'Looks perfect on every device and screen size',
    },
    {
        icon: Search,
        title: 'SEO Optimized',
        description: 'Built to rank well on Google from day one',
    },
    {
        icon: Zap,
        title: 'Lightning Fast',
        description: 'Optimized for speed with modern web standards',
    },
    {
        icon: Shield,
        title: 'SSL Secured',
        description: 'Free HTTPS security certificate included',
    },
    {
        icon: Palette,
        title: 'Custom Design',
        description: 'Tailored to match your brand identity',
    },
    {
        icon: MessageSquare,
        title: 'Contact Forms',
        description: 'Built-in ways for customers to reach you',
    },
    {
        icon: Clock,
        title: '24/7 Online',
        description: 'Your website is always available to customers',
    },
]

export function FeaturesGrid() {
    return (
        <section className="px-4 py-8 bg-[#F8FAFC]">
            <h2 className="text-xl font-bold text-[#0F172A] text-center mb-6">
                What&apos;s Included
            </h2>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {FEATURES.map((feature) => (
                    <div
                        key={feature.title}
                        className="bg-white rounded-lg p-4 text-center"
                    >
                        <feature.icon
                            className="text-[#2563EB] mx-auto mb-2"
                            size={24}
                        />
                        <h3 className="text-sm font-semibold text-[#0F172A]">
                            {feature.title}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                            {feature.description}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    )
}
