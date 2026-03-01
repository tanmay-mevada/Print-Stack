'use client'

import { useState } from 'react'
import Link from 'next/link'
import { updateOrderStatusAction, verifyPickupOTPAction } from '@/app/shop/actions'

export default function OrderRow({ order, onStatusChange }: { order: any, onStatusChange: () => void }) {
  const [updating, setUpdating] = useState(false)
  const [otpInput, setOtpInput] = useState('')

  // Helper to extract a clean filename
  const fileName = order.file_path.split('/').pop()?.split('-').slice(1).join('-') || 'Document.pdf'
  const studentName = order.profiles?.name || 'Unknown Student'

  async function handleStatusAdvance(currentStatus: string) {
    let nextStatus = '';
    let confirmMsg = '';

    if (currentStatus === 'PAID') {
      nextStatus = 'PRINTING';
      confirmMsg = "Start printing this order?";
    } else if (currentStatus === 'PRINTING') {
      nextStatus = 'READY';
      confirmMsg = "Mark as ready? This will email the OTP to the student.";
    } else {
      return;
    }

    if (!window.confirm(confirmMsg)) return;

    setUpdating(true)
    const res = await updateOrderStatusAction(order.id, nextStatus, order.student_id)
    if (!res.success) alert("Error: " + res.error)
    else onStatusChange() // Refresh parent data
    setUpdating(false)
  }

  async function handleVerifyOTP() {
    if (otpInput.length !== 6) return alert("Please enter a 6-digit OTP.");
    
    setUpdating(true)
    const res = await verifyPickupOTPAction(order.id, otpInput)
    if (res.success) {
      alert("OTP Verified! Order Complete.")
      onStatusChange()
    } else {
      alert(res.error)
    }
    setUpdating(false)
  }

  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
      <td className="p-4 text-sm whitespace-nowrap text-gray-500">
        {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        <br/>
        <span className="text-xs">{new Date(order.created_at).toLocaleDateString()}</span>
      </td>
      <td className="p-4 font-bold text-gray-900">{studentName}</td>
      <td className="p-4 text-sm text-gray-600 font-mono truncate max-w-[200px]" title={fileName}>
        {fileName}
      </td>
      <td className="p-4 font-bold text-black">
        <Link href={`/shop/dashboard/orders/${order.id}`} className="text-xs underline uppercase tracking-wider hover:text-gray-500">
          View Details →
        </Link>
      </td>
      
      {/* Dynamic Action Column */}
      <td className="p-4 text-right">
        {order.status === 'PAID' && (
          <button onClick={() => handleStatusAdvance('PAID')} disabled={updating} className="bg-black text-white text-xs font-bold px-4 py-2 uppercase hover:bg-gray-800 disabled:opacity-50 w-full sm:w-auto">
            {updating ? 'WAIT...' : 'START PRINTING'}
          </button>
        )}

        {order.status === 'PRINTING' && (
          <button onClick={() => handleStatusAdvance('PRINTING')} disabled={updating} className="bg-blue-600 text-white text-xs font-bold px-4 py-2 uppercase hover:bg-blue-700 disabled:opacity-50 w-full sm:w-auto">
            {updating ? 'WAIT...' : 'MARK AS READY'}
          </button>
        )}

        {order.status === 'READY' && (
          <div className="flex flex-col sm:flex-row gap-2 justify-end">
            <input 
              type="text" 
              maxLength={6} 
              placeholder="6-Digit OTP" 
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value)}
              className="border border-gray-400 p-2 text-center text-sm font-bold tracking-widest w-full sm:w-32 focus:outline-none focus:border-black"
            />
            <button onClick={handleVerifyOTP} disabled={updating || otpInput.length !== 6} className="bg-green-600 text-white text-xs font-bold px-4 py-2 uppercase hover:bg-green-700 disabled:opacity-50 w-full sm:w-auto">
              {updating ? 'WAIT...' : 'VERIFY OTP'}
            </button>
          </div>
        )}

        {order.status === 'COMPLETED' && (
          <span className="text-green-600 font-bold text-xs uppercase tracking-widest bg-green-50 px-3 py-1 border border-green-200">
            ✓ Completed
          </span>
        )}
      </td>
    </tr>
  )
}