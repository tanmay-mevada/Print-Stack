// src/components/OrderRow.tsx
'use client'

import { useState } from 'react'
import { getDownloadUrlAction, updateOrderStatusAction } from '@/app/shop/actions'

export default function OrderRow({ order }: { order: any }) {
  const [downloading, setDownloading] = useState(false)
  const [updating, setUpdating] = useState(false)

  // Must match your database ENUM exactly
  const statuses = ['CREATED', 'PAID', 'PRINTING', 'READY', 'COMPLETED', 'CANCELLED']

  async function handleDownload() {
    setDownloading(true)
    const res = await getDownloadUrlAction(order.file_path)
    if (res.url) {
      window.open(res.url, '_blank') // Opens the PDF in a new tab securely
    } else {
      alert("Could not generate download link: " + res.error)
    }
    setDownloading(false)
  }

  async function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value
    setUpdating(true)
    const res = await updateOrderStatusAction(order.id, newStatus, order.student_id)
    if (!res.success) {
      alert("Failed to update status: " + res.error)
    }
    setUpdating(false)
  }

  // Styling logic for the status dropdown
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'READY': return 'border-green-600 text-green-700 bg-green-50'
      case 'COMPLETED': return 'border-gray-300 text-gray-500 bg-gray-100'
      case 'CANCELLED': return 'border-red-600 text-red-700 bg-red-50'
      case 'PRINTING': return 'border-blue-600 text-blue-700 bg-blue-50'
      default: return 'border-black text-black bg-white'
    }
  }

  return (
    <tr className="border-b border-gray-300 last:border-0 hover:bg-gray-50 transition-colors">
      <td className="p-4 border-r border-gray-300 font-mono text-xs uppercase">{order.id.split('-')[0]}</td>
      <td className="p-4 border-r border-gray-300 text-sm whitespace-nowrap">{new Date(order.created_at).toLocaleDateString()}</td>
      <td className="p-4 border-r border-gray-300 text-sm">
        <span className="font-bold">{order.total_pages} pg</span> x {order.copies}
        <br/>
        <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">{order.print_type} • {order.sided}</span>
      </td>
      <td className="p-4 border-r border-gray-300 font-bold text-lg">₹{order.total_price}</td>
      <td className="p-4 border-r border-gray-300">
        <button 
          onClick={handleDownload}
          disabled={downloading}
          className="bg-black text-white text-xs font-bold px-4 py-3 uppercase tracking-widest hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full"
        >
          {downloading ? 'WAIT...' : 'DOWNLOAD PDF'}
        </button>
      </td>
      <td className="p-4">
        <select 
          value={order.status}
          onChange={handleStatusChange}
          disabled={updating}
          className={`border-2 p-2 w-full text-xs font-bold uppercase tracking-wider focus:outline-none cursor-pointer ${getStatusColor(order.status)}`}
        >
          {statuses.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </td>
    </tr>
  )
}