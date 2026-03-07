'use client'

import { useState } from 'react'
import Link from 'next/link'
import { forgotPasswordAction } from '../actions'
import { Mail, ArrowRight, CheckCircle2 } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import { useTranslations } from 'next-intl'
import LanguageSwitcher from '@/components/LanguageSwitcher'

export default function ForgotPasswordPage() {
  const t = useTranslations('auth.forgotPasswordPage')
  const tCommon = useTranslations()
  const { isDark } = useTheme()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    
    const formData = new FormData(e.currentTarget)
    const res = await forgotPasswordAction(formData)
    
    if (res?.error) setErrorMsg(res.error)
    else if (res?.success) setSuccess(true)
    
    setLoading(false)
  }

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 py-12 font-sans transition-colors duration-500 ${isDark ? 'bg-[#050505] text-white' : 'bg-[#faf9f6] text-stone-900'}`}>
      <div className="absolute top-6 right-6"><LanguageSwitcher /></div>
      <div className={`w-full max-w-md p-8 sm:p-12 rounded-[2.5rem] border backdrop-blur-xl transition-all ${isDark ? 'bg-[#111111]/80 border-white/10 shadow-2xl shadow-black/50' : 'bg-white border-stone-200 shadow-xl shadow-stone-200/50'}`}>
        
        <div className="mb-8 text-center">
          <img src={isDark ? "/pblackx.png" : "/pwhitex.png"} alt="Logo" className="w-12 h-12 mx-auto mb-6" />
          <h1 className="text-3xl font-black tracking-tight mb-2">{t("title")}</h1>
          <p className={`text-sm font-medium ${isDark ? 'text-white/60' : 'text-stone-500'}`}>
            {t("subtitle")}
          </p>
        </div>

        {success ? (
          <div className={`p-6 rounded-2xl border text-center ${isDark ? 'bg-green-500/10 border-green-500/20' : 'bg-green-50 border-green-200'}`}>
            <CheckCircle2 className={`w-10 h-10 mx-auto mb-3 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
            <h3 className={`text-lg font-black tracking-tight mb-1 ${isDark ? 'text-green-400' : 'text-green-700'}`}>{t("checkInbox")}</h3>
            <p className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-green-500/70' : 'text-green-600/70'}`}>{t("linkSent")}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {errorMsg && <p className="text-xs text-red-500 font-bold text-center bg-red-500/10 p-3 rounded-xl">{errorMsg}</p>}
            
            <div>
              <label className={`block text-[10px] font-bold mb-2 uppercase tracking-widest flex items-center gap-2 ${isDark ? 'text-white/50' : 'text-stone-500'}`}>
                <Mail className="w-3 h-3" /> {tCommon("auth.email")}
              </label>
              <input 
                name="email" 
                type="email" 
                required 
                placeholder={tCommon("auth.placeholders.studentEmail")}
                className={`w-full rounded-xl border px-4 py-3.5 outline-none transition-all font-bold ${isDark ? 'bg-[#0A0A0A] border-white/10 text-white placeholder:text-white/20 focus:border-white/30 focus:ring-1 focus:ring-white/30' : 'bg-stone-50 border-stone-200 text-stone-900 placeholder:text-stone-300 focus:border-stone-900 focus:ring-1 focus:ring-stone-900/20'}`} 
              />
            </div>

            <button disabled={loading} className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all disabled:opacity-50 ${isDark ? 'bg-white text-black hover:bg-gray-200' : 'bg-stone-900 text-white hover:bg-black'}`}>
              {loading ? t("sending") : <>{t("sendResetLink")} <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
        )}

        <div className="mt-8 text-center">
          <Link href="/login" className={`text-xs font-bold uppercase tracking-widest transition-colors ${isDark ? 'text-white/40 hover:text-white' : 'text-stone-400 hover:text-stone-900'}`}>
            ← {tCommon("common.backToLogin")}
          </Link>
        </div>
      </div>
    </div>
  )
}