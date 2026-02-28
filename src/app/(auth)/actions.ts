'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function loginAction(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // 1. Sign in the user
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  
  if (error) return { error: error.message }
  
  // 2. Fetch the role from the user's metadata (saved during signup)
  const role = data.user.user_metadata?.role || 'student'
  
  // 3. Return the role to the frontend instead of redirecting from the server
  return { success: true, role }
}

export async function signupAction(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const name = formData.get('name') as string
  
  // Capture the role from the hidden input field we added to the signup page
  const role = formData.get('role') as string || 'student' 

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { 
        name,
        role // Save the role to Supabase user metadata
      } 
    }
  })

  if (error) return { error: error.message }
  return { success: true, email }
}

export async function verifyOtpAction(email: string, token: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'signup'
  })

  if (error) return { error: error.message }
  
  // After verifying OTP, check their role and redirect appropriately
  const role = data?.user?.user_metadata?.role || 'student'
  
  if (role === 'shopkeeper' || role === 'admin') {
    redirect('/dashboard')
  } else {
    redirect('/student')
  }
}

export async function logoutAction() {
  const supabase = await createClient()
  
  // Clear the session from the database and cookies
  await supabase.auth.signOut()
  
  // Send the user back to the login page
  redirect('/login')
}

export async function signInWithGoogleAction() {
  const supabase = await createClient()
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      // Supabase will redirect back to your callback route after Google approves
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`
    }
  })

  if (error) {
    console.error('Google Auth Error:', error.message)
    return { error: error.message }
  }

  // Redirect the user to the Google login screen
  if (data.url) {
    redirect(data.url)
  }
}