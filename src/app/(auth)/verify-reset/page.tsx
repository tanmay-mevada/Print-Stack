'use client'

import { useState, Suspense } from 'react'
import { consumeResetCodeAction } from '../actions'
import { ShieldCheck, ArrowRight, AlertTriangle, Loader2 } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'

function VerifyResetContent() {
    const t = useTranslations('auth.verifyReset')
    const { isDark } = useTheme()
    const searchParams = useSearchParams()
    const [loading, setLoading] = useState(false)
    const [serverError, setServerError] = useState('')

    // Look for the token_hash instead of code
    const tokenHash = searchParams.get('token_hash')
    const errorParam = searchParams.get('error')
    const errorDesc = searchParams.get('error_description')

    if (errorParam || !tokenHash) {
        return (
            <div className={`w-full max-w-md p-8 text-center rounded-[2.5rem] border backdrop-blur-xl ${isDark ? 'bg-[#111111]/80 border-white/10' : 'bg-white border-stone-200 shadow-xl'}`}>
                <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
                <h2 className="text-2xl font-black mb-2">{t("invalidLink")}</h2>
                <p className={`text-sm mb-6 ${isDark ? 'text-white/60' : 'text-stone-500'}`}>
                    {errorDesc || t("invalidLinkDesc")}
                </p>
                <Link href="/forgot-password" className={`inline-block py-3 px-6 rounded-xl font-bold text-sm uppercase tracking-widest ${isDark ? 'bg-white text-black' : 'bg-stone-900 text-white'}`}>
                    {t("requestNewLink")}
                </Link>
            </div>
        )
    }

    async function handleVerify() {
        setLoading(true)
        setServerError('')

        // Pass the tokenHash to the server action
        const res = await consumeResetCodeAction(tokenHash as string)

        if (res?.error) {
            setServerError(res.error)
            setLoading(false)
        }
    }

    return (
        <div className={`w-full max-w-md p-8 sm:p-12 rounded-[2.5rem] border backdrop-blur-xl text-center transition-all ${isDark ? 'bg-[#111111]/80 border-white/10 shadow-2xl shadow-black/50' : 'bg-white border-stone-200 shadow-xl shadow-stone-200/50'}`}>
            <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 shadow-xl ${isDark ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-green-50 border border-green-200 text-green-600'}`}>
                <ShieldCheck className="w-10 h-10" />
            </div>

            <h1 className="text-3xl font-black tracking-tight mb-3">{t("secureVerification")}</h1>
            <p className={`text-sm font-medium mb-8 ${isDark ? 'text-white/60' : 'text-stone-500'}`}>
                {t("confirmReset")}
            </p>

            {serverError && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-bold">
                    {serverError}
                </div>
            )}

            <button
                onClick={handleVerify}
                disabled={loading}
                className={`w-full flex items-center justify-center gap-2 py-4.5 rounded-xl font-black text-sm uppercase tracking-widest transition-all disabled:opacity-50 ${isDark ? 'bg-white text-black hover:bg-gray-200 shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'bg-stone-900 text-white hover:bg-black shadow-lg'}`}
            >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> {t("verifying")}</> : <>{t("confirmAndReset")} <ArrowRight className="w-4 h-4" /></>}
            </button>
        </div>
    )
}

export default function VerifyResetPage() {
    const t = useTranslations('auth.verifyReset')
    const { isDark } = useTheme()

    return (
        <div className={`min-h-screen flex items-center justify-center px-4 py-12 font-sans transition-colors duration-500 ${isDark ? 'bg-[#050505] text-white' : 'bg-[#faf9f6] text-stone-900'}`}>
            <Suspense fallback={
                <div className="flex flex-col items-center">
                    <Loader2 className="w-8 h-8 animate-spin text-stone-400 mb-4" />
                    <p className="font-bold tracking-widest uppercase text-stone-400 text-sm">{t("loadingPortal")}</p>
                </div>
            }>
                <VerifyResetContent />
            </Suspense>
        </div>
    )
}