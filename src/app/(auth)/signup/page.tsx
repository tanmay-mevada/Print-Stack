'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signInWithGoogleAction, signupAction } from '../actions'

export default function SignupPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleState, googleFormAction] = useActionState(signInWithGoogleAction, null);
  
  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    const res = await signupAction(formData)
    
    if (res?.error) {
      setError(res.error)
      setLoading(false)
    } else if (res?.success) {
      router.push(`/verify-otp?email=${encodeURIComponent(res.email)}`)
    }
  }

  return (
    <div className="p-8 font-sans">
      <h2 className="text-2xl font-bold mb-6">Create an account</h2>

      {(error || googleState?.error) && (
        <div className="text-red-600 mb-4 font-semibold">
          Error: {error || googleState?.error}
        </div>
      )}

      <form onSubmit={handleSignup} className="space-y-4 max-w-sm">
        <div>
          <label className="block mb-1">Full Name</label>
          <input 
            name="name" 
            type="text" 
            required 
            className="border border-gray-400 p-2 w-full" 
          />
        </div>
        <div>
          <label className="block mb-1">Email</label>
          <input 
            name="email" 
            type="email" 
            required 
            className="border border-gray-400 p-2 w-full" 
          />
        </div>
        <div>
          <label className="block mb-1">Password</label>
          <input 
            name="password" 
            type="password" 
            required 
            minLength={6} 
            className="border border-gray-400 p-2 w-full" 
          />
        </div>
        <button 
          disabled={loading} 
          className="border border-gray-400 p-2 w-full mt-2 disabled:opacity-50"
        >
          {loading ? 'Creating account...' : 'Sign Up'}
        </button>
      </form>

      <form action={googleFormAction} className="mb-6 mt-4">
        <button 
          type="submit" 
          className="text-blue-600 underline bg-transparent border-none p-0 cursor-pointer text-base"
        >
          Continue with Google
        </button>
      </form>

      <div className="mt-8">
        <Link href="/login" className="text-blue-600 underline">
          Already have an account? Sign in
        </Link>
      </div>
    </div>
  )
}