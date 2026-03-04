'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { updateStudentProfileAction } from '../actions'
import { User, ImagePlus, X, Phone, Mail } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import toast, { Toaster } from 'react-hot-toast'

export default function StudentProfilePage() {
  const { isDark } = useTheme()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  
  // Holds either the existing URL string or a new File object
  const [profilePic, setProfilePic] = useState<File | string | null>(null)

  useEffect(() => {
    async function fetchProfile() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        setUserId(user.id);
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        
        if (data) {
          setProfile(data)
          if (data.profile_pic) {
            setProfilePic(data.profile_pic)
          }
        }
      }
      setLoading(false)
    }
    fetchProfile()
  }, [])

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
    const savingToast = toast.loading('Saving profile...')

    const supabase = createClient()
    const formData = new FormData(e.currentTarget)

    try {
        let finalImageUrl: string | null = null;
        
        // 1. Upload image if it's a new File
        if (profilePic instanceof File && userId) {
            const fileExt = profilePic.name.split('.').pop();
            const fileName = `student_${userId}_${Date.now()}.${fileExt}`;
            
            const { error: uploadError } = await supabase.storage
                .from('profile_pics')
                .upload(fileName, profilePic, { upsert: true });

            if (uploadError) throw new Error(`Storage Error: ${uploadError.message}`);

            const { data: publicUrlData } = supabase.storage
                .from('profile_pics')
                .getPublicUrl(fileName);

            finalImageUrl = publicUrlData.publicUrl;
        } else if (typeof profilePic === 'string') {
            finalImageUrl = profilePic;
        }

        if (finalImageUrl) {
            formData.set('profile_pic', finalImageUrl);
        }

        // 2. Send to Server Action
        const res = await updateStudentProfileAction(formData)
        
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

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold tracking-widest uppercase">Loading Profile...</div>

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

    <div className="w-full max-w-3xl">

      <Link href="/student/dashboard" className={`text-sm font-bold uppercase tracking-widest transition-colors mb-6 inline-block ${
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
          <h1 className="text-3xl font-black uppercase tracking-tight">Student Profile</h1>
          <p className="text-sm text-white/60 mt-2 font-medium">Manage your personal details and avatar.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-10">

          {/* SECTION 1: Avatar */}
          <div className="flex flex-col items-center sm:flex-row gap-8 pb-10 border-b border-dashed border-current border-opacity-20">
              <div className={`relative w-32 h-32 shrink-0 rounded-full border-4 overflow-hidden flex items-center justify-center transition-all ${
                  previewUrl 
                  ? (isDark ? 'border-white/20 shadow-xl' : 'border-stone-300 shadow-lg') 
                  : (isDark ? 'border-white/10 border-dashed bg-white/5' : 'border-stone-200 border-dashed bg-stone-50')
              }`}>
                  {previewUrl ? (
                      <>
                          <img src={previewUrl} alt="Profile" className="w-full h-full object-cover" />
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
                      <User className={`w-10 h-10 ${isDark ? 'text-white/20' : 'text-stone-300'}`} />
                  )}
              </div>

              <div className="text-center sm:text-left">
                  <h2 className="text-xl font-black mb-2">Profile Picture</h2>
                  <p className={`text-xs mb-4 font-medium max-w-sm ${isDark ? 'text-white/50' : 'text-stone-500'}`}>
                      Upload a photo so shopkeepers can easily verify your identity when you pick up your prints.
                  </p>
                  {!previewUrl && (
                      <label className={`cursor-pointer inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border text-xs font-bold uppercase tracking-widest transition-all ${
                          isDark ? 'border-white/20 bg-[#0A0A0A] hover:bg-white/10 text-white' : 'border-stone-300 bg-white hover:bg-stone-100 text-stone-900 shadow-sm'
                      }`}>
                          <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                          <ImagePlus className="w-4 h-4" /> Select Image
                      </label>
                  )}
              </div>
          </div>

          {/* SECTION 2: Basic Info */}
          <div>
            <h2 className={`text-sm font-black uppercase tracking-widest mb-6 pb-2 border-b ${isDark ? 'text-white/40 border-white/10' : 'text-stone-400 border-stone-200'}`}>
                Personal Details
            </h2>
            
            <div className="space-y-6">
                <div>
                    <label className={`block text-[10px] font-bold mb-2 uppercase tracking-widest flex items-center gap-2 ${isDark ? 'text-white/50' : 'text-stone-500'}`}>
                        <User className="w-3 h-3" /> Full Name
                    </label>
                    <input 
                        name="name" 
                        type="text" 
                        required 
                        defaultValue={profile?.name} 
                        className={`w-full rounded-xl border px-4 py-3 outline-none transition-all font-bold ${
                            isDark ? 'bg-[#0A0A0A] border-white/10 text-white focus:border-white/30 focus:ring-1 focus:ring-white/30' : 'bg-white border-stone-300 text-stone-900 focus:border-stone-900 focus:ring-1 focus:ring-stone-900/20'
                        }`} 
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className={`block text-[10px] font-bold mb-2 uppercase tracking-widest flex items-center gap-2 ${isDark ? 'text-white/50' : 'text-stone-500'}`}>
                            <Phone className="w-3 h-3" /> Phone Number
                        </label>
                        <input 
                            name="phone" 
                            type="tel" 
                            defaultValue={profile?.phone || ''} 
                            pattern="[0-9]{10}" 
                            placeholder="Optional 10-digit number" 
                            className={`w-full rounded-xl border px-4 py-3 outline-none transition-all font-bold ${
                                isDark ? 'bg-[#0A0A0A] border-white/10 text-white placeholder:text-white/20 focus:border-white/30 focus:ring-1 focus:ring-white/30' : 'bg-white border-stone-300 text-stone-900 placeholder:text-stone-300 focus:border-stone-900 focus:ring-1 focus:ring-stone-900/20'
                            }`} 
                        />
                    </div>
                    
                    {/* Read-only Email Field */}
                    <div className="opacity-60 cursor-not-allowed">
                        <label className={`block text-[10px] font-bold mb-2 uppercase tracking-widest flex items-center gap-2 ${isDark ? 'text-white/50' : 'text-stone-500'}`}>
                            <Mail className="w-3 h-3" /> Email Address (Unchangeable)
                        </label>
                        <input 
                            type="email" 
                            readOnly 
                            value={profile?.email || ''} 
                            className={`w-full rounded-xl border px-4 py-3 font-bold ${
                                isDark ? 'bg-white/5 border-white/5 text-white/50' : 'bg-stone-100 border-stone-200 text-stone-500'
                            }`} 
                        />
                    </div>
                </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className={`pt-8 border-t ${isDark ? 'border-white/10' : 'border-stone-200'}`}>
            <button disabled={saving} className={`w-full rounded-xl py-5 text-sm font-black uppercase tracking-widest transition-all shadow-xl disabled:opacity-50 hover:-translate-y-1 ${
                isDark ? 'bg-white text-black hover:bg-gray-200 shadow-white/10 hover:shadow-white/20' : 'bg-stone-900 text-white hover:bg-black shadow-stone-900/20 hover:shadow-stone-900/30'
            }`}>
              {saving ? 'SAVING...' : 'SAVE PROFILE'}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
  )
}