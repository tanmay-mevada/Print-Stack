'use client'

import { useState } from 'react'
import Link from 'next/link'
import { updateOrderStatusAction, verifyPickupOTPAction } from '@/app/shop/actions'

export default function OrderRow({ order, onStatusChange }: { order: any, onStatusChange: () => void }) {
  const [updating, setUpdating] = useState(false)
  
  // Modal States
  const [showOtpModal, setShowOtpModal] = useState(false)
  const [otpInput, setOtpInput] = useState('')
  const [otpMessage, setOtpMessage] = useState({ type: '', text: '' }) // 'success' or 'error'

  const fileName = order.file_path.split('/').pop()?.split('-').slice(1).join('-') || 'Document.pdf'
  const studentName = order.profiles?.name || 'Unknown Student'

  // Handles standard one-way progression (PAID -> PRINTING -> READY)
  async function handleStatusAdvance(currentStatus: string) {
    let nextStatus = '';
    let confirmMsg = '';

    if (currentStatus === 'PAID') {
      nextStatus = 'PRINTING';
      confirmMsg = "Start printing this order?";
    } else if (currentStatus === 'PRINTING') {
      nextStatus = 'READY';
      confirmMsg = "Mark as ready? This will immediately email the 6-digit OTP to the student.";
    } else {
      return;
    }

    if (!window.confirm(confirmMsg)) return;

    setUpdating(true)
    const res = await updateOrderStatusAction(order.id, nextStatus, order.student_id)
    if (!res.success) alert("Error: " + res.error)
    else onStatusChange() 
    setUpdating(false)
  }

  // Handles the final verification inside the modal
  async function handleVerifyOTP() {
    if (otpInput.length !== 6) {
      setOtpMessage({ type: 'error', text: 'Please enter a 6-digit OTP.' })
      return;
    }
    
    setUpdating(true)
    setOtpMessage({ type: '', text: '' }) // Clear previous messages

    const res = await verifyPickupOTPAction(order.id, otpInput)
    
    if (res.success) {
      setOtpMessage({ type: 'success', text: 'OTP VERIFIED! Order Completed.' })
      // Wait 1.5 seconds so they can see the success message, then close and refresh
      setTimeout(() => {
        setShowOtpModal(false)
        onStatusChange()
      }, 1500)
    } else {
      setOtpMessage({ type: 'error', text: res.error || "Invalid OTP. Try again." })
      setUpdating(false)
    }
  }

  return (
    <>
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
            <button onClick={() => handleStatusAdvance('PAID')} disabled={updating} className="bg-black text-white text-xs font-bold px-4 py-2 uppercase tracking-widest hover:bg-gray-800 disabled:opacity-50 w-full sm:w-auto">
              {updating ? 'WAIT...' : 'START PRINTING'}
            </button>
          )}

          {order.status === 'PRINTING' && (
            <button onClick={() => handleStatusAdvance('PRINTING')} disabled={updating} className="bg-blue-600 text-white text-xs font-bold px-4 py-2 uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50 w-full sm:w-auto">
              {updating ? 'WAIT...' : 'MARK AS READY'}
            </button>
          )}

          {order.status === 'READY' && (
            <button onClick={() => setShowOtpModal(true)} className="bg-green-600 text-white text-xs font-bold px-4 py-2 uppercase tracking-widest hover:bg-green-700 w-full sm:w-auto shadow-sm">
              COMPLETE ORDER
            </button>
          )}

          {order.status === 'COMPLETED' && (
            <span className="text-green-600 font-bold text-xs uppercase tracking-widest bg-green-50 px-3 py-1 border border-green-200">
              ✓ Completed
            </span>
          )}
        </td>
      </tr>

      {/* ================= OTP VERIFICATION MODAL ================= */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white p-8 max-w-sm w-full border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-left">
            <h3 className="text-xl font-black uppercase tracking-wider mb-2 text-black">Verify Pickup</h3>
            <p className="text-sm text-gray-600 mb-6 font-medium">Ask {studentName} for the 6-digit code sent to their email.</p>
            
            <input 
              type="text"
              maxLength={6}
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))} // Strips non-numbers instantly
              placeholder="••••••"
              className="w-full text-center text-3xl font-black tracking-[0.5em] border-2 border-stone-300 p-4 mb-4 focus:outline-none focus:border-black text-black"
            />
            
            {/* Status Message Area */}
            {otpMessage.text && (
              <div className={`mb-6 p-3 border text-center text-xs font-bold uppercase tracking-widest ${
                otpMessage.type === 'error' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-green-50 text-green-600 border-green-200'
              }`}>
                {otpMessage.text}
              </div>
            )}
            
            <div className="flex gap-4">
              <button 
                onClick={() => {
                  setShowOtpModal(false);
                  setOtpInput(''); // Reset on close
                  setOtpMessage({type: '', text: ''});
                }} 
                className="flex-1 border-2 border-black text-black font-bold py-3 uppercase tracking-widest hover:bg-stone-100 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleVerifyOTP} 
                disabled={updating || otpInput.length !== 6 || otpMessage.type === 'success'} 
                className="flex-1 bg-black text-white font-bold py-3 uppercase tracking-widest hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {updating ? 'Checking...' : 'Verify'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}