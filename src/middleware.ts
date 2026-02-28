// src/middleware.ts
import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // 1. Get the user session
  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // 2. If no user and trying to access a protected route, send to login
  if (!user && (path.startsWith('/student') || path.startsWith('/shop') || path.startsWith('/admin'))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 3. If user is logged in, fetch their role and route them
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role

    // Redirect logic based on role
    if (path.startsWith('/login')) {
      if (role === 'STUDENT') return NextResponse.redirect(new URL('/student/dashboard', request.url))
      if (role === 'SHOP') return NextResponse.redirect(new URL('/shop/dashboard', request.url))
      if (role === 'ADMIN') return NextResponse.redirect(new URL('/admin', request.url))
    }

    // Prevent cross-role access
    if (path.startsWith('/student') && role !== 'STUDENT') return NextResponse.redirect(new URL('/login', request.url))
    if (path.startsWith('/shop') && role !== 'SHOP') return NextResponse.redirect(new URL('/login', request.url))
    if (path.startsWith('/admin') && role !== 'ADMIN') return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}