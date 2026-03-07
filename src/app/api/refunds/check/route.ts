import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { initiatePhonePeRefund } from '@/lib/phonepe-refund'

const TWO_HOURS_MS = 2 * 60 * 60 * 1000
const CRON_SECRET = process.env.CRON_SECRET

export async function POST(req: NextRequest) {
  if (CRON_SECRET && req.headers.get('authorization') !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // 1. Orders PAID/PRINTING/READY for > 2 hours without COMPLETED
  const { data: staleOrders } = await supabase
    .from('orders')
    .select('id, student_id, shop_id, total_price, phonepe_transaction_id')
    .in('status', ['PAID', 'PRINTING', 'READY'])
    .lt('created_at', new Date(Date.now() - TWO_HOURS_MS).toISOString())

  for (const order of staleOrders || []) {
    const { data: existingRefund } = await supabase
      .from('refunds')
      .select('id')
      .eq('order_id', order.id)
      .single()

    if (existingRefund) continue

    const merchantRefundId = `ref-${order.id.replace(/-/g, '')}-${Date.now()}`
    const originalMerchantOrderId = order.phonepe_transaction_id || order.id.replace(/-/g, '')
    const amountInPaise = Math.round(Number(order.total_price) * 100)

    await supabase.from('refunds').insert({
      order_id: order.id,
      amount: order.total_price,
      reason: 'ORDER_NOT_COMPLETED_2HR',
      status: 'PROCESSING',
      merchant_refund_id: merchantRefundId,
    })

    const result = await initiatePhonePeRefund({
      merchantRefundId,
      originalMerchantOrderId,
      amountInPaise,
    })

    if (result.success) {
      await supabase
        .from('refunds')
        .update({ status: 'COMPLETED', phonepe_refund_id: result.refundId })
        .eq('order_id', order.id)
        .eq('merchant_refund_id', merchantRefundId)

      await supabase
        .from('orders')
        .update({ status: 'CANCELLED' })
        .eq('id', order.id)

      await supabase.from('notifications').insert({
        user_id: order.student_id,
        title: 'Refund Processed',
        message: `Your order #${order.id.split('-')[0]} was not completed within 2 hours. A refund of ₹${order.total_price} has been processed.`,
        type: 'REFUND_COMPLETED',
      })
    } else {
      await supabase
        .from('refunds')
        .update({ status: 'FAILED', error_message: result.error })
        .eq('order_id', order.id)
        .eq('merchant_refund_id', merchantRefundId)
    }
  }

  // 2. Complaints PENDING for > 2 hours with no reply → trigger refund
  const { data: staleComplaints } = await supabase
    .from('complaints')
    .select('id, order_id, shop_id')
    .eq('status', 'PENDING')
    .lt('created_at', new Date(Date.now() - TWO_HOURS_MS).toISOString())

  for (const complaint of staleComplaints || []) {
    const { data: order } = await supabase
      .from('orders')
      .select('id, student_id, total_price, phonepe_transaction_id')
      .eq('id', complaint.order_id)
      .single()

    if (!order) continue

    const { data: existingRefund } = await supabase
      .from('refunds')
      .select('id')
      .eq('order_id', order.id)
      .single()

    if (existingRefund) continue

    const merchantRefundId = `ref-${order.id.replace(/-/g, '')}-${Date.now()}`
    const originalMerchantOrderId = order.phonepe_transaction_id || order.id.replace(/-/g, '')
    const amountInPaise = Math.round(Number(order.total_price) * 100)

    await supabase.from('refunds').insert({
      order_id: order.id,
      complaint_id: complaint.id,
      amount: order.total_price,
      reason: 'COMPLAINT_NO_REPLY_2HR',
      status: 'PROCESSING',
      merchant_refund_id: merchantRefundId,
    })

    const result = await initiatePhonePeRefund({
      merchantRefundId,
      originalMerchantOrderId,
      amountInPaise,
    })

    if (result.success) {
      await supabase
        .from('refunds')
        .update({ status: 'COMPLETED', phonepe_refund_id: result.refundId })
        .eq('order_id', order.id)
        .eq('merchant_refund_id', merchantRefundId)

      await supabase.from('complaints').update({ status: 'REFUNDED' }).eq('id', complaint.id)
      await supabase.from('orders').update({ status: 'CANCELLED' }).eq('id', order.id)

      await supabase.from('notifications').insert({
        user_id: order.student_id,
        title: 'Refund Processed',
        message: `The shop did not respond to your complaint within 2 hours. A refund of ₹${order.total_price} has been processed for order #${order.id.split('-')[0]}.`,
        type: 'REFUND_COMPLETED',
      })
    } else {
      await supabase
        .from('refunds')
        .update({ status: 'FAILED', error_message: result.error })
        .eq('order_id', order.id)
        .eq('merchant_refund_id', merchantRefundId)
    }
  }

  return NextResponse.json({ ok: true })
}
