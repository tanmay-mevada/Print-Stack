'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { verifyOtpAction } from '../actions'

function VerifyOtpForm() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email')

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // If someone navigates to this page without an email in the URL
  if (!email) {
    return (
      <div className="mt-4">
        <p className="mb-4">No email provided for verification.</p>
        <Link href="/signup" className="text-blue-600 underline">Return to Sign Up</Link>
      </div>
    )
  }

  async function handleVerify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    const otp = formData.get('otp') as string

    // We pass the email from the URL, and the OTP from the form
    const res = await verifyOtpAction(email!, otp)
    if (res?.error) setError(res.error)
    setLoading(false)
  }

  return (
    <>
      <h2 className="text-2xl font-bold mb-6">Check your email</h2>
      
      {error && (
        <div className="text-red-600 mb-4 font-semibold">
          Error: {error}
        </div>
      )}

      <form onSubmit={handleVerify} className="space-y-4 max-w-sm">
        <p className="mb-4">
          We sent a verification link and a 6-digit code to <strong>{email}</strong>
        </p>
        
        <div>
          <label className="block mb-1">6-Digit OTP</label>
          <input 
            name="otp" 
            type="text" 
            required 
            maxLength={6} 
            className="border border-gray-400 p-2 w-full tracking-widest" 
            placeholder="••••••"
          />
        </div>
        
        <button 
          disabled={loading} 
          className="border border-gray-400 p-2 w-full mt-2 disabled:opacity-50"
        >
          {loading ? 'Verifying...' : 'Verify Code'}
        </button>
      </form>
    </>
  )
}

export default function VerifyOtpPage() {
  return (
    <div className="p-8 font-sans">
      <Suspense fallback={<div>Loading verification form...</div>}>
        <VerifyOtpForm />
      </Suspense>
    </div>
  )
}