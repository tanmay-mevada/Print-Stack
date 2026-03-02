'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { logoutAction } from '@/app/(auth)/actions'
import { toggleShopActiveStatus } from '../actions'
import { createClient } from '@/lib/supabase/client'
import OrderRow from '@/components/OrderRow'
import LoadingScreen from '@/components/LoadingScreen'
import { Sun, Moon, LogOut, Store, Settings, Printer, Zap, PauseCircle } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'

export default function ShopDashboardPage() {
  const [isOpen, setIsOpen] = useState(false) 
  const { isDark, toggleTheme } = useTheme()
  const [shop, setShop] = useState<any>(null)
  const [activeOrders, setActiveOrders] = useState<any[]>([])
  const [completedOrders, setCompletedOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Ref for the dropdown menu
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function fetchDashboardData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: shopData } = await supabase.from('shops').select('*').eq('owner_id', user.id).single()
        setShop(shopData)

        if (shopData) {
          const { data: ordersData } = await supabase
            .from('orders')
            .select('*, profiles:student_id(name)')
            .eq('shop_id', shopData.id)
            .order('created_at', { ascending: false })

          if (ordersData) {
            setActiveOrders(ordersData.filter(o => ['PENDING', 'PAID', 'PRINTING', 'READY'].includes(o.status)))
            setCompletedOrders(ordersData.filter(o => ['COMPLETED', 'CANCELLED'].includes(o.status)))
          }
        }
      }
      setLoading(false)
    }
    
    fetchDashboardData()
  }, [])

  // Click Outside Logic
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
        // If the dropdown is open AND the click happened outside the referenced div, close it!
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
            setIsOpen(false) // Fixed to match your state variable name
        }
    }

    // Attach the listener to the whole document
    document.addEventListener("mousedown", handleClickOutside)
    
    // Cleanup the listener when the component unmounts
    return () => {
        document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleToggleStatus = async () => {
    if (!shop) return;
    const newStatus = !shop.is_active;
    setShop({ ...shop, is_active: newStatus }); 
    await toggleShopActiveStatus(shop.id, shop.is_active);
  }

  // Use the premium loading screen instead of plain text!
  if (loading) return <LoadingScreen isDark={isDark} />

  return (
    <div className={`min-h-screen font-sans transition-all duration-700 pb-20 ${
        isDark ? 'bg-[#050505] text-white selection:bg-white/20' : 'bg-[#f4f4f0] text-stone-900 selection:bg-stone-900/20'
    }`}>
      <div className="p-6 sm:p-8 max-w-6xl mx-auto relative">
        
        {/* NAVBAR */}
        <div className={`flex justify-between items-center pb-6 mb-10 relative transition-colors duration-500 border-b ${isDark ? 'border-white/10' : 'border-stone-200/60'}`}>
          <div className="flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-lg transition-colors duration-300 ${isDark ? 'bg-gradient-to-br from-white to-gray-300 text-black' : 'bg-gradient-to-br from-stone-800 to-black text-white'}`}>
                <Printer className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black tracking-tight">
                <span className={`bg-clip-text text-transparent ${isDark ? 'bg-gradient-to-r from-white to-gray-400' : 'bg-gradient-to-r from-stone-900 to-stone-500'}`}>
                    {shop?.name ? `${shop.name} ` : 'PrintStack++ '}
                </span>
                <span className={`hidden sm:inline-block ml-2 text-sm font-bold uppercase tracking-widest px-2 py-1 rounded-md ${isDark ? 'bg-white/10 text-white/60' : 'bg-stone-200/50 text-stone-500'}`}>Workspace</span>
            </h1>
          </div>
          <div className="flex items-center gap-3 sm:gap-5">
            <button onClick={toggleTheme} className={`p-3 rounded-full transition-all duration-300 hover:scale-105 ${isDark ? 'bg-white/5 hover:bg-white/10 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]' : 'bg-white hover:bg-stone-50 text-stone-900 shadow-sm border border-stone-200/50'}`}>
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <form action={logoutAction}>
              <button type="submit" className={`flex items-center gap-2 px-5 py-3 rounded-full text-sm font-bold transition-all duration-300 hover:scale-105 ${isDark ? 'bg-white/5 hover:bg-red-500/20 text-white hover:text-red-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] ring-1 ring-white/10' : 'bg-white hover:bg-red-50 text-stone-900 hover:text-red-600 shadow-sm border border-stone-200/50'}`}>
                <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Log Out</span>
              </button>
            </form>

            {/* RESTORED: Profile Circle & Dropdown WITH REF ATTACHED */}
            <div className="relative hidden sm:block" ref={dropdownRef}>
              <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`w-11 h-11 border rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  isDark 
                  ? 'border-white/20 bg-[#111111] hover:bg-white/10 text-white' 
                  : 'border-stone-300 bg-white hover:bg-stone-100 text-stone-900 shadow-sm'
                }`}
              >
                {shop?.name ? shop.name.charAt(0).toUpperCase() : 'S'}
              </button>

              {isOpen && (
                <div className={`absolute right-0 mt-3 w-56 border rounded-2xl shadow-xl z-50 overflow-hidden transition-colors duration-300 animate-in fade-in slide-in-from-top-2 ${
                  isDark ? 'bg-[#111111] border-white/10 shadow-black' : 'bg-white border-stone-200 shadow-stone-200/50'
                }`}>
                  <div className={`p-2 border-b ${isDark ? 'border-white/10' : 'border-stone-100'}`}>
                    <Link 
                        href="/shop/profile" 
                        onClick={() => setIsOpen(false)} // Closes menu when clicked
                        className={`block p-3 rounded-xl text-sm font-bold transition-colors ${isDark ? 'hover:bg-white/10 text-white/80 hover:text-white' : 'hover:bg-stone-50 text-stone-700 hover:text-stone-900'}`}
                    >
                      Edit Shop Details
                    </Link>
                  </div>
                  <div className="p-2">
                    <Link 
                        href="/shop/pricing" 
                        onClick={() => setIsOpen(false)} // Closes menu when clicked
                        className={`block p-3 rounded-xl text-sm font-bold transition-colors ${isDark ? 'hover:bg-white/10 text-white/80 hover:text-white' : 'hover:bg-stone-50 text-stone-700 hover:text-stone-900'}`}
                    >
                      Edit Prices
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ================= DASHBOARD CONTENT ================= */}
        {!shop ? (
           <div className={`border rounded-[3rem] p-16 text-center backdrop-blur-xl max-w-2xl mx-auto mt-12 transition-all duration-500 ${isDark ? 'bg-[#111111]/80 border-white/10 shadow-[0_20px_60px_-15px_rgba(255,255,255,0.05)] ring-1 ring-white/5' : 'bg-white border-stone-200 shadow-2xl shadow-stone-200/50'}`}>
             <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl ${isDark ? 'bg-white/5 text-white/50 ring-1 ring-white/10' : 'bg-stone-100 text-stone-400 ring-1 ring-stone-200'}`}><Store className="w-12 h-12" /></div>
             <h2 className="text-3xl font-black uppercase tracking-widest mb-4">Profile Incomplete</h2>
             <Link href="/shop/profile" className={`inline-flex items-center gap-3 py-5 px-10 rounded-[2rem] font-black text-lg tracking-widest uppercase transition-all duration-500 hover:-translate-y-1 ${isDark ? 'bg-white text-black hover:bg-gray-200 shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:shadow-[0_0_60px_rgba(255,255,255,0.25)]' : 'bg-stone-900 text-white hover:bg-black shadow-xl shadow-stone-900/20'}`}>
               <Settings className="w-6 h-6" /> Setup Shop Details
             </Link>
           </div>
        ) : (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* STATUS TOGGLE */}
           {/* STATUS TOGGLE */}
            <div className={`relative overflow-hidden border rounded-[2.5rem] p-8 sm:p-12 flex flex-col md:flex-row justify-between items-center gap-8 backdrop-blur-xl transition-all duration-500 ${isDark ? 'bg-[#111111]/60 border-white/10 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.5)] ring-1 ring-white/5' : 'bg-white border-stone-200/60 shadow-xl shadow-stone-200/40'}`}>
              {shop.is_active && isDark && <div className="absolute inset-0 bg-green-500/5 blur-3xl rounded-[2.5rem] pointer-events-none" />}
              <div className="text-center md:text-left z-10">
                <h2 className="text-3xl font-black tracking-tight mb-2">Storefront Visibility</h2>
                <p className={`font-medium text-lg ${isDark ? 'text-white/60' : 'text-stone-500'}`}>
                    {shop.is_active ? "Students can see your shop and place orders." : "Your shop is currently hidden from the map."}
                </p>
              </div>
              
              {/* THE CORRECTED TOGGLE BUTTON */}
              <button 
                  onClick={handleToggleStatus} 
                  className={`relative z-10 w-full md:w-auto min-w-[280px] sm:min-w-[320px] h-[72px] rounded-full transition-all duration-500 overflow-hidden ${
                      shop.is_active 
                      ? (isDark ? 'bg-green-500/10 border border-green-500/30 ring-1 ring-green-500/20 shadow-[0_0_40px_rgba(34,197,94,0.15)]' : 'bg-green-50 border border-green-200 shadow-inner') 
                      : (isDark ? 'bg-white/5 border border-white/10' : 'bg-stone-100 border border-stone-200')
                  }`}
              >
                  {/* The Text Track */}
                  <div className={`absolute inset-0 w-full flex items-center gap-3 font-black tracking-widest uppercase transition-all duration-500 ${
                      shop.is_active 
                      ? 'justify-start pl-7 text-green-500' 
                      : `justify-end pr-7 ${isDark ? 'text-white/40' : 'text-stone-400'}`
                  }`}>
                      {shop.is_active ? <Zap className="w-5 h-5 animate-pulse" /> : <PauseCircle className="w-5 h-5" />}
                      {shop.is_active ? 'LIVE & ACTIVE' : 'PAUSED'}
                  </div>

                  {/* The Moving Circle (Thumb) */}
                  <div className={`absolute top-1/2 -translate-y-1/2 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 shadow-md ${
                      shop.is_active 
                      ? 'left-[calc(100%-4rem)] bg-green-500' 
                      : `left-2 ${isDark ? 'bg-white/20 backdrop-blur-md' : 'bg-white border border-stone-200 text-stone-400'}`
                  }`}>
                      <div className={`w-3 h-3 rounded-full ${shop.is_active ? 'bg-white animate-pulse' : (isDark ? 'bg-white/50' : 'bg-stone-300')}`} />
                  </div>
              </button>

            </div>

            {/* ACTIVE ORDERS SECTION */}
            <div>
              <div className="flex items-center gap-4 mb-6 px-2">
                  <div className="relative flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500"></span>
                  </div>
                  <h2 className="text-3xl font-black tracking-tight">Active Queue</h2>
              </div>
              <div className={`border rounded-[2rem] overflow-hidden backdrop-blur-xl transition-all duration-500 ${isDark ? 'bg-[#111111]/80 border-white/10 ring-1 ring-white/5' : 'bg-white border-stone-200/60 shadow-xl shadow-stone-200/30'}`}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                    <thead>
                        <tr className={`border-b text-[10px] uppercase tracking-widest font-black ${isDark ? 'bg-white/5 border-white/10 text-white/50' : 'bg-stone-50 border-stone-200 text-stone-500'}`}>
                        <th className="p-6 border-r border-inherit w-40">Time</th>
                        <th className="p-6 border-r border-inherit">Student</th>
                        <th className="p-6 border-r border-inherit">Document</th>
                        <th className="p-6 border-r border-inherit">Specs</th>
                        <th className="p-6 text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className={`divide-y transition-colors ${isDark ? 'divide-white/10' : 'divide-stone-200'}`}>
                        {activeOrders.length === 0 ? (
                        <tr><td colSpan={5} className={`p-16 text-center text-sm font-bold uppercase tracking-widest ${isDark ? 'text-white/30' : 'text-stone-400'}`}>Queue is empty. Waiting for students.</td></tr>
                        ) : (
                        activeOrders.map(order => <OrderRow key={order.id} order={order} isDark={isDark} />)
                        )}
                    </tbody>
                    </table>
                </div>
              </div>
            </div>

            {/* COMPLETED ORDERS SECTION */}
            {completedOrders.length > 0 && (
                <div className="pt-8">
                <h2 className={`text-2xl font-black tracking-tight mb-6 px-2 ${isDark ? 'text-white/50' : 'text-stone-400'}`}>Order History</h2>
                <div className={`border rounded-[2rem] overflow-hidden backdrop-blur-xl transition-all duration-500 opacity-60 hover:opacity-100 ${isDark ? 'bg-[#111111]/40 border-white/10 ring-1 ring-white/5' : 'bg-stone-50 border-stone-200/60 shadow-sm'}`}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead>
                            <tr className={`border-b text-[10px] uppercase tracking-widest font-black ${isDark ? 'bg-white/5 border-white/10 text-white/50' : 'bg-stone-100 border-stone-200 text-stone-500'}`}>
                            <th className="p-6 border-r border-inherit w-40">Date</th>
                            <th className="p-6 border-r border-inherit">Student</th>
                            <th className="p-6 border-r border-inherit">Document</th>
                            <th className="p-6 border-r border-inherit">Specs</th>
                            <th className="p-6 text-right">Status</th>
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