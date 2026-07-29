import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { Database } from '@/types/database'

function createAdminClientForMiddleware() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

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

  const pathname = request.nextUrl.pathname

  // ---- Portal route protection ----
  const isPortalRoute = pathname.startsWith('/portal')
  const isPublicPortalPage = ['/portal/login', '/portal/reset'].includes(pathname)

  // Redirect unauthenticated portal requests to login (except public pages)
  if (isPortalRoute && !isPublicPortalPage && !user) {
    return NextResponse.redirect(new URL('/portal/login', request.url))
  }

  // Redirect authenticated users away from login page to portal
  // (but NOT from /portal/reset -- they need that to set a new password after email callback)
  if (pathname === '/portal/login' && user) {
    return NextResponse.redirect(new URL('/portal', request.url))
  }

  // ---- Admin + Sales route protection ----
  const isAdminRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/editor')
  const isAdminLoginPage = pathname === '/login'
  const isSalesRoute = pathname.startsWith('/sales') && pathname !== '/sales-login'
  const isSalesLoginPage = pathname === '/sales-login'

  // Unauthenticated admin requests → redirect to /login
  if (isAdminRoute && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Unauthenticated sales requests → redirect to /sales-login
  if (isSalesRoute && !user) {
    return NextResponse.redirect(new URL('/sales-login', request.url))
  }

  // Single role query for all role-gated routes
  if ((isAdminRoute || isAdminLoginPage || isSalesRoute || isSalesLoginPage) && user) {
    const admin = createAdminClientForMiddleware()
    const { data } = await (admin as any)
      .from('user_roles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
    const role = data?.role as string | undefined
    const isUserAdmin = role === 'admin'
    const isUserSales = role === 'sales'
    const hasSalesAccess = isUserAdmin || isUserSales

    // Non-admin on admin routes → redirect to /login
    if (isAdminRoute && !isUserAdmin) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Admin on /login → redirect to dashboard
    if (isAdminLoginPage && isUserAdmin) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // No sales access on sales routes → kick back to sales login
    if (isSalesRoute && !hasSalesAccess) {
      return NextResponse.redirect(new URL('/sales-login', request.url))
    }

    // Sales-authorized user on sales login page → redirect to /sales
    if (isSalesLoginPage && hasSalesAccess) {
      return NextResponse.redirect(new URL('/sales', request.url))
    }
  }

  return response
}
