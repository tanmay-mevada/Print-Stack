'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { replyToComplaintAction } from '../actions'
import { ArrowLeft, AlertCircle, MessageCircle, Sun, Moon, Clock, User } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import toast from 'react-hot-toast'

export default function ShopComplaintsPage() {
  const { isDark } = useTheme()
  const [complaints, setComplaints] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [replyingId, setReplyingId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [submittingId, setSubmittingId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchComplaints() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: shop } = await supabase.from('shops').select('id').eq('owner_id', user.id).single()
      if (!shop) {
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from('complaints')
        .select('*, orders(id, total_price, file_path), shops(name)')
        .eq('shop_id', shop.id)
        .order('created_at', { ascending: false })

      setComplaints(data ?? [])
      setLoading(false)
    }
    fetchComplaints()
  }, [])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('shop-complaints-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'complaints' }, async () => {
        const { data: shopData } = await supabase.from('shops').select('id').eq('owner_id', (await supabase.auth.getUser()).data.user?.id).single()
        if (!shopData) return
        const { data } = await supabase
          .from('complaints')
          .select('*, orders(id, total_price, file_path), shops(name)')
          .eq('shop_id', shopData.id)
          .order('created_at', { ascending: false })
        if (data) setComplaints(data)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  const handleReply = async (complaintId: string) => {
    if (!replyText.trim()) return
    setSubmittingId(complaintId)
    const res = await replyToComplaintAction(complaintId, replyText)
    setSubmittingId(null)
    setReplyingId(null)
    setReplyText('')
    if (res.success) {
      toast.success('Reply sent. Student will be notified.')
      setComplaints(prev =>
        prev.map(c =>
          c.id === complaintId
            ? { ...c, status: 'REPLIED', shopkeeper_reply: replyText, replied_at: new Date().toISOString() }
            : c
        )
      )
    } else {
      toast.error(res.error || 'Failed to send reply')
    }
  }

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center font-bold tracking-widest uppercase ${isDark ? 'bg-[#0A0A0A] text-white/50' : 'bg-[#faf9f6] text-stone-400'}`}>
        Loading...
      </div>
    )
  }

  return (
    <div className={`min-h-screen font-sans transition-colors duration-500 pb-20 ${isDark ? 'bg-[#0A0A0A] text-white' : 'bg-[#faf9f6] text-stone-900'}`}>
      <div className="p-6 sm:p-8 max-w-4xl mx-auto">
        <div className={`flex justify-between items-center border-b pb-6 mb-10 ${isDark ? 'border-white/10' : 'border-stone-200'}`}>
          <div className="flex items-center gap-6">
            <Link href="/shop/dashboard" className={`p-2 rounded-full ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-stone-200 hover:bg-stone-300'}`}>
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-black tracking-tight">Complaints</h1>
              <p className={`text-sm font-medium ${isDark ? 'text-white/50' : 'text-stone-500'}`}>Respond within 2 hours to avoid automatic refund</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {complaints.length === 0 ? (
            <div className={`border rounded-2xl p-16 text-center ${isDark ? 'border-white/10 bg-[#111]' : 'border-stone-200 bg-white'}`}>
              <AlertCircle className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-white/30' : 'text-stone-300'}`} />
              <h2 className="text-xl font-black mb-2">No Complaints</h2>
              <p className={isDark ? 'text-white/50' : 'text-stone-500'}>You’re all caught up. New complaints will appear here.</p>
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
                    c.status === 'REFUNDED' ? (isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700') :
                    (isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700')
                  }`}>
                    {c.status}
                  </span>
                  <span className={`text-xs flex items-center gap-1 ${isDark ? 'text-white/40' : 'text-stone-400'}`}>
                    <Clock className="w-3.5 h-3.5" /> {formatDate(c.created_at)}
                  </span>
                </div>

                <div className={`flex items-center gap-2 mb-3 text-sm font-bold ${isDark ? 'text-white/80' : 'text-stone-700'}`}>
                  <User className="w-4 h-4" />
                  Student — Order #{c.order_id?.split('-')[0]}
                </div>

                <p className={`mb-4 ${isDark ? 'text-white/90' : 'text-stone-800'}`}>{c.complaint_text}</p>

                {c.shopkeeper_reply ? (
                  <div className={`p-4 rounded-xl border ${isDark ? 'border-white/10 bg-white/5' : 'border-stone-200 bg-stone-50'}`}>
                    <p className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1">Your Reply</p>
                    <p className={isDark ? 'text-white/80' : 'text-stone-700'}>{c.shopkeeper_reply}</p>
                  </div>
                ) : c.status === 'PENDING' && (
                  <div className="mt-4">
                    <textarea
                      value={replyingId === c.id ? replyText : ''}
                      onChange={(e) => setReplyText(e.target.value)}
                      onFocus={() => { if (replyingId !== c.id) { setReplyingId(c.id); setReplyText('') } }}
                      placeholder="Type your reply... (within 2 hours)"
                      rows={3}
                      className={`w-full rounded-xl px-4 py-3 text-sm border resize-none ${isDark ? 'bg-white/5 border-white/20 text-white placeholder:text-white/40' : 'bg-stone-50 border-stone-200 text-stone-900 placeholder:text-stone-400'}`}
                    />
                    <button
                      onClick={() => handleReply(c.id)}
                      disabled={!replyText.trim() || replyingId !== c.id || submittingId === c.id}
                      className="mt-2 px-6 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white"
                    >
                      {submittingId === c.id ? 'Sending...' : 'Send Reply'}
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
