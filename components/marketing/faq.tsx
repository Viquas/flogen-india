"use client"

import { useState } from "react"
import { FAQ } from "@/lib/marketing-constants"
import { useScrollAnimation } from "@/hooks/use-scroll-animation"
import { ChevronDown } from "lucide-react"

export default function Faq() {
  const sectionRef = useScrollAnimation()
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section
      id="faq"
      ref={sectionRef as React.RefObject<HTMLElement>}
      className="py-16 sm:py-24 scroll-mt-20"
    >
      <div className="mx-auto max-w-[var(--mkt-max-width)] px-4 sm:px-6 lg:px-8">
        <h2 className="text-[28px] sm:text-[40px] lg:text-[48px] leading-tight text-center">
          {FAQ.sectionTitle}
        </h2>

        <div className="mt-12 max-w-3xl mx-auto">
          {FAQ.items.map((item, i) => {
            const isOpen = openIndex === i
            return (
              <div
                key={item.question}
                className="border-b border-[var(--mkt-border)]"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="flex w-full items-center justify-between py-5 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="text-base sm:text-lg font-medium pr-4">
                    {item.question}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 shrink-0 text-[var(--mkt-text-secondary)] transition-transform duration-300 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <div
                  className={`overflow-hidden transition-all duration-300 ease-out ${
                    isOpen
                      ? "max-h-96 opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <p className="pb-5 pt-1 text-[var(--mkt-text-secondary)] leading-relaxed">
                    {item.answer}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
