'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function loginAction(formData: FormData) {
  // Add await here
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  
  if (error) return { error: error.message }
  redirect('/') 
}

export async function signupAction(formData: FormData) {
  // Add await here
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const name = formData.get('name') as string

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name } 
    }
  })

  if (error) return { error: error.message }
  return { success: true, email }
}

export async function verifyOtpAction(email: string, token: string) {
  // Add await here
  const supabase = await createClient()
  
  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'signup'
  })

  if (error) return { error: error.message }
  redirect('/')
}

export async function logoutAction() {
  const supabase = await createClient()
  
  // Clear the session from the database and cookies
  await supabase.auth.signOut()
  
  // Send the user back to the login page
  redirect('/login')
}