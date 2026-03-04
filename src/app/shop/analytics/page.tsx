'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import LoadingScreen from '@/components/LoadingScreen'
import { 
  TrendingUp, IndianRupee, FileText, Layers, BarChart3, Calendar, Activity, Printer, ArrowLeft
} from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'

type TimeFilter = 'today' | 'week' | 'month' | 'all'

export default function ShopAnalyticsPage() {
  const router = useRouter()
  const { isDark } = useTheme()
  
  const [allOrders, setAllOrders] = useState<any[]>([]) 
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<TimeFilter>('week') // Default to 'week' for better chart visuals initially

  const fetchOrders = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return 
    }

    const { data: shop } = await supabase
      .from('shops')
      .select('id')
      .eq('owner_id', user.id)
      .maybeSingle()

    if (shop) {
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .eq('shop_id', shop.id)
        .order('created_at', { ascending: false })

      if (ordersData) {
        setAllOrders(ordersData) 
      }
    }
    
    setLoading(false)
  }, [router])

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders])

  // ================= ANALYTICS LOGIC =================
  const filteredAnalyticsOrders = useMemo(() => {
    const now = new Date()
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
      return true 
    })
  }, [allOrders, filter])

  const stats = useMemo(() => {
    let totalRevenue = 0
    let totalPagesPrinted = 0
    let colorCount = 0
    let bwCount = 0

    filteredAnalyticsOrders.forEach(order => {
      const orderRevenue = Number(order.total_price || 0)
      totalRevenue += orderRevenue
      
      const pages = Number(order.total_pages || 1)
      const copies = Number(order.copies || 1)
      
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
            const orderRevenue = Number(order.total_price || 0)
            last7Days[dayIndex].revenue += orderRevenue
        }
    })

    const maxRev = Math.max(...last7Days.map(d => d.revenue), 1) 
    return last7Days.map(d => ({ ...d, height: (d.revenue / maxRev) * 100 }))
  }, [filteredAnalyticsOrders])

  if (loading) return <LoadingScreen isDark={isDark} />

  return (
    <div className={`min-h-screen font-sans transition-colors duration-500 pb-20 ${
        isDark ? 'bg-[#0A0A0A] text-white selection:bg-white/30' : 'bg-[#faf9f6] text-stone-900 selection:bg-black/20'
    }`}>
      <div className="p-6 sm:p-8 max-w-6xl mx-auto space-y-8 relative z-10">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
            <Link href="/shop/dashboard" className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border transition-colors ${isDark ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white' : 'bg-white border-stone-200 hover:bg-stone-50 text-stone-900'}`}>
                <ArrowLeft className="w-4 h-4" /> Back
            </Link>
        </div>

        {/* Dashboard Title & Filter */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-2">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight flex items-center gap-3">
                <BarChart3 className={isDark ? 'text-indigo-400' : 'text-indigo-600'} /> 
                Performance Overview
            </h2>
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
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
                        <p className={`text-xs sm:text-sm font-medium ${isDark ? 'text-white/50' : 'text-stone-500'}`}>Last 7 Days (Always visible)</p>
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
  )
}