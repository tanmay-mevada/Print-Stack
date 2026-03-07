'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Clock, FileText, Printer, CheckCircle2, Sun, Moon, AlertCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { createComplaintAction } from '../complaint-actions'
import toast from 'react-hot-toast'

export default function OrderHistoryPage() {
    const t = useTranslations('student')
    const tCommon = useTranslations()
    const [isDark, setIsDark] = useState(true)
    const [orders, setOrders] = useState<any[]>([])
    const [complaintsByOrder, setComplaintsByOrder] = useState<Record<string, boolean>>({})
    const [loading, setLoading] = useState(true)
    const [complaintOrderId, setComplaintOrderId] = useState<string | null>(null)
    const [complaintText, setComplaintText] = useState('')
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        async function fetchUserOrders() {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                const { data: orderData } = await supabase
                    .from('orders')
                    .select('*, shops(name)')
                    .eq('student_id', user.id)
                    .order('created_at', { ascending: false })

                if (orderData) setOrders(orderData)

                const { data: complaintData } = await supabase
                    .from('complaints')
                    .select('order_id')
                    .eq('student_id', user.id)
                const map: Record<string, boolean> = {}
                complaintData?.forEach(c => { map[c.order_id] = true })
                setComplaintsByOrder(map)
            }
            setLoading(false)
        }
        fetchUserOrders()
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
                        <Link href="/student/complaints" className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-wider ${isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-stone-200 hover:bg-stone-300 text-stone-900'}`}>
                            <AlertCircle className="w-4 h-4" /> Complaints & Refunds
                        </Link>
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
                                    {order.status === 'COMPLETED' && (
                                        <div className="mt-0 md:mt-4 flex items-center gap-1.5 text-xs font-bold text-green-500 uppercase tracking-widest">
                                            <CheckCircle2 className="w-4 h-4" /> Paid & Picked Up
                                        </div>
                                    )}
                                    {['PAID', 'PRINTING', 'READY'].includes(order.status) && !complaintsByOrder[order.id] && (
                                        <button
                                            type="button"
                                            onClick={() => setComplaintOrderId(order.id)}
                                            className={`mt-4 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider ${isDark ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-400' : 'bg-amber-100 hover:bg-amber-200 text-amber-700'}`}
                                        >
                                            <AlertCircle className="w-4 h-4" /> Raise Complaint
                                        </button>
                                    )}
                                    {complaintsByOrder[order.id] && (
                                        <Link href="/student/complaints" className={`mt-4 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider ${isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-stone-200 hover:bg-stone-300 text-stone-700'}`}>
                                            <AlertCircle className="w-4 h-4" /> View Complaint
                                        </Link>
                                    )}
                                </div>

                            </div>
                        ))
                    )}
                </div>

            </div>

            {/* Raise Complaint Modal */}
            {complaintOrderId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => !submitting && setComplaintOrderId(null)}>
                    <div className={`w-full max-w-md rounded-2xl p-6 shadow-2xl ${isDark ? 'bg-[#111] border border-white/10' : 'bg-white border border-stone-200'}`} onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-black mb-4">Raise Complaint</h3>
                        <p className={`text-sm mb-4 ${isDark ? 'text-white/60' : 'text-stone-500'}`}>Describe the issue. The shop has 2 hours to respond before an automatic refund.</p>
                        <textarea
                            value={complaintText}
                            onChange={e => setComplaintText(e.target.value)}
                            placeholder="e.g. Order not ready, wrong printing, etc."
                            rows={4}
                            className={`w-full rounded-xl px-4 py-3 text-sm border resize-none ${isDark ? 'bg-white/5 border-white/20 text-white placeholder:text-white/40' : 'bg-stone-50 border-stone-200 text-stone-900 placeholder:text-stone-400'}`}
                        />
                        <div className="flex gap-3 mt-4">
                            <button
                                type="button"
                                onClick={() => !submitting && setComplaintOrderId(null)}
                                className={`flex-1 py-3 rounded-xl text-sm font-bold uppercase tracking-wider ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-stone-200 hover:bg-stone-300'}`}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={submitting || !complaintText.trim()}
                                onClick={async () => {
                                    setSubmitting(true)
                                    const res = await createComplaintAction(complaintOrderId, complaintText)
                                    setSubmitting(false)
                                    if (res.success) {
                                        setComplaintOrderId(null)
                                        setComplaintText('')
                                        setComplaintsByOrder(prev => ({ ...prev, [complaintOrderId]: true }))
                                        toast.success('Complaint raised. Shop will be notified.')
                                    } else {
                                        toast.error(res.error || 'Failed to raise complaint')
                                    }
                                }}
                                className="flex-1 py-3 rounded-xl text-sm font-bold uppercase tracking-wider bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white"
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