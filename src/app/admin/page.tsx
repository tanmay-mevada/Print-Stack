'use client'

import { useEffect, useState } from 'react'
import { getAdminMasterData } from './actions'
import { useTheme } from '@/context/ThemeContext'
import {
    IndianRupee, Activity, AlertTriangle, Store, Users,
    ShoppingCart, ShieldCheck, Sun, Moon, LayoutDashboard,
    Receipt, AlertOctagon, CheckCircle2, Clock, ArrowRight
} from 'lucide-react'
import LoadingScreen from '@/components/LoadingScreen'

export default function AdminSPA() {
    const { isDark, toggleTheme } = useTheme()
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'dashboard' | 'shops' | 'users' | 'orders' | 'disputes'>('dashboard')

    useEffect(() => {
        async function loadData() {
            const res = await getAdminMasterData()
            if (res.success) setData(res)
            setLoading(false)
        }
        loadData()
    }, [])

    if (loading) return <LoadingScreen isDark={isDark} />

    const { metrics, lists } = data;

    // ============================================================================
    // TAB RENDERERS
    // ============================================================================

    const renderDashboard = () => (
        <div className="space-y-10 animate-in fade-in zoom-in-95 duration-500">
            <div>
                <h1 className="text-4xl font-black tracking-tight mb-2">Platform Overview</h1>
                <p className={`font-medium ${isDark ? 'text-white/50' : 'text-stone-500'}`}>Welcome to the PrintStack command center.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className={`p-6 rounded-[2rem] border ${isDark ? 'bg-[#111111]/80 border-white/10' : 'bg-white border-stone-200'}`}>
                    <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-2xl ${isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'}`}><IndianRupee className="w-6 h-6" /></div>
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${isDark ? 'bg-white/5 text-white/50' : 'bg-stone-100 text-stone-500'}`}>Completed</span>
                    </div>
                    <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${isDark ? 'text-white/40' : 'text-stone-500'}`}>Total Revenue</p>
                    <p className="text-4xl font-black tracking-tighter">₹{metrics.totalRevenue.toLocaleString('en-IN')}</p>
                </div>

                <div className={`p-6 rounded-[2rem] border ${isDark ? 'bg-[#111111]/80 border-white/10' : 'bg-white border-stone-200'}`}>
                    <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-2xl ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}><Activity className="w-6 h-6" /></div>
                    </div>
                    <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${isDark ? 'text-white/40' : 'text-stone-500'}`}>Active Queue</p>
                    <p className="text-4xl font-black tracking-tighter">{metrics.activeOrdersCount}</p>
                </div>

                <div className={`p-6 rounded-[2rem] border ${isDark ? 'bg-[#111111]/80 border-white/10' : 'bg-white border-stone-200'}`}>
                    <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-2xl ${isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600'}`}><Store className="w-6 h-6" /></div>
                    </div>
                    <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${isDark ? 'text-white/40' : 'text-stone-500'}`}>Registered Shops</p>
                    <p className="text-4xl font-black tracking-tighter">{metrics.shopsCount}</p>
                </div>

                <div className={`p-6 rounded-[2rem] border ${isDark ? 'bg-[#111111]/80 border-white/10' : 'bg-white border-stone-200'}`}>
                    <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-2xl ${isDark ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-600'}`}><Users className="w-6 h-6" /></div>
                    </div>
                    <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${isDark ? 'text-white/40' : 'text-stone-500'}`}>Total Users</p>
                    <p className="text-4xl font-black tracking-tighter">{metrics.usersCount}</p>
                </div>
            </div>

            {(metrics.pendingRefunds > 0 || metrics.openComplaints > 0) && (
                <div className={`p-6 rounded-[2rem] border flex items-center justify-between ${isDark ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-full ${isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600'}`}><AlertTriangle className="w-6 h-6" /></div>
                        <div>
                            <h3 className={`font-black text-lg ${isDark ? 'text-red-400' : 'text-red-700'}`}>Attention Required</h3>
                            <p className={`text-sm font-bold ${isDark ? 'text-red-400/70' : 'text-red-600/70'}`}>You have {metrics.pendingRefunds} pending refunds and {metrics.openComplaints} open complaints.</p>
                        </div>
                    </div>
                    <button onClick={() => setActiveTab('disputes')} className={`px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-colors ${isDark ? 'bg-red-500 text-black hover:bg-red-400' : 'bg-red-600 text-white hover:bg-red-500'}`}>Resolve Now</button>
                </div>
            )}
        </div>
    )

    const renderShops = () => (
        <div className="space-y-6 animate-in fade-in duration-500">
            <h2 className="text-3xl font-black tracking-tight">Shop Directory</h2>
            <div className={`rounded-[2rem] border overflow-hidden ${isDark ? 'border-white/10' : 'border-stone-200'}`}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead>
                            <tr className={`border-b text-[10px] uppercase tracking-widest font-black ${isDark ? 'bg-white/5 border-white/10 text-white/50' : 'bg-stone-50 border-stone-200 text-stone-500'}`}>
                                <th className="p-5">Shop Name</th>
                                <th className="p-5">Location</th>
                                <th className="p-5">Contact</th>
                                <th className="p-5 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y text-sm font-bold ${isDark ? 'divide-white/10' : 'divide-stone-200'}`}>
                            {lists.shops.map((shop: any) => (
                                <tr key={shop.id} className={`transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-stone-50'}`}>
                                    <td className="p-5 flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full overflow-hidden border flex items-center justify-center shrink-0 ${isDark ? 'bg-white/10 border-white/20' : 'bg-stone-200 border-stone-300'}`}>
                                            {shop.profile_pic ? <img src={shop.profile_pic} alt="pic" className="w-full h-full object-cover" /> : <Store className="w-4 h-4 opacity-50" />}
                                        </div>
                                        <span className="truncate">{shop.name}</span>
                                    </td>
                                    <td className="p-5 truncate max-w-[200px]">{shop.address}</td>
                                    <td className="p-5">
                                        <div className="flex flex-col">
                                            <span className="truncate">{shop.profiles?.email || 'N/A'}</span>
                                            <span className={`text-xs font-mono mt-0.5 ${isDark ? 'text-white/40' : 'text-stone-500'}`}>{shop.phone}</span>
                                        </div>
                                    </td>
                                    <td className="p-5 text-right">
                                        {shop.is_active ? <span className="text-green-500">Active</span> : <span className="text-red-500">Inactive</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )

    const renderUsers = () => (
        <div className="space-y-6 animate-in fade-in duration-500">
            <h2 className="text-3xl font-black tracking-tight">Users Directory</h2>
            <div className={`rounded-[2rem] border overflow-hidden ${isDark ? 'border-white/10' : 'border-stone-200'}`}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                            <tr className={`border-b text-[10px] uppercase tracking-widest font-black ${isDark ? 'bg-white/5 border-white/10 text-white/50' : 'bg-stone-50 border-stone-200 text-stone-500'}`}>
                                <th className="p-5">User</th>
                                <th className="p-5">Contact Details</th>
                                <th className="p-5">Account Role</th>
                                <th className="p-5 text-right">Joined Date</th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y text-sm font-bold ${isDark ? 'divide-white/10' : 'divide-stone-200'}`}>
                            {lists.profiles.map((user: any) => (
                                <tr key={user.id} className={`transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-stone-50'}`}>
                                    <td className="p-5 flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full overflow-hidden border flex items-center justify-center shrink-0 ${isDark ? 'bg-white/10 border-white/20' : 'bg-stone-200 border-stone-300'}`}>
                                            {user.profile_pic ? <img src={user.profile_pic} alt="pic" className="w-full h-full object-cover" /> : <Users className="w-4 h-4 opacity-50" />}
                                        </div>
                                        <span className="truncate">{user.name || 'Anonymous User'}</span>
                                    </td>
                                    <td className="p-5">
                                        <div className="flex flex-col">
                                            <span className="truncate max-w-[200px]">{user.email || 'N/A'}</span>
                                            <span className={`text-xs mt-0.5 ${isDark ? 'text-white/40' : 'text-stone-500'}`}>{user.phone || 'No phone added'}</span>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <span className={`px-2.5 py-1 text-[10px] rounded-md uppercase tracking-widest border ${user.role === 'SHOP_OWNER' ? (isDark ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-purple-50 text-purple-700 border-purple-200') : (isDark ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-50 text-blue-700 border-blue-200')}`}>
                                            {user.role || 'STUDENT'}
                                        </span>
                                    </td>
                                    <td className="p-5 text-right whitespace-nowrap text-xs opacity-70">
                                        {new Date(user.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )

    const renderOrders = () => (
        <div className="space-y-6 animate-in fade-in duration-500">
            <h2 className="text-3xl font-black tracking-tight">Global Ledger</h2>
            <div className={`rounded-[2rem] border overflow-hidden ${isDark ? 'border-white/10' : 'border-stone-200'}`}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead>
                            <tr className={`border-b text-[10px] uppercase tracking-widest font-black ${isDark ? 'bg-white/5 border-white/10 text-white/50' : 'bg-stone-50 border-stone-200 text-stone-500'}`}>
                                <th className="p-5 w-24">Order ID</th>
                                <th className="p-5">Date & Time</th>
                                <th className="p-5">Route (Shop ← Student)</th>
                                <th className="p-5 text-right">Amount</th>
                                <th className="p-5 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y text-sm font-bold ${isDark ? 'divide-white/10' : 'divide-stone-200'}`}>
                            {lists.orders.map((order: any) => (
                                <tr key={order.id} className={`transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-stone-50'}`}>
                                    <td className="p-5 font-mono text-[10px] uppercase opacity-70">
                                        {order.id.split('-')[0]}
                                    </td>
                                    <td className="p-5 whitespace-nowrap text-xs">
                                        {new Date(order.created_at).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td className="p-5">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-1 rounded text-[10px] uppercase tracking-widest truncate max-w-[120px] ${isDark ? 'bg-white/5' : 'bg-stone-100'}`}>{order.shops?.name || 'Unknown Shop'}</span>
                                            <ArrowRight className="w-3 h-3 opacity-30 shrink-0" />
                                            <span className={`px-2 py-1 rounded text-[10px] uppercase tracking-widest truncate max-w-[120px] ${isDark ? 'bg-white/5' : 'bg-stone-100'}`}>{order.profiles?.name || 'Anonymous'}</span>
                                        </div>
                                    </td>
                                    <td className="p-5 text-right font-black text-lg tracking-tighter">
                                        ₹{order.total_price}
                                    </td>
                                    <td className="p-5 text-right">
                                        <span className={`px-2.5 py-1 text-[10px] rounded-md uppercase tracking-widest border ${order.status === 'COMPLETED' ? (isDark ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-green-50 text-green-700 border-green-200') :
                                                order.status === 'READY' ? (isDark ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-indigo-50 text-indigo-700 border-indigo-200') :
                                                    order.status === 'PRINTING' ? (isDark ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-orange-50 text-orange-700 border-orange-200') :
                                                        (isDark ? 'bg-white/5 text-white/50 border-white/10' : 'bg-stone-100 text-stone-500 border-stone-200')
                                            }`}>
                                            {order.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {lists.orders.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center opacity-50 font-bold">No orders processed yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )

    const renderDisputes = () => (
        <div className="space-y-8 animate-in fade-in duration-500">
            <h2 className="text-3xl font-black tracking-tight">Disputes & Refunds</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className={`border rounded-[2.5rem] p-8 ${isDark ? 'bg-[#111111]/60 border-white/10' : 'bg-white border-stone-200'}`}>
                    <h3 className="text-xl font-black flex items-center gap-2 mb-6"><IndianRupee className="w-5 h-5 text-yellow-500" /> Pending Refunds</h3>
                    <div className="space-y-4">
                        {lists.refunds.length === 0 ? <p className="opacity-50 font-bold text-sm">No refund requests.</p> : lists.refunds.map((refund: any) => (
                            <div key={refund.id} className={`p-4 rounded-2xl border ${isDark ? 'bg-[#0A0A0A] border-white/5' : 'bg-stone-50 border-stone-100'}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-black text-lg">₹{refund.amount}</span>
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${refund.status === 'REQUESTED' ? (isDark ? 'bg-yellow-500/20 text-yellow-500' : 'bg-yellow-100 text-yellow-700') : 'opacity-50'}`}>{refund.status}</span>
                                </div>
                                <p className="font-bold text-sm mb-2">"{refund.reason}"</p>
                                <p className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-white/40' : 'text-stone-500'}`}>{refund.profiles?.name} (Shop: {refund.shops?.name})</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={`border rounded-[2.5rem] p-8 ${isDark ? 'bg-[#111111]/60 border-white/10' : 'bg-white border-stone-200'}`}>
                    <h3 className="text-xl font-black flex items-center gap-2 mb-6"><AlertTriangle className="w-5 h-5 text-red-500" /> User Complaints</h3>
                    <div className="space-y-4">
                        {lists.complaints.length === 0 ? <p className="opacity-50 font-bold text-sm">No active complaints.</p> : lists.complaints.map((complaint: any) => (
                            <div key={complaint.id} className={`p-4 rounded-2xl border ${isDark ? 'bg-[#0A0A0A] border-white/5' : 'bg-stone-50 border-stone-100'}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${complaint.status === 'OPEN' ? (isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600') : 'opacity-50'}`}>{complaint.status}</span>
                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-white/40' : 'text-stone-500'}`}>{new Date(complaint.created_at).toLocaleDateString()}</span>
                                </div>
                                <p className="font-bold text-sm mb-2">"{complaint.message}"</p>
                                <p className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-white/40' : 'text-stone-500'}`}>{complaint.profiles?.name} regarding {complaint.shops?.name}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )

    // ============================================================================
    // SIDEBAR NAVIGATION
    // ============================================================================
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'shops', label: 'Manage Shops', icon: Store },
        { id: 'users', label: 'Users Directory', icon: Users },
        { id: 'orders', label: 'Global Ledger', icon: Receipt },
        { id: 'disputes', label: 'Disputes & Refunds', icon: AlertOctagon },
    ] as const;

    return (
        <div className={`min-h-screen flex font-sans transition-colors duration-500 ${isDark ? 'bg-[#050505] text-white selection:bg-white/20' : 'bg-[#faf9f6] text-stone-900 selection:bg-stone-900/20'}`}>

            {/* SIDEBAR */}
            <aside className={`w-72 border-r flex flex-col shrink-0 transition-colors z-20 relative ${isDark ? 'bg-[#0A0A0A] border-white/10' : 'bg-white border-stone-200'}`}>
                <div className={`p-6 border-b flex items-center justify-between ${isDark ? 'border-white/10' : 'border-stone-200'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <h1 className="font-black text-xl tracking-tight">Admin</h1>
                    </div>
                    <button onClick={toggleTheme} className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-stone-100'}`}>
                        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    {navItems.map((item) => {
                        const isActive = activeTab === item.id;
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm tracking-widest uppercase transition-all ${isActive
                                        ? (isDark ? 'bg-white/10 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]' : 'bg-stone-900 text-white shadow-md')
                                        : (isDark ? 'text-white/50 hover:bg-white/5 hover:text-white' : 'text-stone-500 hover:bg-stone-100 hover:text-stone-900')
                                    }`}
                            >
                                <Icon className={`w-5 h-5 ${isActive ? '' : 'opacity-50'}`} />
                                {item.label}
                            </button>
                        )
                    })}
                </nav>
            </aside>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 h-screen overflow-y-auto p-8 sm:p-12 relative">
                {/* Background ambient glow based on active tab */}
                {isDark && (
                    <div className={`fixed top-0 right-0 w-[800px] h-[800px] rounded-full blur-[150px] opacity-20 pointer-events-none transition-colors duration-1000 ${activeTab === 'disputes' ? 'bg-red-500' : activeTab === 'dashboard' ? 'bg-indigo-500' : 'bg-white/5'
                        }`} />
                )}

                <div className="max-w-6xl mx-auto relative z-10">
                    {activeTab === 'dashboard' && renderDashboard()}
                    {activeTab === 'shops' && renderShops()}
                    {activeTab === 'users' && renderUsers()}
                    {activeTab === 'orders' && renderOrders()}
                    {activeTab === 'disputes' && renderDisputes()}
                </div>
            </main>
        </div>
    )
}