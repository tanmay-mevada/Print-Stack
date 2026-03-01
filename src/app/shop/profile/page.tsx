'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { updateShopProfileAction, resolveGoogleMapsLinkAction } from '../actions'
import SmartLocationPicker from '@/components/SmartLocationPicker'
import { MapPin, Link2, Loader2, CheckCircle2 } from 'lucide-react'

export default function ShopProfilePage() {
  const [shop, setShop] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null)
  
  const [coords, setCoords] = useState({ lat: 21.1702, lng: 72.8311 })
  const [locationMode, setLocationMode] = useState<'pin' | 'link'>('pin')
  
  const [mapsInput, setMapsInput] = useState('')
  const [linkError, setLinkError] = useState('')
  const [parsingLink, setParsingLink] = useState(false)
  const [linkSuccess, setLinkSuccess] = useState(false)

  // Standardized Map Link Generator
  const generatedMapLink = `https://www.google.com/maps?q=${coords.lat},${coords.lng}`

  useEffect(() => {
    async function fetchShop() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('shops').select('*').eq('owner_id', user.id).single()
        if (data) {
          setShop(data)
          setCoords({ lat: data.latitude, lng: data.longitude })
          // If they already have a saved link, pre-fill the input box!
          if (data.map_link) {
            setMapsInput(data.map_link)
          }
        }
      }
      setLoading(false)
    }
    fetchShop()
  }, [])

  const handleLocationChange = useCallback((lat: number, lng: number) => {
    setCoords({ lat, lng })
    setLinkSuccess(false) // Reset success if they drag the pin manually
  }, [])

  const handleMapsLinkPaste = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value
    setMapsInput(url)
    setLinkError('')
    setLinkSuccess(false)

    if (!url.trim()) return;

    setParsingLink(true)

    const res = await resolveGoogleMapsLinkAction(url)
    
    if (res?.success && res.lat && res.lng) {
      setCoords({ lat: res.lat, lng: res.lng })
      setLinkSuccess(true)
    } else {
      setLinkError(res?.error || 'Could not parse this link.')
    }
    
    setParsingLink(false)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    const formData = new FormData(e.currentTarget)
    formData.set('latitude', coords.lat.toString())
    formData.set('longitude', coords.lng.toString())
    
    // INTELLIGENT LINK SAVING:
    // If they used the Link method and it succeeded, save their exact pasted link.
    // Otherwise, save the dynamically generated one based on the pin.
    const finalMapLink = (locationMode === 'link' && linkSuccess && mapsInput) 
      ? mapsInput 
      : generatedMapLink;
      
    formData.set('map_link', finalMapLink)

    const res = await updateShopProfileAction(formData)
    
    if (res?.error) setMessage({ text: res.error, type: 'error' })
    else if (res?.success) setMessage({ text: "Profile saved successfully!", type: 'success' })
    
    setSaving(false)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-neutral-50 font-bold uppercase tracking-widest text-stone-400">Loading...</div>

  return (
  <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-neutral-50 text-black font-sans">
    <div className="w-full max-w-4xl">

      <Link href="/shop/dashboard" className="text-sm font-bold uppercase tracking-widest text-neutral-500 hover:text-black transition-colors mb-6 inline-block">
        ← Back to Dashboard
      </Link>

      <div className="bg-white border border-neutral-300 shadow-xl rounded-[2rem] overflow-hidden">
        
        <div className="px-8 py-8 border-b border-neutral-200 bg-neutral-900 text-white">
          <h1 className="text-3xl font-black uppercase tracking-tight">Shop Profile</h1>
          <p className="text-sm text-neutral-400 mt-2 font-medium">Configure your public storefront details and exact pickup location.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-10">

          {/* SECTION 1: Basic Info */}
          <div>
            <h2 className="text-sm font-black text-neutral-400 uppercase tracking-widest mb-6 pb-2 border-b border-neutral-200">1. Store Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-neutral-700 mb-2 uppercase tracking-wide">Shop Name</label>
                <input name="name" type="text" required defaultValue={shop?.name} className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:ring-2 focus:ring-black focus:border-black transition" />
              </div>
              <div>
                <label className="block text-sm font-bold text-neutral-700 mb-2 uppercase tracking-wide">Phone Number</label>
                <input name="phone" type="tel" required defaultValue={shop?.phone} pattern="[0-9]{10}" placeholder="10-digit number" className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:ring-2 focus:ring-black focus:border-black transition" />
              </div>
            </div>
            <div className="mt-6">
              <label className="block text-sm font-bold text-neutral-700 mb-2 uppercase tracking-wide">Street Address</label>
              <input name="address" type="text" required defaultValue={shop?.address} placeholder="Full address for students to find you..." className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:ring-2 focus:ring-black focus:border-black transition" />
            </div>
          </div>

          {/* SECTION 2: Location Setup */}
          <div>
            <h2 className="text-sm font-black text-neutral-400 uppercase tracking-widest mb-6 pb-2 border-b border-neutral-200">2. Map Pin Setup</h2>
            
            <div className="flex gap-4 mb-6">
              <button
                type="button"
                onClick={() => setLocationMode('pin')}
                className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-bold uppercase tracking-wider text-sm border-2 transition-all ${
                  locationMode === 'pin' ? 'border-black bg-black text-white' : 'border-neutral-200 text-neutral-500 hover:border-neutral-300 hover:bg-neutral-50'
                }`}
              >
                <MapPin className="w-4 h-4" /> Edit by Pin
              </button>
              <button
                type="button"
                onClick={() => setLocationMode('link')}
                className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-bold uppercase tracking-wider text-sm border-2 transition-all ${
                  locationMode === 'link' ? 'border-black bg-black text-white' : 'border-neutral-200 text-neutral-500 hover:border-neutral-300 hover:bg-neutral-50'
                }`}
              >
                <Link2 className="w-4 h-4" /> Add by Link
              </button>
            </div>

            {locationMode === 'link' && (
              <div className="mb-6 p-6 bg-neutral-50 border border-neutral-200 rounded-xl relative overflow-hidden">
                <label className="block text-sm font-bold text-neutral-900 mb-2 flex items-center gap-2">
                  Paste Google Maps Link
                  {parsingLink && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
                </label>
                <p className="text-xs text-neutral-500 mb-4">Paste any Google Maps link. The map below is locked to prevent accidental movement.</p>
                <input
                  type="url"
                  value={mapsInput}
                  onChange={handleMapsLinkPaste}
                  placeholder="https://maps.google.com/..."
                  className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition mb-2 ${
                    linkError ? 'border-red-400 bg-red-50' : 
                    linkSuccess ? 'border-emerald-400 bg-emerald-50 focus:ring-emerald-500' :
                    'border-neutral-300 bg-white focus:ring-2 focus:ring-black'
                  }`}
                />
                
                {linkError && <p className="text-xs text-red-600 font-bold">{linkError}</p>}
                {linkSuccess && (
                  <p className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Location successfully pinned from link!
                  </p>
                )}
              </div>
            )}

            <div className="mb-6">
              <SmartLocationPicker
                defaultLat={coords.lat}
                defaultLng={coords.lng}
                onLocationChange={handleLocationChange}
                isReadOnly={locationMode === 'link'} 
              />
            </div>

            {locationMode === 'pin' && (
              <div className="bg-neutral-50 border border-neutral-200 p-5 rounded-xl flex items-center justify-between">
                <div className="truncate pr-4">
                  <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest block mb-1">Generated Location Link</span>
                  <a href={generatedMapLink} target="_blank" rel="noreferrer" className="text-sm font-bold text-blue-600 hover:underline truncate">
                    {generatedMapLink}
                  </a>
                </div>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(generatedMapLink).then(() => alert('Link Copied!'))}
                  className="shrink-0 bg-white border border-neutral-300 text-black text-xs font-bold uppercase tracking-widest px-6 py-3 rounded-lg hover:bg-neutral-100 transition shadow-sm"
                >
                  Copy Link
                </button>
              </div>
            )}
          </div>

          {/* Submit Button & Messages */}
          <div className="pt-8 border-t border-neutral-200">
            <button disabled={saving} className="w-full rounded-xl bg-black text-white py-5 text-sm font-black uppercase tracking-widest hover:bg-neutral-800 transition shadow-xl shadow-black/20 disabled:opacity-50">
              {saving ? 'SAVING PROFILE...' : 'SAVE SHOP PROFILE'}
            </button>

            {message && (
              <div className={`p-4 rounded-xl mt-4 text-sm font-bold text-center uppercase tracking-widest ${message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>
                {message.text}
              </div>
            )}
          </div>

        </form>
      </div>
    </div>
  </div>
  )
}