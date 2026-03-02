'use client'

import { useState, useActionState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { loginAction, signInWithGoogleAction } from '../actions'
import { Printer, Mail, Lock, ArrowRight, CheckCircle2, ShieldCheck, Sun, Moon } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'

export default function LoginPage() {
    const router = useRouter()
    const { isDark, toggleTheme } = useTheme()
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [googleState, googleFormAction] = useActionState(signInWithGoogleAction, null)

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
                router.push('/admin/dashboard')
            } else {
                router.push('/student')
            }
        }
    }

    // Combine local error and google error for a single display area
    const displayError = error || googleState?.error;

    return (
        <div className={`min-h-screen font-sans flex transition-colors duration-500 ${isDark ? 'bg-[#0A0A0A] text-white' : 'bg-[#faf9f6] text-stone-900'}`}>

            {/* ================= LEFT COLUMN: LOGIN FORM ================= */}
            <div className="w-full lg:w-1/2 flex flex-col p-8 sm:p-12 md:p-16 lg:p-24 justify-center relative z-10">

                {/* Header: Logo & Theme Toggle */}
                <div className="absolute top-8 left-8 sm:top-12 sm:left-12 flex items-center gap-6 z-10">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-sm transition-colors duration-300 ${isDark ? 'bg-white group-hover:bg-gray-300' : 'bg-stone-900 group-hover:bg-stone-700'}`}>
                            <Printer className={`w-5 h-5 ${isDark ? 'text-black' : 'text-white'}`} />
                        </div>
                        <span className={`font-bold text-xl tracking-tight transition-colors ${isDark ? 'text-white' : 'text-stone-900'}`}>
                            PrintStack++
                        </span>
                    </Link>
                    
                    <button 
                        type="button"
                      onClick={toggleTheme}
                        className={`p-2 rounded-full transition-all duration-300 ${isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-black/5 hover:bg-black/10 text-stone-900'}`}
                        aria-label="Toggle Theme"
                    >
                        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>
                </div>

                <div className="max-w-md w-full mx-auto mt-16 lg:mt-0">
                    <div className="mb-10">
                        <h2 className={`text-4xl font-black tracking-tight mb-3 transition-colors ${isDark ? 'text-white' : 'text-stone-900'}`}>
                            Welcome back
                        </h2>
                        <p className={`font-medium transition-colors ${isDark ? 'text-white/60' : 'text-stone-500'}`}>
                            Enter your credentials to access your digital print queue.
                        </p>
                    </div>

                    {displayError && (
                        <div className={`mb-6 p-4 rounded-xl text-sm font-semibold flex items-start gap-3 transition-colors ${isDark ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-red-50 border border-red-200 text-red-600'}`}>
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isDark ? 'bg-red-500/20' : 'bg-red-100'}`}>
                                !
                            </div>
                            {displayError}
                        </div>
                    )}

                    {/* Credentials Form */}
                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label className={`block text-sm font-bold mb-2 uppercase tracking-wide transition-colors ${isDark ? 'text-white/80' : 'text-stone-700'}`}>
                                Email Address
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail className={`h-5 w-5 transition-colors ${isDark ? 'text-white/40' : 'text-stone-400'}`} />
                                </div>
                                <input
                                    name="email"
                                    type="email"
                                    placeholder="student@cvmu.edu.in"
                                    required
                                    className={`block w-full pl-11 pr-4 py-3.5 rounded-xl transition-all shadow-sm outline-none focus:ring-2 ${
                                        isDark 
                                        ? 'bg-[#111111] border border-white/10 text-white placeholder-white/40 focus:ring-white/30 focus:border-white/30' 
                                        : 'bg-white border border-stone-200 text-stone-900 placeholder-stone-400 focus:ring-stone-900/20 focus:border-stone-900'
                                    }`}
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className={`block text-sm font-bold uppercase tracking-wide transition-colors ${isDark ? 'text-white/80' : 'text-stone-700'}`}>
                                    Password
                                </label>
                                <Link href="#" className={`text-sm font-bold transition-colors ${isDark ? 'text-white/60 hover:text-white' : 'text-stone-500 hover:text-stone-900'}`}>
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className={`h-5 w-5 transition-colors ${isDark ? 'text-white/40' : 'text-stone-400'}`} />
                                </div>
                                <input
                                    name="password"
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    className={`block w-full pl-11 pr-4 py-3.5 rounded-xl transition-all shadow-sm outline-none focus:ring-2 ${
                                        isDark 
                                        ? 'bg-[#111111] border border-white/10 text-white placeholder-white/40 focus:ring-white/30 focus:border-white/30' 
                                        : 'bg-white border border-stone-200 text-stone-900 placeholder-stone-400 focus:ring-stone-900/20 focus:border-stone-900'
                                    }`}
                                />
                            </div>
                        </div>

                        <button
                            disabled={loading}
                            className={`w-full py-4 font-bold rounded-xl transition-all duration-300 disabled:opacity-70 flex items-center justify-center gap-2 mt-6 ${
                                isDark
                                ? 'bg-white text-black hover:bg-gray-200 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]'
                                : 'bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10'
                            }`}
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <svg className={`animate-spin h-5 w-5 ${isDark ? 'text-black' : 'text-white'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Signing in...
                                </span>
                            ) : (
                                <>Sign In <ArrowRight className="w-5 h-5" /></>
                            )}
                        </button>
                    </form>

                    <div className="my-8 flex items-center">
                        <div className={`flex-1 border-t transition-colors ${isDark ? 'border-white/10' : 'border-stone-200'}`}></div>
                        <span className={`px-4 text-xs font-bold uppercase tracking-widest transition-colors ${isDark ? 'text-white/40' : 'text-stone-400'}`}>Or</span>
                        <div className={`flex-1 border-t transition-colors ${isDark ? 'border-white/10' : 'border-stone-200'}`}></div>
                    </div>

                    {/* Google OAuth Form */}
                    <form action={googleFormAction}>
                        <button
                            type="submit"
                            className={`w-full py-3.5 font-bold rounded-xl transition-all flex items-center justify-center gap-3 border ${
                                isDark
                                ? 'bg-[#111111] border-white/10 text-white hover:bg-white/5'
                                : 'bg-white border-stone-200 text-stone-800 hover:bg-stone-50 shadow-sm'
                            }`}
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Continue with Google
                        </button>
                    </form>

                    <div className="mt-10 text-center">
                        <p className={`font-medium transition-colors ${isDark ? 'text-white/60' : 'text-stone-500'}`}>
                            Don't have an account?{' '}
                            <Link href="/signup" className={`font-bold hover:underline transition-all ${isDark ? 'text-white hover:text-gray-300' : 'text-stone-900 hover:text-stone-700'}`}>
                                Sign up
                            </Link>
                        </p>
                    </div>

                </div>
            </div>

            {/* ================= RIGHT COLUMN: VISUAL / IMAGE ================= */}
            {/* The background here dynamically shifts opposite to the main theme for a striking split-screen effect */}
            <div className={`hidden lg:flex w-1/2 relative overflow-hidden items-center justify-center transition-colors duration-500 ${isDark ? 'bg-[#faf9f6]' : 'bg-[#050505]'}`}>
                
                {/* Image adjusts blending and opacity based on theme */}
                <div
                    className={`absolute inset-0 bg-cover bg-center transition-all duration-500 ${isDark ? 'mix-blend-multiply opacity-[0.07]' : 'mix-blend-luminosity opacity-30'}`}
                    style={{ backgroundImage: "url('https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=2070&auto=format&fit=crop')" }}
                />

                {/* Gradient Overlay dynamically shifts to match background */}
                <div className={`absolute inset-0 bg-gradient-to-t transition-colors duration-500 ${isDark ? 'from-[#faf9f6] via-[#faf9f6]/40 to-transparent' : 'from-[#0A0A0A] via-[#0A0A0A]/60 to-transparent'}`} />

                {/* Floating Feature Highlight */}
                <div className="relative z-10 p-12 max-w-lg mt-auto mb-12 w-full">
                    {/* Glass card dynamically shifts colors in strict opposition to the left side */}
                    <div className={`backdrop-blur-xl border p-8 rounded-[2rem] shadow-2xl transition-all duration-500 ${isDark ? 'bg-white/60 border-stone-200 shadow-stone-200/50' : 'bg-white/10 border-white/20 shadow-black'}`}>
                        
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 transition-colors duration-500 ${isDark ? 'bg-stone-900' : 'bg-white'}`}>
                            <ShieldCheck className={`w-6 h-6 ${isDark ? 'text-white' : 'text-black'}`} />
                        </div>
                        
                        <h3 className={`text-2xl font-black tracking-tight mb-3 transition-colors ${isDark ? 'text-stone-900' : 'text-white'}`}>
                            Secure Document Handover
                        </h3>
                        
                        <p className={`font-medium leading-relaxed mb-6 transition-colors ${isDark ? 'text-stone-600' : 'text-white/80'}`}>
                            Upload from your hostel, pay securely, and collect exactly when you need it using your private OTP. No more waiting in long lines.
                        </p>

                        <div className="space-y-3">
                            <div className={`flex items-center gap-3 font-medium text-sm transition-colors ${isDark ? 'text-stone-800' : 'text-white/90'}`}>
                                <CheckCircle2 className={`w-5 h-5 ${isDark ? 'text-stone-900' : 'text-white'}`} />
                                Auto Page & Cost Detection
                            </div>
                            <div className={`flex items-center gap-3 font-medium text-sm transition-colors ${isDark ? 'text-stone-800' : 'text-white/90'}`}>
                                <CheckCircle2 className={`w-5 h-5 ${isDark ? 'text-stone-900' : 'text-white'}`} />
                                Zero Cost Ambiguity
                            </div>
                        </div>

                    </div>
                </div>
            </div>

        </div>
    )
}