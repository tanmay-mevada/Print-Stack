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
  <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-neutral-50 text-black ">
    
    <div className="w-full max-w-2xl">

      {/* Back Link */}
      <Link
        href="/shop/dashboard"
        className="text-sm text-black hover:text-neutral-900 transition-colors"
      >
        ← Back to Dashboard
      </Link>

      {/* Card */}
      <div className="mt-4 bg-white border border-neutral-200 shadow-xl rounded-3xl overflow-hidden">

        {/* Header */}
        <div className="px-8 py-6 border-b border-neutral-200">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
            Edit Pricing (₹)
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Update your per-page printing configuration.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 py-8 space-y-8">

          {/* Alerts */}
          {message && (
            <div
              className={`rounded-xl px-4 py-3 text-sm font-medium border ${
                message.type === 'error'
                  ? 'bg-red-50 border-red-200 text-red-700'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-700'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* B&W Price */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              B&W Price per page
            </label>
            <input
              name="bw_price"
              type="number"
              step="0.5"
              required
              defaultValue={pricing?.bw_price}
              className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition"
            />
          </div>

          {/* Color Price */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Color Price per page
            </label>
            <input
              name="color_price"
              type="number"
              step="0.5"
              required
              defaultValue={pricing?.color_price}
              className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition"
            />
          </div>

          {/* Double-Sided Modifier */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Double-Sided Modifier
            </label>
            <input
              name="double_side_modifier"
              type="number"
              step="0.5"
              required
              defaultValue={pricing?.double_side_modifier || 0}
              className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition"
            />
            <p className="text-xs text-neutral-500 mt-2">
              Amount added per page for double-sided printing.
            </p>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              disabled={saving}
              className="w-full rounded-xl bg-neutral-900 text-white py-3 text-sm font-semibold hover:bg-neutral-800 transition disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save Pricing'}
            </button>
          </div>

        </form>
      </div>
    </div>
  </div>
)
}