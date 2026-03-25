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
    "w-full bg-[var(--mkt-surface)] text-white rounded-[var(--mkt-radius)] border border-[var(--mkt-border)] px-4 py-3 text-sm font-[family-name:var(--font-inter-marketing)] placeholder:text-[var(--mkt-text-tertiary)] focus:border-[var(--mkt-accent)] focus:outline-none transition-colors"

  return (
    <section
      id="contact"
      ref={sectionRef as React.RefObject<HTMLElement>}
      className="py-16 sm:py-24 bg-[var(--mkt-bg)] text-[var(--mkt-text-dark)] scroll-mt-20"
    >
      <div className="mx-auto max-w-[var(--mkt-max-width)] px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-[28px] sm:text-[40px] lg:text-[48px] leading-tight">
            {CONTACT.sectionTitle}
          </h2>
          <p className="mt-4 text-lg text-[var(--mkt-text-secondary)]">
            {CONTACT.sectionSubtitle}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-12 max-w-2xl mx-auto space-y-5"
        >
          {/* Name */}
          <div>
            <label htmlFor="name" className="sr-only">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="Your name *"
              value={formData.name}
              onChange={handleChange}
              className={inputClasses}
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="sr-only">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="Email address *"
              value={formData.email}
              onChange={handleChange}
              className={inputClasses}
            />
          </div>

          {/* Business Name (optional) */}
          <div>
            <label htmlFor="businessName" className="sr-only">
              Business Name
            </label>
            <input
              id="businessName"
              name="businessName"
              type="text"
              placeholder="Business name (optional)"
              value={formData.businessName}
              onChange={handleChange}
              className={inputClasses}
            />
          </div>

          {/* Message */}
          <div>
            <label htmlFor="message" className="sr-only">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              required
              rows={5}
              placeholder="Tell us about your project *"
              value={formData.message}
              onChange={handleChange}
              className={`${inputClasses} resize-none`}
            />
          </div>

          {/* Error message */}
          {(status === "error" || errorMessage) && (
            <p className="text-sm text-red-400">{errorMessage}</p>
          )}

          {/* Success message */}
          {status === "success" && (
            <p className="text-sm text-green-400">{CONTACT.successMessage}</p>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={status === "sending"}
            className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-[var(--mkt-accent)] text-white font-medium rounded-[var(--mkt-radius)] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
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

          {/* Microcopy */}
          <p className="text-center text-xs text-[var(--mkt-text-tertiary)]">
            {CONTACT.microcopy}
          </p>
        </form>
      </div>
    </section>
  )
}
