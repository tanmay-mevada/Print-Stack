import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Successfully verified via link! Redirect to the root (middleware will handle routing)
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // If the link is invalid or expired
  return NextResponse.redirect(`${origin}/login?error=Invalid%20or%20expired%20verification%20link`)
}