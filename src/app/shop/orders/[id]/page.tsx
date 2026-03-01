'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { updateOrderStatusAction, verifyPickupOTPAction } from '@/app/(auth)/actions' 
import { ArrowLeft, FileText, Download, CheckCircle2, Clock, User, FileDigit, RefreshCw, KeyRound } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast' // <-- IMPORTED TOAST

export default function OrderDetailsPage() {
    const params = useParams()
    const router = useRouter()
    
    const [order, setOrder] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState(false)
    
    // OTP State
    const [otpInput, setOtpInput] = useState('')
    const [verifying, setVerifying] = useState(false)

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
        
        const supabase = createClient()
        const path = order.file_path.replace('uploads/', '')
        
        const { data, error } = await supabase.storage
            .from('print_files')
            .createSignedUrl(path, 60) 
            
        toast.dismiss(loadingToast)
            
        if (data?.signedUrl) {
            window.open(data.signedUrl, '_blank')
            toast.success("Download started!")
        } else {
            toast.error("Could not generate download link.")
        }
    }

    const handleStatusUpdate = async (newStatus: string) => {
        setUpdating(true)
        const updateToast = toast.loading(`Updating status to ${newStatus}...`)
        
        // Use your server action from (auth)/actions.ts
        const res = await updateOrderStatusAction(order.id, newStatus, order.student_id)
        
        toast.dismiss(updateToast)
        
        if (res.success) {
            setOrder({ ...order, status: newStatus })
            if (newStatus === 'READY') {
                toast.success("Order Ready! OTP email securely sent to student.", { duration: 5000 })
            } else {
                toast.success(`Order moved to ${newStatus}`)
            }
        } else {
            toast.error(`Error: ${res.error}`)
        }
        
        setUpdating(false)
    }

    const handleVerifyOtp = async () => {
        if (!otpInput || otpInput.length !== 6) return toast.error("Please enter the 6-digit OTP.")
        
        setVerifying(true)
        const verifyToast = toast.loading("Verifying code...")
        
        // Use your secure verification action from (auth)/actions.ts
        const res = await verifyPickupOTPAction(order.id, otpInput)

        toast.dismiss(verifyToast)

        if (res.success) {
            setOrder({ ...order, status: 'COMPLETED' })
            toast.success("OTP Verified! Order is now complete.", { duration: 4000 })
        } else {
            toast.error(res.error || "Invalid OTP. Please try again.")
        }
        
        setVerifying(false)
    }

    if (loading) {
        return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white/50 font-bold tracking-widest uppercase">Loading Details...</div>
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white">
                <h1 className="text-2xl font-black mb-4">Order Not Found</h1>
                <button onClick={() => router.push('/shop/dashboard')} className="px-6 py-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all font-bold tracking-widest uppercase text-sm">
                    Return to Dashboard
                </button>
            </div>
        )
    }

    const fileName = order.file_path ? order.file_path.split('-').slice(1).join('-') : 'Document.pdf'

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-white/20 pb-20">
            
            {/* ================= TOASTER CONFIGURATION ================= */}
            <Toaster 
                position="top-center"
                toastOptions={{
                    style: {
                        background: '#111111',
                        color: '#fff',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '16px',
                        padding: '16px 24px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        letterSpacing: '0.05em',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                    },
                    success: {
                        iconTheme: { primary: '#22c55e', secondary: '#050505' },
                    },
                    error: {
                        iconTheme: { primary: '#ef4444', secondary: '#050505' },
                    },
                }}
            />

            <div className="p-6 sm:p-10 max-w-5xl mx-auto">
                
                {/* ================= HEADER & BACK BUTTON ================= */}
                <button 
                    onClick={() => router.push('/shop/dashboard')} 
                    className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-white/50 hover:text-white mb-10 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                </button>

                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-3">Order Details</h1>
                        <p className="text-white/40 font-mono text-sm tracking-widest uppercase">ID: {order.id}</p>
                    </div>
                    
                    <div className={`px-5 py-3 rounded-2xl text-sm font-black uppercase tracking-widest border backdrop-blur-md flex items-center gap-3 ${
                        order.status === 'COMPLETED' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                        order.status === 'READY' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' :
                        order.status === 'PRINTING' ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' :
                        'bg-white/5 border-white/10 text-white'
                    }`}>
                        <div className={`w-2.5 h-2.5 rounded-full ${
                            order.status === 'COMPLETED' ? 'bg-green-400' :
                            order.status === 'READY' ? 'bg-indigo-400 animate-pulse' :
                            order.status === 'PRINTING' ? 'bg-orange-400 animate-pulse' : 'bg-white'
                        }`} />
                        STATUS: {order.status}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    
                    {/* ================= LEFT COLUMN: ORDER INFO ================= */}
                    <div className="md:col-span-2 space-y-8">
                        
                        {/* Document Card */}
                        <div className="bg-[#111111]/80 border border-white/10 p-8 sm:p-10 rounded-[2.5rem] shadow-[0_10px_30px_-15px_rgba(0,0,0,0.5)] ring-1 ring-white/5 backdrop-blur-xl">
                            <h2 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-8 flex items-center gap-2">
                                <FileDigit className="w-4 h-4" /> Document Overview
                            </h2>
                            
                            <div className="flex items-start gap-6 mb-10 pb-10 border-b border-white/5">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center shrink-0 border border-white/10 shadow-lg">
                                    <FileText className="w-8 h-8 text-white drop-shadow-md" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-black text-2xl truncate mb-2">{fileName}</p>
                                    <p className="text-white/50 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                                        <Clock className="w-3.5 h-3.5" />
                                        {new Date(order.created_at).toLocaleString('en-IN', {
                                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-8 gap-x-4">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Color Mode</p>
                                    <p className="font-black text-xl">{order.print_type === 'COLOR' ? 'Full Color' : 'B & W'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Layout</p>
                                    <p className="font-black text-xl">{order.sided === 'DOUBLE' ? 'Double Sided' : 'Single Sided'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Pages</p>
                                    <p className="font-black text-xl">{order.total_pages} Pages</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Copies</p>
                                    <p className="font-black text-xl">{order.copies} Copies</p>
                                </div>
                            </div>
                        </div>

                        {/* Customer & Payment Card */}
                        <div className="bg-[#111111]/80 border border-white/10 p-8 sm:p-10 rounded-[2.5rem] shadow-xl ring-1 ring-white/5 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                            <div>
                                <h2 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-2 flex items-center gap-2">
                                    <User className="w-4 h-4" /> Student Name
                                </h2>
                                <p className="font-black text-2xl">{order.profiles?.name || 'Anonymous Student'}</p>
                            </div>
                            <div className="sm:text-right p-5 rounded-2xl bg-white/5 border border-white/10">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Total Amount</p>
                                <p className="font-black text-4xl">₹{order.total_price}</p>
                            </div>
                        </div>
                    </div>

                    {/* ================= RIGHT COLUMN: ACTIONS ================= */}
                    <div className="space-y-6">
                        
                        {/* Download Action */}
                        <div className="bg-gradient-to-b from-[#1a1a1e] to-[#111111] border border-white/10 p-8 rounded-[2.5rem] shadow-xl ring-1 ring-white/5 backdrop-blur-xl">
                            <h3 className="font-black text-xl mb-2">Print File</h3>
                            <p className="text-sm font-medium text-white/50 mb-8 leading-relaxed">Download the secure PDF to your local machine for printing.</p>
                            
                            <button 
                                onClick={handleDownload}
                                className="w-full py-5 rounded-[1.5rem] font-black tracking-widest uppercase transition-all duration-300 bg-white text-black hover:bg-gray-200 flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:shadow-[0_0_40px_rgba(255,255,255,0.25)] hover:-translate-y-1"
                            >
                                <Download className="w-5 h-5" /> Download PDF
                            </button>
                        </div>

                        {/* Status Management Pipeline */}
                        <div className="bg-[#111111]/80 border border-white/10 p-8 rounded-[2.5rem] shadow-xl ring-1 ring-white/5 backdrop-blur-xl">
                            <h3 className="font-black text-xl mb-6 flex items-center gap-3">
                                <RefreshCw className={`w-5 h-5 ${updating ? 'animate-spin' : ''}`} /> 
                                Progress
                            </h3>
                            
                            <div className="flex flex-col gap-4">
                                
                                {/* Step 1: PRINTING */}
                                <button 
                                    onClick={() => handleStatusUpdate('PRINTING')}
                                    disabled={order.status === 'PRINTING' || order.status === 'READY' || order.status === 'COMPLETED'}
                                    className={`py-4 px-5 rounded-2xl font-bold tracking-widest uppercase text-sm border transition-all text-left flex items-center justify-between group ${
                                        order.status === 'PRINTING' || order.status === 'READY' || order.status === 'COMPLETED'
                                        ? 'bg-orange-500/10 border-orange-500/20 text-orange-500/50 cursor-not-allowed' 
                                        : 'bg-white/5 border-white/10 hover:bg-orange-500/20 hover:text-orange-400 hover:border-orange-500/50 text-white'
                                    }`}
                                >
                                    1. Mark as Printing
                                    {(order.status === 'PRINTING' || order.status === 'READY' || order.status === 'COMPLETED') && <CheckCircle2 className="w-4 h-4" />}
                                </button>
                                
                                {/* Step 2: READY (Triggers Email and OTP generation via server action) */}
                                <button 
                                    onClick={() => handleStatusUpdate('READY')}
                                    disabled={order.status === 'READY' || order.status === 'COMPLETED'}
                                    className={`py-4 px-5 rounded-2xl font-bold tracking-widest uppercase text-sm border transition-all text-left flex items-center justify-between group ${
                                        order.status === 'READY' || order.status === 'COMPLETED'
                                        ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500/50 cursor-not-allowed' 
                                        : 'bg-white/5 border-white/10 hover:bg-indigo-500/20 hover:text-indigo-400 hover:border-indigo-500/50 text-white'
                                    }`}
                                >
                                    2. Ready for Pickup
                                    {(order.status === 'READY' || order.status === 'COMPLETED') && <CheckCircle2 className="w-4 h-4" />}
                                </button>

                                {/* Step 3: COMPLETED (WITH 6-DIGIT OTP) */}
                                {order.status === 'COMPLETED' ? (
                                    <div className="py-4 px-5 rounded-2xl font-bold tracking-widest uppercase text-sm border text-left flex justify-between items-center bg-green-500/10 border-green-500/20 text-green-500/50 cursor-not-allowed">
                                        3. Completed 
                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    </div>
                                ) : order.status === 'READY' ? (
                                    <div className="p-5 rounded-2xl bg-white/5 border border-white/10 ring-1 ring-white/5 shadow-inner space-y-4 animate-in fade-in zoom-in-95 duration-500">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 flex items-center gap-2">
                                            <KeyRound className="w-3 h-3" /> 3. Student Handover
                                        </p>
                                        <input 
                                            type="text" 
                                            placeholder="6-DIGIT OTP" 
                                            maxLength={6}
                                            value={otpInput}
                                            onChange={(e) => setOtpInput(e.target.value.replace(/[^0-9]/g, ''))}
                                            className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-3 font-mono text-xl tracking-[0.5em] text-center focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 outline-none transition-all placeholder:tracking-normal placeholder:text-sm placeholder:text-white/20"
                                        />
                                        <button 
                                            onClick={handleVerifyOtp}
                                            disabled={verifying || otpInput.length < 6}
                                            className="w-full py-3.5 rounded-xl font-black tracking-widest uppercase text-sm bg-green-500 text-black hover:bg-green-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(34,197,94,0.2)]"
                                        >
                                            {verifying ? 'Verifying...' : 'Verify & Complete'}
                                        </button>
                                    </div>
                                ) : (
                                    <button 
                                        disabled={true}
                                        className="py-4 px-5 rounded-2xl font-bold tracking-widest uppercase text-sm border text-left flex justify-between items-center bg-white/5 border-white/10 text-white/30 cursor-not-allowed"
                                    >
                                        3. Completed 
                                    </button>
                                )}

                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    )
}