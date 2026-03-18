import { ChevronDown } from 'lucide-react'

const FAQ_ITEMS = [
    {
        question: 'What do I get when I claim this website?',
        answer: 'You get a fully custom, professionally designed website with your branding, content, and contact details. The website is built with modern technology, optimized for mobile devices, and includes hosting.',
    },
    {
        question: 'How long does it take to go live?',
        answer: 'After you complete the customization form, your website is typically updated and ready to go live within 2-3 business days.',
    },
    {
        question: 'Can I make changes after claiming?',
        answer: 'Yes! After payment, you will fill out a customization form where you can upload your logo, set brand colors, update contact information, and request text changes.',
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
        <section className="px-4 py-8 bg-[#F8FAFC]">
            <h2 className="text-xl font-bold text-[#0F172A] text-center mb-6">
                Frequently Asked Questions
            </h2>

            <div className="max-w-2xl mx-auto">
                {FAQ_ITEMS.map((item) => (
                    <details
                        key={item.question}
                        className="group border-b border-gray-200 py-3"
                    >
                        <summary className="font-medium text-[#0F172A] cursor-pointer list-none flex justify-between items-center">
                            <span>{item.question}</span>
                            <ChevronDown
                                className="chevron text-gray-400 w-5 h-5 transition-transform duration-200 group-open:rotate-180"
                            />
                        </summary>
                        <p className="text-sm text-gray-600 pt-2 pb-1">
                            {item.answer}
                        </p>
                    </details>
                ))}
            </div>
        </section>
    )
}
