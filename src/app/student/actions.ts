'use server'

import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'
import { revalidatePath } from 'next/cache'
import nodemailer from 'nodemailer'
import { unstable_noStore as noStore } from 'next/cache';

// ============================================================================
// MAILER CONFIGURATION & TEMPLATES (Student Side)
// ============================================================================

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

const BRAND_COLOR = "#1c1917";

const getBaseTemplate = (title: string, content: string) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${title}</title></head>
<body style="margin: 0; padding: 0; background-color: #f4f4f0; font-family: -apple-system, sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="padding: 40px 20px;">
    <tr><td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e7e5e4; border-radius: 8px; overflow: hidden;">
          <tr><td style="background-color: ${BRAND_COLOR}; padding: 30px 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px; text-transform: uppercase;">PrintStack</h1>
          </td></tr>
          <tr><td style="padding: 40px; color: #333333; line-height: 1.6; font-size: 16px;">${content}</td></tr>
          <tr><td style="background-color: #f8f9fa; padding: 20px 40px; text-align: center; border-top: 1px solid #e7e5e4;">
              <p style="margin: 0; font-size: 12px; color: #6b7280;">This is an automated message from PrintStack.</p>
          </td></tr>
        </table>
    </td></tr>
  </table>
</body>
</html>
`;

async function sendOrderConfirmationEmail(to: string, name: string, orderId: string, shopName: string, amount: number) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;
  const content = `
    <h2 style="margin-top: 0; color: #111827;">Order Confirmed</h2>
    <p>Dear ${name},</p>
    <p>Your payment was successful and your print order has been forwarded to the shop.</p>
    <table width="100%" style="margin: 30px 0; border-collapse: collapse;">
      <tr><td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Order ID</td><td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold; color: #111827;">${orderId.split('-')[0].toUpperCase()}</td></tr>
      <tr><td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Destination</td><td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold; color: #111827;">${shopName}</td></tr>
      <tr><td style="padding: 10px 0; color: #6b7280;">Total Paid</td><td style="padding: 10px 0; text-align: right; font-weight: bold; color: #111827;">INR ${amount.toFixed(2)}</td></tr>
    </table>
    <p>We will notify you again with a secure pickup code once your documents are printed and ready for collection.</p>
  `;
  await transporter.sendMail({ from: `"PrintStack" <${process.env.EMAIL_USER}>`, to, subject: `Order Confirmed: ${shopName}`, html: getBaseTemplate('Order Confirmed', content) });
}

// ============================================================================
// ADVANCED PRICING MATH UTILITIES
// ============================================================================

function parsePageRange(rangeStr: string, maxPages: number): Set<number> {
  const pages = new Set<number>();
  if (!rangeStr) return pages;
  
  const parts = rangeStr.split(',').map(p => p.trim());
  for (const part of parts) {
    if (part.includes('-')) {
      const [start, end] = part.split('-').map(Number);
      if (start && end && start <= end) {
        for (let i = start; i <= Math.min(end, maxPages); i++) pages.add(i);
      }
    } else {
      const num = Number(part);
      if (num && num <= maxPages) pages.add(num);
    }
  }
  return pages;
}

// ============================================================================
// STUDENT ACTIONS
// ============================================================================

export async function fetchAvailableShopsAction(lat?: number, lng?: number) {
  noStore(); 
  const supabase = await createClient()

  const { data: allShops } = await supabase
    .from('shops')
    .select('id, name, address, phone, latitude, longitude, map_link, owner_id, is_active, paused_until')
  
  let shopsResult = allShops || []

  if (shopsResult.length > 0) {
    const shopIds = shopsResult.map((s: any) => s.id)
    const ownerIds = [...new Set(shopsResult.map((s: any) => s.owner_id).filter(Boolean))]

    const [pricingRes, profilesRes] = await Promise.all([
      supabase.from('pricing_configs').select('*').in('shop_id', shopIds),
      ownerIds.length > 0 ? supabase.from('profiles').select('id, profile_pic').in('id', ownerIds) : { data: [] }
    ])
    
    shopsResult = shopsResult.map((shop: any) => ({
      ...shop,
      pricing: pricingRes.data?.find((p: any) => p.shop_id === shop.id) || null,
      profile_pic: profilesRes.data?.find((p: any) => p.id === shop.owner_id)?.profile_pic || null
    }))
  }
  
  return { type: (lat && lng) ? 'nearby' : 'all', shops: shopsResult }
}

export async function submitOrderAction(payload: { 
  shopId: string; 
  filePath: string; 
  config: { 
    print_type: 'BW' | 'COLOR' | 'MIXED'; 
    sided: 'SINGLE' | 'DOUBLE' | 'MIXED'; 
    copies: number; 
    total_pages: number;
    color_pages?: string;
    double_pages?: string;
    paper_size: 'A4' | 'A3' | 'A2' | 'A1' | 'A0';
    binding_type: 'NONE' | 'SPIRAL' | 'HARD';
    wants_stapling: boolean;
    wants_cover: boolean;
    wants_lamination: boolean; // <-- NEW
    wants_paper_file: boolean; // <-- NEW
  }; 
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: pricing } = await supabase.from('pricing_configs').select('*').eq('shop_id', payload.shopId).single()
  if (!pricing) return { error: 'Missing pricing config.' }

  const requiredPages = payload.config.total_pages * payload.config.copies;

  // 1. HARD BACKEND SECURITY VALIDATION
  if (payload.config.paper_size !== 'A4') {
    const pKey = payload.config.paper_size.toLowerCase();
    if (pricing[`${pKey}_price`] === null) return { error: `${payload.config.paper_size} is not supported by this shop.` }
    if (pricing[`${pKey}_stock`] < requiredPages) return { error: `Shop does not have enough ${payload.config.paper_size} stock.` }
  }
  if (payload.config.binding_type === 'SPIRAL' && pricing.spiral_binding_price === null) return { error: 'Spiral binding not supported.' }
  if (payload.config.binding_type === 'HARD' && pricing.hard_binding_price === null) return { error: 'Hard binding not supported.' }
  if (payload.config.wants_stapling && pricing.stapling_price === null) return { error: 'Stapling not supported.' }
  if (payload.config.wants_cover && pricing.transparent_cover_price === null) return { error: 'Covers not supported.' }
  if (payload.config.wants_lamination && pricing.lamination_price === null) return { error: 'Lamination not supported.' }
  if (payload.config.wants_paper_file && pricing.paper_file_price === null) return { error: 'Paper files not supported.' }

  // 2. MATRIX PRICING ENGINE
  let totalCostForOneCopy = 0;

  const getPagePrice = (isColor: boolean, isDouble: boolean) => {
    let base = 0;
    if (payload.config.paper_size === 'A3') base = pricing.a3_price;
    else if (payload.config.paper_size === 'A2') base = pricing.a2_price;
    else if (payload.config.paper_size === 'A1') base = pricing.a1_price;
    else if (payload.config.paper_size === 'A0') base = pricing.a0_price;
    else base = isColor ? pricing.color_price : pricing.bw_price; // Standard A4
    
    return base * (isDouble ? pricing.double_side_modifier : 1);
  }

  // Calculate Base Page Prices
  if (payload.config.print_type === 'MIXED' || payload.config.sided === 'MIXED') {
    const colorSet = parsePageRange(payload.config.color_pages || '', payload.config.total_pages);
    const doubleSet = parsePageRange(payload.config.double_pages || '', payload.config.total_pages);
    for (let i = 1; i <= payload.config.total_pages; i++) {
      const isColor = payload.config.print_type === 'COLOR' || (payload.config.print_type === 'MIXED' && colorSet.has(i));
      const isDouble = payload.config.sided === 'DOUBLE' || (payload.config.sided === 'MIXED' && doubleSet.has(i));
      totalCostForOneCopy += getPagePrice(isColor, isDouble);
    }
  } else {
    totalCostForOneCopy = getPagePrice(payload.config.print_type === 'COLOR', payload.config.sided === 'DOUBLE') * payload.config.total_pages;
  }

  // Add Lamination (Price is PER PAGE)
  if (payload.config.wants_lamination) {
      totalCostForOneCopy += (pricing.lamination_price * payload.config.total_pages);
  }

  let finalExactPrice = totalCostForOneCopy * payload.config.copies;

  // Add Finishing Flat Fees (Multiply by copies because each document needs its own finishing)
  let finishingCostPerCopy = 0;
  if (payload.config.binding_type === 'SPIRAL') finishingCostPerCopy += pricing.spiral_binding_price;
  if (payload.config.binding_type === 'HARD') finishingCostPerCopy += pricing.hard_binding_price;
  if (payload.config.wants_stapling) finishingCostPerCopy += pricing.stapling_price;
  if (payload.config.wants_cover) finishingCostPerCopy += pricing.transparent_cover_price;
  if (payload.config.wants_paper_file) finishingCostPerCopy += pricing.paper_file_price;

  finalExactPrice += (finishingCostPerCopy * payload.config.copies);

  // 3. INVENTORY DEDUCTION (Reserve the stock immediately)
  if (payload.config.paper_size !== 'A4') {
    const pKey = payload.config.paper_size.toLowerCase();
    await supabase.from('pricing_configs').update({ 
      [`${pKey}_stock`]: pricing[`${pKey}_stock`] - requiredPages 
    }).eq('shop_id', payload.shopId);
  }

  // 4. CREATE ORDER
  const { data: newOrder, error } = await supabase.from('orders').insert({
    student_id: user.id, 
    shop_id: payload.shopId, 
    file_path: payload.filePath,
    total_pages: payload.config.total_pages, 
    print_type: payload.config.print_type, 
    sided: payload.config.sided,
    copies: payload.config.copies, 
    color_pages: payload.config.color_pages || null,
    double_pages: payload.config.double_pages || null, 
    total_price: finalExactPrice, 
    status: 'CREATED',
    paper_size: payload.config.paper_size, 
    binding_type: payload.config.binding_type === 'NONE' ? null : payload.config.binding_type,
    wants_stapling: payload.config.wants_stapling, 
    wants_cover: payload.config.wants_cover,
    wants_lamination: payload.config.wants_lamination, // <-- NEW
    wants_paper_file: payload.config.wants_paper_file  // <-- NEW
  }).select('id').single()

  if (error) return { error: error.message }

  const amountInPaise = Math.round(finalExactPrice * 100)
  const formattedTransactionId = newOrder.id.replace(/-/g, '')

  const paymentPayload = {
    merchantId: process.env.PHONEPE_MERCHANT_ID, merchantTransactionId: formattedTransactionId,
    merchantUserId: user.id.replace(/-/g, ''), amount: amountInPaise,
    redirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/student/verify?id=${newOrder.id}&txid=${formattedTransactionId}`,
    redirectMode: "REDIRECT", 
    callbackUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhook/phonepe`,
    paymentInstrument: { type: "PAY_PAGE" }
  }

  const base64Payload = Buffer.from(JSON.stringify(paymentPayload)).toString('base64')
  const saltKey = process.env.PHONEPE_SALT_KEY!
  const saltIndex = process.env.PHONEPE_SALT_INDEX!
  const checksum = crypto.createHash('sha256').update(base64Payload + '/pg/v1/pay' + saltKey).digest('hex') + '###' + saltIndex

  const HOST = process.env.PHONEPE_ENV === 'PROD' ? 'https://api.phonepe.com/apis/hermes' : 'https://api-preprod.phonepe.com/apis/pg-sandbox'

  try {
    const res = await fetch(`${HOST}/pg/v1/pay`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-VERIFY': checksum }, body: JSON.stringify({ request: base64Payload }) })
    const data = await res.json()
    if (data.success) return { success: true, paymentUrl: data.data.instrumentResponse.redirectInfo.url }
    return { error: data.message || "Failed to initialize PhonePe." }
  } catch (err) {
    return { error: "Payment gateway error." }
  }
}

export async function verifyPaymentSuccessAction(orderId: string) {
  const supabase = await createClient()
  
  const { data: order, error } = await supabase.from('orders').update({ status: 'PAID' }).eq('id', orderId).select('*, profiles:student_id(email, name), shops(name, owner_id)').single()
  if (error || !order) return { error: "Failed to verify order" }

  if (order.profiles?.email) {
      await sendOrderConfirmationEmail(order.profiles.email, order.profiles.name || 'Student', order.id, order.shops?.name || 'Print Shop', order.total_price);
  }

  if (order.shops?.owner_id) {
      await supabase.from('notifications').insert({
          user_id: order.shops.owner_id,
          title: "New Print Order",
          message: `A new order has been placed by ${order.profiles?.name || 'a student'}.`,
          type: "ORDER_NEW"
      })
  }

  revalidatePath('/student/orders')
  return { success: true }
}

export async function updateStudentProfileAction(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const name = formData.get('name') as string
    const phone = formData.get('phone') as string
    const profile_pic = formData.get('profile_pic') as string | null

    const updates: any = { name, phone }
    if (profile_pic) updates.profile_pic = profile_pic

    const { error } = await supabase.from('profiles').update(updates).eq('id', user.id)
    if (error) return { error: error.message }

    revalidatePath('/student/dashboard')
    revalidatePath('/student/profile')
    return { success: true }
}

export async function requestRefundAction(orderId: string, reason: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Get order details
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, student_id, shop_id, total_price, status')
    .eq('id', orderId)
    .eq('student_id', user.id)
    .single()

  if (orderError || !order) return { error: 'Order not found' }
  if (order.status === 'COMPLETED') return { error: 'Cannot request refund for completed orders' }

  // Check if refund already exists
  const { data: existingRefund } = await supabase
    .from('refunds')
    .select('id')
    .eq('order_id', orderId)
    .maybeSingle()

  if (existingRefund) return { error: 'Refund already requested for this order' }

  // Create refund request
  const { error } = await supabase.from('refunds').insert({
    order_id: orderId,
    student_id: user.id,
    shop_id: order.shop_id,
    amount: order.total_price,
    reason
  })

  if (error) return { error: error.message }

  // Notify shopkeeper
  await supabase.from('notifications').insert({
    user_id: order.shop_id,
    title: 'Refund Request',
    message: 'A student has requested a refund for their order.',
    type: 'REFUND_REQUEST'
  })

  revalidatePath('/student/orders')
  return { success: true }
}

export async function raiseComplaintAction(orderId: string, message: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Get order details
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, student_id, shop_id, status')
    .eq('id', orderId)
    .eq('student_id', user.id)
    .single()

  if (orderError || !order) return { error: 'Order not found' }

  // Create complaint
  const { error } = await supabase.from('complaints').insert({
    order_id: orderId,
    student_id: user.id,
    shop_id: order.shop_id,
    message
  })

  if (error) return { error: error.message }

  // Notify shopkeeper
  await supabase.from('notifications').insert({
    user_id: order.shop_id,
    title: 'New Complaint',
    message: 'A student has raised a complaint regarding their order.',
    type: 'COMPLAINT_NEW'
  })

  revalidatePath('/student/orders')
  return { success: true }
}