'use client'

import { useRouter } from 'next/navigation'
import { FileText, ChevronRight, Activity } from 'lucide-react'

type OrderRowProps = {
  order: any;
  isDark: boolean;
}

export default function OrderRow({ order, isDark }: OrderRowProps) {
  const router = useRouter()
  if (!order) return null;

  // Format Date gracefully
  const formattedDate = new Date(order.created_at).toLocaleDateString('en-IN', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })

  // Extract clean filename
  const fileName = order.file_path ? order.file_path.split('-').slice(1).join('-') : 'Document.pdf'

  return (
    <tr 
      onClick={() => router.push(`/shop/orders/${order.id}`)}
      // 🔥 DYNAMIC ROW HIGHLIGHT: If priority is true, the whole row glows orange 🔥
      className={`cursor-pointer transition-all duration-300 group ${
        order.is_priority 
          ? (isDark ? 'bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/30' : 'bg-orange-50 hover:bg-orange-100 border-orange-200')
          : (isDark ? 'hover:bg-white/5 border-white/10' : 'hover:bg-stone-50/80 border-stone-200')
      }`}
    >
      
      {/* 1. Time / Date */}
      <td className="p-6 border-r border-inherit whitespace-nowrap">
        <span className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-white/60' : 'text-stone-500'}`}>
          {formattedDate}
        </span>
      </td>

      {/* 2. Student Name + Priority Badge */}
      <td className="p-6 border-r border-inherit">
        <div className="flex flex-col gap-1">
          <span className="font-bold text-sm truncate max-w-[150px] block">
            {order.profiles?.name || 'Student'}
          </span>
          {/* 🔥 PRIORITY LABEL 🔥 */}
          {order.is_priority && (
            <span className="text-[9px] font-black uppercase tracking-widest text-orange-500 flex items-center gap-1 animate-pulse">
                <Activity className="w-3 h-3" /> Priority
            </span>
          )}
        </div>
      </td>

      {/* 3. Document Name */}
      <td className="p-6 border-r border-inherit">
        <div className="flex items-center gap-2">
          {/* Change file icon color if priority */}
          <FileText className={`w-4 h-4 shrink-0 ${order.is_priority ? 'text-orange-500' : (isDark ? 'text-white/40' : 'text-stone-400')}`} />
          <span className="font-bold text-sm truncate max-w-[150px] sm:max-w-[200px] block">
            {fileName}
          </span>
        </div>
      </td>

      {/* 4. Specs (MINIMAL & CLEAN) */}
      <td className="p-6 border-r border-inherit">
        <div className={`flex items-center gap-2 text-[11px] font-black uppercase tracking-widest ${isDark ? 'text-white/60' : 'text-stone-500'}`}>
          <span className={
            order.print_type === 'COLOR' ? (isDark ? 'text-blue-400' : 'text-blue-600') : 
            order.print_type === 'MIXED' ? (isDark ? 'text-yellow-500' : 'text-yellow-600') : ''
          }>
            {order.print_type === 'MIXED' ? 'MIXED' : order.print_type === 'BW' ? 'B&W' : 'COLOR'}
          </span>
          <span className="opacity-30">•</span>
          <span>{order.total_pages} PG</span>
        </div>
      </td>

      {/* 5. Status & Arrow Indicator */}
      <td className="p-6 text-right">
        <div className="flex items-center justify-end gap-4">
          <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
              order.status === 'COMPLETED' ? (isDark ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-green-50 border-green-200 text-green-700') :
              order.status === 'READY' ? (isDark ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-indigo-50 border-indigo-200 text-indigo-700') :
              order.status === 'PRINTING' ? (isDark ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' : 'bg-orange-50 border-orange-200 text-orange-700') :
              (isDark ? 'bg-white/10 border-white/10 text-white' : 'bg-stone-100 border-stone-200 text-stone-700')
          }`}>
              {order.status}
          </span>
          <ChevronRight className={`w-5 h-5 transition-transform group-hover:translate-x-1 ${
              order.is_priority ? 'text-orange-500' : (isDark ? 'text-white/30 group-hover:text-white' : 'text-stone-300 group-hover:text-stone-900')
          }`} />
        </div>
      </td>
      
    </tr>
  )
}