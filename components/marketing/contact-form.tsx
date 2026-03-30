"use client"

import { useState, useEffect } from "react"
import { CONTACT } from "@/lib/marketing-constants"
import { useScrollAnimation } from "@/hooks/use-scroll-animation"
import { SpinnerGap } from "@phosphor-icons/react"

type FormData = {
  name: string
  email: string
  businessName: string
  message: string
}

type FormStatus = "idle" | "sending" | "success" | "error"

type SelectedPlan = { name: string; price: string }

export default function ContactForm() {
  const sectionRef = useScrollAnimation()
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    businessName: "",
    message: "",
  })
  const [status, setStatus] = useState<FormStatus>("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const [selectedPlan, setSelectedPlan] = useState<SelectedPlan | null>(null)

  useEffect(() => {
    const handler = (e: Event) => {
      const { name, price } = (e as CustomEvent<SelectedPlan>).detail
      setSelectedPlan({ name, price })
      setFormData((prev) => ({
        ...prev,
        message:
          price === "Custom"
            ? `I'd like to discuss the ${name} Plan for my business.`
            : `I'm interested in the ${name} Plan (${price}) for my business.`,
      }))
    }
    window.addEventListener("plan-selected", handler)
    return () => window.removeEventListener("plan-selected", handler)
  }, [])

  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage("")

    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setErrorMessage("Please fill in all required fields.")
      return
    }

    if (!isValidEmail(formData.email)) {
      setErrorMessage("Please enter a valid email address.")
      return
    }

    setStatus("sending")

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Something went wrong.")
      }

      setStatus("success")
      setFormData({ name: "", email: "", businessName: "", message: "" })
      setSelectedPlan(null)
    } catch (err) {
      setStatus("error")
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to send message. Please try again."
      )
    }
  }

  const inputClasses =
    "w-full bg-transparent text-[var(--mkt-text)] rounded-lg border border-[var(--mkt-border)] px-4 py-3 text-[14px] font-[family-name:var(--font-inter-marketing)] placeholder:text-[var(--mkt-text-tertiary)] focus:border-[var(--mkt-text-tertiary)] focus:outline-none transition-colors"

  return (
    <section
      id="contact"
      ref={sectionRef as React.RefObject<HTMLElement>}
      className="py-24 sm:py-32 scroll-mt-20"
    >
      <div className="mx-auto max-w-[var(--mkt-max-width)] px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-[24px] sm:text-[32px] leading-tight">
            {CONTACT.sectionTitle}
          </h2>
          <p className="mt-3 text-[15px] text-[var(--mkt-text-secondary)]">
            {CONTACT.sectionSubtitle}
          </p>
        </div>

        {/* Plan selection banner */}
        {selectedPlan && (
          <div className="mt-6 max-w-lg mx-auto flex items-center justify-between gap-3 rounded-lg border border-[var(--mkt-accent)]/20 bg-[var(--mkt-accent-muted)] px-4 py-3">
            <p className="text-[14px] text-[var(--mkt-text)]">
              You selected:{" "}
              <span className="font-semibold">{selectedPlan.name}</span>
              {" — "}
              {selectedPlan.price === "Custom"
                ? "Custom Pricing"
                : selectedPlan.price}
            </p>
            <button
              type="button"
              onClick={() => setSelectedPlan(null)}
              className="shrink-0 text-[var(--mkt-text-tertiary)] hover:text-[var(--mkt-text)] transition-colors"
              aria-label="Dismiss plan selection"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="mt-10 max-w-lg mx-auto space-y-5"
        >
          <div>
            <label htmlFor="name" className="block text-[13px] text-[var(--mkt-text-tertiary)] mb-1.5">
              Name *
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="Your name"
              value={formData.name}
              onChange={handleChange}
              className={inputClasses}
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-[13px] text-[var(--mkt-text-tertiary)] mb-1.5">
              Email *
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="you@company.com"
              value={formData.email}
              onChange={handleChange}
              className={inputClasses}
            />
          </div>

          <div>
            <label htmlFor="businessName" className="block text-[13px] text-[var(--mkt-text-tertiary)] mb-1.5">
              Business Name
            </label>
            <input
              id="businessName"
              name="businessName"
              type="text"
              placeholder="Optional"
              value={formData.businessName}
              onChange={handleChange}
              className={inputClasses}
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-[13px] text-[var(--mkt-text-tertiary)] mb-1.5">
              Message *
            </label>
            <textarea
              id="message"
              name="message"
              required
              rows={5}
              placeholder="Tell us about your project"
              value={formData.message}
              onChange={handleChange}
              className={`${inputClasses} resize-none`}
            />
          </div>

          {(status === "error" || errorMessage) && (
            <p className="text-[13px] text-red-400">{errorMessage}</p>
          )}

          {status === "success" && (
            <p className="text-[13px] text-emerald-400">{CONTACT.successMessage}</p>
          )}

          <button
            type="submit"
            disabled={status === "sending"}
            className="mkt-cta-primary w-full flex items-center justify-center gap-2 px-5 py-3 text-[14px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === "sending" ? (
              <>
                <SpinnerGap className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              CONTACT.submitButton
            )}
          </button>

          <p className="text-center text-[12px] text-[var(--mkt-text-tertiary)]">
            {CONTACT.microcopy}
          </p>

          {/* What happens next */}
          <div className="pt-4 border-t border-[var(--mkt-border)]">
            <p className="text-[11px] text-[var(--mkt-text-tertiary)] text-center mb-3">
              What happens next?
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6">
              {CONTACT.nextSteps.map((step, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 text-[11px] text-[var(--mkt-text-tertiary)]"
                >
                  <span className="flex items-center justify-center w-4 h-4 rounded-full bg-[var(--mkt-surface)] text-[10px] font-medium shrink-0">
                    {i + 1}
                  </span>
                  {step}
                </div>
              ))}
            </div>
          </div>
        </form>
      </div>
    </section>
  )
}
