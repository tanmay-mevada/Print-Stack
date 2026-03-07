'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { updateShopPricingAction } from '../actions'
import { useTheme } from '@/context/ThemeContext'
import toast, { Toaster } from 'react-hot-toast'
import LoadingScreen from '@/components/LoadingScreen'
import { ArrowLeft, IndianRupee, Layers, Palette } from 'lucide-react'

export default function ShopPricingPage() {
  const { isDark } = useTheme()
  const [pricing, setPricing] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function fetchPricing() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Find shop first
        const { data: shop } = await supabase.from('shops').select('id').eq('owner_id', user.id).single()
        if (shop) {
          const { data: p } = await supabase.from('pricing_configs').select('*').eq('shop_id', shop.id).single()
          if (p) setPricing(p)
        }
      }
      setLoading(false)
    }
    fetchPricing()
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    
    const savingToast = toast.loading('Updating pricing...')
    
    const formData = new FormData(e.currentTarget)
    const res = await updateShopPricingAction(formData)
    
    toast.dismiss(savingToast)
    
    if (res?.error) {
        toast.error(res.error)
    }
    if (res?.success) {
        toast.success('Pricing updated successfully!')
    }
    
    setSaving(false)
  }

  if (loading) return <LoadingScreen isDark={isDark} />

  return (
  <div className={`min-h-screen flex items-center justify-center px-4 py-12 font-sans transition-colors duration-700 ${
      isDark ? 'bg-[#050505] text-white selection:bg-white/20' : 'bg-[#faf9f6] text-stone-900 selection:bg-stone-900/20'
  }`}>
    
    {/* ================= TOASTER CONFIGURATION ================= */}
    <Toaster 
        position="top-center"
        toastOptions={{
            style: {
                background: isDark ? '#111111' : '#ffffff',
                color: isDark ? '#fff' : '#1c1917',
                border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e7e5e4',
                borderRadius: '16px',
                padding: '16px 24px',
                fontSize: '14px',
                fontWeight: 'bold',
                letterSpacing: '0.05em',
                boxShadow: isDark ? '0 20px 40px rgba(0,0,0,0.5)' : '0 20px 40px rgba(0,0,0,0.1)',
            },
            success: {
                iconTheme: { primary: '#22c55e', secondary: isDark ? '#050505' : '#ffffff' },
            },
            error: {
                iconTheme: { primary: '#ef4444', secondary: isDark ? '#050505' : '#ffffff' },
            },
        }}
    />
    
    <div className="w-full max-w-2xl">

      {/* Back Link */}
      <Link
        href="/shop/dashboard"
        className={`flex items-center gap-2 text-sm font-bold uppercase tracking-widest transition-colors mb-6 w-fit ${
            isDark ? 'text-white/50 hover:text-white' : 'text-stone-500 hover:text-stone-900'
        }`}
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      {/* Card */}
      <div className={`rounded-[2.5rem] overflow-hidden border transition-colors duration-700 ${
          isDark 
          ? 'bg-[#111111]/80 border-white/10 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] ring-1 ring-white/5 backdrop-blur-xl' 
          : 'bg-white border-stone-200 shadow-xl shadow-stone-200/50'
      }`}>

        {/* Header */}
        <div className={`px-8 py-8 border-b ${isDark ? 'bg-black/50 border-white/10 text-white' : 'bg-stone-900 border-stone-800 text-white'}`}>
          <div className="flex items-center gap-3 mb-2">
             <div className={`p-2 rounded-xl ${isDark ? 'bg-white/10 text-white' : 'bg-white/20 text-white'}`}>
                 <IndianRupee className="w-5 h-5" />
             </div>
             <h1 className="text-3xl font-black uppercase tracking-tight">
               Edit Pricing
             </h1>
          </div>
          <p className="text-sm text-white/60 font-medium ml-12">
            Update your per-page printing configuration.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-8">

          {/* B&W Price */}
          <div className={`p-6 rounded-2xl border transition-colors ${isDark ? 'bg-white/5 border-white/10' : 'bg-stone-50 border-stone-200'}`}>
            <label className={`flex items-center gap-2 text-[10px] font-bold mb-3 uppercase tracking-widest ${isDark ? 'text-white/50' : 'text-stone-500'}`}>
              <Layers className="w-4 h-4" /> B&W Price per page
            </label>
            <div className="relative">
                <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none font-black ${isDark ? 'text-white/40' : 'text-stone-400'}`}>
                    ₹
                </div>
                <input
                  name="bw_price"
                  type="number"
                  step="0.5"
                  required
                  defaultValue={pricing?.bw_price}
                  className={`w-full rounded-xl border pl-10 pr-4 py-3 font-black text-xl outline-none transition-all ${
                      isDark 
                      ? 'bg-[#0A0A0A] border-white/10 text-white focus:border-white/30 focus:ring-1 focus:ring-white/30' 
                      : 'bg-white border-stone-300 text-stone-900 focus:border-stone-900 focus:ring-1 focus:ring-stone-900/20'
                  }`}
                />
            </div>
          </div>

          {/* Color Price */}
          <div className={`p-6 rounded-2xl border transition-colors ${isDark ? 'bg-white/5 border-white/10' : 'bg-stone-50 border-stone-200'}`}>
            <label className={`flex items-center gap-2 text-[10px] font-bold mb-3 uppercase tracking-widest ${isDark ? 'text-white/50' : 'text-stone-500'}`}>
              <Palette className="w-4 h-4" /> Color Price per page
            </label>
            <div className="relative">
                <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none font-black ${isDark ? 'text-white/40' : 'text-stone-400'}`}>
                    ₹
                </div>
                <input
                  name="color_price"
                  type="number"
                  step="0.5"
                  required
                  defaultValue={pricing?.color_price}
                  className={`w-full rounded-xl border pl-10 pr-4 py-3 font-black text-xl outline-none transition-all ${
                      isDark 
                      ? 'bg-[#0A0A0A] border-white/10 text-white focus:border-white/30 focus:ring-1 focus:ring-white/30' 
                      : 'bg-white border-stone-300 text-stone-900 focus:border-stone-900 focus:ring-1 focus:ring-stone-900/20'
                  }`}
                />
            </div>
          </div>

          {/* Double-Sided Modifier */}
          <div className={`p-6 rounded-2xl border transition-colors ${isDark ? 'bg-white/5 border-white/10' : 'bg-stone-50 border-stone-200'}`}>
            <div className="flex justify-between items-start mb-3">
                <label className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-white/50' : 'text-stone-500'}`}>
                  Double-Sided Modifier
                </label>
            </div>
            <p className={`text-xs mb-4 font-medium ${isDark ? 'text-white/40' : 'text-stone-500'}`}>
              Multiplier applied to the base page price for double-sided prints (e.g., 0.8 means double-sided costs 80% of two single pages).
            </p>
            <input
              name="double_side_modifier"
              type="number"
              step="0.1"
              required
              defaultValue={pricing?.double_side_modifier || 0.8}
              className={`w-full rounded-xl border px-4 py-3 font-black text-xl outline-none transition-all ${
                  isDark 
                  ? 'bg-[#0A0A0A] border-white/10 text-white focus:border-white/30 focus:ring-1 focus:ring-white/30' 
                  : 'bg-white border-stone-300 text-stone-900 focus:border-stone-900 focus:ring-1 focus:ring-stone-900/20'
              }`}
            />
          </div>

          {/* Submit Button */}
          <div className={`pt-4 border-t ${isDark ? 'border-white/10' : 'border-stone-200'}`}>
            <button
              disabled={saving}
              className={`w-full rounded-xl py-5 text-sm font-black uppercase tracking-widest transition-all shadow-xl disabled:opacity-50 hover:-translate-y-1 ${
                  isDark ? 'bg-white text-black hover:bg-gray-200 shadow-white/10 hover:shadow-white/20' : 'bg-stone-900 text-white hover:bg-black shadow-stone-900/20 hover:shadow-stone-900/30'
              }`}
            >
              {saving ? 'SAVING...' : 'SAVE PRICING'}
            </button>
          </div>

        </form>
      </div>
    </div>
  </div>
  )
}