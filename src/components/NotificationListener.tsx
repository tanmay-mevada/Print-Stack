'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { BellRing, CheckCircle2, Printer, ShoppingBag, AlertCircle, MessageCircle } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'

export default function NotificationListener() {
  const { isDark } = useTheme()

  useEffect(() => {
    const supabase = createClient()
    let userId: string | null = null

    // 1. Get the current logged-in user
    const initUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (data.user) {
        userId = data.user.id
      }
    }
    
    initUser()

    // 2. Listen to the 'notifications' table for NEW inserts
    const channel = supabase.channel('realtime-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          const newNotification = payload.new

          // Only show the toast if the notification belongs to this specific user
          if (newNotification.user_id === userId) {
            
            // Choose an icon based on the notification type
            let Icon = BellRing;
            let iconColor = isDark ? '#60a5fa' : '#2563eb'; // Blue default

            if (newNotification.type === 'ORDER_PRINTING') {
              Icon = Printer;
              iconColor = isDark ? '#f472b6' : '#db2777'; // Pink
            } else if (newNotification.type === 'ORDER_READY') {
              Icon = CheckCircle2;
              iconColor = isDark ? '#4ade80' : '#16a34a'; // Green
            } else if (newNotification.type === 'ORDER_NEW') {
              Icon = ShoppingBag;
              iconColor = isDark ? '#fbbf24' : '#d97706'; // Yellow
            } else if (newNotification.type === 'COMPLAINT_NEW') {
              Icon = AlertCircle;
              iconColor = isDark ? '#f87171' : '#dc2626'; // Red
            } else if (newNotification.type === 'COMPLAINT_REPLIED') {
              Icon = MessageCircle;
              iconColor = isDark ? '#34d399' : '#10b981'; // Emerald
            } else if (newNotification.type === 'REFUND_COMPLETED') {
              Icon = CheckCircle2;
              iconColor = isDark ? '#4ade80' : '#16a34a'; // Green
            }

            // Trigger the beautiful hot-toast popup
            toast.custom((t) => (
              <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full shadow-2xl rounded-2xl pointer-events-auto flex ring-1 transition-all ${isDark ? 'bg-[#111] text-white ring-white/10' : 'bg-white text-stone-900 ring-stone-200'}`}>
                <div className="flex-1 w-0 p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 pt-0.5">
                      <Icon size={24} color={iconColor} />
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-black text-inherit">
                        {newNotification.title}
                      </p>
                      <p className={`mt-1 text-xs font-medium ${isDark ? 'text-white/70' : 'text-stone-500'}`}>
                        {newNotification.message}
                      </p>
                    </div>
                  </div>
                </div>
                <div className={`flex border-l ${isDark ? 'border-white/10' : 'border-stone-100'}`}>
                  <button
                    onClick={() => toast.dismiss(t.id)}
                    className={`w-full border border-transparent rounded-none rounded-r-2xl p-4 flex items-center justify-center text-xs font-bold uppercase tracking-widest ${isDark ? 'text-white/40 hover:text-white' : 'text-stone-400 hover:text-stone-600'}`}
                  >
                    Close
                  </button>
                </div>
              </div>
            ), { duration: 6000, position: 'top-right' });
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [isDark])

  return null // This component doesn't render anything visually, it just listens!
}