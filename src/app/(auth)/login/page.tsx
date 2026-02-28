'use client'

import { useState } from 'react'
import Link from 'next/link'
import { loginAction, signInWithGoogleAction } from '../actions'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    
    const res = await loginAction(formData)
    if (res?.error) setError(res.error)
    setLoading(false)
  }

  return (
    <div className="p-8 font-sans">
      <h2 className="text-2xl font-bold mb-6">Welcome back</h2>

      {error && (
        <div className="text-red-600 mb-4 font-semibold">
          Error: {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4 max-w-sm">
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
            className="border border-gray-400 p-2 w-full" 
          />
        </div>
        <button 
          disabled={loading} 
          className="border border-gray-400 p-2 w-full mt-2 disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <form action={signInWithGoogleAction} className="mb-6">
        <button 
          type="submit" 
          className="text-blue-600 underline bg-transparent border-none p-0 cursor-pointer text-base"
        >
          Continue with Google
        </button>
      </form>
      
      <div className="mt-8">
        <Link href="/signup" className="text-blue-600 underline">
          Don't have an account? Sign up
        </Link>
      </div>

    </div>
  )
}