'use client'

import { useState } from 'react'
import { Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react'
import { loginWithPassword, sendPasswordReset } from './login-actions'

export function LoginForm() {
    const [mode, setMode] = useState<'login' | 'reset'>('login')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [resetSent, setResetSent] = useState(false)

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const result = await loginWithPassword({ email, password })
            // If we get here, login failed (success redirects server-side)
            setError(result.error)
            setLoading(false)
        } catch (err: unknown) {
            // redirect() throws NEXT_REDIRECT -- let it propagate
            if (
                err &&
                typeof err === 'object' &&
                'digest' in err &&
                typeof (err as { digest: unknown }).digest === 'string' &&
                (err as { digest: string }).digest.startsWith('NEXT_REDIRECT')
            ) {
                throw err
            }
            setError('Something went wrong. Please try again.')
            setLoading(false)
        }
    }

    async function handleReset(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            await sendPasswordReset(email)
            setResetSent(true)
        } catch {
            setError('Something went wrong. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    if (mode === 'reset') {
        return (
            <div className="w-full max-w-sm mx-auto">
                <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
                    {resetSent ? (
                        <div className="text-center">
                            <h2 className="text-xl font-semibold text-[#0F172A] mb-2">
                                Check your email
                            </h2>
                            <p className="text-sm text-gray-600 mb-6">
                                If an account exists with that email, we sent a reset link.
                            </p>
                            <button
                                type="button"
                                onClick={() => {
                                    setMode('login')
                                    setResetSent(false)
                                    setError('')
                                }}
                                className="inline-flex items-center gap-1.5 text-sm text-[#0F172A] font-medium hover:underline"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to login
                            </button>
                        </div>
                    ) : (
                        <>
                            <h2 className="text-xl font-semibold text-[#0F172A] mb-1">
                                Reset your password
                            </h2>
                            <p className="text-sm text-gray-600 mb-6">
                                Enter your email and we&apos;ll send a reset link.
                            </p>
                            <form onSubmit={handleReset} className="space-y-4">
                                <div>
                                    <label htmlFor="reset-email" className="block text-sm font-medium text-[#0F172A] mb-1.5">
                                        Email
                                    </label>
                                    <input
                                        id="reset-email"
                                        type="email"
                                        required
                                        autoComplete="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-[#0F172A] placeholder:text-gray-400 focus:border-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#0F172A]"
                                        placeholder="you@example.com"
                                    />
                                </div>

                                {error && (
                                    <p className="text-sm text-red-600">{error}</p>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full rounded-lg bg-[#0F172A] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#1e293b] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                                    Send Reset Link
                                </button>
                            </form>

                            <div className="mt-4 text-center">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMode('login')
                                        setError('')
                                    }}
                                    className="inline-flex items-center gap-1.5 text-sm text-[#0F172A] font-medium hover:underline"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Back to login
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="w-full max-w-sm mx-auto">
            <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
                <h2 className="text-xl font-semibold text-[#0F172A] mb-1">
                    Welcome back
                </h2>
                <p className="text-sm text-gray-600 mb-6">
                    Log in to your client portal
                </p>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label htmlFor="login-email" className="block text-sm font-medium text-[#0F172A] mb-1.5">
                            Email
                        </label>
                        <input
                            id="login-email"
                            type="email"
                            required
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-[#0F172A] placeholder:text-gray-400 focus:border-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#0F172A]"
                            placeholder="you@example.com"
                        />
                    </div>

                    <div>
                        <label htmlFor="login-password" className="block text-sm font-medium text-[#0F172A] mb-1.5">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                id="login-password"
                                type={showPassword ? 'text' : 'password'}
                                required
                                minLength={8}
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm text-[#0F172A] placeholder:text-gray-400 focus:border-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#0F172A]"
                                placeholder="Min. 8 characters"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <p className="text-sm text-red-600">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-[#0F172A] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#1e293b] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                        Log In
                    </button>
                </form>

                <div className="mt-4 text-center">
                    <button
                        type="button"
                        onClick={() => {
                            setMode('reset')
                            setError('')
                        }}
                        className="text-sm text-gray-600 hover:text-[#0F172A] hover:underline"
                    >
                        Forgot password?
                    </button>
                </div>
            </div>
        </div>
    )
}
