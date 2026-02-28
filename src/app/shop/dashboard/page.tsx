'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { logoutAction } from '@/app/(auth)/actions' // Only importing logoutAction now
import { createClient } from '@/lib/supabase/client'
import { Sun, Moon, Printer, LogOut } from 'lucide-react'

export default function ShopDashboardPage() {
  // --- UI States ---
  const [isDark, setIsDark] = useState(true)
  const [isOpen, setIsOpen] = useState(false) // Profile dropdown
  
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

  // --- Handle Status Toggle Directly Here ---
  const handleToggleStatus = async () => {
    if (!shop) return;
    
    const newStatus = !shop.is_active;
    // Optimistically update the UI instantly
    setShop({ ...shop, is_active: newStatus }); 

    const supabase = createClient();
    const { error } = await supabase
      .from('shops')
      .update({ is_active: newStatus })
      .eq('id', shop.id);

    if (error) {
      console.error("Failed to update status:", error);
      // Revert if it fails
      setShop({ ...shop, is_active: !newStatus }); 
    }
  }

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center font-bold transition-colors duration-500 ${isDark ? 'bg-[#0A0A0A] text-white' : 'bg-[#faf9f6] text-stone-900'}`}>
        Loading Dashboard...
      </div>
    )
  }

  return (
    <div className={`min-h-screen font-sans transition-colors duration-500 ${isDark ? 'bg-[#0A0A0A] text-white' : 'bg-[#faf9f6] text-stone-900'}`}>
      <div className="p-8 max-w-7xl mx-auto">
        
        {/* ================= NAVBAR (COMBINED) ================= */}
        <div className={`flex justify-between items-center border-b pb-6 mb-8 relative transition-colors duration-500 ${isDark ? 'border-white/10' : 'border-stone-200'}`}>
          
          {/* Left: Logo & Name */}
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-sm transition-colors duration-300 ${isDark ? 'bg-white' : 'bg-stone-900'}`}>
                <Printer className={`w-5 h-5 ${isDark ? 'text-black' : 'text-white'}`} />
            </div>
            <h1 className={`text-2xl font-black tracking-tight transition-colors ${isDark ? 'text-white' : 'text-stone-900'}`}>
              {shop?.name ? `${shop.name} ` : 'Shop Dashboard'}
              {shop?.name && <span className={isDark ? 'text-white/40' : 'text-stone-400'}>Dashboard</span>}
            </h1>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-6">
            
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
            <div className="relative">
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
                <div className={`absolute right-0 mt-3 w-48 border rounded-2xl shadow-xl z-50 overflow-hidden transition-colors duration-300 ${
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
          <div className={`border rounded-3xl p-12 text-center transition-colors ${isDark ? 'border-white/10 bg-[#111111]' : 'border-stone-200 bg-white shadow-sm'}`}>
            <p className={`mb-6 text-lg font-medium ${isDark ? 'text-white/60' : 'text-stone-600'}`}>Your shop profile is incomplete. Students cannot find you.</p>
            <Link href="/shop/profile" className={`inline-block p-4 px-8 rounded-xl font-bold transition-all ${isDark ? 'bg-white text-black hover:bg-gray-200' : 'bg-stone-900 text-white hover:bg-stone-800'}`}>
              Setup Shop Details Now
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* Active Status Toggle Area */}
            <div className={`border rounded-[2rem] p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 transition-colors duration-500 ${isDark ? 'bg-[#111111] border-white/10' : 'bg-white border-stone-200 shadow-sm'}`}>
              <div>
                <h2 className="text-2xl font-black mb-2">Shop Status</h2>
                <p className={`font-medium ${isDark ? 'text-white/60' : 'text-stone-500'}`}>
                  {shop.is_active 
                    ? "You are currently visible to students and accepting orders." 
                    : "You are currently hidden and not accepting orders."}
                </p>
              </div>
              
              <button 
                onClick={handleToggleStatus}
                className={`px-8 py-4 rounded-xl font-black tracking-wide transition-all duration-300 border ${
                  shop.is_active 
                  ? (isDark ? 'bg-white border-transparent text-black hover:bg-gray-200 shadow-[0_0_20px_rgba(255,255,255,0.1)]' : 'bg-stone-900 border-transparent text-white hover:bg-stone-800 shadow-lg shadow-stone-900/20')
                  : (isDark ? 'bg-transparent border-white/20 text-white/50 hover:bg-white/5 hover:text-white' : 'bg-transparent border-stone-300 text-stone-500 hover:bg-stone-50 hover:text-stone-900')
                }`}
              >
                {shop.is_active ? 'ACTIVE' : 'INACTIVE'}
              </button>
            </div>

            {/* Orders Table */}
            <div>
              <h2 className="text-2xl font-black mb-6">Incoming Orders</h2>
              <div className={`border rounded-[2rem] overflow-hidden transition-colors duration-500 ${isDark ? 'border-white/10 bg-[#111111]' : 'border-stone-200 bg-white shadow-sm'}`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className={`border-b ${isDark ? 'bg-white/5 border-white/10 text-white/60' : 'bg-stone-50 border-stone-200 text-stone-500'}`}>
                        <th className={`p-5 font-bold uppercase tracking-wider text-xs border-r ${isDark ? 'border-white/10' : 'border-stone-200'}`}>Order ID</th>
                        <th className={`p-5 font-bold uppercase tracking-wider text-xs border-r ${isDark ? 'border-white/10' : 'border-stone-200'}`}>Date</th>
                        <th className={`p-5 font-bold uppercase tracking-wider text-xs border-r ${isDark ? 'border-white/10' : 'border-stone-200'}`}>Pages</th>
                        <th className={`p-5 font-bold uppercase tracking-wider text-xs border-r ${isDark ? 'border-white/10' : 'border-stone-200'}`}>Total (₹)</th>
                        <th className="p-5 font-bold uppercase tracking-wider text-xs">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.length === 0 ? (
                        <tr>
                          <td colSpan={5} className={`p-8 text-center font-medium ${isDark ? 'text-white/40' : 'text-stone-500'}`}>
                            No orders yet. Turn your shop ACTIVE to start receiving requests.
                          </td>
                        </tr>
                      ) : (
                        orders.map((order: any) => (
                          <tr key={order.id} className={`border-b last:border-0 transition-colors ${isDark ? 'border-white/10 hover:bg-white/5' : 'border-stone-100 hover:bg-stone-50'}`}>
                            <td className={`p-5 border-r text-sm font-bold ${isDark ? 'border-white/10 text-white/80' : 'border-stone-200 text-stone-700'}`}>{order.id.split('-')[0]}...</td>
                            <td className={`p-5 border-r font-medium ${isDark ? 'border-white/10 text-white/60' : 'border-stone-200 text-stone-600'}`}>{new Date(order.created_at).toLocaleDateString()}</td>
                            <td className={`p-5 border-r font-medium ${isDark ? 'border-white/10 text-white/60' : 'border-stone-200 text-stone-600'}`}>{order.total_pages} ({order.print_type})</td>
                            <td className={`p-5 border-r font-black ${isDark ? 'border-white/10 text-white' : 'border-stone-200 text-stone-900'}`}>₹{order.total_price}</td>
                            <td className="p-5">
                              <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border ${isDark ? 'bg-white/5 border-white/10 text-white/80' : 'bg-stone-50 border-stone-200 text-stone-700'}`}>{order.status}</span>
                            </td>
                          </tr>
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