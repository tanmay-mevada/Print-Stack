'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { logoutAction } from '@/app/(auth)/actions'
import { setShopStatusAction } from '../actions'
import { updateRefundStatusAction, updateComplaintStatusAction } from '../actions'
import { createClient } from '@/lib/supabase/client'
import OrderRow from '@/components/OrderRow'
import NotificationListener from '@/components/NotificationListener'
import { Toaster } from 'react-hot-toast'
import LoadingScreen from '@/components/LoadingScreen'
import {
  Sun, Moon, LogOut, Store, Settings, Zap, PauseCircle,
  BarChart3, ChevronDown, Clock, XCircle, Timer, Search, Filter, ArrowUpDown, CheckCircle2
} from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'

// ==========================================================================
// COMPACT CUSTOM FILTER DROPDOWN
// ==========================================================================
interface FilterOption { label: string; value: string; }

function FilterDropdown({ value, options, onChange, isDark, icon: Icon }: { value: string, options: FilterOption[], onChange: (val: string) => void, isDark: boolean, icon: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selected = options.find(o => o.value === value);

  return (
    <div className="relative flex-1 sm:flex-none" ref={ref}>
      <button onClick={() => setIsOpen(!isOpen)} className={`w-full flex items-center justify-center sm:justify-start gap-2 px-4 py-3 sm:py-2.5 rounded-xl sm:rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all border outline-none ${isDark ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white' : 'bg-stone-50 border-stone-200 hover:bg-stone-100 text-stone-700'} ${isOpen ? (isDark ? 'ring-1 ring-white/20' : 'ring-1 ring-stone-900/20') : ''}`}>
        {Icon && <Icon className="w-3.5 h-3.5 opacity-50 shrink-0" />}
        <span className="whitespace-nowrap">{selected?.label}</span>
        <ChevronDown className={`w-3.5 h-3.5 opacity-50 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className={`absolute right-0 top-[calc(100%+8px)] min-w-[160px] z-50 rounded-2xl shadow-2xl border overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${isDark ? 'bg-[#18181b] border-white/10 shadow-black/80' : 'bg-white border-stone-200 shadow-stone-300/50'}`}>
          {options.map(opt => (
            <button key={opt.value} onClick={() => { onChange(opt.value); setIsOpen(false); }} className={`w-full text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest flex justify-between items-center transition-colors ${value === opt.value ? (isDark ? 'bg-white/10 text-white' : 'bg-stone-100 text-stone-900') : (isDark ? 'hover:bg-white/5 text-white/50 hover:text-white' : 'hover:bg-stone-50 text-stone-500 hover:text-stone-900')}`}>
              {opt.label}
              {value === opt.value && <CheckCircle2 className={`w-4 h-4 ${isDark ? 'text-white' : 'text-stone-900'}`} />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ShopDashboardPage() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const { isDark, toggleTheme } = useTheme()
  const [shop, setShop] = useState<any>(null)

  const [activeOrders, setActiveOrders] = useState<any[]>([])
  const [completedOrders, setCompletedOrders] = useState<any[]>([])
  const [refunds, setRefunds] = useState<any[]>([])
  const [complaints, setComplaints] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userAvatar, setUserAvatar] = useState<string | null>(null)

  const [statusMenuOpen, setStatusMenuOpen] = useState(false)
  const [updatingComplaint, setUpdatingComplaint] = useState<string | null>(null)
  const [updatingRefund, setUpdatingRefund] = useState<string | null>(null)

  // ==========================================================================
  // SEARCH, FILTER & SORT STATES
  // ==========================================================================
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [sortBy, setSortBy] = useState('date_desc')

  // ==========================================================================
  // CUSTOM PAUSE MODAL STATES & LOGIC
  // ==========================================================================
  const [isPauseModalOpen, setIsPauseModalOpen] = useState(false)
  const [pauseDuration, setPauseDuration] = useState<number | string>(30)
  const [reopenTime, setReopenTime] = useState<string>('')

  useEffect(() => {
    if (isPauseModalOpen) {
      const now = new Date()
      now.setMinutes(now.getMinutes() + 30)
      setReopenTime(now.toTimeString().slice(0, 5))
      setPauseDuration(30)
    }
  }, [isPauseModalOpen])

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const mins = parseInt(e.target.value)
    setPauseDuration(e.target.value)
    if (!isNaN(mins) && mins > 0) {
      const now = new Date()
      now.setMinutes(now.getMinutes() + mins)
      setReopenTime(now.toTimeString().slice(0, 5))
    }
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const timeVal = e.target.value
    setReopenTime(timeVal)
    if (timeVal) {
      const [hours, minutes] = timeVal.split(':').map(Number)
      const target = new Date()
      target.setHours(hours, minutes, 0, 0)
      if (target < new Date()) {
        target.setDate(target.getDate() + 1)
      }
      const diffMins = Math.round((target.getTime() - new Date().getTime()) / 60000)
      setPauseDuration(diffMins)
    }
  }

  const dropdownRef = useRef<HTMLDivElement>(null)
  const statusRef = useRef<HTMLDivElement>(null)

  const fetchDashboardData = useCallback(async (isInitialLoad = false) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { if (isInitialLoad) router.push('/login'); return }

    const { data: profile } = await supabase.from('profiles').select('profile_pic').eq('id', user.id).single()
    if (profile?.profile_pic) setUserAvatar(profile.profile_pic)

    let currentShop = shop;
    if (!currentShop) {
      const { data: shopData } = await supabase.from('shops').select('*').eq('owner_id', user.id).maybeSingle()
      setShop(shopData)
      currentShop = shopData;
    }

    if (currentShop) {
      try {
        const { data: ordersData } = await supabase.from('orders').select('*, profiles:student_id(name)').eq('shop_id', currentShop.id).order('created_at', { ascending: false })
        if (ordersData) {
          setActiveOrders(ordersData.filter(o => ['PENDING', 'PAID', 'PRINTING', 'READY'].includes(o.status)))
          setCompletedOrders(ordersData.filter(o => ['COMPLETED', 'CANCELLED'].includes(o.status)))
        }

        // Fetch refunds
        const { data: refundsData, error: refundsError } = await supabase.from('refunds').select('*, orders!order_id(id, total_price), profiles!student_id(name)').eq('shop_id', currentShop.id).order('created_at', { ascending: false })
        if (refundsError) {
          console.error('Error fetching refunds:', refundsError)
        } else if (refundsData) {
          setRefunds(refundsData)
        }

        // Fetch complaints
        const { data: complaintsData, error: complaintsError } = await supabase.from('complaints').select('*, orders!order_id(id), profiles!student_id(name)').eq('shop_id', currentShop.id).order('created_at', { ascending: false })
        if (complaintsError) {
          console.error('Error fetching complaints:', complaintsError)
          // If complaints table doesn't exist, show message
          if (complaintsError.message.includes('relation') || complaintsError.message.includes('does not exist')) {
            console.warn('⚠️ Complaints table not found. Please run the database migration in Supabase.')
          }
        } else if (complaintsData) {
          setComplaints(complaintsData)
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      }
    }
    if (isInitialLoad) setLoading(false)
  }, [router, shop])

  useEffect(() => {
    fetchDashboardData(true);
    const supabase = createClient();

    // Real-time subscriptions
    const ordersChannel = supabase
      .channel('orders_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchDashboardData(false))
      .subscribe();

    const refundsChannel = supabase
      .channel('refunds_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'refunds' }, () => fetchDashboardData(false))
      .subscribe();

    const complaintsChannel = supabase
      .channel('complaints_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'complaints' }, () => fetchDashboardData(false))
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(refundsChannel);
      supabase.removeChannel(complaintsChannel);
    };
  }, [fetchDashboardData])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false)
      if (statusRef.current && !statusRef.current.contains(event.target as Node)) setStatusMenuOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const isPaused = shop?.paused_until && new Date(shop.paused_until) > new Date();

  const handleSetStatus = async (isActive: boolean, exactIsoString: string | null = null) => {
    if (!shop) return;
    setStatusMenuOpen(false);
    setIsPauseModalOpen(false);
    setShop({ ...shop, is_active: isActive, paused_until: exactIsoString });
    await setShopStatusAction(shop.id, isActive, exactIsoString);
  }

  const submitCustomPause = () => {
    const target = new Date();
    target.setMinutes(target.getMinutes() + Number(pauseDuration));
    handleSetStatus(true, target.toISOString());
  }

  const handleComplaintStatusUpdate = async (complaintId: string, newStatus: 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED') => {
    setUpdatingComplaint(complaintId)
    const result = await updateComplaintStatusAction(complaintId, newStatus)
    setUpdatingComplaint(null)
    
    if (result.success) {
      const toast = require('react-hot-toast').default
      toast.success(`Complaint marked as ${newStatus.toLowerCase()}`)
      // Refresh data
      fetchDashboardData(false)
    } else {
      const toast = require('react-hot-toast').default
      toast.error(result.error || 'Failed to update complaint')
    }
  }

  const handleRefundStatusUpdate = async (refundId: string, newStatus: 'APPROVED' | 'REJECTED') => {
    setUpdatingRefund(refundId)
    const result = await updateRefundStatusAction(refundId, newStatus)
    setUpdatingRefund(null)
    
    if (result.success) {
      const toast = require('react-hot-toast').default
      toast.success(`Refund ${newStatus.toLowerCase()}`)
      // Refresh data
      fetchDashboardData(false)
    } else {
      const toast = require('react-hot-toast').default
      toast.error(result.error || 'Failed to update refund')
    }
  }

  // ==========================================================================
  // DATA PROCESSING ENGINE (SEARCH, FILTER, SORT)
  // ==========================================================================
  const processOrders = useCallback((ordersList: any[]) => {
    return ordersList
      .filter(order => {
        const searchLower = searchQuery.toLowerCase()
        const matchesSearch =
          order.profiles?.name?.toLowerCase().includes(searchLower) ||
          order.file_path?.toLowerCase().includes(searchLower) ||
          order.id.toLowerCase().includes(searchLower)

        const matchesType = typeFilter === 'ALL' || order.print_type === typeFilter
        return matchesSearch && matchesType
      })
      .sort((a, b) => {
        // 🔥 PRIORITY SORTING OVERRIDE 🔥
        // Priority orders ALWAYS float to the absolute top of the list!
        if (a.is_priority && !b.is_priority) return -1;
        if (!a.is_priority && b.is_priority) return 1;

        // If they are both priority (or both normal), fall back to standard sorting
        if (sortBy === 'date_desc') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        if (sortBy === 'date_asc') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        if (sortBy === 'price_desc') return Number(b.total_price) - Number(a.total_price)
        if (sortBy === 'price_asc') return Number(a.total_price) - Number(b.total_price)
        return 0
      })
  }, [searchQuery, typeFilter, sortBy])

  const filteredActiveOrders = useMemo(() => processOrders(activeOrders), [activeOrders, processOrders])
  const filteredCompletedOrders = useMemo(() => processOrders(completedOrders), [completedOrders, processOrders])

  if (loading) return <LoadingScreen isDark={isDark} />

  return (
    <div className={`min-h-screen font-sans transition-colors duration-500 pb-20 ${isDark ? 'bg-[#0A0A0A] text-white selection:bg-white/30' : 'bg-[#faf9f6] text-stone-900 selection:bg-black/20'}`}>
      <Toaster />
      <NotificationListener />

      {/* ================= CUSTOM PAUSE MODAL OVERLAY ================= */}
      {isPauseModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className={`w-full max-w-md p-8 rounded-[2.5rem] border shadow-2xl transition-all ${isDark ? 'bg-[#111111] border-white/10' : 'bg-white border-stone-200'}`}>
            <h3 className="text-2xl font-black mb-2">Pause Shop</h3>
            <p className={`text-sm mb-6 ${isDark ? 'text-white/60' : 'text-stone-500'}`}>Syncs automatically. Edit either value below.</p>

            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={`block text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-white/50' : 'text-stone-500'}`}>Duration (Minutes)</label>
                  {Number(pauseDuration) >= 60 && !isNaN(Number(pauseDuration)) && (
                    <span className={`text-[10px] font-black uppercase tracking-widest animate-in fade-in ${isDark ? 'text-yellow-500' : 'text-yellow-600'}`}>
                      {Math.floor(Number(pauseDuration) / 60)} hr{Math.floor(Number(pauseDuration) / 60) > 1 ? 's' : ''}
                      {Number(pauseDuration) % 60 > 0 ? ` ${Number(pauseDuration) % 60} min` : ''}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input type="number" value={pauseDuration} onChange={handleDurationChange} className={`w-full rounded-xl border pl-10 pr-4 py-3.5 outline-none font-bold ${isDark ? 'bg-[#0A0A0A] border-white/10 text-white focus:border-white/30' : 'bg-stone-50 border-stone-200 text-stone-900 focus:border-stone-400'}`} />
                  <Timer className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className={`h-[1px] flex-1 ${isDark ? 'bg-white/10' : 'bg-stone-200'}`}></div>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-white/40' : 'text-stone-400'}`}>OR</span>
                <div className={`h-[1px] flex-1 ${isDark ? 'bg-white/10' : 'bg-stone-200'}`}></div>
              </div>
              <div>
                <label className={`block text-[10px] font-bold mb-2 uppercase tracking-widest ${isDark ? 'text-white/50' : 'text-stone-500'}`}>Reopen Time</label>
                <div className="relative">
                  <input type="time" value={reopenTime} onChange={handleTimeChange} className={`w-full rounded-xl border pl-10 pr-4 py-3.5 outline-none font-bold ${isDark ? 'bg-[#0A0A0A] border-white/10 text-white focus:border-white/30' : 'bg-stone-50 border-stone-200 text-stone-900 focus:border-stone-400'}`} />
                  <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => setIsPauseModalOpen(false)} className={`flex-1 py-3.5 rounded-xl font-bold text-sm tracking-widest uppercase ${isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'}`}>Cancel</button>
              <button onClick={submitCustomPause} className={`flex-1 py-3.5 rounded-xl font-black text-sm tracking-widest uppercase ${isDark ? 'bg-yellow-500 text-black hover:bg-yellow-400' : 'bg-yellow-400 text-stone-900 hover:bg-yellow-500'}`}>Pause Shop</button>
            </div>
          </div>
        </div>
      )}

      <div className="p-6 sm:p-8 max-w-6xl mx-auto space-y-8 relative z-10">

        {/* ================= NAVBAR ================= */}
        <div className={`flex justify-between items-center pb-6 relative transition-colors duration-500 border-b ${isDark ? 'border-white/10' : 'border-stone-200/60'}`}>
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/" className="flex items-center gap-3 sm:gap-4 group">
              <img src={isDark ? "/pblackx.png" : "/pwhitex.png"} alt="Logo" className="w-9 h-9 sm:w-10 sm:h-10 object-contain" />
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                <span className={`bg-clip-text text-transparent transition-colors duration-300 ${isDark ? 'bg-gradient-to-r from-white to-gray-400' : 'bg-gradient-to-r from-stone-900 to-stone-500'}`}>{shop?.name ? `${shop.name} ` : 'PrintStack '}</span>
              </h1>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-5">
            <button onClick={toggleTheme} className={`p-2.5 sm:p-3 rounded-full transition-all duration-300 hover:scale-105 ${isDark ? 'bg-white/5 hover:bg-white/10 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]' : 'bg-white hover:bg-stone-50 text-stone-900 shadow-sm border border-stone-200/50'}`}>
              {isDark ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
            <div className="relative block" ref={dropdownRef}>
              <button onClick={() => setIsOpen(!isOpen)} className={`w-10 h-10 sm:w-11 sm:h-11 border rounded-full overflow-hidden flex items-center justify-center text-sm font-bold transition-all duration-300 ${isDark ? 'border-white/20 bg-[#111111] hover:bg-white/10 text-white' : 'border-stone-300 bg-white hover:bg-stone-100 text-stone-900 shadow-sm'}`}>
                {userAvatar ? <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" /> : shop?.name ? shop.name.charAt(0).toUpperCase() : 'S'}
              </button>
              {isOpen && (
                <div className={`absolute right-0 mt-3 w-56 border rounded-2xl shadow-xl z-50 overflow-hidden transition-colors duration-300 animate-in fade-in slide-in-from-top-2 ${isDark ? 'bg-[#111111] border-white/10 shadow-black' : 'bg-white border-stone-200 shadow-stone-200/50'}`}>
                  <div className={`p-2 border-b ${isDark ? 'border-white/10' : 'border-stone-100'}`}>
                    <Link href="/shop/analytics" onClick={() => setIsOpen(false)} className={`flex items-center gap-3 p-3 rounded-xl text-sm font-bold transition-colors ${isDark ? 'hover:bg-white/10 text-white/80 hover:text-white' : 'hover:bg-stone-50 text-stone-700 hover:text-stone-900'}`}><BarChart3 className="w-4 h-4 opacity-70" /> Analytics</Link>
                    <Link href="/shop/profile" onClick={() => setIsOpen(false)} className={`flex items-center gap-3 p-3 rounded-xl text-sm font-bold transition-colors ${isDark ? 'hover:bg-white/10 text-white/80 hover:text-white' : 'hover:bg-stone-50 text-stone-700 hover:text-stone-900'}`}><Store className="w-4 h-4 opacity-70" /> Edit Shop Details</Link>
                    <Link href="/shop/pricing" onClick={() => setIsOpen(false)} className={`flex items-center gap-3 p-3 rounded-xl text-sm font-bold transition-colors ${isDark ? 'hover:bg-white/10 text-white/80 hover:text-white' : 'hover:bg-stone-50 text-stone-700 hover:text-stone-900'}`}><Settings className="w-4 h-4 opacity-70" /> Edit Prices</Link>
                  </div>
                  <div className="p-2">
                    <form action={logoutAction}><button type="submit" className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm font-bold transition-colors text-left ${isDark ? 'hover:bg-red-500/10 text-red-400 hover:text-red-300' : 'hover:bg-red-50 text-red-600 hover:text-red-700'}`}><LogOut className="w-4 h-4 opacity-70" /> Log out</button></form>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {!shop ? (
          <div className={`border rounded-[2rem] sm:rounded-[3rem] p-8 sm:p-16 text-center backdrop-blur-xl max-w-2xl mx-auto mt-12 transition-all duration-500 ${isDark ? 'bg-[#111111]/80 border-white/10 shadow-[0_20px_60px_-15px_rgba(255,255,255,0.05)] ring-1 ring-white/5' : 'bg-white border-stone-200 shadow-2xl shadow-stone-200/50'}`}>
            <div className={`w-20 h-20 sm:w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl ${isDark ? 'bg-white/5 text-white/50 ring-1 ring-white/10' : 'bg-stone-100 text-stone-400 ring-1 ring-stone-200'}`}><Store className="w-10 h-10 sm:w-12 sm:h-12" /></div>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-widest mb-4">Profile Incomplete</h2>
            <p className={`mb-8 font-medium ${isDark ? 'text-white/60' : 'text-stone-500'}`}>You must complete your shop profile before you can receive orders.</p>
            <Link href="/shop/profile" className={`inline-flex items-center gap-3 py-4 sm:py-5 px-8 sm:px-10 rounded-[2rem] font-black text-base sm:text-lg tracking-widest uppercase transition-all duration-500 hover:-translate-y-1 ${isDark ? 'bg-white text-black hover:bg-gray-200 shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:shadow-[0_0_60px_rgba(255,255,255,0.25)]' : 'bg-stone-900 text-white hover:bg-black shadow-xl shadow-stone-900/20'}`}>
              <Settings className="w-5 h-5 sm:w-6 sm:h-6" /> Setup Shop Details
            </Link>
          </div>
        ) : (
          <div className="space-y-8 sm:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* ================= STATUS TOGGLE ================= */}
          {/* ================= STATUS TOGGLE ================= */}
<div className={`relative z-50 overflow-visible border rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-12 flex flex-col lg:flex-row justify-between items-center gap-6 sm:gap-8 backdrop-blur-xl transition-all duration-500 ${isDark ? 'bg-[#111111]/60 border-white/10 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.5)] ring-1 ring-white/5' : 'bg-white border-stone-200/60 shadow-xl shadow-stone-200/40'}`}>
              {shop.is_active && !isPaused && isDark && <div className="absolute inset-0 bg-green-500/5 blur-3xl rounded-[2.5rem] pointer-events-none" />}
              {isPaused && isDark && <div className="absolute inset-0 bg-yellow-500/5 blur-3xl rounded-[2.5rem] pointer-events-none" />}

              <div className="text-center lg:text-left z-10 flex-1">
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">Storefront Visibility</h2>
                <p className={`font-medium text-sm sm:text-lg ${isDark ? 'text-white/60' : 'text-stone-500'}`}>
                  {shop.is_active && !isPaused && "Students can see your shop and place orders."}
                  {!shop.is_active && "Your shop is currently closed and hidden from the map."}
                  {isPaused && `Your shop is paused. It will auto-resume at ${new Date(shop.paused_until).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                <div className="relative w-full sm:w-auto z-50" ref={statusRef}>
                  <button onClick={() => setStatusMenuOpen(!statusMenuOpen)} className={`relative w-full sm:w-auto min-w-[280px] sm:min-w-[320px] h-[64px] sm:h-[72px] rounded-full transition-all duration-500 overflow-hidden shrink-0 flex items-center justify-between px-6 sm:px-8 border ${shop.is_active && !isPaused ? (isDark ? 'bg-green-500/10 border-green-500/30 text-green-500 shadow-[0_0_40px_rgba(34,197,94,0.15)]' : 'bg-green-50 border-green-200 text-green-700 shadow-inner') :
                    isPaused ? (isDark ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500' : 'bg-yellow-50 border-yellow-200 text-yellow-700') :
                      (isDark ? 'bg-white/5 border-white/10 text-white/50' : 'bg-stone-100 border-stone-200 text-stone-500')
                    }`}
                  >
                    <div className="flex items-center gap-3 font-black tracking-widest uppercase text-sm sm:text-base">
                      {shop.is_active && !isPaused && <Zap className="w-5 h-5 animate-pulse" />}
                      {isPaused && <Clock className="w-5 h-5" />}
                      {!shop.is_active && <XCircle className="w-5 h-5" />}
                      {shop.is_active && !isPaused && 'LIVE & ACTIVE'}
                      {isPaused && 'PAUSED'}
                      {!shop.is_active && 'CLOSED'}
                    </div>
                    <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${statusMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {statusMenuOpen && (
                    <div className={`absolute top-[calc(100%+8px)] right-0 w-full sm:w-[320px] border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 ${isDark ? 'bg-[#111111] border-white/10' : 'bg-white border-stone-200'}`}>
                      {(shop.is_active || isPaused) && (
                        <button onClick={() => handleSetStatus(false)} className={`w-full text-left p-4 border-b text-sm font-bold transition-colors flex items-center gap-3 ${isDark ? 'border-white/10 hover:bg-white/5 text-white' : 'border-stone-100 hover:bg-stone-50 text-stone-900'}`}><XCircle className="w-4 h-4 text-red-500" /> Close Shop</button>
                      )}
                      {(!shop.is_active || isPaused) && (
                        <button onClick={() => handleSetStatus(true, null)} className={`w-full text-left p-4 border-b text-sm font-bold transition-colors flex items-center gap-3 ${isDark ? 'border-white/10 hover:bg-white/5 text-white' : 'border-stone-100 hover:bg-stone-50 text-stone-900'}`}><Zap className="w-4 h-4 text-green-500" /> Resume / Go Live Now</button>
                      )}
                      <button onClick={() => { setStatusMenuOpen(false); setIsPauseModalOpen(true); }} className={`w-full text-left p-4 text-sm font-bold transition-colors flex items-center gap-3 ${isDark ? 'hover:bg-white/5 text-yellow-500' : 'hover:bg-stone-50 text-yellow-600'}`}>
                        <Clock className="w-4 h-4" /> Custom Pause...
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

          {/* ================= ULTRA-COMPACT SEARCH & FILTER BAR ================= */}
{/* ================= ULTRA-COMPACT SEARCH & FILTER BAR ================= */}
<div className={`p-2 rounded-2xl sm:rounded-full border flex flex-col sm:flex-row gap-2 items-center backdrop-blur-xl shadow-sm transition-colors z-40 relative ${isDark ? 'bg-[#111111]/80 border-white/10 ring-1 ring-white/5' : 'bg-white border-stone-200'
  }`}>

              <div className="relative flex-1 w-full pl-3">
                <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-white/40' : 'text-stone-400'}`} />
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-8 pr-4 py-2 sm:py-1.5 bg-transparent text-xs font-bold uppercase tracking-widest outline-none transition-all ${isDark ? 'text-white placeholder:text-white/30' : 'text-stone-900 placeholder:text-stone-400'
                    }`}
                />
              </div>

              <div className="flex w-full sm:w-auto gap-2 shrink-0">
                <FilterDropdown
                  value={typeFilter}
                  options={[
                    { label: "All", value: "ALL" },
                    { label: "B&W", value: "BW" },
                    { label: "Color", value: "COLOR" },
                    { label: "Mixed", value: "MIXED" }
                  ]}
                  onChange={setTypeFilter}
                  isDark={isDark}
                  icon={Filter}
                />
                <FilterDropdown
                  value={sortBy}
                  options={[
                    { label: "Newest", value: "date_desc" },
                    { label: "Oldest", value: "date_asc" },
                    { label: "Price: High", value: "price_desc" },
                    { label: "Price: Low", value: "price_asc" }
                  ]}
                  onChange={setSortBy}
                  isDark={isDark}
                  icon={ArrowUpDown}
                />
              </div>
            </div>

            {/* ================= ACTIVE ORDERS SECTION ================= */}
            <div className="pt-2 z-10 relative">
              <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6 px-2">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="relative flex h-3 w-3 sm:h-4 sm:w-4">
                    <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${shop.is_active && !isPaused ? 'bg-green-400 animate-ping' : isPaused ? 'bg-yellow-400' : 'bg-stone-400'}`}></span>
                    <span className={`relative inline-flex rounded-full h-3 w-3 sm:h-4 sm:w-4 ${shop.is_active && !isPaused ? 'bg-green-500' : isPaused ? 'bg-yellow-500' : 'bg-stone-500'}`}></span>
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
                      {filteredActiveOrders.length === 0 ? (
                        <tr><td colSpan={5} className={`p-12 sm:p-16 text-center text-xs sm:text-sm font-bold uppercase tracking-widest ${isDark ? 'text-white/30' : 'text-stone-400'}`}>No active orders match your search.</td></tr>
                      ) : (
                        filteredActiveOrders.map(order => <OrderRow key={order.id} order={order} isDark={isDark} />)
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* ================= COMPLETED ORDERS SECTION ================= */}
            {filteredCompletedOrders.length > 0 && (
              <div className="pt-4 sm:pt-6 z-10 relative">
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
                        {filteredCompletedOrders.map(order => <OrderRow key={order.id} order={order} isDark={isDark} />)}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Empty State for Completed Orders if filtering hides them */}
            {completedOrders.length > 0 && filteredCompletedOrders.length === 0 && (
              <div className="pt-4 sm:pt-6">
                <h2 className={`text-xl sm:text-2xl font-black tracking-tight mb-4 sm:mb-6 px-2 ${isDark ? 'text-white/50' : 'text-stone-400'}`}>Order History</h2>
                <div className={`p-10 text-center border rounded-[1.5rem] sm:rounded-[2rem] opacity-60 ${isDark ? 'bg-[#111111]/40 border-white/10' : 'bg-stone-50 border-stone-200/60'}`}>
                  <p className={`text-xs sm:text-sm font-bold uppercase tracking-widest ${isDark ? 'text-white/30' : 'text-stone-400'}`}>No past orders match your search.</p>
                </div>
              </div>
            )}

            {/* ================= REFUNDS SECTION ================= */}
            {refunds.length > 0 && (
              <div className="pt-4 sm:pt-6 z-10 relative">
                <h2 className={`text-xl sm:text-2xl font-black tracking-tight mb-4 sm:mb-6 px-2 ${isDark ? 'text-white/50' : 'text-stone-400'}`}>Refund Requests</h2>
                <div className={`border rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden backdrop-blur-xl transition-all duration-500 ${isDark ? 'bg-[#111111]/80 border-white/10 ring-1 ring-white/5' : 'bg-white border-stone-200/60 shadow-xl shadow-stone-200/30'}`}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px] sm:min-w-[900px]">
                      <thead>
                        <tr className={`border-b text-[10px] uppercase tracking-widest font-black ${isDark ? 'bg-white/5 border-white/10 text-white/50' : 'bg-stone-50 border-stone-200 text-stone-500'}`}>
                          <th className="p-4 sm:p-6 border-r border-inherit w-32 sm:w-40">Date</th>
                          <th className="p-4 sm:p-6 border-r border-inherit">Student</th>
                          <th className="p-4 sm:p-6 border-r border-inherit">Reason</th>
                          <th className="p-4 sm:p-6 border-r border-inherit">Amount</th>
                          <th className="p-4 sm:p-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y transition-colors ${isDark ? 'divide-white/10' : 'divide-stone-200'}`}>
                        {refunds.map(refund => (
                          <tr key={refund.id} className={`text-sm ${isDark ? 'text-white/80' : 'text-stone-700'}`}>
                            <td className="p-4 sm:p-6 border-r border-inherit">
                              <div className="font-bold">{new Date(refund.created_at).toLocaleDateString()}</div>
                              <div className={`text-xs ${isDark ? 'text-white/50' : 'text-stone-500'}`}>{new Date(refund.created_at).toLocaleTimeString()}</div>
                            </td>
                            <td className="p-4 sm:p-6 border-r border-inherit">
                              <div className="font-bold">{refund.profiles?.name || 'Unknown'}</div>
                            </td>
                            <td className="p-4 sm:p-6 border-r border-inherit">
                              <div className="max-w-xs truncate" title={refund.reason}>{refund.reason}</div>
                            </td>
                            <td className="p-4 sm:p-6 border-r border-inherit">
                              <div className="font-bold">₹{refund.amount}</div>
                            </td>
                            <td className="p-4 sm:p-6 text-right">
                              {refund.status === 'REQUESTED' ? (
                                <div className="flex gap-2 justify-end">
                                  <button
                                    onClick={() => handleRefundStatusUpdate(refund.id, 'APPROVED')}
                                    disabled={updatingRefund === refund.id}
                                    className={`px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${isDark ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}
                                  >
                                    {updatingRefund === refund.id ? 'Processing...' : 'Approve'}
                                  </button>
                                  <button
                                    onClick={() => handleRefundStatusUpdate(refund.id, 'REJECTED')}
                                    disabled={updatingRefund === refund.id}
                                    className={`px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${isDark ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}
                                  >
                                    {updatingRefund === refund.id ? 'Processing...' : 'Reject'}
                                  </button>
                                </div>
                              ) : (
                                <span className={`px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-lg ${
                                  refund.status === 'APPROVED' ? (isDark ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-700') :
                                  refund.status === 'REJECTED' ? (isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-700') :
                                  (isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-700')
                                }`}>
                                  {refund.status}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ================= COMPLAINTS SECTION ================= */}
            {complaints.length > 0 && (
              <div className="pt-4 sm:pt-6 z-10 relative">
                <h2 className={`text-xl sm:text-2xl font-black tracking-tight mb-4 sm:mb-6 px-2 ${isDark ? 'text-white/50' : 'text-stone-400'}`}>Complaints</h2>
                <div className={`border rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden backdrop-blur-xl transition-all duration-500 ${isDark ? 'bg-[#111111]/80 border-white/10 ring-1 ring-white/5' : 'bg-white border-stone-200/60 shadow-xl shadow-stone-200/30'}`}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px] sm:min-w-[900px]">
                      <thead>
                        <tr className={`border-b text-[10px] uppercase tracking-widest font-black ${isDark ? 'bg-white/5 border-white/10 text-white/50' : 'bg-stone-50 border-stone-200 text-stone-500'}`}>
                          <th className="p-4 sm:p-6 border-r border-inherit w-32 sm:w-40">Date</th>
                          <th className="p-4 sm:p-6 border-r border-inherit">Student</th>
                          <th className="p-4 sm:p-6 border-r border-inherit">Message</th>
                          <th className="p-4 sm:p-6 border-r border-inherit">Status</th>
                          <th className="p-4 sm:p-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y transition-colors ${isDark ? 'divide-white/10' : 'divide-stone-200'}`}>
                        {complaints.map(complaint => (
                          <tr key={complaint.id} className={`text-sm ${isDark ? 'text-white/80' : 'text-stone-700'}`}>
                            <td className="p-4 sm:p-6 border-r border-inherit">
                              <div className="font-bold">{new Date(complaint.created_at).toLocaleDateString()}</div>
                              <div className={`text-xs ${isDark ? 'text-white/50' : 'text-stone-500'}`}>{new Date(complaint.created_at).toLocaleTimeString()}</div>
                            </td>
                            <td className="p-4 sm:p-6 border-r border-inherit">
                              <div className="font-bold">{complaint.profiles?.name || 'Unknown'}</div>
                            </td>
                            <td className="p-4 sm:p-6 border-r border-inherit">
                              <div className="max-w-xs truncate" title={complaint.message}>{complaint.message}</div>
                            </td>
                            <td className="p-4 sm:p-6 border-r border-inherit">
                              <span className={`px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-lg ${
                                complaint.status === 'OPEN' ? (isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-700') :
                                complaint.status === 'IN_PROGRESS' ? (isDark ? 'bg-yellow-500/10 text-yellow-400' : 'bg-yellow-50 text-yellow-700') :
                                complaint.status === 'RESOLVED' ? (isDark ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-700') :
                                (isDark ? 'bg-gray-500/10 text-gray-400' : 'bg-gray-50 text-gray-700')
                              }`}>
                                {complaint.status.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="p-4 sm:p-6 text-right">
                              {complaint.status !== 'CLOSED' && (
                                <div className="flex gap-2 justify-end">
                                  {complaint.status === 'OPEN' && (
                                    <button
                                      onClick={() => handleComplaintStatusUpdate(complaint.id, 'IN_PROGRESS')}
                                      disabled={updatingComplaint === complaint.id}
                                      className={`px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${isDark ? 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20' : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'}`}
                                    >
                                      {updatingComplaint === complaint.id ? 'Starting...' : 'Start'}
                                    </button>
                                  )}
                                  {(complaint.status === 'OPEN' || complaint.status === 'IN_PROGRESS') && (
                                    <button
                                      onClick={() => handleComplaintStatusUpdate(complaint.id, 'RESOLVED')}
                                      disabled={updatingComplaint === complaint.id}
                                      className={`px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${isDark ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}
                                    >
                                      {updatingComplaint === complaint.id ? 'Resolving...' : 'Resolve'}
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleComplaintStatusUpdate(complaint.id, 'CLOSED')}
                                    disabled={updatingComplaint === complaint.id}
                                    className={`px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${isDark ? 'bg-gray-500/10 text-gray-400 hover:bg-gray-500/20' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}
                                  >
                                    {updatingComplaint === complaint.id ? 'Closing...' : 'Close'}
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
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