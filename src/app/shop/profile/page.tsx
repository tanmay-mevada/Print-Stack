'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { updateShopProfileAction } from '../actions'
import SmartLocationPicker from '@/components/SmartLocationPicker'

export default function ShopProfilePage() {
  const [shop, setShop] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Update message state to handle both success and error colors
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null)

  const [coords, setCoords] = useState({ lat: 21.1702, lng: 72.8311 })

  useEffect(() => {
    async function fetchShop() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('shops').select('*').eq('owner_id', user.id).single()
        if (data) {
          setShop(data)
          setCoords({ lat: data.latitude, lng: data.longitude })
        }
      }
      setLoading(false)
    }
    fetchShop()
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    const formData = new FormData(e.currentTarget)
    formData.set('latitude', coords.lat.toString())
    formData.set('longitude', coords.lng.toString())

    const res = await updateShopProfileAction(formData)
    
    // NOW IT WILL ACTUALLY SHOW YOU THE ERROR IF IT FAILS
    if (res?.error) {
      setMessage({ text: res.error, type: 'error' })
    } else if (res?.success) {
      setMessage({ text: "Profile saved successfully!", type: 'success' })
    }
    
    setSaving(false)
  }

  if (loading) return <div className="p-8">Loading...</div>

  return (
  <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-neutral-50 text-black">
    
    <div className="w-full max-w-3xl">

      {/* Back Link */}
      <Link
        href="/shop/dashboard"
        className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
      >
        ← Back to Dashboard
      </Link>

      {/* Card */}
      <div className="mt-4 bg-white border border-neutral-200 shadow-xl rounded-3xl overflow-hidden">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-neutral-200">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
            Shop Profile
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Update your shop details and exact location.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="px-8 py-8 space-y-6">

          {/* Shop Name */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Shop Name
            </label>
            <input
              name="name"
              type="text"
              required
              defaultValue={shop?.name}
              className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Phone Number
            </label>
            <input
              name="phone"
              type="tel"
              required
              defaultValue={shop?.phone}
              pattern="[0-9]{10}"
              placeholder="e.g., 9876543210"
              className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Shop Address
            </label>
            <input
              name="address"
              type="text"
              required
              defaultValue={shop?.address}
              placeholder="Shop 42, University Road..."
              className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition"
            />
          </div>

          {/* Location Picker */}
          <div className="pt-4 border-t border-neutral-200">
            <h3 className="text-sm font-semibold text-neutral-800 mb-4">
              Pin Exact Location
            </h3>

            <SmartLocationPicker
              defaultLat={shop?.latitude}
              defaultLng={shop?.longitude}
              onLocationChange={(lat: number, lng: number) =>
                setCoords({ lat, lng })
              }
            />
          </div>

          {/* Submit */}
          <div className="pt-6">
            <button
              disabled={saving}
              className="w-full rounded-xl bg-neutral-900 text-white py-3 text-sm font-semibold hover:bg-neutral-800 transition disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>

            {message && (
              <p
                className={`text-sm mt-4 font-medium ${
                  message.type === 'error'
                    ? 'text-red-600'
                    : 'text-emerald-600'
                }`}
              >
                {message.text}
              </p>
            )}
          </div>

        </form>
      </div>
    </div>
  </div>
)
}