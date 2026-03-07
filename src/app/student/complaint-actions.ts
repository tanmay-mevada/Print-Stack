'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const TWO_HOURS_MS = 2 * 60 * 60 * 1000

export async function createComplaintAction(orderId: string, complaintText: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .select('id, student_id, shop_id, status, created_at')
    .eq('id', orderId)
    .single()

  if (orderErr || !order) return { error: 'Order not found' }
  if (order.student_id !== user.id) return { error: 'Unauthorized' }

  const allowedStatuses = ['PAID', 'PRINTING', 'READY']
  if (!allowedStatuses.includes(order.status)) {
    return { error: 'Complaints can only be raised for orders that are paid but not yet completed.' }
  }

  // Check if complaint already exists
  const { data: existing } = await supabase
    .from('complaints')
    .select('id')
    .eq('order_id', orderId)
    .single()

  if (existing) return { error: 'A complaint has already been raised for this order.' }

  const { error: insertErr } = await supabase.from('complaints').insert({
    order_id: orderId,
    student_id: user.id,
    shop_id: order.shop_id,
    complaint_text: complaintText.trim(),
    status: 'PENDING',
  })

  if (insertErr) return { error: insertErr.message }

  // Notify shop owner
  const { data: shop } = await supabase.from('shops').select('owner_id, name').eq('id', order.shop_id).single()
  const { data: studentProfile } = await supabase.from('profiles').select('name').eq('id', user.id).single()
  const studentName = studentProfile?.name || 'A student'

  if (shop?.owner_id) {
    await supabase.from('notifications').insert({
      user_id: shop.owner_id,
      title: 'New Complaint',
      message: `${studentName} raised a complaint on order #${orderId.split('-')[0]}. Please respond within 2 hours.`,
      type: 'COMPLAINT_NEW',
    })
  }

  revalidatePath('/student/orders')
  revalidatePath('/student/complaints')
  return { success: true }
}
