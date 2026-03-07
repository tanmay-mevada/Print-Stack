'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Clock, FileText, Printer, CheckCircle2, Sun, Moon, AlertTriangle, RotateCcw } from 'lucide-react'
import { useTranslations } from 'next-intl'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { requestRefundAction, raiseComplaintAction } from '../actions'
import toast from 'react-hot-toast'

export default function OrderHistoryPage() {
    const t = useTranslations('student')
    const tCommon = useTranslations()
    const [isDark, setIsDark] = useState(true)
    const [orders, setOrders] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [refundModal, setRefundModal] = useState<{ open: boolean, orderId: string }>({ open: false, orderId: '' })
    const [complaintModal, setComplaintModal] = useState<{ open: boolean, orderId: string }>({ open: false, orderId: '' })
    const [refundReason, setRefundReason] = useState('')
    const [complaintMessage, setComplaintMessage] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const handleRefund = async () => {
        if (!refundReason.trim()) return
        setSubmitting(true)
        const result = await requestRefundAction(refundModal.orderId, refundReason)
        setSubmitting(false)
        if (result.success) {
            toast.success('Refund request submitted successfully')
            setRefundModal({ open: false, orderId: '' })
            setRefundReason('')
            // Refresh orders
            window.location.reload()
        } else {
            toast.error(result.error || 'Failed to submit refund request')
        }
    }

    const handleComplaint = async () => {
        if (!complaintMessage.trim()) return
        setSubmitting(true)
        const result = await raiseComplaintAction(complaintModal.orderId, complaintMessage)
        setSubmitting(false)
        if (result.success) {
            toast.success('Complaint submitted successfully')
            setComplaintModal({ open: false, orderId: '' })
            setComplaintMessage('')
            // Refresh orders
            window.location.reload()
        } else {
            toast.error(result.error || 'Failed to submit complaint')
        }
    }

    useEffect(() => {
        async function fetchUserOrders() {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                const { data } = await supabase
                    .from('orders')
                    .select('*, shops(name)') 
                    .eq('student_id', user.id)
                    .order('created_at', { ascending: false })

                if (data) setOrders(data)
            }
            setLoading(false)
        }
        fetchUserOrders()

        // Real-time subscriptions
        const supabase = createClient()
        const ordersChannel = supabase
            .channel('student_orders')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
                fetchUserOrders()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(ordersChannel)
        }
    }, [])

    // Helper to format Date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        })
    }

    // Helper to extract original filename from the Supabase storage path (e.g. uploads/123-file.pdf -> file.pdf)
    const getFileName = (path: string) => {
        if (!path) return 'Document.pdf'
        const parts = path.split('-')
        return parts.length > 1 ? parts.slice(1).join('-') : path.replace('uploads/', '')
    }

    if (loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center font-bold tracking-widest uppercase transition-colors duration-500 ${isDark ? 'bg-[#0A0A0A] text-white/50' : 'bg-[#faf9f6] text-stone-400'}`}>
                {tCommon('common.loading')}
            </div>
        )
    }

    return (
        <div className={`min-h-screen font-sans transition-colors duration-500 pb-20 ${isDark ? 'bg-[#0A0A0A] text-white' : 'bg-[#faf9f6] text-stone-900'}`}>
            <div className="p-6 sm:p-8 max-w-5xl mx-auto">
                
                {/* NAVBAR & HEADER */}
                <div className={`flex justify-between items-center border-b pb-6 mb-10 relative transition-colors duration-500 ${isDark ? 'border-white/10' : 'border-stone-200'}`}>
                    <div className="flex items-center gap-6">
                        <Link href="/student/dashboard" className={`p-2 rounded-full transition-colors ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-stone-200 hover:bg-stone-300'}`}>
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-black tracking-tight">{t('orderHistory')}</h1>
                            <p className={`text-sm font-medium ${isDark ? 'text-white/50' : 'text-stone-500'}`}>{t('orderHistoryDesc')}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <LanguageSwitcher />
                    <button 
                        type="button"
                        onClick={() => setIsDark(!isDark)}
                        className={`p-2.5 rounded-full transition-all duration-300 ${isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-black/5 hover:bg-black/10 text-stone-900'}`}
                    >
                        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>
                    </div>
                </div>

                {/* ORDERS LIST */}
                <div className="space-y-6">
                    {orders.length === 0 ? (
                        <div className={`border rounded-[2rem] p-16 text-center transition-colors shadow-sm ${isDark ? 'border-white/10 bg-[#111111]' : 'border-stone-200 bg-white'}`}>
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${isDark ? 'bg-white/5 text-white/50' : 'bg-stone-100 text-stone-400'}`}>
                                <Printer className="w-10 h-10" />
                            </div>
                            <h2 className="text-2xl font-black uppercase tracking-widest mb-4">{t('noOrdersYet')}</h2>
                            <p className={`font-medium ${isDark ? 'text-white/60' : 'text-stone-500'}`}>
                                {t('noOrdersDesc')}
                            </p>
                        </div>
                    ) : (
                        orders.map(order => (
                            <div key={order.id} className={`border rounded-[2rem] p-6 sm:p-8 transition-colors duration-300 flex flex-col md:flex-row justify-between gap-8 ${
                                isDark ? 'bg-[#111111] border-white/10 hover:border-white/20' : 'bg-white border-stone-200 hover:border-stone-300 shadow-sm'
                            }`}>
                                
                                {/* Left Side: Details */}
                                <div className="flex-1 space-y-6">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <span className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest border ${
                                            order.status === 'COMPLETED' ? (isDark ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-green-50 border-green-200 text-green-700') :
                                            order.status === 'READY' ? (isDark ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-indigo-50 border-indigo-200 text-indigo-700') :
                                            (isDark ? 'bg-white/10 border-white/10 text-white' : 'bg-stone-100 border-stone-200 text-stone-700')
                                        }`}>
                                            {order.status}
                                        </span>
                                        <span className={`text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 ${isDark ? 'text-white/50' : 'text-stone-500'}`}>
                                            <Clock className="w-3.5 h-3.5" />
                                            {formatDate(order.created_at)}
                                        </span>
                                        <span className={`text-xs font-bold font-mono ml-auto ${isDark ? 'text-white/30' : 'text-stone-400'}`}>
                                            ID: {order.id.split('-')[0]}
                                        </span>
                                    </div>

                                    <div>
                                        <h3 className="font-black text-xl md:text-2xl mb-1">{order.shops?.name || 'Unknown Print Shop'}</h3>
                                        <div className={`flex items-center gap-2 font-medium text-sm ${isDark ? 'text-white/60' : 'text-stone-500'}`}>
                                            <FileText className="w-4 h-4" /> 
                                            {getFileName(order.file_path)}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-dashed border-current border-opacity-20">
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-1">Color Mode</p>
                                            <p className="font-bold text-sm">{order.print_type === 'COLOR' ? 'Full Color' : 'B&W'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-1">Layout</p>
                                            <p className="font-bold text-sm">{order.sided === 'DOUBLE' ? 'Double Sided' : 'Single Sided'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-1">Pages</p>
                                            <p className="font-bold text-sm">{order.total_pages} Pages</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-1">Copies</p>
                                            <p className="font-bold text-sm">{order.copies} {order.copies === 1 ? 'Copy' : 'Copies'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: Price */}
                                <div className={`md:w-48 flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center pt-6 md:pt-0 border-t md:border-t-0 md:border-l ${isDark ? 'border-white/10' : 'border-stone-200'}`}>
                                    <div className="text-left md:text-right">
                                        <span className={`text-[10px] font-bold uppercase tracking-widest block mb-1 ${isDark ? 'text-white/50' : 'text-stone-500'}`}>Total Paid</span>
                                        <div className="text-3xl md:text-4xl font-black">
                                            ₹{order.total_price}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 mt-4">
                                        {order.status === 'COMPLETED' ? (
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-green-500 uppercase tracking-widest">
                                                <CheckCircle2 className="w-4 h-4" /> Paid & Picked Up
                                            </div>
                                        ) : (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setRefundModal({ open: true, orderId: order.id })}
                                                    className={`px-3 py-1.5 text-xs font-bold uppercase tracking-widest rounded-lg border transition-colors ${
                                                        isDark ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' : 'bg-stone-100 border-stone-200 text-stone-700 hover:bg-stone-200'
                                                    }`}
                                                >
                                                    <RotateCcw className="w-3 h-3 inline mr-1" />
                                                    Refund
                                                </button>
                                                <button
                                                    onClick={() => setComplaintModal({ open: true, orderId: order.id })}
                                                    className={`px-3 py-1.5 text-xs font-bold uppercase tracking-widest rounded-lg border transition-colors ${
                                                        isDark ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20' : 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                                                    }`}
                                                >
                                                    <AlertTriangle className="w-3 h-3 inline mr-1" />
                                                    Complaint
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                            </div>
                        ))
                    )}
                </div>

            </div>

            {/* Refund Modal */}
            {refundModal.open && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className={`w-full max-w-md rounded-2xl p-6 ${isDark ? 'bg-[#111111] border border-white/10' : 'bg-white border border-stone-200'}`}>
                        <h3 className="text-xl font-black mb-4">Request Refund</h3>
                        <textarea
                            value={refundReason}
                            onChange={(e) => setRefundReason(e.target.value)}
                            placeholder="Please explain why you're requesting a refund..."
                            className={`w-full p-3 rounded-lg border resize-none ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-white/50' : 'bg-stone-50 border-stone-200 text-stone-900 placeholder-stone-500'}`}
                            rows={4}
                        />
                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={() => setRefundModal({ open: false, orderId: '' })}
                                className={`flex-1 py-2 px-4 rounded-lg font-bold transition-colors ${isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-stone-200 hover:bg-stone-300 text-stone-700'}`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRefund}
                                disabled={submitting || !refundReason.trim()}
                                className="flex-1 py-2 px-4 rounded-lg font-bold bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {submitting ? 'Submitting...' : 'Submit'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Complaint Modal */}
            {complaintModal.open && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className={`w-full max-w-md rounded-2xl p-6 ${isDark ? 'bg-[#111111] border border-white/10' : 'bg-white border border-stone-200'}`}>
                        <h3 className="text-xl font-black mb-4">Raise Complaint</h3>
                        <textarea
                            value={complaintMessage}
                            onChange={(e) => setComplaintMessage(e.target.value)}
                            placeholder="Please describe your complaint..."
                            className={`w-full p-3 rounded-lg border resize-none ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-white/50' : 'bg-stone-50 border-stone-200 text-stone-900 placeholder-stone-500'}`}
                            rows={4}
                        />
                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={() => setComplaintModal({ open: false, orderId: '' })}
                                className={`flex-1 py-2 px-4 rounded-lg font-bold transition-colors ${isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-stone-200 hover:bg-stone-300 text-stone-700'}`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleComplaint}
                                disabled={submitting || !complaintMessage.trim()}
                                className="flex-1 py-2 px-4 rounded-lg font-bold bg-red-500 hover:bg-red-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {submitting ? 'Submitting...' : 'Submit'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}