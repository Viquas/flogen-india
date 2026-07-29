import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import { Database } from '@/types/database'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const rawNext = searchParams.get('next') ?? '/portal'
  // Prevent open redirect — only allow same-origin relative paths. Note the
  // backslash guard: `/\evil.com` passes a naive `//` check but the WHATWG URL
  // parser treats `\` after `/` as `/`, resolving off-origin.
  let next = '/portal'
  if (rawNext.startsWith('/') && !rawNext.startsWith('//') && !rawNext.startsWith('/\\')) {
    try {
      if (new URL(rawNext, origin).origin === origin) next = rawNext
    } catch {
      /* keep default */
    }
  }

  if (code) {
    const response = NextResponse.redirect(new URL(next, origin))

    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return response
    }
  }

  // No code or exchange failed -- redirect to login
  return NextResponse.redirect(new URL('/portal/login', origin))
}
