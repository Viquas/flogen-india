import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'

export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/portal/:path*',
    '/auth/callback',
    '/dashboard/:path*',
    '/editor/:path*',
    '/login',
  ],
}
