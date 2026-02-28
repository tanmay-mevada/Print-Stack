'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { updateShopPricingAction } from '../actions'

export default function ShopPricingPage() {
  const [pricing, setPricing] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ text: string, type: 'error' | 'success' } | null>(null)

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
    setMessage(null)
    
    const formData = new FormData(e.currentTarget)
    const res = await updateShopPricingAction(formData)
    
    if (res?.error) setMessage({ text: res.error, type: 'error' })
    if (res?.success) setMessage({ text: 'Pricing updated successfully.', type: 'success' })
    setSaving(false)
  }

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="p-8 font-sans max-w-lg">
      <Link href="/shop/dashboard" className="text-blue-600 underline text-sm mb-6 inline-block">← Back to Dashboard</Link>
      
      <h1 className="text-2xl font-bold mb-6">Edit Pricing (₹)</h1>

      {message && (
        <div className={`mb-4 font-semibold ${message.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 border border-gray-400 p-6">
        <div>
          <label className="block mb-1 font-semibold">B&W Price per page</label>
          <input name="bw_price" type="number" step="0.5" required defaultValue={pricing?.bw_price} className="border border-gray-400 p-2 w-full" />
        </div>

        <div>
          <label className="block mb-1 font-semibold">Color Price per page</label>
          <input name="color_price" type="number" step="0.5" required defaultValue={pricing?.color_price} className="border border-gray-400 p-2 w-full" />
        </div>

        <div>
          <label className="block mb-1 font-semibold">Double-Sided Modifier</label>
          <input name="double_side_modifier" type="number" step="0.5" required defaultValue={pricing?.double_side_modifier || 0} className="border border-gray-400 p-2 w-full" />
          <p className="text-xs text-gray-500 mt-1">Amount added per page for double-sided printing.</p>
        </div>

        <button disabled={saving} className="border border-gray-400 p-2 w-full mt-4 disabled:opacity-50 font-bold">
          {saving ? 'Saving...' : 'Save Pricing'}
        </button>
      </form>
    </div>
  )
}