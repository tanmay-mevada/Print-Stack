'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { updateOrderStatusAction, verifyPickupOTPAction, getDownloadUrlAction } from '@/app/shop/actions'
import { ArrowLeft, FileText, Download, CheckCircle2, Clock, User, FileDigit, RefreshCw, KeyRound, X, AlertCircle, Layers, BookOpen, Paperclip, Activity, Flame } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import LoadingScreen from '@/components/LoadingScreen'
import { useTheme } from '@/context/ThemeContext'

export default function OrderDetailsPage() {
    const params = useParams()
    const router = useRouter()
    
    const { isDark } = useTheme() 

    const [order, setOrder] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState(false)
    
    const [otpInput, setOtpInput] = useState('')
    const [verifying, setVerifying] = useState(false)
    const [showOtpModal, setShowOtpModal] = useState(false) 

    useEffect(() => {
        async function fetchOrderDetails() {
            if (!params?.id) return;
            
            const supabase = createClient()
            const { data, error } = await supabase
                .from('orders')
                .select('*, profiles:student_id(name)')
                .eq('id', params.id)
                .single()

            if (data) {
                setOrder(data)
            } else {
                console.error("Failed to fetch order:", error)
                toast.error("Failed to load order details.")
            }
            setLoading(false)
        }
        
        fetchOrderDetails()
    }, [params?.id])

    const handleDownload = async () => {
        if (!order?.file_path) return toast.error("No file found for this order.")
        const loadingToast = toast.loading("Generating secure download link...")
        const res = await getDownloadUrlAction(order.file_path)
        toast.dismiss(loadingToast)
        if (res.url) {
            window.open(res.url, '_blank')
            toast.success("Download started!")
        } else {
            toast.error("Could not generate link: " + (res.error || 'Unknown error'))
        }
    }

    const handleStatusUpdate = async (newStatus: string) => {
        setUpdating(true)
        const updateToast = toast.loading(`Updating status to ${newStatus}...`)
        const res = await updateOrderStatusAction(order.id, newStatus, order.student_id)
        toast.dismiss(updateToast)
        
        if (res.success) {
            setOrder({ ...order, status: newStatus })
            if (newStatus === 'READY') toast.success("Order Ready! OTP email securely sent to student.", { duration: 5000 })
            else toast.success(`Order moved to ${newStatus}`)
        } else {
            toast.error(`Error: ${res.error}`)
        }
        setUpdating(false)
    }

    const handleVerifyOtp = async () => {
        if (!otpInput || otpInput.length !== 6) return toast.error("Please enter the 6-digit OTP.")
        setVerifying(true)
        const verifyToast = toast.loading("Verifying code...")
        const res = await verifyPickupOTPAction(order.id, otpInput)
        toast.dismiss(verifyToast)

        if (res.success) {
            setOrder({ ...order, status: 'COMPLETED' })
            toast.success("OTP Verified! Order is now complete.", { duration: 4000 })
            setShowOtpModal(false)
            setOtpInput('') 
        } else {
            toast.error(res.error || "Invalid OTP. Please try again.")
        }
        setVerifying(false)
    }

    if (loading) return <LoadingScreen isDark={isDark} />

    if (!order) {
        return (
            <div className={`min-h-screen flex flex-col items-center justify-center transition-colors duration-700 ${isDark ? 'bg-[#050505] text-white' : 'bg-[#faf9f6] text-stone-900'}`}>
                <h1 className="text-2xl font-black mb-4">Order Not Found</h1>
                <button onClick={() => router.push('/shop/dashboard')} className={`px-6 py-3 rounded-xl transition-all font-bold tracking-widest uppercase text-sm ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-stone-200 hover:bg-stone-300'}`}>
                    Return to Dashboard
                </button>
            </div>
        )
    }

    const fileName = order.file_path ? order.file_path.split('-').slice(1).join('-') : 'Document.pdf'
    const isMixedPrint = order.print_type === 'MIXED';
    const isMixedSided = order.sided === 'MIXED';
    const hasAdvancedConfig = isMixedPrint || isMixedSided;

    // Check for Finishing Touches
    const hasFinishingTouches = 
        (order.binding_type && order.binding_type !== 'NONE') || 
        (order.cover_type && order.cover_type !== 'NONE') || 
        order.wants_stapling || 
        order.wants_lamination;

    return (
        <div className={`min-h-screen font-sans transition-colors duration-700 pb-20 ${
            isDark ? 'bg-[#050505] text-white selection:bg-white/20' : 'bg-[#faf9f6] text-stone-900 selection:bg-stone-900/20'
        }`}>
            
            <Toaster 
                position="top-center"
                toastOptions={{
                    style: {
                        background: isDark ? '#111111' : '#ffffff', color: isDark ? '#fff' : '#1c1917',
                        border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e7e5e4',
                        borderRadius: '16px', padding: '16px 24px', fontSize: '14px', fontWeight: 'bold',
                        boxShadow: isDark ? '0 20px 40px rgba(0,0,0,0.5)' : '0 20px 40px rgba(0,0,0,0.1)',
                    }
                }}
            />

            <div className="p-6 sm:p-10 max-w-5xl mx-auto">
                
                {/* Header & Back Button */}
                <button 
                    onClick={() => router.push('/shop/dashboard')} 
                    className={`flex items-center gap-2 text-sm font-bold uppercase tracking-widest mb-8 transition-colors ${
                        isDark ? 'text-white/50 hover:text-white' : 'text-stone-500 hover:text-stone-900'
                    }`}
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                </button>

                {/* 🔥 MASSIVE PRIORITY ALERT BANNER 🔥 */}
                {order.is_priority && (
                    <div className={`mb-10 p-6 sm:p-8 rounded-[2.5rem] border-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-2xl animate-in slide-in-from-top-4 duration-500 ${
                        isDark 
                        ? 'bg-orange-500/10 border-orange-500/50 shadow-[0_0_40px_rgba(249,115,22,0.15)] ring-1 ring-orange-500/20' 
                        : 'bg-orange-50 border-orange-400 shadow-orange-500/20'
                    }`}>
                        <div className="flex items-center gap-5">
                            <div className={`p-4 rounded-full animate-pulse shrink-0 ${isDark ? 'bg-orange-500/20 text-orange-500' : 'bg-orange-200 text-orange-600'}`}>
                                <Flame className="w-8 h-8" />
                            </div>
                            <div>
                                <h2 className={`text-2xl sm:text-3xl font-black tracking-tight uppercase ${isDark ? 'text-orange-500' : 'text-orange-700'}`}>
                                    Priority Order
                                </h2>
                                <p className={`text-sm font-bold mt-1 ${isDark ? 'text-orange-500/70' : 'text-orange-600/80'}`}>
                                    This student paid a 1.5x surge charge to jump the queue. Please process immediately.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-3">Order Details</h1>
                        <p className={`font-mono text-sm tracking-widest uppercase ${isDark ? 'text-white/40' : 'text-stone-400'}`}>ID: {order.id}</p>
                    </div>
                    
                    <div className={`px-5 py-3 rounded-2xl text-sm font-black uppercase tracking-widest border backdrop-blur-md flex items-center gap-3 ${
                        order.status === 'COMPLETED' ? (isDark ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-green-50 border-green-200 text-green-700') :
                        order.status === 'READY' ? (isDark ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-indigo-50 border-indigo-200 text-indigo-700') :
                        order.status === 'PRINTING' ? (isDark ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' : 'bg-orange-50 border-orange-200 text-orange-700') :
                        (isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-stone-100 border-stone-200 text-stone-700')
                    }`}>
                        <div className={`w-2.5 h-2.5 rounded-full ${
                            order.status === 'COMPLETED' ? (isDark ? 'bg-green-400' : 'bg-green-500') :
                            order.status === 'READY' ? (isDark ? 'bg-indigo-400 animate-pulse' : 'bg-indigo-500 animate-pulse') :
                            order.status === 'PRINTING' ? (isDark ? 'bg-orange-400 animate-pulse' : 'bg-orange-500 animate-pulse') : 
                            (isDark ? 'bg-white' : 'bg-stone-400')
                        }`} />
                        STATUS: {order.status}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    
                    {/* Left Column: Order Info */}
                    <div className="md:col-span-2 space-y-6">
                        
                        {/* MAIN DOCUMENT CARD */}
                        <div className={`border p-8 sm:p-10 rounded-[2.5rem] ring-1 backdrop-blur-xl transition-colors duration-500 ${
                            order.is_priority 
                                ? (isDark ? 'bg-orange-950/20 border-orange-500/30 shadow-[0_10px_40px_-15px_rgba(249,115,22,0.3)] ring-orange-500/20' : 'bg-orange-50/50 border-orange-300 shadow-xl shadow-orange-200/50 ring-orange-200')
                                : (isDark ? 'bg-[#111111]/80 border-white/10 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.5)] ring-white/5' : 'bg-white border-stone-200 shadow-xl shadow-stone-200/50 ring-stone-100')
                        }`}>
                            <h2 className={`text-xs font-bold uppercase tracking-widest mb-8 flex items-center gap-2 ${order.is_priority ? (isDark ? 'text-orange-400' : 'text-orange-600') : (isDark ? 'text-white/40' : 'text-stone-400')}`}>
                                <FileDigit className="w-4 h-4" /> Document Overview
                            </h2>
                            
                            <div className={`flex items-start gap-6 mb-10 pb-10 border-b ${order.is_priority ? (isDark ? 'border-orange-500/20' : 'border-orange-200') : (isDark ? 'border-white/5' : 'border-stone-100')}`}>
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border shadow-lg ${
                                    order.is_priority 
                                        ? (isDark ? 'bg-gradient-to-br from-orange-500/20 to-orange-500/5 border-orange-500/30 text-orange-500' : 'bg-gradient-to-br from-orange-100 to-white border-orange-300 text-orange-600')
                                        : (isDark ? 'bg-gradient-to-br from-white/20 to-white/5 border-white/10 text-white' : 'bg-gradient-to-br from-stone-100 to-white border-stone-200 text-stone-900')
                                }`}>
                                    <FileText className="w-8 h-8 drop-shadow-md" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-black text-2xl truncate mb-2">{fileName}</p>
                                    <p className={`font-bold uppercase tracking-widest text-xs flex items-center gap-2 ${isDark ? 'text-white/50' : 'text-stone-500'}`}>
                                        <Clock className="w-3.5 h-3.5" />
                                        {new Date(order.created_at).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>

                            {/* UPDATED 5-COLUMN GRID (Added Paper Size) */}
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-y-8 gap-x-4 mb-8">
                                <div>
                                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${isDark ? 'text-white/40' : 'text-stone-400'}`}>Paper Size</p>
                                    <p className="font-black text-xl text-yellow-500">{order.paper_size || 'A4'}</p>
                                </div>
                                <div>
                                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${isDark ? 'text-white/40' : 'text-stone-400'}`}>Color Mode</p>
                                    <p className={`font-black text-xl ${isMixedPrint ? (isDark ? 'text-yellow-500' : 'text-yellow-600') : ''}`}>
                                        {isMixedPrint ? 'Mixed' : order.print_type === 'COLOR' ? 'Color' : 'B & W'}
                                    </p>
                                </div>
                                <div>
                                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${isDark ? 'text-white/40' : 'text-stone-400'}`}>Layout</p>
                                    <p className={`font-black text-xl ${isMixedSided ? (isDark ? 'text-indigo-400' : 'text-indigo-600') : ''}`}>
                                        {isMixedSided ? 'Mixed' : order.sided === 'DOUBLE' ? 'Double' : 'Single'}
                                    </p>
                                </div>
                                <div>
                                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${isDark ? 'text-white/40' : 'text-stone-400'}`}>Pages</p>
                                    <p className="font-black text-xl">{order.total_pages}</p>
                                </div>
                                <div>
                                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${isDark ? 'text-white/40' : 'text-stone-400'}`}>Copies</p>
                                    <p className="font-black text-xl">{order.copies}</p>
                                </div>
                            </div>

                            {/* FINISHING TOUCHES UI */}
                            {hasFinishingTouches && (
                                <div className={`mt-8 p-6 rounded-2xl border ${isDark ? 'bg-[#1a1a1a] border-white/10' : 'bg-stone-50 border-stone-200'}`}>
                                    <h3 className={`text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                        <Layers className="w-3.5 h-3.5" /> Required Finishing Touches
                                    </h3>
                                    <div className="flex flex-wrap gap-3">
                                        {order.binding_type === 'SPIRAL' && (
                                            <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border flex items-center gap-2 ${isDark ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300' : 'bg-indigo-50 border-indigo-200 text-indigo-700'}`}><BookOpen className="w-4 h-4"/> Spiral Binding</span>
                                        )}
                                        {order.binding_type === 'HARD' && (
                                            <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border flex items-center gap-2 ${isDark ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300' : 'bg-indigo-50 border-indigo-200 text-indigo-700'}`}><BookOpen className="w-4 h-4"/> Hard Binding</span>
                                        )}
                                        {order.cover_type === 'PAPER' && (
                                            <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border flex items-center gap-2 ${isDark ? 'bg-orange-500/10 border-orange-500/30 text-orange-300' : 'bg-orange-50 border-orange-200 text-orange-700'}`}><FileText className="w-4 h-4"/> Paper Folder</span>
                                        )}
                                        {order.cover_type === 'PLASTIC' && (
                                            <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border flex items-center gap-2 ${isDark ? 'bg-blue-500/10 border-blue-500/30 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-700'}`}><Layers className="w-4 h-4"/> Plastic Cover</span>
                                        )}
                                        {order.wants_stapling && (
                                            <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border flex items-center gap-2 ${isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-300' : 'bg-white border-stone-300 text-stone-700 shadow-sm'}`}><Paperclip className="w-4 h-4"/> Stapled</span>
                                        )}
                                        {order.wants_lamination && (
                                            <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border flex items-center gap-2 ${isDark ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300' : 'bg-cyan-50 border-cyan-200 text-cyan-700'}`}><Layers className="w-4 h-4"/> Laminated</span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ADVANCED PRINT INSTRUCTIONS ALERT BOX */}
                            {hasAdvancedConfig && (
                                <div className={`mt-6 p-6 rounded-2xl border ${isDark ? 'bg-[#1a1a1a] border-white/10' : 'bg-stone-50 border-stone-200'}`}>
                                    <h3 className="font-black tracking-widest uppercase text-xs flex items-center gap-2 mb-4">
                                        <AlertCircle className={`w-4 h-4 ${isDark ? 'text-yellow-500' : 'text-yellow-600'}`} /> 
                                        Custom Mixed Instructions
                                    </h3>
                                    <div className="space-y-3">
                                        {isMixedPrint && order.color_pages && (
                                            <div className="flex justify-between items-center pb-3 border-b border-dashed border-current border-opacity-20">
                                                <span className={`text-sm font-bold uppercase tracking-widest ${isDark ? 'text-white/50' : 'text-stone-500'}`}>Print in Color</span>
                                                <span className={`font-black text-lg ${isDark ? 'text-yellow-500' : 'text-yellow-700'}`}>Pages {order.color_pages}</span>
                                            </div>
                                        )}
                                        {isMixedSided && order.double_pages && (
                                            <div className="flex justify-between items-center">
                                                <span className={`text-sm font-bold uppercase tracking-widest ${isDark ? 'text-white/50' : 'text-stone-500'}`}>Print Double-Sided</span>
                                                <span className={`font-black text-lg ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>Pages {order.double_pages}</span>
                                            </div>
                                        )}
                                        <p className={`text-[10px] uppercase font-bold tracking-widest mt-4 pt-2 opacity-60`}>
                                            *All other pages print as standard B&W / Single Sided
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className={`border p-8 sm:p-10 rounded-[2.5rem] shadow-xl ring-1 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6 transition-colors duration-500 ${
                            isDark ? 'bg-[#111111]/80 border-white/10 ring-white/5' : 'bg-white border-stone-200 ring-stone-100 shadow-stone-200/50'
                        }`}>
                            <div>
                                <h2 className={`text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2 ${isDark ? 'text-white/40' : 'text-stone-400'}`}>
                                    <User className="w-4 h-4" /> Student Name
                                </h2>
                                <p className="font-black text-2xl">{order.profiles?.name || 'Anonymous Student'}</p>
                            </div>
                            <div className={`sm:text-right p-5 rounded-2xl border ${
                                order.is_priority 
                                ? (isDark ? 'bg-orange-500/10 border-orange-500/30' : 'bg-orange-50 border-orange-200')
                                : (isDark ? 'bg-white/5 border-white/10' : 'bg-stone-50 border-stone-200')
                            }`}>
                                <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center sm:justify-end gap-1 ${isDark ? 'text-white/40' : 'text-stone-400'}`}>
                                    Total Amount {order.is_priority && <span className="text-orange-500 font-black">(INCLUDES SURGE)</span>}
                                </p>
                                <p className="font-black text-4xl">₹{order.total_price}</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Actions */}
                    <div className="space-y-6">
                        <div className={`border p-8 rounded-[2.5rem] shadow-xl ring-1 backdrop-blur-xl transition-colors duration-500 ${
                            isDark ? 'bg-gradient-to-b from-[#1a1a1e] to-[#111111] border-white/10 ring-white/5' : 'bg-white border-stone-200 ring-stone-100 shadow-stone-200/50'
                        }`}>
                            <h3 className="font-black text-xl mb-2">Print File</h3>
                            <p className={`text-sm font-medium mb-8 leading-relaxed ${isDark ? 'text-white/50' : 'text-stone-500'}`}>Download the secure PDF to your local machine for printing.</p>
                            
                            <button 
                                onClick={handleDownload}
                                className={`w-full py-5 rounded-[1.5rem] font-black tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-3 hover:-translate-y-1 ${
                                    isDark ? 'bg-white text-black hover:bg-gray-200 shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:shadow-[0_0_40px_rgba(255,255,255,0.25)]' : 'bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/20'
                                }`}
                            >
                                <Download className="w-5 h-5" /> Download PDF
                            </button>
                        </div>

                        <div className={`border p-8 rounded-[2.5rem] shadow-xl ring-1 backdrop-blur-xl transition-colors duration-500 ${
                            isDark ? 'bg-[#111111]/80 border-white/10 ring-white/5' : 'bg-white border-stone-200 ring-stone-100 shadow-stone-200/50'
                        }`}>
                            <h3 className="font-black text-xl mb-6 flex items-center gap-3">
                                <RefreshCw className={`w-5 h-5 ${updating ? 'animate-spin' : ''}`} /> 
                                Progress
                            </h3>
                            
                            <div className="flex flex-col gap-4">
                                <button 
                                    onClick={() => handleStatusUpdate('PRINTING')}
                                    disabled={order.status === 'PRINTING' || order.status === 'READY' || order.status === 'COMPLETED'}
                                    className={`py-4 px-5 rounded-2xl font-bold tracking-widest uppercase text-sm border transition-all text-left flex items-center justify-between group ${
                                        order.status === 'PRINTING' || order.status === 'READY' || order.status === 'COMPLETED'
                                        ? (isDark ? 'bg-orange-500/10 border-orange-500/20 text-orange-500/50 cursor-not-allowed' : 'bg-orange-50 border-orange-200 text-orange-700/50 cursor-not-allowed') 
                                        : (isDark ? 'bg-white/5 border-white/10 hover:bg-orange-500/20 hover:text-orange-400 hover:border-orange-500/50 text-white' : 'bg-stone-50 border-stone-200 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-300 text-stone-700')
                                    }`}
                                >
                                    1. Mark as Printing
                                    {(order.status === 'PRINTING' || order.status === 'READY' || order.status === 'COMPLETED') && <CheckCircle2 className="w-4 h-4" />}
                                </button>
                                
                                <button 
                                    onClick={() => handleStatusUpdate('READY')}
                                    disabled={order.status === 'READY' || order.status === 'COMPLETED'}
                                    className={`py-4 px-5 rounded-2xl font-bold tracking-widest uppercase text-sm border transition-all text-left flex items-center justify-between group ${
                                        order.status === 'READY' || order.status === 'COMPLETED'
                                        ? (isDark ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500/50 cursor-not-allowed' : 'bg-indigo-50 border-indigo-200 text-indigo-700/50 cursor-not-allowed')
                                        : (isDark ? 'bg-white/5 border-white/10 hover:bg-indigo-500/20 hover:text-indigo-400 hover:border-indigo-500/50 text-white' : 'bg-stone-50 border-stone-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 text-stone-700')
                                    }`}
                                >
                                    2. Ready for Pickup
                                    {(order.status === 'READY' || order.status === 'COMPLETED') && <CheckCircle2 className="w-4 h-4" />}
                                </button>

                                {order.status === 'COMPLETED' ? (
                                    <div className={`py-4 px-5 rounded-2xl font-bold tracking-widest uppercase text-sm border text-left flex justify-between items-center cursor-not-allowed ${
                                        isDark ? 'bg-green-500/10 border-green-500/20 text-green-500/50' : 'bg-green-50 border-green-200 text-green-700/50'
                                    }`}>
                                        3. Completed 
                                        <CheckCircle2 className={`w-4 h-4 ${isDark ? 'text-green-500' : 'text-green-600'}`} />
                                    </div>
                                ) : order.status === 'READY' ? (
                                    <button 
                                        onClick={() => setShowOtpModal(true)}
                                        className={`py-4 px-5 rounded-2xl font-bold tracking-widest uppercase text-sm border transition-all text-left flex items-center justify-between group ${
                                            isDark ? 'bg-white/5 border-white/10 hover:bg-green-500/20 hover:text-green-400 hover:border-green-500/50 text-white' : 'bg-stone-50 border-stone-200 hover:bg-green-50 hover:text-green-700 hover:border-green-300 text-stone-700'
                                        }`}
                                    >
                                        3. Enter OTP & Complete
                                    </button>
                                ) : (
                                    <button disabled={true} className={`py-4 px-5 rounded-2xl font-bold tracking-widest uppercase text-sm border text-left flex justify-between items-center cursor-not-allowed ${isDark ? 'bg-white/5 border-white/10 text-white/30' : 'bg-stone-50 border-stone-200 text-stone-400'}`}>
                                        3. Completed 
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ================= OTP VERIFICATION MODAL ================= */}
            {showOtpModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className={`w-full max-w-sm p-8 rounded-[2.5rem] shadow-2xl ring-1 animate-in zoom-in-95 duration-300 ${
                        isDark ? 'bg-[#111111] border-white/10 ring-white/5' : 'bg-white border-stone-200 ring-stone-100'
                    }`}>
                        <div className="flex justify-between items-center mb-8">
                            <h3 className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${isDark ? 'text-white/50' : 'text-stone-500'}`}>
                                <KeyRound className="w-4 h-4" /> Student Handover
                            </h3>
                            <button 
                                onClick={() => { setShowOtpModal(false); setOtpInput('') }} 
                                className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-white/10 text-white/50 hover:text-white' : 'hover:bg-stone-100 text-stone-400 hover:text-stone-700'}`}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <input 
                                type="text" 
                                placeholder="6-DIGIT OTP" 
                                maxLength={6}
                                value={otpInput}
                                onChange={(e) => setOtpInput(e.target.value.replace(/[^0-9]/g, ''))}
                                className={`w-full border rounded-xl px-4 py-4 font-mono text-2xl tracking-[0.5em] text-center outline-none transition-all placeholder:tracking-normal placeholder:text-sm ${
                                    isDark ? 'bg-[#0A0A0A] border-white/10 focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 placeholder:text-white/20 text-white' : 'bg-stone-50 border-stone-300 focus:border-green-500 focus:ring-1 focus:ring-green-500 placeholder:text-stone-400 text-stone-900'
                                }`}
                            />
                            <button 
                                onClick={handleVerifyOtp}
                                disabled={verifying || otpInput.length < 6}
                                className={`w-full py-4 rounded-xl font-black tracking-widest uppercase text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                                    isDark ? 'bg-green-500 text-black hover:bg-green-400 shadow-[0_0_20px_rgba(34,197,94,0.2)]' : 'bg-green-600 text-white hover:bg-green-500 shadow-md'
                                }`}
                            >
                                {verifying ? 'Verifying...' : 'Verify & Complete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}