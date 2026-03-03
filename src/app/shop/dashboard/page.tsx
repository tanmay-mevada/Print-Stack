'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { logoutAction } from '@/app/(auth)/actions'
import { toggleShopActiveStatus } from '../actions'
import { createClient } from '@/lib/supabase/client'
import OrderRow from '@/components/OrderRow'
import LoadingScreen from '@/components/LoadingScreen'
import { 
  Sun, Moon, LogOut, Store, Settings, Printer, Zap, PauseCircle,
  TrendingUp, IndianRupee, FileText, Layers, BarChart3, Calendar, Activity
} from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'

type TimeFilter = 'today' | 'week' | 'month' | 'all'

export default function ShopDashboardPage() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false) 
  const { isDark, toggleTheme } = useTheme()
  const [shop, setShop] = useState<any>(null)
  
  // Order States
  const [allOrders, setAllOrders] = useState<any[]>([]) // Kept for analytics calculation
  const [activeOrders, setActiveOrders] = useState<any[]>([])
  const [completedOrders, setCompletedOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Analytics Filter State
  const [filter, setFilter] = useState<TimeFilter>('week')

  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function fetchDashboardData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return 
      }

      const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle()

      if (shopError) console.error("Database Error fetching shop:", shopError)

      setShop(shopData)

      if (shopData) {
        const { data: ordersData } = await supabase
          .from('orders')
          .select('*, profiles:student_id(name)')
          .eq('shop_id', shopData.id)
          .order('created_at', { ascending: false })

        if (ordersData) {
          setAllOrders(ordersData) // Store all orders for analytics
          setActiveOrders(ordersData.filter(o => ['PENDING', 'PAID', 'PRINTING', 'READY'].includes(o.status)))
          setCompletedOrders(ordersData.filter(o => ['COMPLETED', 'CANCELLED'].includes(o.status)))
        }
      }
      
      setLoading(false)
    }
    
    fetchDashboardData()
  }, [router])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
            setIsOpen(false)
        }
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

  // ================= ANALYTICS LOGIC =================
  // ================= ANALYTICS LOGIC =================
  const filteredAnalyticsOrders = useMemo(() => {
    const now = new Date()
    // Only count paid/successful orders towards revenue & print counts
    const validOrders = allOrders.filter(o => ['PAID', 'PRINTING', 'READY', 'COMPLETED'].includes(o.status))

    return validOrders.filter(order => {
      const orderDate = new Date(order.created_at)
      if (filter === 'today') return orderDate.toDateString() === now.toDateString()
      if (filter === 'week') {
        const weekAgo = new Date()
        weekAgo.setDate(now.getDate() - 7)
        return orderDate >= weekAgo
      }
      if (filter === 'month') {
        const monthAgo = new Date()
        monthAgo.setMonth(now.getMonth() - 1)
        return orderDate >= monthAgo
      }
      return true // 'all'
    })
  }, [allOrders, filter])

  const stats = useMemo(() => {
    let totalRevenue = 0
    let totalPagesPrinted = 0
    let colorCount = 0
    let bwCount = 0

    filteredAnalyticsOrders.forEach(order => {
      // 1. Mapped exactly to your schema: total_price
      const orderRevenue = Number(order.total_price || 0)
      totalRevenue += orderRevenue
      
      // 2. Mapped exactly to your schema: total_pages and copies
      const pages = Number(order.total_pages || 1)
      const copies = Number(order.copies || 1)
      
      // 3. Mapped exactly to your schema: print_type
      // Normalizing to uppercase to catch 'Color', 'color', or 'COLOR'
      const isColor = String(order.print_type).toUpperCase() === 'COLOR'

      const orderTotalPages = pages * copies
      totalPagesPrinted += orderTotalPages

      if (isColor) colorCount += orderTotalPages
      else bwCount += orderTotalPages
    })

    return {
      revenue: totalRevenue,
      orders: filteredAnalyticsOrders.length,
      aov: filteredAnalyticsOrders.length > 0 ? (totalRevenue / filteredAnalyticsOrders.length) : 0,
      pages: totalPagesPrinted,
      color: colorCount,
      bw: bwCount,
      colorPercentage: totalPagesPrinted > 0 ? Math.round((colorCount / totalPagesPrinted) * 100) : 0,
      bwPercentage: totalPagesPrinted > 0 ? Math.round((bwCount / totalPagesPrinted) * 100) : 0,
    }
  }, [filteredAnalyticsOrders])

  const chartData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const last7Days = Array.from({length: 7}, (_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - (6 - i))
        return { name: days[d.getDay()], date: d.toDateString(), revenue: 0 }
    })

    filteredAnalyticsOrders.forEach(order => {
        const orderDate = new Date(order.created_at).toDateString()
        const dayIndex = last7Days.findIndex(d => d.date === orderDate)
        if(dayIndex !== -1) {
            // Mapped exactly to your schema: total_price
            const orderRevenue = Number(order.total_price || 0)
            last7Days[dayIndex].revenue += orderRevenue
        }
    })

    const maxRev = Math.max(...last7Days.map(d => d.revenue), 1) 
    return last7Days.map(d => ({ ...d, height: (d.revenue / maxRev) * 100 }))
  }, [filteredAnalyticsOrders])
  if (loading) return <LoadingScreen isDark={isDark} />

  return (
    <div className={`min-h-screen font-sans transition-colors duration-500 ${
        isDark ? 'bg-[#0A0A0A] text-white selection:bg-white/30 selection:text-white' : 'bg-[#faf9f6] text-stone-900 selection:bg-black/20 selection:text-black'
    }`}>
      <div className="p-6 sm:p-8 max-w-6xl mx-auto relative z-10">
        
        {/* ================= NAVBAR ================= */}
        <div className={`flex justify-between items-center pb-6 mb-8 relative transition-colors duration-500 border-b ${isDark ? 'border-white/10' : 'border-stone-200/60'}`}>
          <div className="flex items-center gap-3 sm:gap-4">
            <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shadow-lg transition-colors duration-300 ${isDark ? 'bg-gradient-to-br from-white to-gray-300 text-black' : 'bg-gradient-to-br from-stone-800 to-black text-white'}`}>
                <Printer className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                <span className={`bg-clip-text text-transparent ${isDark ? 'bg-gradient-to-r from-white to-gray-400' : 'bg-gradient-to-r from-stone-900 to-stone-500'}`}>
                    {shop?.name ? `${shop.name} ` : 'PrintStack '}
                </span>
                <span className={`hidden sm:inline-block ml-2 text-sm font-bold uppercase tracking-widest px-2 py-1 rounded-md ${isDark ? 'bg-white/10 text-white/60' : 'bg-stone-200/50 text-stone-500'}`}>Workspace</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-5">
            <button onClick={toggleTheme} className={`p-2.5 sm:p-3 rounded-full transition-all duration-300 hover:scale-105 ${isDark ? 'bg-white/5 hover:bg-white/10 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]' : 'bg-white hover:bg-stone-50 text-stone-900 shadow-sm border border-stone-200/50'}`}>
                {isDark ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
            
            <form action={logoutAction}>
              <button type="submit" className={`flex items-center gap-2 px-3 sm:px-5 py-2.5 sm:py-3 rounded-full text-sm font-bold transition-all duration-300 hover:scale-105 ${isDark ? 'bg-white/5 hover:bg-red-500/20 text-white hover:text-red-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] ring-1 ring-white/10' : 'bg-white hover:bg-red-50 text-stone-900 hover:text-red-600 shadow-sm border border-stone-200/50'}`}>
                <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Log Out</span>
              </button>
            </form>

            <div className="relative block" ref={dropdownRef}>
              <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`w-10 h-10 sm:w-11 sm:h-11 border rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  isDark ? 'border-white/20 bg-[#111111] hover:bg-white/10 text-white' : 'border-stone-300 bg-white hover:bg-stone-100 text-stone-900 shadow-sm'
                }`}
              >
                {shop?.name ? shop.name.charAt(0).toUpperCase() : 'S'}
              </button>

              {/* Dropdown Menu */}
              {isOpen && (
                <div className={`absolute right-0 mt-3 w-56 border rounded-2xl shadow-xl z-50 overflow-hidden transition-colors duration-300 animate-in fade-in slide-in-from-top-2 ${
                  isDark ? 'bg-[#111111] border-white/10 shadow-black' : 'bg-white border-stone-200 shadow-stone-200/50'
                }`}>
                  <div className={`p-2 border-b ${isDark ? 'border-white/10' : 'border-stone-100'}`}>
                    <Link 
                        href="/shop/profile" 
                        onClick={() => setIsOpen(false)}
                        className={`block p-3 rounded-xl text-sm font-bold transition-colors ${isDark ? 'hover:bg-white/10 text-white/80 hover:text-white' : 'hover:bg-stone-50 text-stone-700 hover:text-stone-900'}`}
                    >
                      Edit Shop Details
                    </Link>
                    <Link 
                        href="/shop/pricing" 
                        onClick={() => setIsOpen(false)}
                        className={`block p-3 rounded-xl text-sm font-bold transition-colors ${isDark ? 'hover:bg-white/10 text-white/80 hover:text-white' : 'hover:bg-stone-50 text-stone-700 hover:text-stone-900'}`}
                    >
                      Edit Prices
                    </Link>
                  </div>
                  <div className="p-2">
                    <form action={logoutAction}>
                      <button type="submit" className={`w-full flex items-center gap-2 p-3 rounded-xl text-sm font-bold transition-colors text-left ${isDark ? 'hover:bg-red-500/10 text-red-400 hover:text-red-300' : 'hover:bg-red-50 text-red-600 hover:text-red-700'}`}>
                        <LogOut className="w-4 h-4" /> Log out
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ================= MAIN DASHBOARD CONTENT ================= */}
      {/* pt-28 ensures the content is pushed down below the fixed navbar */}
      <div className="p-6 sm:p-8 pt-28 sm:pt-32 max-w-6xl mx-auto relative pb-20">
        
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
              <div className="text-center lg:text-left z-10">
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">Storefront Visibility</h2>
                <p className={`font-medium text-sm sm:text-lg ${isDark ? 'text-white/60' : 'text-stone-500'}`}>
                    {shop.is_active ? "Students can see your shop and place orders." : "Your shop is currently hidden from the map."}
                </p>
              </div>
              
              <button 
                  onClick={handleToggleStatus} 
                  className={`relative z-10 w-full lg:w-auto min-w-[280px] sm:min-w-[320px] h-[64px] sm:h-[72px] rounded-full transition-all duration-500 overflow-hidden ${
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

            {/* ================= INJECTED ANALYTICS DASHBOARD ================= */}
           
            {/* ================= ACTIVE ORDERS SECTION ================= */}
            <div className="pt-4 sm:pt-6">
              <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6 px-2">
                  <div className="relative flex h-3 w-3 sm:h-4 sm:w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 sm:h-4 sm:w-4 bg-green-500"></span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Active Queue</h2>
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

         <div className="lg:pt-20 pt-12">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 px-2">
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3">
                        <BarChart3 className={isDark ? 'text-indigo-400' : 'text-indigo-600'} /> 
                        Performance Overview
                    </h2>
                    {/* TIME FILTERS */}
                    <div className={`flex items-center p-1.5 rounded-full border backdrop-blur-xl ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-stone-200 shadow-sm'}`}>
                        {(['today', 'week', 'month', 'all'] as TimeFilter[]).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 sm:px-6 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all duration-300 ${
                            filter === f 
                            ? (isDark ? 'bg-white text-black shadow-lg' : 'bg-stone-900 text-white shadow-md')
                            : (isDark ? 'text-white/50 hover:text-white hover:bg-white/10' : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100')
                            }`}
                        >
                            {f}
                        </button>
                        ))}
                    </div>
                </div>

                {/* KPI CARDS */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
                    <div className={`p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border relative overflow-hidden transition-all duration-500 hover:-translate-y-1 ${isDark ? 'bg-[#111111]/80 border-white/10 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)]' : 'bg-white border-stone-200 shadow-lg shadow-stone-200/50'}`}>
                        <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20 ${isDark ? 'bg-green-500' : 'bg-green-400'}`} />
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-3 sm:mb-4 ${isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-50 text-green-600'}`}>
                            <IndianRupee className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <p className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1 ${isDark ? 'text-white/50' : 'text-stone-500'}`}>Revenue</p>
                        <h3 className="text-2xl sm:text-3xl font-black tracking-tight">₹{stats.revenue.toFixed(2)}</h3>
                    </div>

                    <div className={`p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border relative overflow-hidden transition-all duration-500 hover:-translate-y-1 ${isDark ? 'bg-[#111111]/80 border-white/10 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)]' : 'bg-white border-stone-200 shadow-lg shadow-stone-200/50'}`}>
                        <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20 ${isDark ? 'bg-blue-500' : 'bg-blue-400'}`} />
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-3 sm:mb-4 ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                            <Activity className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <p className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1 ${isDark ? 'text-white/50' : 'text-stone-500'}`}>Orders</p>
                        <h3 className="text-2xl sm:text-3xl font-black tracking-tight">{stats.orders}</h3>
                    </div>

                    <div className={`p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border relative overflow-hidden transition-all duration-500 hover:-translate-y-1 ${isDark ? 'bg-[#111111]/80 border-white/10 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)]' : 'bg-white border-stone-200 shadow-lg shadow-stone-200/50'}`}>
                        <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20 ${isDark ? 'bg-purple-500' : 'bg-purple-400'}`} />
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-3 sm:mb-4 ${isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-50 text-purple-600'}`}>
                            <Layers className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <p className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1 ${isDark ? 'text-white/50' : 'text-stone-500'}`}>Pages</p>
                        <h3 className="text-2xl sm:text-3xl font-black tracking-tight">{stats.pages}</h3>
                    </div>

                    <div className={`p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border relative overflow-hidden transition-all duration-500 hover:-translate-y-1 ${isDark ? 'bg-[#111111]/80 border-white/10 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)]' : 'bg-white border-stone-200 shadow-lg shadow-stone-200/50'}`}>
                        <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20 ${isDark ? 'bg-orange-500' : 'bg-orange-400'}`} />
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-3 sm:mb-4 ${isDark ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-50 text-orange-600'}`}>
                            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <p className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1 ${isDark ? 'text-white/50' : 'text-stone-500'}`}>Avg Order</p>
                        <h3 className="text-2xl sm:text-3xl font-black tracking-tight">₹{stats.aov.toFixed(1)}</h3>
                    </div>
                </div>

                {/* CHARTS & BREAKDOWNS */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* 7-DAY REVENUE CHART */}
                    <div className={`lg:col-span-2 p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] border backdrop-blur-xl flex flex-col ${isDark ? 'bg-[#111111]/80 border-white/10' : 'bg-white border-stone-200 shadow-lg shadow-stone-200/40'}`}>
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-lg sm:text-xl font-black tracking-tight">Revenue Trend</h3>
                                <p className={`text-xs sm:text-sm font-medium ${isDark ? 'text-white/50' : 'text-stone-500'}`}>Last 7 Days</p>
                            </div>
                            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-stone-100'}`}>
                                <Calendar className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="flex-1 flex items-end justify-between gap-2 sm:gap-6 mt-4 min-h-[150px] sm:min-h-[200px]">
                            {chartData.map((day, idx) => (
                                <div key={idx} className="flex flex-col items-center gap-2 sm:gap-3 flex-1 group">
                                    <div className={`opacity-0 group-hover:opacity-100 transition-opacity text-[8px] sm:text-[10px] font-bold py-1 px-2 rounded-md ${isDark ? 'bg-white text-black' : 'bg-stone-900 text-white'}`}>
                                        ₹{day.revenue}
                                    </div>
                                    <div className="w-full relative flex justify-center h-32 sm:h-48 bg-transparent items-end">
                                        <div 
                                            className={`w-full max-w-[2rem] sm:max-w-[3rem] rounded-t-lg sm:rounded-t-xl transition-all duration-1000 ${isDark ? 'bg-indigo-500 group-hover:bg-indigo-400' : 'bg-indigo-600 group-hover:bg-indigo-500'} ${day.revenue === 0 ? 'min-h-[4px] bg-stone-500/20' : ''}`}
                                            style={{ height: `${day.height}%` }}
                                        />
                                    </div>
                                    <span className={`text-[8px] sm:text-xs font-bold uppercase tracking-widest ${isDark ? 'text-white/40' : 'text-stone-400'}`}>{day.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* COLOR VS B&W BREAKDOWN */}
                    <div className={`p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] border backdrop-blur-xl flex flex-col justify-between ${isDark ? 'bg-[#111111]/80 border-white/10' : 'bg-white border-stone-200 shadow-lg shadow-stone-200/40'}`}>
                        <div>
                            <div className="flex justify-between items-center mb-6 sm:mb-8">
                                <h3 className="text-lg sm:text-xl font-black tracking-tight">Print Details</h3>
                                <Printer className={`w-4 h-4 sm:w-5 sm:h-5 ${isDark ? 'text-white/40' : 'text-stone-400'}`} />
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between items-end mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-full ${isDark ? 'bg-stone-400' : 'bg-stone-800'}`} />
                                            <span className="text-xs sm:text-sm font-bold uppercase tracking-widest">Black & White</span>
                                        </div>
                                        <span className="text-base sm:text-lg font-black">{stats.bwPercentage}%</span>
                                    </div>
                                    <div className={`h-2 sm:h-3 w-full rounded-full overflow-hidden ${isDark ? 'bg-white/5' : 'bg-stone-100'}`}>
                                        <div className={`h-full transition-all duration-1000 ${isDark ? 'bg-stone-400' : 'bg-stone-800'}`} style={{ width: `${stats.bwPercentage}%` }} />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between items-end mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500" />
                                            <span className="text-xs sm:text-sm font-bold uppercase tracking-widest">Color</span>
                                        </div>
                                        <span className="text-base sm:text-lg font-black">{stats.colorPercentage}%</span>
                                    </div>
                                    <div className={`h-2 sm:h-3 w-full rounded-full overflow-hidden ${isDark ? 'bg-white/5' : 'bg-stone-100'}`}>
                                        <div className="h-full bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 transition-all duration-1000" style={{ width: `${stats.colorPercentage}%` }} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={`mt-6 sm:mt-8 p-3 sm:p-4 rounded-xl border flex items-center gap-3 sm:gap-4 ${isDark ? 'bg-white/5 border-white/10' : 'bg-stone-50 border-stone-200'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
                                <FileText className="w-4 h-4" />
                            </div>
                            <p className={`text-[10px] sm:text-xs font-medium leading-relaxed ${isDark ? 'text-white/70' : 'text-stone-600'}`}>
                                Processed <strong>{stats.pages} total pages</strong> across <strong>{stats.orders} orders</strong>.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

      </div>
    </div>
  )
}