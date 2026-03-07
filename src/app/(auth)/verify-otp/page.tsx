'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { verifyOtpAction } from '../actions'
import { 
    Printer, 
    Sun, 
    Moon, 
    ArrowRight, 
    KeyRound, 
    ShieldCheck, 
    MailCheck 
} from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import { useTranslations } from 'next-intl'
import LanguageSwitcher from '@/components/LanguageSwitcher'

function VerifyOtpContent() {
    const searchParams = useSearchParams()
    const email = searchParams.get('email')
    
    const t = useTranslations('auth.verifyOtp')
    const { isDark, toggleTheme } = useTheme()
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    async function handleVerify(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setError(null)
        
        const formData = new FormData(e.currentTarget)
        const otp = formData.get('otp') as string

        const res = await verifyOtpAction(email!, otp)
        if (res?.error) {
            setError(res.error)
            setLoading(false)
        }
        // Note: We don't need to handle success here because verifyOtpAction automatically redirects!
    }

    return (
        <div className={`min-h-screen font-sans flex transition-colors duration-500 ${isDark ? 'bg-[#0A0A0A] text-white' : 'bg-[#faf9f6] text-stone-900'}`}>
            
            {/* ================= LEFT COLUMN: VERIFY FORM ================= */}
            <div className="w-full lg:w-1/2 flex flex-col p-8 sm:p-12 md:p-16 lg:p-24 justify-center relative z-10">

                {/* Header: Logo & Theme Toggle */}
                <div className="absolute top-8 left-8 sm:top-12 sm:left-12 right-8 flex items-center justify-between z-10">
                <div className="flex items-center gap-6">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-sm transition-colors duration-300 ${isDark ? 'bg-white group-hover:bg-gray-300' : 'bg-stone-900 group-hover:bg-stone-700'}`}>
                            <Printer className={`w-5 h-5 ${isDark ? 'text-black' : 'text-white'}`} />
                        </div>
                        <span className={`font-bold text-xl tracking-tight transition-colors ${isDark ? 'text-white' : 'text-stone-900'}`}>
                            PrintStack
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
                <LanguageSwitcher />
                </div>

                <div className="max-w-md w-full mx-auto mt-16 lg:mt-0 relative z-10">
                    
                    {!email ? (
                        /* Missing Email Fallback */
                        <div className="text-center">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 transition-colors ${isDark ? 'bg-white/10 text-white/50' : 'bg-stone-200 text-stone-500'}`}>
                                <MailCheck className="w-8 h-8" />
                            </div>
                            <h2 className={`text-3xl font-black tracking-tight mb-3 transition-colors ${isDark ? 'text-white' : 'text-stone-900'}`}>
                                {t("missingInfo")}
                            </h2>
                            <p className={`font-medium mb-8 transition-colors ${isDark ? 'text-white/60' : 'text-stone-500'}`}>
                                {t("missingInfoDesc")}
                            </p>
                            <Link 
                                href="/signup" 
                                className={`inline-flex items-center justify-center w-full py-4 font-bold rounded-xl transition-all duration-300 ${
                                    isDark ? 'bg-white text-black hover:bg-gray-200' : 'bg-stone-900 text-white hover:bg-stone-800'
                                }`}
                            >
                                {t("returnToSignUp")}
                            </Link>
                        </div>
                    ) : (
                        /* Standard Verification Form */
                        <>
                            <div className="mb-10 text-center sm:text-left">
                                <h2 className={`text-4xl font-black tracking-tight mb-3 transition-colors ${isDark ? 'text-white' : 'text-stone-900'}`}>
                                    {t("checkEmail")}
                                </h2>
                                <p className={`font-medium transition-colors ${isDark ? 'text-white/60' : 'text-stone-500'}`}>
                                    {t("sentCodeTo")} <strong className={isDark ? 'text-white' : 'text-stone-900'}>{email}</strong>
                                </p>
                            </div>

                            {error && (
                                <div className={`mb-6 p-4 rounded-xl text-sm font-semibold flex items-start gap-3 transition-colors ${isDark ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-red-50 border border-red-200 text-red-600'}`}>
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isDark ? 'bg-red-500/20' : 'bg-red-100'}`}>
                                        !
                                    </div>
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleVerify} className="space-y-6">
                                <div>
                                    <label className={`block text-sm font-bold mb-3 uppercase tracking-wide transition-colors text-center sm:text-left ${isDark ? 'text-white/80' : 'text-stone-700'}`}>
                                        {t("secureOtpCode")}
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <KeyRound className={`h-6 w-6 transition-colors ${isDark ? 'text-white/20' : 'text-stone-300'}`} />
                                        </div>
                                        <input
                                            name="otp"
                                            type="text"
                                            required
                                            maxLength={6}
                                            placeholder="••••••"
                                            className={`block w-full pl-12 pr-4 py-4 rounded-xl text-center text-3xl tracking-[0.5em] font-black transition-all shadow-sm outline-none focus:ring-2 ${
                                                isDark 
                                                ? 'bg-[#111111] border border-white/10 text-white placeholder-white/20 focus:ring-white/30 focus:border-white/30' 
                                                : 'bg-white border border-stone-200 text-stone-900 placeholder-stone-300 focus:ring-stone-900/20 focus:border-stone-900'
                                            }`}
                                        />
                                    </div>
                                </div>

                                <button
                                    disabled={loading}
                                    className={`w-full py-4 font-bold rounded-xl transition-all duration-300 disabled:opacity-70 flex items-center justify-center gap-2 mt-2 ${
                                        isDark
                                        ? 'bg-white text-black hover:bg-gray-200 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]'
                                        : 'bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10'
                                    }`}
                                >
                                    {loading ? (
                                        <span className="flex items-center gap-2">
                                            <svg className={`animate-spin h-5 w-5 ${isDark ? 'text-black' : 'text-white'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            {t("verifying")}
                                        </span>
                                    ) : (
                                        <>{t("verifyAndContinue")} <ArrowRight className="w-5 h-5" /></>
                                    )}
                                </button>
                            </form>

                            <div className="mt-10 text-center">
                                <p className={`font-medium text-sm transition-colors ${isDark ? 'text-white/60' : 'text-stone-500'}`}>
                                    {t("checkSpam")}
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* ================= RIGHT COLUMN: VISUAL / IMAGE ================= */}
            <div className={`hidden lg:flex w-1/2 relative overflow-hidden items-center justify-center transition-colors duration-500 ${isDark ? 'bg-[#faf9f6]' : 'bg-[#050505]'}`}>
                
                {/* Image adjusts blending and opacity based on theme */}
                <div
                    className={`absolute inset-0 bg-cover bg-center transition-all duration-500 ${isDark ? 'mix-blend-multiply opacity-[0.07]' : 'mix-blend-luminosity opacity-30'}`}
                    style={{ backgroundImage: "url('https://images.unsplash.com/photo-1614064641913-a5323d81b490?q=80&w=2070&auto=format&fit=crop')" }}
                />

                {/* Gradient Overlay dynamically shifts to match background */}
                <div className={`absolute inset-0 bg-gradient-to-t transition-colors duration-500 ${isDark ? 'from-[#faf9f6] via-[#faf9f6]/40 to-transparent' : 'from-[#0A0A0A] via-[#0A0A0A]/60 to-transparent'}`} />

                {/* Floating Feature Highlight */}
                <div className="relative z-10 p-12 max-w-lg mt-auto mb-12 w-full">
                    <div className={`backdrop-blur-xl border p-8 rounded-[2rem] shadow-2xl transition-all duration-500 ${isDark ? 'bg-white/60 border-stone-200 shadow-stone-200/50' : 'bg-white/10 border-white/20 shadow-black'}`}>
                        
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 transition-colors duration-500 ${isDark ? 'bg-stone-900' : 'bg-white'}`}>
                            <ShieldCheck className={`w-6 h-6 ${isDark ? 'text-white' : 'text-black'}`} />
                        </div>
                        
                        <h3 className={`text-2xl font-black tracking-tight mb-3 transition-colors ${isDark ? 'text-stone-900' : 'text-white'}`}>
                            {t("bankGradeTitle")}
                        </h3>
                        
                        <p className={`font-medium leading-relaxed transition-colors ${isDark ? 'text-stone-600' : 'text-white/80'}`}>
                            {t("bankGradeDesc")}
                        </p>

                    </div>
                </div>
            </div>

        </div>
    )
}

// Wrapper component to provide the Suspense boundary required by Next.js useSearchParams
export default function VerifyOtpPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white/50 font-bold tracking-widest uppercase">
                Loading...
            </div>
        }>
            <VerifyOtpContent />
        </Suspense>
    )
}