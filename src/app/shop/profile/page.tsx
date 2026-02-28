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
    <div className="p-8 font-sans max-w-xl">
      <Link href="/shop/dashboard" className="text-blue-600 underline text-sm mb-4 inline-block">← Back</Link>
      <h1 className="text-2xl font-bold mb-6">Shop Profile</h1>

      <form onSubmit={handleSubmit} className="space-y-4 border border-gray-400 p-6">
        <div>
          <label className="block mb-1">Shop Name</label>
          <input name="name" type="text" required defaultValue={shop?.name} className="border border-gray-400 p-2 w-full" />
        </div>

        <div>
          <label className="block mb-1">Phone Number</label>
          <input 
            name="phone" 
            type="tel" 
            required 
            defaultValue={shop?.phone} 
            pattern="[0-9]{10}" 
            title="Please enter a valid 10-digit phone number"
            placeholder="e.g., 9876543210"
            className="border border-gray-400 p-2 w-full" 
          />
        </div>

        <div>
          <label className="block mb-1">Shop Address (Text)</label>
          <input 
            name="address" 
            type="text" 
            required 
            defaultValue={shop?.address} 
            placeholder="e.g., Shop 42, University Road..."
            className="border border-gray-400 p-2 w-full" 
          />
        </div>
        
        <div className="pt-2">
          <label className="block mb-1 font-semibold">Pin Exact Location</label>
          <SmartLocationPicker
            defaultLat={shop?.latitude}
            defaultLng={shop?.longitude}
            onLocationChange={(lat: number, lng: number) => setCoords({ lat, lng })}
          />
        </div>

        <button disabled={saving} className="border border-gray-400 bg-gray-100 p-2 w-full mt-4 font-bold hover:bg-gray-200">
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
        
        {/* Render the success/error messages clearly */}
        {message && (
          <p className={`text-sm mt-2 font-bold ${message.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
            {message.text}
          </p>
        )}
      </form>
    </div>
  )
}