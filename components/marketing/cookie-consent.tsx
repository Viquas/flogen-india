"use client"

import { useState, useEffect } from "react"

const STORAGE_KEY = "cookie-consent"

export default function CookieConsent() {
  const [visible, setVisible] = useState<boolean | null>(null)

  useEffect(() => {
    const preference = localStorage.getItem(STORAGE_KEY)
    setVisible(preference === null)
  }, [])

  function handleAccept() {
    localStorage.setItem(STORAGE_KEY, "accepted")
    setVisible(false)
  }

  function handleDecline() {
    localStorage.setItem(STORAGE_KEY, "declined")
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 bg-[#0A0A0A]/95 backdrop-blur-sm border-t border-[var(--mkt-border)] animate-slide-up"
      role="banner"
      aria-label="Cookie consent"
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes slide-up {
              from { transform: translateY(100%); }
              to { transform: translateY(0); }
            }
            .animate-slide-up {
              animation: slide-up 0.3s ease-out;
            }
          `,
        }}
      />
      <div className="mx-auto max-w-[var(--mkt-max-width)] px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-sm text-[var(--mkt-text-secondary)]">
            We use cookies to improve your experience. By continuing to use this
            site, you agree to our{" "}
            <a
              href="/privacy"
              className="text-[var(--mkt-accent)] hover:underline"
            >
              Privacy Policy
            </a>
            .
          </p>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleDecline}
              className="px-4 py-2 text-sm rounded-[var(--mkt-radius)] border border-[var(--mkt-border)] text-[var(--mkt-text-secondary)] hover:text-white hover:border-white/20 transition-colors cursor-pointer"
            >
              Decline
            </button>
            <button
              onClick={handleAccept}
              className="px-4 py-2 text-sm rounded-[var(--mkt-radius)] bg-[var(--mkt-accent)] text-[#0A0A0A] font-medium hover:opacity-90 transition-opacity cursor-pointer"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
