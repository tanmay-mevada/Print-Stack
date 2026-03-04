'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { updateShopProfileAction, resolveGoogleMapsLinkAction } from '../actions'
import SmartLocationPicker from '@/components/SmartLocationPicker'
import { MapPin, Link2, Loader2, CheckCircle2, ImagePlus, X, Store } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import toast, { Toaster } from 'react-hot-toast'

export default function ShopProfilePage() {
  const { isDark } = useTheme()
  const [shop, setShop] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [coords, setCoords] = useState({ lat: 21.1702, lng: 72.8311 })
  const [locationMode, setLocationMode] = useState<'pin' | 'link'>('pin')
  
  const [mapsInput, setMapsInput] = useState('')
  const [linkError, setLinkError] = useState('')
  const [parsingLink, setParsingLink] = useState(false)
  const [linkSuccess, setLinkSuccess] = useState(false)

  // NEW: Single Profile Picture State
  const [profilePic, setProfilePic] = useState<File | string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const generatedMapLink = `https://www.google.com/maps?q=${coords.lat},${coords.lng}`

  useEffect(() => {
    async function fetchShopAndProfile() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        setUserId(user.id);
        
        // Fetch Shop Data
        const { data: shopData } = await supabase.from('shops').select('*').eq('owner_id', user.id).single()
        if (shopData) {
          setShop(shopData)
          setCoords({ lat: shopData.latitude, lng: shopData.longitude })
          if (shopData.map_link) {
            setMapsInput(shopData.map_link)
          }
        }

        // NEW: Fetch Profile Data (for the profile picture)
        const { data: profileData } = await supabase.from('profiles').select('profile_pic').eq('id', user.id).single()
        if (profileData?.profile_pic) {
          setProfilePic(profileData.profile_pic)
        }
      }
      setLoading(false)
    }
    fetchShopAndProfile()
  }, [])

  const handleLocationChange = useCallback((lat: number, lng: number) => {
    setCoords({ lat, lng })
    setLinkSuccess(false) 
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
      toast.success("Location pinned successfully!")
    } else {
      setLinkError(res?.error || 'Could not parse this link.')
      toast.error("Failed to parse Google Maps link.")
    }
    
    setParsingLink(false)
  }

  // Handle Single Image Selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const newFile = e.target.files[0];
          
          if (!newFile.type.startsWith('image/')) {
              toast.error("Please upload an image file.");
              return;
          }
          if (newFile.size > 5 * 1024 * 1024) { 
              toast.error("Image must be less than 5MB.");
              return;
          }
          setProfilePic(newFile);
      }
  }

 async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    
    setSaving(true)
    const savingToast = toast.loading('Saving shop profile & uploading image...')

    const supabase = createClient()
    const formData = new FormData(e.currentTarget)
    formData.set('latitude', coords.lat.toString())
    formData.set('longitude', coords.lng.toString())
    
    const finalMapLink = (locationMode === 'link' && linkSuccess && mapsInput) ? mapsInput : generatedMapLink;
    formData.set('map_link', finalMapLink)

    try {
        let finalImageUrl: string | null = null;
        
        // 1. Upload the image to Supabase Storage if it's a new File
        if (profilePic instanceof File && userId) {
            const fileExt = profilePic.name.split('.').pop();
            const fileName = `profile_${userId}_${Date.now()}.${fileExt}`;
            
            const { error: uploadError } = await supabase.storage
                .from('profile_pics')
                .upload(fileName, profilePic, { upsert: true });

            if (uploadError) throw new Error(`Storage Error: ${uploadError.message}`);

            const { data: publicUrlData } = supabase.storage
                .from('profile_pics')
                .getPublicUrl(fileName);

            finalImageUrl = publicUrlData.publicUrl;
        } else if (typeof profilePic === 'string') {
            finalImageUrl = profilePic; // Keep existing URL
        }

        // 2. Attach the final URL to the formData so actions.ts can grab it
        if (finalImageUrl) {
            formData.set('profile_pic', finalImageUrl);
        }

        // 3. Send everything to the Server Action
        const res = await updateShopProfileAction(formData)
        
        toast.dismiss(savingToast)

        if (res?.error) {
            toast.error(`Error: ${res.error}`)
        } else if (res?.success) {
            toast.success("Profile saved successfully!")
        }
    } catch (error: any) {
        toast.dismiss(savingToast)
        toast.error(error.message || "An error occurred while saving.");
    } finally {
        setSaving(false)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold tracking-widest uppercase">Loading...</div>

  // Determine what to show in the preview circle
  const previewUrl = profilePic instanceof File ? URL.createObjectURL(profilePic) : profilePic;

  return (
  <div className={`min-h-screen flex items-center justify-center px-4 py-12 font-sans transition-colors duration-700 ${
      isDark ? 'bg-[#050505] text-white selection:bg-white/20' : 'bg-[#faf9f6] text-stone-900 selection:bg-stone-900/20'
  }`}>
    
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
                boxShadow: isDark ? '0 20px 40px rgba(0,0,0,0.5)' : '0 20px 40px rgba(0,0,0,0.1)',
            },
        }}
    />

    <div className="w-full max-w-4xl">

      <Link href="/shop/dashboard" className={`text-sm font-bold uppercase tracking-widest transition-colors mb-6 inline-block ${
          isDark ? 'text-white/50 hover:text-white' : 'text-stone-500 hover:text-stone-900'
      }`}>
        ← Back to Dashboard
      </Link>

      <div className={`rounded-[2.5rem] overflow-hidden border transition-colors duration-700 ${
          isDark 
          ? 'bg-[#111111]/80 border-white/10 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] ring-1 ring-white/5 backdrop-blur-xl' 
          : 'bg-white border-stone-200 shadow-xl shadow-stone-200/50'
      }`}>
        
        <div className={`px-8 py-8 border-b ${isDark ? 'bg-black/50 border-white/10 text-white' : 'bg-stone-900 border-stone-800 text-white'}`}>
          <h1 className="text-3xl font-black uppercase tracking-tight">Shop Profile</h1>
          <p className="text-sm text-white/60 mt-2 font-medium">Configure your public storefront details and exact pickup location.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-10">

          {/* SECTION 1: Basic Info */}
          <div>
            <h2 className={`text-sm font-black uppercase tracking-widest mb-6 pb-2 border-b ${
                isDark ? 'text-white/40 border-white/10' : 'text-stone-400 border-stone-200'
            }`}>1. Store Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={`block text-[10px] font-bold mb-2 uppercase tracking-widest ${isDark ? 'text-white/50' : 'text-stone-500'}`}>Shop Name</label>
                <input 
                    name="name" 
                    type="text" 
                    required 
                    defaultValue={shop?.name} 
                    className={`w-full rounded-xl border px-4 py-3 outline-none transition-all font-bold ${
                        isDark ? 'bg-[#0A0A0A] border-white/10 text-white focus:border-white/30 focus:ring-1 focus:ring-white/30' : 'bg-white border-stone-300 text-stone-900 focus:border-stone-900 focus:ring-1 focus:ring-stone-900/20'
                    }`} 
                />
              </div>
              <div>
                <label className={`block text-[10px] font-bold mb-2 uppercase tracking-widest ${isDark ? 'text-white/50' : 'text-stone-500'}`}>Phone Number</label>
                <input 
                    name="phone" 
                    type="tel" 
                    required 
                    defaultValue={shop?.phone} 
                    pattern="[0-9]{10}" 
                    placeholder="10-digit number" 
                    className={`w-full rounded-xl border px-4 py-3 outline-none transition-all font-bold ${
                        isDark ? 'bg-[#0A0A0A] border-white/10 text-white placeholder:text-white/20 focus:border-white/30 focus:ring-1 focus:ring-white/30' : 'bg-white border-stone-300 text-stone-900 placeholder:text-stone-300 focus:border-stone-900 focus:ring-1 focus:ring-stone-900/20'
                    }`} 
                />
              </div>
            </div>
            <div className="mt-6">
              <label className={`block text-[10px] font-bold mb-2 uppercase tracking-widest ${isDark ? 'text-white/50' : 'text-stone-500'}`}>Street Address</label>
              <input 
                  name="address" 
                  type="text" 
                  required 
                  defaultValue={shop?.address} 
                  placeholder="Full address for students to find you..." 
                  className={`w-full rounded-xl border px-4 py-3 outline-none transition-all font-bold ${
                      isDark ? 'bg-[#0A0A0A] border-white/10 text-white placeholder:text-white/20 focus:border-white/30 focus:ring-1 focus:ring-white/30' : 'bg-white border-stone-300 text-stone-900 placeholder:text-stone-300 focus:border-stone-900 focus:ring-1 focus:ring-stone-900/20'
                  }`} 
              />
            </div>
          </div>

          {/* SECTION 2: Shop Profile Picture */}
          <div>
            <div className="flex justify-between items-end mb-6 pb-2 border-b border-current border-opacity-10">
              <h2 className={`text-sm font-black uppercase tracking-widest ${isDark ? 'text-white/40' : 'text-stone-400'}`}>2. Store Logo / Profile Pic</h2>
            </div>
            
            <p className={`text-xs mb-6 font-medium ${isDark ? 'text-white/50' : 'text-stone-500'}`}>
                Upload a recognizable logo or photo of your storefront so students can easily identify you on the map.
            </p>

            <div className="flex items-center gap-8">
              <div className={`relative w-32 h-32 rounded-full border-4 overflow-hidden flex items-center justify-center transition-all ${
                  previewUrl 
                  ? (isDark ? 'border-white/20 shadow-xl' : 'border-stone-300 shadow-lg') 
                  : (isDark ? 'border-white/10 border-dashed bg-white/5' : 'border-stone-200 border-dashed bg-stone-50')
              }`}>
                  {previewUrl ? (
                      <>
                          <img src={previewUrl} alt="Profile Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                              <button 
                                  type="button"
                                  onClick={() => setProfilePic(null)}
                                  className="p-2 bg-red-500 text-white rounded-full hover:scale-110 transition-transform shadow-xl"
                              >
                                  <X className="w-5 h-5" />
                              </button>
                          </div>
                      </>
                  ) : (
                      <Store className={`w-10 h-10 ${isDark ? 'text-white/20' : 'text-stone-300'}`} />
                  )}
              </div>

              {!previewUrl && (
                  <label className={`cursor-pointer inline-flex items-center gap-2 px-6 py-3 rounded-xl border text-xs font-bold uppercase tracking-widest transition-all ${
                      isDark ? 'border-white/20 bg-[#0A0A0A] hover:bg-white/10 text-white' : 'border-stone-300 bg-white hover:bg-stone-100 text-stone-900 shadow-sm'
                  }`}>
                      <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handleImageSelect} 
                      />
                      <ImagePlus className="w-4 h-4" /> Upload Image
                  </label>
              )}
            </div>
          </div>

          {/* SECTION 3: Location Setup */}
          <div>
            <h2 className={`text-sm font-black uppercase tracking-widest mb-6 pb-2 border-b ${
                isDark ? 'text-white/40 border-white/10' : 'text-stone-400 border-stone-200'
            }`}>3. Map Pin Setup</h2>
            
            <div className="flex gap-4 mb-6">
              <button
                type="button"
                onClick={() => setLocationMode('pin')}
                className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-bold uppercase tracking-wider text-sm border-2 transition-all ${
                  locationMode === 'pin' 
                  ? (isDark ? 'border-white bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'border-stone-900 bg-stone-900 text-white shadow-lg') 
                  : (isDark ? 'border-white/10 text-white/50 hover:border-white/30 hover:bg-white/5' : 'border-stone-200 text-stone-500 hover:border-stone-300 hover:bg-stone-50')
                }`}
              >
                <MapPin className="w-4 h-4" /> Edit by Pin
              </button>
              <button
                type="button"
                onClick={() => setLocationMode('link')}
                className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-bold uppercase tracking-wider text-sm border-2 transition-all ${
                  locationMode === 'link' 
                  ? (isDark ? 'border-white bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'border-stone-900 bg-stone-900 text-white shadow-lg') 
                  : (isDark ? 'border-white/10 text-white/50 hover:border-white/30 hover:bg-white/5' : 'border-stone-200 text-stone-500 hover:border-stone-300 hover:bg-stone-50')
                }`}
              >
                <Link2 className="w-4 h-4" /> Add by Link
              </button>
            </div>

            {locationMode === 'link' && (
              <div className={`mb-6 p-6 border rounded-xl relative overflow-hidden transition-colors ${
                  isDark ? 'bg-white/5 border-white/10' : 'bg-stone-50 border-stone-200'
              }`}>
                <label className="block text-sm font-bold mb-2 flex items-center gap-2">
                  Paste Google Maps Link
                  {parsingLink && <Loader2 className={`w-4 h-4 animate-spin ${isDark ? 'text-white' : 'text-stone-900'}`} />}
                </label>
                <p className={`text-xs mb-4 ${isDark ? 'text-white/40' : 'text-stone-500'}`}>Paste any Google Maps link. The map below is locked to prevent accidental movement.</p>
                <input
                  type="url"
                  value={mapsInput}
                  onChange={handleMapsLinkPaste}
                  placeholder="https://maps.google.com/..."
                  className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all mb-2 ${
                    linkError ? (isDark ? 'border-red-500/50 bg-red-500/10 focus:ring-1 focus:ring-red-500' : 'border-red-400 bg-red-50 focus:ring-1 focus:ring-red-400') : 
                    linkSuccess ? (isDark ? 'border-green-500/50 bg-green-500/10 focus:ring-1 focus:ring-green-500' : 'border-emerald-400 bg-emerald-50 focus:ring-1 focus:ring-emerald-400') :
                    (isDark ? 'bg-[#0A0A0A] border-white/10 text-white placeholder:text-white/20 focus:border-white/30 focus:ring-1 focus:ring-white/30' : 'bg-white border-stone-300 text-stone-900 focus:ring-1 focus:ring-stone-900')
                  }`}
                />
                
                {linkError && <p className="text-xs text-red-500 font-bold">{linkError}</p>}
                {linkSuccess && (
                  <p className="text-xs text-green-500 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Location successfully pinned from link!
                  </p>
                )}
              </div>
            )}

            <div className={`mb-6 rounded-xl overflow-hidden ring-1 ${isDark ? 'ring-white/10' : 'ring-stone-200'}`}>
              <SmartLocationPicker
                defaultLat={coords.lat}
                defaultLng={coords.lng}
                onLocationChange={handleLocationChange}
                isReadOnly={locationMode === 'link'} 
              />
            </div>

            {locationMode === 'pin' && (
              <div className={`border p-5 rounded-xl flex items-center justify-between transition-colors ${
                  isDark ? 'bg-white/5 border-white/10' : 'bg-stone-50 border-stone-200'
              }`}>
                <div className="truncate pr-4">
                  <span className={`text-[10px] font-bold uppercase tracking-widest block mb-1 ${isDark ? 'text-white/40' : 'text-stone-500'}`}>Generated Location Link</span>
                  <a href={generatedMapLink} target="_blank" rel="noreferrer" className={`text-sm font-bold hover:underline truncate ${isDark ? 'text-indigo-400' : 'text-blue-600'}`}>
                    {generatedMapLink}
                  </a>
                </div>
                <button
                  type="button"
                  onClick={() => {
                      navigator.clipboard.writeText(generatedMapLink)
                      toast.success('Link Copied!')
                  }}
                  className={`shrink-0 border text-xs font-bold uppercase tracking-widest px-6 py-3 rounded-lg transition-all shadow-sm ${
                      isDark ? 'bg-[#0A0A0A] border-white/20 text-white hover:bg-white/10' : 'bg-white border-stone-300 text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  Copy Link
                </button>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className={`pt-8 border-t ${isDark ? 'border-white/10' : 'border-stone-200'}`}>
            <button disabled={saving} className={`w-full rounded-xl py-5 text-sm font-black uppercase tracking-widest transition-all shadow-xl disabled:opacity-50 hover:-translate-y-1 ${
                isDark ? 'bg-white text-black hover:bg-gray-200 shadow-white/10 hover:shadow-white/20' : 'bg-stone-900 text-white hover:bg-black shadow-stone-900/20 hover:shadow-stone-900/30'
            }`}>
              {saving ? 'SAVING PROFILE & UPLOADING...' : 'SAVE SHOP PROFILE'}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
  )
}