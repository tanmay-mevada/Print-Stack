'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { logoutAction } from '@/app/(auth)/actions'
import { toggleShopActiveStatus } from '../actions'
import { createClient } from '@/lib/supabase/client'
import OrderRow from '@/components/OrderRow'
import { Sun, Moon, Printer, LogOut, Store, Settings } from 'lucide-react'

export default function ShopDashboardPage() {
  // --- UI & Theme States ---
  const [isDark, setIsDark] = useState(true)
  const [isOpen, setIsOpen] = useState(false) 
  
  // --- Data States ---
  const [shop, setShop] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // --- Fetch Data on Client ---
  useEffect(() => {
    async function fetchDashboardData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Fetch shop details
        const { data: shopData } = await supabase
          .from('shops')
          .select('*')
          .eq('owner_id', user.id)
          .single()

        setShop(shopData)

        // Fetch orders if shop exists
        if (shopData) {
          const { data: ordersData } = await supabase
            .from('orders')
            .select('*')
            .eq('shop_id', shopData.id)
            .order('created_at', { ascending: false })

          setOrders(ordersData || [])
        }
      }
      setLoading(false)
    }

    fetchDashboardData()
  }, [])

  // --- Handle Status Toggle ---
  const handleToggleStatus = async () => {
    if (!shop) return;
    
    const newStatus = !shop.is_active;
    // Optimistically update the UI instantly
    setShop({ ...shop, is_active: newStatus }); 

    // Trigger the server action to update the DB
    await toggleShopActiveStatus(shop.id, shop.is_active);
  }

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center font-bold tracking-widest uppercase transition-colors duration-500 ${isDark ? 'bg-[#0A0A0A] text-white/50' : 'bg-[#faf9f6] text-stone-400'}`}>
        Loading Workspace...
      </div>
    )
  }

  return (
    <div className={`min-h-screen font-sans transition-colors duration-500 pb-20 ${isDark ? 'bg-[#0A0A0A] text-white' : 'bg-[#faf9f6] text-stone-900'}`}>
      <div className="p-6 sm:p-8 max-w-7xl mx-auto">
        
        {/* ================= NAVBAR (COMBINED) ================= */}
        <div className={`flex justify-between items-center border-b pb-6 mb-10 relative transition-colors duration-500 ${isDark ? 'border-white/10' : 'border-stone-200'}`}>
          
          {/* Left: Logo & Name */}
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-sm transition-colors duration-300 ${isDark ? 'bg-white' : 'bg-stone-900'}`}>
                <Printer className={`w-5 h-5 ${isDark ? 'text-black' : 'text-white'}`} />
            </div>
            <h1 className={`text-2xl font-black tracking-tight transition-colors ${isDark ? 'text-white' : 'text-stone-900'}`}>
              {shop?.name ? `${shop.name} ` : 'PrintStack++ '}
              <span className={isDark ? 'text-white/40' : 'text-stone-400'}>Workspace</span>
            </h1>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-4">
            
            {/* Theme Toggle Button */}
            <button 
                type="button"
                onClick={() => setIsDark(!isDark)}
                className={`p-2.5 rounded-full transition-all duration-300 ${isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-black/5 hover:bg-black/10 text-stone-900'}`}
                aria-label="Toggle Theme"
            >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Combined Logout Button */}
            <form action={logoutAction}>
              <button 
                type="submit"
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 border ${
                  isDark 
                  ? 'border-white/20 bg-transparent hover:bg-white/10 text-white' 
                  : 'border-stone-300 bg-white hover:bg-stone-100 text-stone-900 shadow-sm'
                }`}
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Log Out</span>
              </button>
            </form>

            {/* Profile Circle */}
            <div className="relative hidden sm:block">
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

              {/* Dropdown Menu */}
              {isOpen && (
                <div className={`absolute right-0 mt-3 w-56 border rounded-2xl shadow-xl z-50 overflow-hidden transition-colors duration-300 ${
                  isDark ? 'bg-[#111111] border-white/10 shadow-black' : 'bg-white border-stone-200 shadow-stone-200/50'
                }`}>
                  <div className={`p-2 border-b ${isDark ? 'border-white/10' : 'border-stone-100'}`}>
                    <Link href="/shop/profile" className={`block p-3 rounded-xl text-sm font-bold transition-colors ${isDark ? 'hover:bg-white/10 text-white/80 hover:text-white' : 'hover:bg-stone-50 text-stone-700 hover:text-stone-900'}`}>
                      Edit Shop Details
                    </Link>
                  </div>
                  <div className="p-2">
                    <Link href="/shop/pricing" className={`block p-3 rounded-xl text-sm font-bold transition-colors ${isDark ? 'hover:bg-white/10 text-white/80 hover:text-white' : 'hover:bg-stone-50 text-stone-700 hover:text-stone-900'}`}>
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
          <div className={`border rounded-[2.5rem] p-16 text-center transition-colors duration-500 max-w-2xl mx-auto mt-12 shadow-sm ${isDark ? 'border-white/10 bg-[#111111]' : 'border-stone-200 bg-white'}`}>
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${isDark ? 'bg-white/5 text-white/50' : 'bg-stone-100 text-stone-400'}`}>
                <Store className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-widest mb-4">Profile Incomplete</h2>
            <p className={`mb-10 font-medium ${isDark ? 'text-white/60' : 'text-stone-500'}`}>
                Your shop is currently hidden from students. Please set up your location and operating details to go live.
            </p>
            <Link href="/shop/profile" className={`inline-flex items-center gap-2 p-4 px-8 rounded-xl font-bold uppercase tracking-widest transition-all duration-300 ${isDark ? 'bg-white text-black hover:bg-gray-200 shadow-[0_0_20px_rgba(255,255,255,0.1)]' : 'bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/20'}`}>
              <Settings className="w-5 h-5" /> Setup Shop Details
            </Link>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Active Status Toggle Area */}
            <div className={`border rounded-[2rem] p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 transition-colors duration-500 ${isDark ? 'bg-[#111111] border-white/10' : 'bg-white border-stone-200 shadow-sm'}`}>
              <div>
                <h2 className="text-xl font-black uppercase tracking-wider mb-2">Storefront Visibility</h2>
                <p className={`font-medium text-sm ${isDark ? 'text-white/60' : 'text-stone-500'}`}>
                  {shop.is_active 
                    ? "Your shop is LIVE on the map. Students can send orders." 
                    : "Your shop is HIDDEN. You are not receiving new orders."}
                </p>
              </div>
              
              <button 
                onClick={handleToggleStatus}
                className={`px-8 py-4 w-full sm:w-auto rounded-xl font-black tracking-widest uppercase transition-all duration-300 border ${
                  shop.is_active 
                  ? (isDark ? 'bg-white border-transparent text-black hover:bg-gray-200 shadow-[0_0_20px_rgba(255,255,255,0.1)]' : 'bg-stone-900 border-transparent text-white hover:bg-stone-800 shadow-lg shadow-stone-900/20')
                  : (isDark ? 'bg-transparent border-white/20 text-white/50 hover:bg-white/5 hover:text-white' : 'bg-transparent border-stone-300 text-stone-500 hover:bg-stone-50 hover:text-stone-900')
                }`}
              >
                {shop.is_active ? '● ACCEPTING ORDERS' : '○ PAUSED'}
              </button>
            </div>

            {/* Orders Table Container */}
            <div>
              <h2 className="text-2xl font-black mb-6 uppercase tracking-wider">Order Queue</h2>
              
              <div className={`border rounded-[2rem] overflow-hidden transition-colors duration-500 shadow-sm ${isDark ? 'border-white/10 bg-[#111111]' : 'border-stone-200 bg-white'}`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[1000px]">
                    
                    <thead>
                      <tr className={`border-b text-xs uppercase tracking-widest font-black ${isDark ? 'bg-white/5 border-white/10 text-white/60' : 'bg-stone-50 border-stone-200 text-stone-500'}`}>
                        <th className={`p-6 border-r w-24 ${isDark ? 'border-white/10' : 'border-stone-200'}`}>Order ID</th>
                        <th className={`p-6 border-r w-32 ${isDark ? 'border-white/10' : 'border-stone-200'}`}>Date</th>
                        <th className={`p-6 border-r ${isDark ? 'border-white/10' : 'border-stone-200'}`}>Print Details</th>
                        <th className={`p-6 border-r w-32 ${isDark ? 'border-white/10' : 'border-stone-200'}`}>Total</th>
                        <th className={`p-6 border-r w-48 ${isDark ? 'border-white/10' : 'border-stone-200'}`}>Document</th>
                        <th className="p-6 w-56">Status Update</th>
                      </tr>
                    </thead>
                    
                    <tbody className="divide-y divide-white/5">
                      {!orders || orders.length === 0 ? (
                        <tr>
                          <td colSpan={6} className={`p-16 text-center text-sm font-bold uppercase tracking-widest ${isDark ? 'text-white/30' : 'text-stone-400'}`}>
                            Your order queue is currently empty.
                          </td>
                        </tr>
                      ) : (
                        orders.map((order: any) => (
                          /* Note: You may need to pass isDark to OrderRow if it has hardcoded backgrounds */
                          <OrderRow key={order.id} order={order} /> 
                        ))
                      )}
                    </tbody>

                  </table>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}