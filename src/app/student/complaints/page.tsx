'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, AlertCircle, MessageCircle, CheckCircle2, Sun, Moon, FileText, Clock, IndianRupee } from 'lucide-react'
import { useTranslations } from 'next-intl'
import LanguageSwitcher from '@/components/LanguageSwitcher'

export default function ComplaintsRefundsPage() {
  const t = useTranslations('student')
  const tCommon = useTranslations()
  const [isDark, setIsDark] = useState(true)
  const [complaints, setComplaints] = useState<any[]>([])
  const [refunds, setRefunds] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data: myOrders } = await supabase.from('orders').select('id').eq('student_id', user.id)
      const orderIds = myOrders?.map(o => o.id) || []

      const [complaintsRes, refundsRes] = await Promise.all([
        supabase
          .from('complaints')
          .select('*, orders(id), shops(name)')
          .eq('student_id', user.id)
          .order('created_at', { ascending: false }),
        orderIds.length > 0
          ? supabase.from('refunds').select('*').in('order_id', orderIds).order('created_at', { ascending: false })
          : Promise.resolve({ data: [] })
      ])

      if (complaintsRes.data) setComplaints(complaintsRes.data)
      setRefunds(refundsRes.data ?? [])

      setLoading(false)
    }
    fetch()
  }, [])

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

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

        <div className={`flex justify-between items-center border-b pb-6 mb-10 ${isDark ? 'border-white/10' : 'border-stone-200'}`}>
          <div className="flex items-center gap-6">
            <Link href="/student/orders" className={`p-2 rounded-full ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-stone-200 hover:bg-stone-300'}`}>
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-black tracking-tight">Complaints & Refunds</h1>
              <p className={`text-sm font-medium ${isDark ? 'text-white/50' : 'text-stone-500'}`}>Track your complaints and refund status</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <button
              type="button"
              onClick={() => setIsDark(!isDark)}
              className={`p-2.5 rounded-full ${isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-black/5 hover:bg-black/10 text-stone-900'}`}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Refunds section */}
        <section className="mb-12">
          <h2 className="text-lg font-black uppercase tracking-widest mb-4 flex items-center gap-2">
            <IndianRupee className="w-5 h-5" />
            Refunds
          </h2>
          <div className="space-y-4">
            {refunds.length === 0 ? (
              <div className={`border rounded-2xl p-8 text-center ${isDark ? 'border-white/10 bg-[#111]' : 'border-stone-200 bg-white'}`}>
                <p className={isDark ? 'text-white/50' : 'text-stone-500'}>No refunds yet.</p>
              </div>
            ) : (
              refunds.map((r) => (
                <div
                  key={r.id}
                  className={`border rounded-2xl p-6 ${isDark ? 'border-white/10 bg-[#111]' : 'border-stone-200 bg-white'}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                        r.status === 'COMPLETED' ? (isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700') :
                        r.status === 'FAILED' ? (isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700') :
                        (isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700')
                      }`}>
                        {r.status}
                      </span>
                      <p className="mt-2 font-bold">₹{r.amount}</p>
                      <p className={`text-sm ${isDark ? 'text-white/50' : 'text-stone-500'}`}>Order #{r.order_id?.split('-')[0]}</p>
                      <p className={`text-xs mt-1 ${isDark ? 'text-white/40' : 'text-stone-400'}`}>{formatDate(r.created_at)}</p>
                    </div>
                    {r.status === 'COMPLETED' && <CheckCircle2 className="w-8 h-8 text-green-500" />}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Complaints section */}
        <section>
          <h2 className="text-lg font-black uppercase tracking-widest mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Complaints
          </h2>
          <div className="space-y-4">
            {complaints.length === 0 ? (
              <div className={`border rounded-2xl p-8 text-center ${isDark ? 'border-white/10 bg-[#111]' : 'border-stone-200 bg-white'}`}>
                <p className={isDark ? 'text-white/50' : 'text-stone-500'}>No complaints yet. Raise one from order history for eligible orders.</p>
                <Link href="/student/orders" className="inline-block mt-4 text-sm font-bold underline">View Orders</Link>
              </div>
            ) : (
              complaints.map((c) => (
                <div
                  key={c.id}
                  className={`border rounded-2xl p-6 ${isDark ? 'border-white/10 bg-[#111]' : 'border-stone-200 bg-white'}`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                      c.status === 'PENDING' ? (isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700') :
                      c.status === 'REPLIED' ? (isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700') :
                      (isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700')
                    }`}>
                      {c.status}
                    </span>
                    <span className={`text-xs ${isDark ? 'text-white/40' : 'text-stone-400'}`}>{formatDate(c.created_at)}</span>
                  </div>
                  <p className={isDark ? 'text-white/80' : 'text-stone-700'}>{c.complaint_text}</p>
                  <p className={`text-sm mt-2 ${isDark ? 'text-white/50' : 'text-stone-500'}`}>Order #{c.order_id?.split('-')[0]} • {c.shops?.name}</p>
                  {c.shopkeeper_reply && (
                    <div className={`mt-4 p-4 rounded-xl border ${isDark ? 'border-white/10 bg-white/5' : 'border-stone-200 bg-stone-50'}`}>
                      <p className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
                        <MessageCircle className="w-3.5 h-3.5" /> Shop Reply
                      </p>
                      <p className={isDark ? 'text-white/80' : 'text-stone-700'}>{c.shopkeeper_reply}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

      </div>
    </div>
  )
}
