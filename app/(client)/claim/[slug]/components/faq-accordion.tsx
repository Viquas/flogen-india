import { ChevronDown } from 'lucide-react'

const FAQ_ITEMS = [
    {
        question: 'What do I get when I claim this website?',
        answer: 'You get a fully custom, professionally designed website with your branding, content, and contact details. The website is built with modern technology, optimized for mobile devices, and includes hosting.',
    },
    {
        question: 'Can I customize the website after claiming?',
        answer: 'Absolutely! After payment, you\'ll fill out a simple form with your logo, brand colors, photos, and contact details. Our team handles all the changes for you and has the site ready in 2-3 business days.',
    },
    {
        question: 'How long does it take to go live?',
        answer: 'After you complete the customization form, your website is typically updated and ready to go live within 2-3 business days.',
    },
    {
        question: 'What is the difference between Standard and Pro?',
        answer: 'The Pro plan includes everything in Standard plus a booking system for scheduling appointments, priority support, and a free strategy call to optimize your online presence.',
    },
    {
        question: 'Do I need to buy a domain?',
        answer: 'No, you get a free subdomain included. You can also connect your existing domain or we can help you purchase a new one.',
    },
    {
        question: 'Is there a monthly fee?',
        answer: 'Yes, hosting is billed separately at a small monthly fee. This covers server costs, SSL certificate, and technical maintenance.',
    },
]

export function FaqAccordion() {
    return (
        <section className="px-4 py-14">
            <div className="max-w-2xl mx-auto">
                {/* Lime pill label */}
                <div className="flex justify-center mb-6">
                    <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-[#AF92FF] text-[#050304] text-xs font-semibold tracking-wide">
                        FAQ
                    </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-[family-name:var(--font-signifier)] font-light text-[#050304] text-center mb-8">
                    Common questions
                </h2>

                <div className="bg-white rounded-2xl border border-[#050304]/5 divide-y divide-[#050304]/5">
                    {FAQ_ITEMS.map((item) => (
                        <details
                            key={item.question}
                            className="group"
                        >
                            <summary className="font-medium text-[#050304] cursor-pointer list-none flex justify-between items-center px-6 py-4">
                                <span className="text-sm">{item.question}</span>
                                <ChevronDown
                                    className="text-[#050304]/20 w-4 h-4 transition-transform duration-200 group-open:rotate-180 shrink-0 ml-4"
                                    strokeWidth={1.5}
                                />
                            </summary>
                            <p className="text-sm text-[#050304]/50 px-6 pb-4 -mt-1 leading-relaxed">
                                {item.answer}
                            </p>
                        </details>
                    ))}
                </div>
            </div>
        </section>
    )
}
