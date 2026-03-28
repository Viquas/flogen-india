"use client"

import { useState } from "react"
import { FAQ } from "@/lib/marketing-constants"
import { useScrollAnimation } from "@/hooks/use-scroll-animation"
import { CaretDown } from "@phosphor-icons/react"

export default function Faq() {
  const sectionRef = useScrollAnimation()
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section
      id="faq"
      ref={sectionRef as React.RefObject<HTMLElement>}
      className="py-24 sm:py-32 scroll-mt-20"
    >
      <div className="mx-auto max-w-[var(--mkt-max-width)] px-4 sm:px-6 lg:px-8">
        <h2 className="leading-tight text-center" style={{ fontSize: "clamp(1.75rem, 2.5vw + 0.5rem, 3rem)" }}>
          {FAQ.sectionTitle}
        </h2>

        <div className="mt-12 max-w-2xl mx-auto">
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
                  <span className="text-[15px] font-medium text-[var(--mkt-text)] pr-4">
                    {item.question}
                  </span>
                  <CaretDown
                    className={`w-4 h-4 shrink-0 text-[var(--mkt-text-tertiary)] transition-transform duration-300 ${
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
                  <p className="pb-5 pt-1 text-[14px] text-[var(--mkt-text-secondary)] leading-relaxed">
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
