"use client"

import { useState } from "react"
import { CONTACT } from "@/lib/marketing-constants"
import { useScrollAnimation } from "@/hooks/use-scroll-animation"
import { Loader2 } from "lucide-react"

type FormData = {
  name: string
  email: string
  businessName: string
  message: string
}

type FormStatus = "idle" | "sending" | "success" | "error"

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
            className="w-full flex items-center justify-center gap-2 px-5 py-3 text-[14px] font-medium bg-[var(--mkt-accent)] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === "sending" ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              CONTACT.submitButton
            )}
          </button>

          <p className="text-center text-[12px] text-[var(--mkt-text-tertiary)]">
            {CONTACT.microcopy}
          </p>
        </form>
      </div>
    </section>
  )
}
