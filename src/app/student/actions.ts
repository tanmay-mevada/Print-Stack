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

// Converts a string like "1, 3-5" into a JavaScript Set: {1, 3, 4, 5}
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
  noStore(); // Prevents aggressive caching of the shops list
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
    bw_pages?: string;
    single_pages?: string;
    double_pages?: string;
  }; 
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: pricing } = await supabase.from('pricing_configs').select('*').eq('shop_id', payload.shopId).single()
  if (!pricing) return { error: 'Missing pricing config.' }

  // THE MATRIX PRICING ENGINE
  let finalExactPrice = 0;

  if (payload.config.print_type === 'MIXED' || payload.config.sided === 'MIXED') {
    // If they used Advanced Settings, calculate page by page
    const colorSet = parsePageRange(payload.config.color_pages || '', payload.config.total_pages);
    const doubleSet = parsePageRange(payload.config.double_pages || '', payload.config.total_pages);
    
    let totalCostForOneCopy = 0;
    
    for (let i = 1; i <= payload.config.total_pages; i++) {
      const isColor = payload.config.print_type === 'COLOR' || (payload.config.print_type === 'MIXED' && colorSet.has(i));
      const isDouble = payload.config.sided === 'DOUBLE' || (payload.config.sided === 'MIXED' && doubleSet.has(i));
      
      const basePrice = isColor ? pricing.color_price : pricing.bw_price;
      const modifier = isDouble ? pricing.double_side_modifier : 1;
      
      totalCostForOneCopy += (basePrice * modifier);
    }
    finalExactPrice = totalCostForOneCopy * payload.config.copies;
  } else {
    // Standard basic calculation
    let pricePerPage = payload.config.print_type === 'COLOR' ? pricing.color_price : pricing.bw_price;
    let sideModifier = payload.config.sided === 'DOUBLE' ? pricing.double_side_modifier : 1;
    finalExactPrice = (pricePerPage * sideModifier) * payload.config.total_pages * payload.config.copies;
  }

  // Insert into database with the new columns
  const { data: newOrder, error } = await supabase.from('orders').insert({
    student_id: user.id, 
    shop_id: payload.shopId, 
    file_path: payload.filePath,
    total_pages: payload.config.total_pages, 
    print_type: payload.config.print_type, 
    sided: payload.config.sided,
    copies: payload.config.copies, 
    color_pages: payload.config.color_pages || null,
    bw_pages: payload.config.bw_pages || null,
    single_pages: payload.config.single_pages || null,
    double_pages: payload.config.double_pages || null,
    total_price: finalExactPrice, 
    status: 'CREATED' 
  }).select('id').single()

  if (error) return { error: error.message }

  const amountInPaise = Math.round(finalExactPrice * 100)
  const formattedTransactionId = newOrder.id.replace(/-/g, '')

  const paymentPayload = {
    merchantId: process.env.PHONEPE_MERCHANT_ID, merchantTransactionId: formattedTransactionId,
    merchantUserId: user.id.replace(/-/g, ''), amount: amountInPaise,
    redirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/student/verify?id=${newOrder.id}&txid=${formattedTransactionId}`,
    redirectMode: "REDIRECT", paymentInstrument: { type: "PAY_PAGE" }
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