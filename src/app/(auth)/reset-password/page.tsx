'use client'

import { useState } from 'react'
import { updatePasswordAction } from '../actions'
import { Lock, ArrowRight } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'

export default function ResetPasswordPage() {
    const { isDark } = useTheme()
    const [loading, setLoading] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setErrorMsg('')

        const formData = new FormData(e.currentTarget)
        const password = formData.get('password') as string
        const confirm = formData.get('confirm_password') as string

        if (password !== confirm) {
            setErrorMsg("Passwords do not match.")
            setLoading(false)
            return
        }

        const res = await updatePasswordAction(formData)
        if (res?.error) setErrorMsg(res.error)
        setLoading(false)
    }

    return (
        <div className={`min-h-screen flex items-center justify-center px-4 py-12 font-sans transition-colors duration-500 ${isDark ? 'bg-[#050505] text-white' : 'bg-[#faf9f6] text-stone-900'}`}>
            <div className={`w-full max-w-md p-8 sm:p-12 rounded-[2.5rem] border backdrop-blur-xl transition-all ${isDark ? 'bg-[#111111]/80 border-white/10 shadow-2xl shadow-black/50' : 'bg-white border-stone-200 shadow-xl shadow-stone-200/50'}`}>

                <div className="mb-8 text-center">
                    <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-6 shadow-xl ${isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-stone-100 border border-stone-200 text-stone-900'}`}>
                        <Lock className="w-6 h-6" />
                    </div>
                    <h1 className="text-3xl font-black tracking-tight mb-2">New Password</h1>
                    <p className={`text-sm font-medium ${isDark ? 'text-white/60' : 'text-stone-500'}`}>
                        Secure your account with a new password.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {errorMsg && <p className="text-xs text-red-500 font-bold text-center bg-red-500/10 p-3 rounded-xl">{errorMsg}</p>}

                    <div>
                        <label className={`block text-[10px] font-bold mb-2 uppercase tracking-widest ${isDark ? 'text-white/50' : 'text-stone-500'}`}>New Password</label>
                        <input
                            name="password"
                            type="password"
                            required
                            minLength={6}
                            className={`w-full rounded-xl border px-4 py-3.5 outline-none transition-all font-bold ${isDark ? 'bg-[#0A0A0A] border-white/10 text-white focus:border-white/30 focus:ring-1 focus:ring-white/30' : 'bg-stone-50 border-stone-200 text-stone-900 focus:border-stone-900 focus:ring-1 focus:ring-stone-900/20'}`}
                        />
                    </div>

                    <div>
                        <label className={`block text-[10px] font-bold mb-2 uppercase tracking-widest ${isDark ? 'text-white/50' : 'text-stone-500'}`}>Confirm Password</label>
                        <input
                            name="confirm_password"
                            type="password"
                            required
                            minLength={6}
                            className={`w-full rounded-xl border px-4 py-3.5 outline-none transition-all font-bold ${isDark ? 'bg-[#0A0A0A] border-white/10 text-white focus:border-white/30 focus:ring-1 focus:ring-white/30' : 'bg-stone-50 border-stone-200 text-stone-900 focus:border-stone-900 focus:ring-1 focus:ring-stone-900/20'}`}
                        />
                    </div>

                    <button disabled={loading} className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all disabled:opacity-50 ${isDark ? 'bg-white text-black hover:bg-gray-200' : 'bg-stone-900 text-white hover:bg-black'}`}>
                        {loading ? 'Updating...' : <>Update Password <ArrowRight className="w-4 h-4" /></>}
                    </button>
                </form>
            </div>
        </div>
    )
}