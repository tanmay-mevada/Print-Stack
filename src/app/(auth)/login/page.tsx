'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation' // Added useRouter
import { loginAction, signInWithGoogleAction } from '../actions'
import { Printer, Mail, Lock, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter() // Initialize router
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    
    const res = await loginAction(formData)
    
    if (res?.error) {
      setError(res.error)
      setLoading(false)
    } else if (res?.success) {
      // Redirect based on the role returned from your database
      if (res?.role === 'shopkeeper' || res?.role === 'admin') {
        router.push('/dashboard') // Route for Shopkeepers / Admin
      } else {
        router.push('/student') // Route for Students
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 font-sans flex">
      
      {/* ================= LEFT COLUMN: LOGIN FORM ================= */}
      <div className="w-full lg:w-1/2 flex flex-col p-8 sm:p-12 md:p-16 lg:p-24 justify-center relative">
        
        {/* Back to Home / Logo */}
        <div className="absolute top-8 left-8 sm:top-12 sm:left-12">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-stone-900 rounded-lg flex items-center justify-center shadow-sm group-hover:bg-orange-600 transition-colors">
              <Printer className="text-[#faf9f6] w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-stone-900">
              PrintStack++
            </span>
          </Link>
        </div>

        <div className="max-w-md w-full mx-auto mt-16 lg:mt-0">
          <div className="mb-10">
            <h2 className="text-4xl font-black tracking-tight text-stone-900 mb-3">
              Welcome back
            </h2>
            <p className="text-stone-500 font-medium">
              Enter your credentials to access your digital print queue.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-semibold flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                !
              </div>
              {error}
            </div>
          )}

          {/* Credentials Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2 uppercase tracking-wide">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-stone-400" />
                </div>
                <input 
                  name="email" 
                  type="email" 
                  placeholder="student@cvmu.edu.in"
                  required 
                  className="block w-full pl-11 pr-4 py-3.5 bg-white border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all shadow-sm" 
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-bold text-stone-700 uppercase tracking-wide">
                  Password
                </label>
                <Link href="#" className="text-sm font-bold text-orange-600 hover:text-orange-700 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-stone-400" />
                </div>
                <input 
                  name="password" 
                  type="password" 
                  placeholder="••••••••"
                  required 
                  className="block w-full pl-11 pr-4 py-3.5 bg-white border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all shadow-sm" 
                />
              </div>
            </div>

            <button 
              disabled={loading} 
              className="w-full py-4 bg-stone-900 text-white font-bold rounded-xl hover:bg-orange-600 focus:ring-4 focus:ring-orange-500/20 transition-all duration-300 disabled:opacity-70 flex items-center justify-center gap-2 shadow-lg shadow-stone-900/10 mt-6"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Signing in...
                </span>
              ) : (
                <>Sign In <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </form>

          <div className="my-8 flex items-center">
            <div className="flex-1 border-t border-stone-200"></div>
            <span className="px-4 text-xs font-bold text-stone-400 uppercase tracking-widest">Or</span>
            <div className="flex-1 border-t border-stone-200"></div>
          </div>

          {/* Google OAuth Form */}
          <form action={signInWithGoogleAction}>
            <button 
              type="submit" 
              className="w-full py-3.5 bg-white border border-stone-200 text-stone-800 font-bold rounded-xl hover:bg-stone-50 transition-all flex items-center justify-center gap-3 shadow-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
          </form>
          
          <div className="mt-10 text-center">
            <p className="text-stone-500 font-medium">
              Don't have an account?{' '}
              <Link href="/signup" className="text-orange-600 font-bold hover:underline hover:text-orange-700 transition-all">
                Sign up
              </Link>
            </p>
          </div>

        </div>
      </div>

      {/* ================= RIGHT COLUMN: VISUAL / IMAGE ================= */}
      <div className="hidden lg:flex w-1/2 bg-stone-900 relative overflow-hidden items-center justify-center">
        {/* Sleek Abstract Paper/Stack Image via Unsplash */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-luminosity"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=2070&auto=format&fit=crop')" }}
        />
        
        {/* Gradient Overlay to ensure text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-900/60 to-transparent" />

        {/* Floating Feature Highlight */}
        <div className="relative z-10 p-12 max-w-lg mt-auto mb-12 w-full">
          {/* <div className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-[2rem] shadow-2xl">
            <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center mb-6">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-black tracking-tight text-white mb-3">
              Secure Document Handover
            </h3>
            <p className="text-stone-300 font-medium leading-relaxed mb-6">
              Upload from your hostel, pay securely, and collect exactly when you need it using your private OTP. No more waiting in long lines.
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-stone-200 font-medium text-sm">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                Auto Page & Cost Detection
              </div>
              <div className="flex items-center gap-3 text-stone-200 font-medium text-sm">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                Zero Cost Ambiguity
              </div>
            </div>
          </div> */}
        </div>
      </div>

    </div>
  )
}