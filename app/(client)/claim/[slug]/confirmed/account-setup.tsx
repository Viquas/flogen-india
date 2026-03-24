'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { createAccountAndLogin, loginExistingAccount } from './confirmed-actions'

interface AccountSetupProps {
  email: string
  claimId: string
}

export function AccountSetup({ email, claimId }: AccountSetupProps) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isReturningUser, setIsReturningUser] = useState(false)

  async function handleNewAccount(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setIsSubmitting(true)
    setError(null)

    const result = await createAccountAndLogin({ claimId, email, password })

    if (result.success) {
      router.push('/portal')
      return
    }

    if ('existingUser' in result && result.existingUser) {
      setIsReturningUser(true)
      setPassword('')
      setError(null)
    } else {
      setError(result.error)
    }

    setIsSubmitting(false)
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!password) {
      setError('Please enter your password')
      return
    }

    setIsSubmitting(true)
    setError(null)

    const result = await loginExistingAccount({ email, password })

    if (result.success) {
      router.push('/portal')
      return
    }

    setError(result.error)
    setIsSubmitting(false)
  }

  // --- Returning user mode ---
  if (isReturningUser) {
    return (
      <div className="bg-[#F8FAFC] rounded-xl p-5">
        <h3 className="text-lg font-bold text-[#0F172A] mb-1">
          Welcome back! Log in to access your new site.
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          An account with this email already exists.
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email (read-only) */}
          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              readOnly
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-100 text-gray-500 text-sm cursor-not-allowed"
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#050304] text-white py-3 rounded-full font-semibold text-sm hover:bg-[#1a1a1a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Logging in...
              </>
            ) : (
              'Log In'
            )}
          </button>
        </form>
      </div>
    )
  }

  // --- New account mode ---
  return (
    <div className="bg-[#F8FAFC] rounded-xl p-5">
      <form onSubmit={handleNewAccount} className="space-y-4">
        {/* Email (read-only) */}
        <div>
          <label htmlFor="setup-email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="setup-email"
            type="email"
            value={email}
            readOnly
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-100 text-gray-500 text-sm cursor-not-allowed"
          />
        </div>

        {/* Password */}
        <div>
          <label htmlFor="setup-password" className="block text-sm font-medium text-gray-700 mb-1">
            Create a Password
          </label>
          <div className="relative">
            <input
              id="setup-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              minLength={8}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">At least 8 characters</p>
        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting || password.length < 8}
          className="w-full bg-[#050304] text-white py-3 rounded-full font-semibold text-sm hover:bg-[#1a1a1a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating account...
            </>
          ) : (
            'Set Password & Access Portal'
          )}
        </button>
      </form>
    </div>
  )
}
