'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { logoutAction } from '@/app/(auth)/actions'
import { toggleShopActiveStatus } from '../actions'
import { createClient } from '@/lib/supabase/client'
import OrderRow from '@/components/OrderRow'
import { Sun, Moon, LogOut, Store, Settings, Printer } from 'lucide-react'

export default function ShopDashboardPage() {
  const [isDark, setIsDark] = useState(false)
  const [isOpen, setIsOpen] = useState(false) 
  
  const [shop, setShop] = useState<any>(null)
  const [activeOrders, setActiveOrders] = useState<any[]>([])
  const [completedOrders, setCompletedOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDashboardData = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data: shopData } = await supabase.from('shops').select('*').eq('owner_id', user.id).single()
      setShop(shopData)

      if (shopData) {
        // Fetch orders AND join the profiles table to get the student's name
        const { data: ordersData } = await supabase
          .from('orders')
          .select('*, profiles:student_id(name)')
          .eq('shop_id', shopData.id)
          .order('created_at', { ascending: false })

        if (ordersData) {
          // Split orders based on status
          setActiveOrders(ordersData.filter(o => ['PAID', 'PRINTING', 'READY'].includes(o.status)))
          setCompletedOrders(ordersData.filter(o => ['COMPLETED', 'CANCELLED'].includes(o.status)))
        }
      }
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const handleToggleStatus = async () => {
    if (!shop) return;
    const newStatus = !shop.is_active;
    setShop({ ...shop, is_active: newStatus }); 
    await toggleShopActiveStatus(shop.id, shop.is_active);
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold tracking-widest uppercase bg-[#faf9f6] text-stone-400">Loading Workspace...</div>

  return (
    <div className={`min-h-screen font-sans transition-colors duration-500 pb-20 ${isDark ? 'bg-[#0A0A0A] text-white' : 'bg-[#faf9f6] text-stone-900'}`}>
      <div className="p-6 sm:p-8 max-w-6xl mx-auto">
        
        {/* Navbar */}
        <div className={`flex justify-between items-center border-b pb-6 mb-10 relative transition-colors duration-500 ${isDark ? 'border-white/10' : 'border-stone-200'}`}>
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-sm ${isDark ? 'bg-white' : 'bg-stone-900'}`}>
                <Printer className={`w-5 h-5 ${isDark ? 'text-black' : 'text-white'}`} />
            </div>
            <h1 className="text-2xl font-black tracking-tight">{shop?.name ? `${shop.name} ` : 'PrintStack '} <span className="text-stone-400">Workspace</span></h1>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsDark(!isDark)} className="p-2.5 rounded-full bg-black/5 hover:bg-black/10 text-stone-900">
                {isDark ? <Sun className="w-5 h-5 text-white" /> : <Moon className="w-5 h-5" />}
            </button>
            <form action={logoutAction}>
              <button type="submit" className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold border border-stone-300 bg-white text-stone-900">
                <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Log Out</span>
              </button>
            </form>
          </div>
        </div>

        {!shop ? (
           <div className="border border-stone-200 rounded-[2.5rem] p-16 text-center bg-white max-w-2xl mx-auto mt-12 shadow-sm">
             <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 bg-stone-100 text-stone-400"><Store className="w-10 h-10" /></div>
             <h2 className="text-2xl font-black uppercase tracking-widest mb-4">Profile Incomplete</h2>
             <Link href="/shop/profile" className="inline-flex items-center gap-2 p-4 px-8 rounded-xl font-bold uppercase tracking-widest bg-stone-900 text-white">
               <Settings className="w-5 h-5" /> Setup Shop Details
             </Link>
           </div>
        ) : (
          <div className="space-y-12">
            
            {/* Storefront Status Toggle */}
            <div className={`border rounded-[2rem] p-8 flex flex-col sm:flex-row justify-between items-center gap-6 shadow-sm ${isDark ? 'bg-[#111111] border-white/10' : 'bg-white border-stone-200'}`}>
              <div>
                <h2 className="text-xl font-black uppercase tracking-wider mb-2">Storefront Visibility</h2>
                <p className="font-medium text-sm text-stone-500">{shop.is_active ? "LIVE on the map. Accepting orders." : "HIDDEN. Paused."}</p>
              </div>
              <button onClick={handleToggleStatus} className={`px-8 py-4 rounded-xl font-black tracking-widest uppercase transition-all duration-300 border ${shop.is_active ? 'bg-stone-900 text-white' : 'bg-transparent border-stone-300 text-stone-500'}`}>
                {shop.is_active ? '● ACCEPTING ORDERS' : '○ PAUSED'}
              </button>
            </div>

            {/* ACTIVE ORDERS SECTION */}
            <div>
              <h2 className="text-2xl font-black mb-6 uppercase tracking-wider flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></span> Active Queue
              </h2>
              <div className={`border overflow-hidden shadow-sm ${isDark ? 'border-white/10 bg-[#111111]' : 'border-stone-200 bg-white'}`}>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`border-b text-xs uppercase tracking-widest font-black ${isDark ? 'bg-white/5 border-white/10' : 'bg-stone-50 border-stone-200'}`}>
                      <th className="p-4 border-r">Time</th>
                      <th className="p-4 border-r">Student Name</th>
                      <th className="p-4 border-r">File Name</th>
                      <th className="p-4 border-r">Details</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {activeOrders.length === 0 ? (
                      <tr><td colSpan={5} className="p-12 text-center text-sm font-bold uppercase tracking-widest text-stone-400">Queue is empty.</td></tr>
                    ) : (
                      activeOrders.map(order => <OrderRow key={order.id} order={order} onStatusChange={fetchDashboardData} />)
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* COMPLETED ORDERS SECTION */}
            <div>
              <h2 className="text-xl font-black mb-6 uppercase tracking-wider text-stone-400">Order History</h2>
              <div className={`border overflow-hidden shadow-sm opacity-80 ${isDark ? 'border-white/10 bg-[#111111]' : 'border-stone-200 bg-white'}`}>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b text-xs uppercase tracking-widest font-black bg-stone-50 border-stone-200 text-stone-500">
                      <th className="p-4 border-r">Date</th>
                      <th className="p-4 border-r">Student Name</th>
                      <th className="p-4 border-r">File Name</th>
                      <th className="p-4 border-r">Details</th>
                      <th className="p-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {completedOrders.length === 0 ? (
                      <tr><td colSpan={5} className="p-8 text-center text-sm font-bold uppercase tracking-widest text-stone-400">No completed orders yet.</td></tr>
                    ) : (
                      completedOrders.map(order => <OrderRow key={order.id} order={order} onStatusChange={fetchDashboardData} />)
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}