import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import { Database } from '@/types/database'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session -- getUser() validates with auth server (not getSession)
  const { data: { user } } = await supabase.auth.getUser()

  const isPortalRoute = request.nextUrl.pathname.startsWith('/portal')
  const isPublicPortalPage = ['/portal/login', '/portal/reset'].includes(request.nextUrl.pathname)

  // Redirect unauthenticated portal requests to login (except public pages)
  if (isPortalRoute && !isPublicPortalPage && !user) {
    const loginUrl = new URL('/portal/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect authenticated users away from login page to portal
  // (but NOT from /portal/reset -- they need that to set a new password after email callback)
  if (request.nextUrl.pathname === '/portal/login' && user) {
    const portalUrl = new URL('/portal', request.url)
    return NextResponse.redirect(portalUrl)
  }

  return response
}
