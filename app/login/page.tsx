import { AdminLoginForm } from './login-form'

export const dynamic = 'force-dynamic'

export default function AdminLoginPage() {
    return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
            <div className="w-full max-w-sm space-y-8">
                <div className="text-center">
                    <img src="/flogen-logo.svg" alt="Flogen" className="h-6 mx-auto mb-8" />
                    <h1 className="text-xl font-semibold text-white">Admin Login</h1>
                    <p className="text-sm text-zinc-500 mt-1">Sign in to access the dashboard</p>
                </div>
                <AdminLoginForm />
            </div>
        </div>
    )
}
