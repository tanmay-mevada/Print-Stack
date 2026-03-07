'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { updateShopPricingAction } from '../actions'
import { useTheme } from '@/context/ThemeContext'
import toast, { Toaster } from 'react-hot-toast'
import LoadingScreen from '@/components/LoadingScreen'
import { ArrowLeft, IndianRupee, Layers, Palette, Printer, BookOpen, Package } from 'lucide-react'

export default function ShopPricingPage() {
  const { isDark } = useTheme()
  const [pricing, setPricing] = useState<any>({
    bw_price: 0, color_price: 0, double_side_modifier: 1,
    a3_price: null, a3_stock: 0,
    a2_price: null, a2_stock: 0,
    a1_price: null, a1_stock: 0,
    a0_price: null, a0_stock: 0,
    spiral_binding_price: null,
    hard_binding_price: null,
    stapling_price: null,
    transparent_cover_price: null
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function fetchPricing() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
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
    
    const savingToast = toast.loading('Updating matrix...')
    
    const formData = new FormData(e.currentTarget)
    
    // Convert empty strings to null for optional fields before passing to action
    const optionalFields = [
      'a3_price', 'a3_stock', 'a2_price', 'a2_stock', 'a1_price', 'a1_stock', 'a0_price', 'a0_stock',
      'spiral_binding_price', 'hard_binding_price', 'stapling_price', 'transparent_cover_price'
    ];

    optionalFields.forEach(field => {
       const val = formData.get(field);
       if (val === '') {
           formData.set(field, 'null'); // Hack to pass null through FormData
       }
    });

    const res = await updateShopPricingAction(formData)
    
    toast.dismiss(savingToast)
    
    if (res?.error) toast.error(res.error)
    if (res?.success) toast.success('Pricing matrix updated successfully!')
    
    setSaving(false)
  }

  // Helper component for clean inputs
  const PriceInput = ({ label, value, name, placeholder = "0.00", isStock = false }: any) => (
    <div className="space-y-2">
      <label className={`block text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-white/40' : 'text-stone-500'}`}>{label}</label>
      <div className="relative">
        <input
          name={name}
          type="number"
          step={isStock ? "1" : "0.01"}
          value={value === null ? '' : value}
          onChange={(e) => setPricing({ ...pricing, [name]: e.target.value === '' ? null : parseFloat(e.target.value) })}
          placeholder={placeholder}
          className={`w-full px-4 py-3 rounded-xl border font-bold outline-none transition-all ${
            isDark ? 'bg-[#0A0A0A] border-white/10 focus:border-white/30 text-white' : 'bg-white border-stone-200 focus:border-stone-400 text-stone-900'
          } ${value === null && !isStock ? 'opacity-50 grayscale' : ''}`}
        />
        {!isStock && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold opacity-30">INR</span>}
      </div>
    </div>
  )

  if (loading) return <LoadingScreen isDark={isDark} />

  return (
  <div className={`min-h-screen flex items-center justify-center px-4 py-12 font-sans transition-colors duration-700 ${
      isDark ? 'bg-[#050505] text-white selection:bg-white/20' : 'bg-[#faf9f6] text-stone-900 selection:bg-stone-900/20'
  }`}>
    
    <Toaster 
        position="top-center"
        toastOptions={{
            style: {
                background: isDark ? '#111111' : '#ffffff', color: isDark ? '#fff' : '#1c1917',
                border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e7e5e4',
                borderRadius: '16px', padding: '16px 24px', fontSize: '14px', fontWeight: 'bold',
                boxShadow: isDark ? '0 20px 40px rgba(0,0,0,0.5)' : '0 20px 40px rgba(0,0,0,0.1)',
            },
        }}
    />
    
    <div className="w-full max-w-4xl">

      <Link href="/shop/dashboard" className={`flex items-center gap-2 text-sm font-bold uppercase tracking-widest transition-colors mb-6 w-fit ${isDark ? 'text-white/50 hover:text-white' : 'text-stone-500 hover:text-stone-900'}`}>
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <div className={`rounded-[2.5rem] overflow-hidden border transition-colors duration-700 ${
          isDark ? 'bg-[#111111]/80 border-white/10 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] ring-1 ring-white/5 backdrop-blur-xl' : 'bg-white border-stone-200 shadow-xl shadow-stone-200/50'
      }`}>

        <div className={`px-8 py-8 border-b ${isDark ? 'bg-black/50 border-white/10 text-white' : 'bg-stone-900 border-stone-800 text-white'}`}>
          <div className="flex items-center gap-3 mb-2">
             <div className={`p-2 rounded-xl ${isDark ? 'bg-white/10' : 'bg-white/20'}`}>
                 <IndianRupee className="w-5 h-5" />
             </div>
             <h1 className="text-3xl font-black uppercase tracking-tight">Service Pricing Matrix</h1>
          </div>
          <p className="text-sm text-white/60 font-medium ml-12">Configure your per-page costs, large format stock, and finishing fees.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-10">

          {/* CATEGORY 1: STANDARD A4 */}
          <div>
            <h2 className={`text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2 ${isDark ? 'text-white/80' : 'text-stone-600'}`}>
              <Printer className="w-4 h-4" /> 1. Standard A4 Printing
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <PriceInput label="A4 Black & White" value={pricing?.bw_price} name="bw_price" />
              <PriceInput label="A4 Full Color" value={pricing?.color_price} name="color_price" />
              <PriceInput label="Double Sided Multiplier" value={pricing?.double_side_modifier} name="double_side_modifier" placeholder="e.g. 0.8" />
            </div>
          </div>

          {/* CATEGORY 2: LARGE FORMAT & PLOTTER */}
          <div className={`pt-8 border-t ${isDark ? 'border-white/10' : 'border-stone-200'}`}>
            <h2 className={`text-sm font-black uppercase tracking-widest mb-2 flex items-center gap-2 ${isDark ? 'text-white/80' : 'text-stone-600'}`}>
              <Layers className="w-4 h-4" /> 2. Large Format Sizes
            </h2>
            <p className={`text-xs font-medium mb-6 ${isDark ? 'text-white/40' : 'text-stone-500'}`}>Leave price empty to hide the size from students.</p>
            
            <div className="space-y-4">
              {[ {s: 'A3', p: 'a3_price', st: 'a3_stock'}, {s: 'A2', p: 'a2_price', st: 'a2_stock'}, {s: 'A1', p: 'a1_price', st: 'a1_stock'}, {s: 'A0', p: 'a0_price', st: 'a0_stock'} ].map((item) => (
                <div key={item.s} className={`grid grid-cols-2 gap-6 p-5 rounded-2xl border border-dashed transition-colors ${isDark ? 'border-white/10 bg-white/5' : 'border-stone-200 bg-stone-50'}`}>
                  <PriceInput label={`${item.s} Price`} value={pricing?.[item.p]} name={item.p} />
                  <PriceInput label={`${item.s} Stock (Pages)`} value={pricing?.[item.st]} name={item.st} isStock={true} placeholder="0" />
                </div>
              ))}
            </div>
          </div>

          {/* CATEGORY 3: BINDING & FINISHING */}
          <div className={`pt-8 border-t ${isDark ? 'border-white/10' : 'border-stone-200'}`}>
            <h2 className={`text-sm font-black uppercase tracking-widest mb-2 flex items-center gap-2 ${isDark ? 'text-white/80' : 'text-stone-600'}`}>
              <BookOpen className="w-4 h-4" /> 3. Finishing & Binding
            </h2>
            <p className={`text-xs font-medium mb-6 ${isDark ? 'text-white/40' : 'text-stone-500'}`}>Flat fees applied per document. Leave empty to disable.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <PriceInput label="Spiral Binding" value={pricing?.spiral_binding_price} name="spiral_binding_price" />
              <PriceInput label="Hard Binding" value={pricing?.hard_binding_price} name="hard_binding_price" />
              <PriceInput label="Stapling (Per Doc)" value={pricing?.stapling_price} name="stapling_price" />
              <PriceInput label="Transparent Covers" value={pricing?.transparent_cover_price} name="transparent_cover_price" />
            </div>
          </div>

          {/* Submit Button */}
          <div className={`pt-8 border-t ${isDark ? 'border-white/10' : 'border-stone-200'}`}>
            <button
              type="submit"
              disabled={saving}
              className={`w-full rounded-xl py-6 text-sm font-black uppercase tracking-widest transition-all shadow-xl disabled:opacity-50 hover:-translate-y-1 ${
                  isDark ? 'bg-white text-black hover:bg-gray-200 shadow-[0_0_40px_rgba(255,255,255,0.15)]' : 'bg-stone-900 text-white hover:bg-black shadow-stone-900/20'
              }`}
            >
              {saving ? 'UPDATING MATRIX...' : 'SAVE PRICING MATRIX'}
            </button>
          </div>

        </form>
      </div>
    </div>
  </div>
  )
}