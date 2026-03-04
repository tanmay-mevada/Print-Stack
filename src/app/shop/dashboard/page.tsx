'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { logoutAction } from '@/app/(auth)/actions'
import { toggleShopActiveStatus } from '../actions'
import { createClient } from '@/lib/supabase/client'
import OrderRow from '@/components/OrderRow'
import NotificationListener from '@/components/NotificationListener'
import { Toaster } from 'react-hot-toast' // If not already imported
import LoadingScreen from '@/components/LoadingScreen'
import { 
  Sun, Moon, LogOut, Store, Settings, Zap, PauseCircle,
  BarChart3
} from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'

export default function ShopDashboardPage() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false) 
  const { isDark, toggleTheme } = useTheme()
  const [shop, setShop] = useState<any>(null)
  
  // Order & Profile States
  const [activeOrders, setActiveOrders] = useState<any[]>([])
  const [completedOrders, setCompletedOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // NEW: State to hold the shop owner's profile picture
  const [userAvatar, setUserAvatar] = useState<string | null>(null)

  const dropdownRef = useRef<HTMLDivElement>(null)

  // ==========================================================================
  // REAL-TIME AUTO-REFRESH LOGIC (Shopkeeper Side)
  // ==========================================================================
  const fetchDashboardData = useCallback(async (isInitialLoad = false) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      if (isInitialLoad) router.push('/login')
      return 
    }

    // NEW: Fetch Profile Picture
    const { data: profile } = await supabase.from('profiles').select('profile_pic').eq('id', user.id).single()
    if (profile?.profile_pic) {
        setUserAvatar(profile.profile_pic)
    }

    let currentShop = shop;
    if (!currentShop) {
      const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle()

      if (shopError) console.error("Database Error fetching shop:", shopError)
      setShop(shopData)
      currentShop = shopData;
    }

    if (currentShop) {
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*, profiles:student_id(name)')
        .eq('shop_id', currentShop.id)
        .order('created_at', { ascending: false })

      if (ordersData) {
        setActiveOrders(ordersData.filter(o => ['PENDING', 'PAID', 'PRINTING', 'READY'].includes(o.status)))
        setCompletedOrders(ordersData.filter(o => ['COMPLETED', 'CANCELLED'].includes(o.status)))
      }
    }
    
    if (isInitialLoad) setLoading(false)
  }, [router, shop])

  useEffect(() => {
    fetchDashboardData(true);
    const supabase = createClient();
    const channel = supabase.channel('shop-orders-tracker')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
          fetchDashboardData(false);
      }).subscribe();

    const intervalId = setInterval(() => { fetchDashboardData(false); }, 8000);
    return () => { supabase.removeChannel(channel); clearInterval(intervalId); }
  }, [fetchDashboardData])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleToggleStatus = async () => {
    if (!shop) return;
    const newStatus = !shop.is_active;
    setShop({ ...shop, is_active: newStatus }); 
    await toggleShopActiveStatus(shop.id, shop.is_active);
  }

  if (loading) return <LoadingScreen isDark={isDark} />

  return (
    <div className={`min-h-screen font-sans transition-colors duration-500 pb-20 ${
        isDark ? 'bg-[#0A0A0A] text-white selection:bg-white/30' : 'bg-[#faf9f6] text-stone-900 selection:bg-black/20'
    }`}>
      <Toaster /> 
      <NotificationListener />
      <div className="p-6 sm:p-8 max-w-6xl mx-auto space-y-8 relative z-10">
        
        {/* ================= NAVBAR ================= */}
        <div className={`flex justify-between items-center pb-6 relative transition-colors duration-500 border-b ${isDark ? 'border-white/10' : 'border-stone-200/60'}`}>
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/" className="flex items-center gap-3 sm:gap-4 group">
              <img src={isDark ? "/pblackx.png" : "/pwhitex.png"} alt="PrintStack Logo" className="w-9 h-9 sm:w-10 sm:h-10 object-contain" />
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                <span className={`bg-clip-text text-transparent transition-colors duration-300 ${isDark ? 'bg-gradient-to-r from-white to-gray-400' : 'bg-gradient-to-r from-stone-900 to-stone-500'}`}>
                    {shop?.name ? `${shop.name} ` : 'PrintStack '}
                </span>
              </h1>
            </Link>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-5">
            <button onClick={toggleTheme} className={`p-2.5 sm:p-3 rounded-full transition-all duration-300 hover:scale-105 ${isDark ? 'bg-white/5 hover:bg-white/10 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]' : 'bg-white hover:bg-stone-50 text-stone-900 shadow-sm border border-stone-200/50'}`}>
                {isDark ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
            
            <div className="relative block" ref={dropdownRef}>
              
              {/* UPDATED: Profile Picture Icon */}
              <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`w-10 h-10 sm:w-11 sm:h-11 border rounded-full overflow-hidden flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  isDark ? 'border-white/20 bg-[#111111] hover:bg-white/10 text-white' : 'border-stone-300 bg-white hover:bg-stone-100 text-stone-900 shadow-sm'
                }`}
              >
                {userAvatar ? (
                    <img src={userAvatar} alt="Shop Profile" className="w-full h-full object-cover" />
                ) : (
                    shop?.name ? shop.name.charAt(0).toUpperCase() : 'S'
                )}
              </button>

              {/* Dropdown Menu */}
              {isOpen && (
                <div className={`absolute right-0 mt-3 w-56 border rounded-2xl shadow-xl z-50 overflow-hidden transition-colors duration-300 animate-in fade-in slide-in-from-top-2 ${
                  isDark ? 'bg-[#111111] border-white/10 shadow-black' : 'bg-white border-stone-200 shadow-stone-200/50'
                }`}>
                  <div className={`p-2 border-b ${isDark ? 'border-white/10' : 'border-stone-100'}`}>
                    <Link href="/shop/analytics" onClick={() => setIsOpen(false)} className={`flex items-center gap-3 p-3 rounded-xl text-sm font-bold transition-colors ${isDark ? 'hover:bg-white/10 text-white/80 hover:text-white' : 'hover:bg-stone-50 text-stone-700 hover:text-stone-900'}`}>
                      <BarChart3 className="w-4 h-4 opacity-70" /> Analytics
                    </Link>
                    <Link href="/shop/profile" onClick={() => setIsOpen(false)} className={`flex items-center gap-3 p-3 rounded-xl text-sm font-bold transition-colors ${isDark ? 'hover:bg-white/10 text-white/80 hover:text-white' : 'hover:bg-stone-50 text-stone-700 hover:text-stone-900'}`}>
                      <Store className="w-4 h-4 opacity-70" /> Edit Shop Details
                    </Link>
                    <Link href="/shop/pricing" onClick={() => setIsOpen(false)} className={`flex items-center gap-3 p-3 rounded-xl text-sm font-bold transition-colors ${isDark ? 'hover:bg-white/10 text-white/80 hover:text-white' : 'hover:bg-stone-50 text-stone-700 hover:text-stone-900'}`}>
                      <Settings className="w-4 h-4 opacity-70" /> Edit Prices
                    </Link>
                  </div>
                  <div className="p-2">
                    <form action={logoutAction}>
                      <button type="submit" className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm font-bold transition-colors text-left ${isDark ? 'hover:bg-red-500/10 text-red-400 hover:text-red-300' : 'hover:bg-red-50 text-red-600 hover:text-red-700'}`}>
                        <LogOut className="w-4 h-4 opacity-70" /> Log out
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ================= MAIN DASHBOARD CONTENT ================= */}
        {!shop ? (
           <div className={`border rounded-[2rem] sm:rounded-[3rem] p-8 sm:p-16 text-center backdrop-blur-xl max-w-2xl mx-auto mt-12 transition-all duration-500 ${isDark ? 'bg-[#111111]/80 border-white/10 shadow-[0_20px_60px_-15px_rgba(255,255,255,0.05)] ring-1 ring-white/5' : 'bg-white border-stone-200 shadow-2xl shadow-stone-200/50'}`}>
             <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl ${isDark ? 'bg-white/5 text-white/50 ring-1 ring-white/10' : 'bg-stone-100 text-stone-400 ring-1 ring-stone-200'}`}><Store className="w-10 h-10 sm:w-12 sm:h-12" /></div>
             <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-widest mb-4">Profile Incomplete</h2>
             <p className={`mb-8 font-medium ${isDark ? 'text-white/60' : 'text-stone-500'}`}>You must complete your shop profile before you can receive orders.</p>
             <Link href="/shop/profile" className={`inline-flex items-center gap-3 py-4 sm:py-5 px-8 sm:px-10 rounded-[2rem] font-black text-base sm:text-lg tracking-widest uppercase transition-all duration-500 hover:-translate-y-1 ${isDark ? 'bg-white text-black hover:bg-gray-200 shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:shadow-[0_0_60px_rgba(255,255,255,0.25)]' : 'bg-stone-900 text-white hover:bg-black shadow-xl shadow-stone-900/20'}`}>
               <Settings className="w-5 h-5 sm:w-6 sm:h-6" /> Setup Shop Details
             </Link>
           </div>
        ) : (
          <div className="space-y-8 sm:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* ================= STATUS TOGGLE ================= */}
            <div className={`relative overflow-hidden border rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-12 flex flex-col lg:flex-row justify-between items-center gap-6 sm:gap-8 backdrop-blur-xl transition-all duration-500 ${isDark ? 'bg-[#111111]/60 border-white/10 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.5)] ring-1 ring-white/5' : 'bg-white border-stone-200/60 shadow-xl shadow-stone-200/40'}`}>
              {shop.is_active && isDark && <div className="absolute inset-0 bg-green-500/5 blur-3xl rounded-[2.5rem] pointer-events-none" />}
              <div className="text-center lg:text-left z-10 flex-1">
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">Storefront Visibility</h2>
                <p className={`font-medium text-sm sm:text-lg ${isDark ? 'text-white/60' : 'text-stone-500'}`}>
                    {shop.is_active ? "Students can see your shop and place orders." : "Your shop is currently hidden from the map."}
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                  <Link href="/shop/analytics" className={`hidden lg:flex items-center gap-2 px-6 h-[64px] sm:h-[72px] rounded-full font-black text-sm tracking-widest uppercase transition-all duration-300 ${isDark ? 'bg-white/5 border border-white/10 text-white hover:bg-white/10' : 'bg-stone-100 border border-stone-200 text-stone-700 hover:bg-stone-200'}`}>
                      <BarChart3 className="w-5 h-5" /> Analytics
                  </Link>

                  <button 
                    onClick={handleToggleStatus} 
                    className={`relative z-10 w-full sm:w-auto min-w-[280px] sm:min-w-[320px] h-[64px] sm:h-[72px] rounded-full transition-all duration-500 overflow-hidden shrink-0 ${
                        shop.is_active 
                        ? (isDark ? 'bg-green-500/10 border border-green-500/30 ring-1 ring-green-500/20 shadow-[0_0_40px_rgba(34,197,94,0.15)]' : 'bg-green-50 border border-green-200 shadow-inner') 
                        : (isDark ? 'bg-white/5 border border-white/10' : 'bg-stone-100 border border-stone-200')
                    }`}
                  >
                    <div className={`absolute inset-0 w-full flex items-center gap-2 sm:gap-3 text-sm sm:text-base font-black tracking-widest uppercase transition-all duration-500 ${
                        shop.is_active ? 'justify-start pl-6 sm:pl-7 text-green-500' : `justify-end pr-6 sm:pr-7 ${isDark ? 'text-white/40' : 'text-stone-400'}`
                    }`}>
                        {shop.is_active ? <Zap className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" /> : <PauseCircle className="w-4 h-4 sm:w-5 sm:h-5" />}
                        {shop.is_active ? 'LIVE & ACTIVE' : 'PAUSED'}
                    </div>
                    <div className={`absolute top-1/2 -translate-y-1/2 w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all duration-500 shadow-md ${
                        shop.is_active ? 'left-[calc(100%-3.5rem)] sm:left-[calc(100%-4rem)] bg-green-500' : `left-2 ${isDark ? 'bg-white/20 backdrop-blur-md' : 'bg-white border border-stone-200 text-stone-400'}`
                    }`}>
                        <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${shop.is_active ? 'bg-white animate-pulse' : (isDark ? 'bg-white/50' : 'bg-stone-300')}`} />
                    </div>
                  </button>
              </div>
            </div>

            {/* ================= ACTIVE ORDERS SECTION ================= */}
            <div className="pt-4 sm:pt-6">
              <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6 px-2">
                  <div className="flex items-center gap-3 sm:gap-4">
                      <div className="relative flex h-3 w-3 sm:h-4 sm:w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 sm:h-4 sm:w-4 bg-green-500"></span>
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Active Queue</h2>
                  </div>
              </div>
              <div className={`border rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden backdrop-blur-xl transition-all duration-500 ${isDark ? 'bg-[#111111]/80 border-white/10 ring-1 ring-white/5' : 'bg-white border-stone-200/60 shadow-xl shadow-stone-200/30'}`}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px] sm:min-w-[900px]">
                    <thead>
                        <tr className={`border-b text-[10px] uppercase tracking-widest font-black ${isDark ? 'bg-white/5 border-white/10 text-white/50' : 'bg-stone-50 border-stone-200 text-stone-500'}`}>
                        <th className="p-4 sm:p-6 border-r border-inherit w-32 sm:w-40">Time</th>
                        <th className="p-4 sm:p-6 border-r border-inherit">Student</th>
                        <th className="p-4 sm:p-6 border-r border-inherit">Document</th>
                        <th className="p-4 sm:p-6 border-r border-inherit">Specs</th>
                        <th className="p-4 sm:p-6 text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className={`divide-y transition-colors ${isDark ? 'divide-white/10' : 'divide-stone-200'}`}>
                        {activeOrders.length === 0 ? (
                        <tr><td colSpan={5} className={`p-12 sm:p-16 text-center text-xs sm:text-sm font-bold uppercase tracking-widest ${isDark ? 'text-white/30' : 'text-stone-400'}`}>Queue is empty. Waiting for students.</td></tr>
                        ) : (
                        activeOrders.map(order => <OrderRow key={order.id} order={order} isDark={isDark} />)
                        )}
                    </tbody>
                    </table>
                </div>
              </div>
            </div>

            {/* ================= COMPLETED ORDERS SECTION ================= */}
            {completedOrders.length > 0 && (
                <div className="pt-4 sm:pt-6">
                <h2 className={`text-xl sm:text-2xl font-black tracking-tight mb-4 sm:mb-6 px-2 ${isDark ? 'text-white/50' : 'text-stone-400'}`}>Order History</h2>
                <div className={`border rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden backdrop-blur-xl transition-all duration-500 opacity-60 hover:opacity-100 ${isDark ? 'bg-[#111111]/40 border-white/10 ring-1 ring-white/5' : 'bg-stone-50 border-stone-200/60 shadow-sm'}`}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px] sm:min-w-[900px]">
                        <thead>
                            <tr className={`border-b text-[10px] uppercase tracking-widest font-black ${isDark ? 'bg-white/5 border-white/10 text-white/50' : 'bg-stone-100 border-stone-200 text-stone-500'}`}>
                            <th className="p-4 sm:p-6 border-r border-inherit w-32 sm:w-40">Date</th>
                            <th className="p-4 sm:p-6 border-r border-inherit">Student</th>
                            <th className="p-4 sm:p-6 border-r border-inherit">Document</th>
                            <th className="p-4 sm:p-6 border-r border-inherit">Specs</th>
                            <th className="p-4 sm:p-6 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y transition-colors ${isDark ? 'divide-white/10' : 'divide-stone-200'}`}>
                            {completedOrders.map(order => <OrderRow key={order.id} order={order} isDark={isDark} />)}
                        </tbody>
                        </table>
                    </div>
                </div>
                </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}