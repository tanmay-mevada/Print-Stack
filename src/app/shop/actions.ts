'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import nodemailer from 'nodemailer'
import crypto from 'crypto'

// ============================================================================
// MAILER CONFIGURATION & TEMPLATES (Shop Side)
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

async function sendOrderReadyEmail(to: string, name: string, shopName: string, shopAddress: string, otp: string) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;
  const content = `
    <h2 style="margin-top: 0; color: #111827;">Ready for Pickup</h2>
    <p>Dear ${name},</p>
    <p>Your documents have been printed and are currently waiting for you at the counter.</p>
    <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0;">
      <p style="margin: 0 0 10px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: #6b7280;">Your Secure Verification Code</p>
      <p style="margin: 0; font-size: 42px; font-weight: 900; letter-spacing: 8px; color: #111827;">${otp}</p>
    </div>
    <h4 style="margin: 0 0 10px 0; color: #111827;">Pickup Location:</h4>
    <p style="margin: 0 0 30px 0; color: #4b5563;"><strong>${shopName}</strong><br/>${shopAddress}</p>
    <p style="font-size: 14px; color: #6b7280; margin: 0;">Please provide this code to the shopkeeper to verify your identity and collect your documents.</p>
  `;
  await transporter.sendMail({ from: `"PrintStack" <${process.env.EMAIL_USER}>`, to, subject: `Action Required: Your prints are ready at ${shopName}`, html: getBaseTemplate('Order Ready', content) });
}

async function sendOrderReceiptEmail(to: string, name: string, orderId: string, shopName: string, amount: number) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;
  const content = `
    <h2 style="margin-top: 0; color: #111827;">Transaction Complete</h2>
    <p>Dear ${name},</p>
    <p>Thank you for using PrintStack. Your order has been successfully picked up.</p>
    <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 30px 0;">
      <h4 style="margin: 0 0 15px 0; color: #111827; text-transform: uppercase; font-size: 12px; letter-spacing: 1px;">Receipt Summary</h4>
      <table width="100%" style="border-collapse: collapse;">
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Order ID</td><td style="padding: 8px 0; text-align: right; font-weight: bold; color: #111827; font-size: 14px;">${orderId.split('-')[0].toUpperCase()}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Provider</td><td style="padding: 8px 0; text-align: right; font-weight: bold; color: #111827; font-size: 14px;">${shopName}</td></tr>
        <tr><td style="padding: 8px 0; border-top: 1px solid #e5e7eb; color: #111827; font-weight: bold;">Amount Paid</td><td style="padding: 8px 0; border-top: 1px solid #e5e7eb; text-align: right; font-weight: bold; color: #111827;">INR ${amount.toFixed(2)}</td></tr>
      </table>
    </div>
    <p>We look forward to serving you again soon.</p>
  `;
  await transporter.sendMail({ from: `"PrintStack" <${process.env.EMAIL_USER}>`, to, subject: `Receipt for Order ${orderId.split('-')[0].toUpperCase()}`, html: getBaseTemplate('Receipt', content) });
}

// ============================================================================
// SHOP ACTIONS
// ============================================================================

export async function updateShopProfileAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const updates = {
    name: formData.get('name') as string, phone: formData.get('phone') as string,
    address: formData.get('address') as string, latitude: parseFloat(formData.get('latitude') as string),
    longitude: parseFloat(formData.get('longitude') as string), map_link: formData.get('map_link') as string,
  }

  const { data: existingShop } = await supabase.from('shops').select('id').eq('owner_id', user.id).single()

  if (existingShop) {
    const { error } = await supabase.from('shops').update(updates).eq('id', existingShop.id)
    if (error) return { error: error.message }
  } else {
    const { error } = await supabase.from('shops').insert({ ...updates, owner_id: user.id })
    if (error) return { error: error.message }
  }

  const profile_pic = formData.get('profile_pic') as string | null
  if (profile_pic) await supabase.from('profiles').update({ profile_pic }).eq('id', user.id)

  revalidatePath('/shop')
  revalidatePath('/shop/profile')
  return { success: true }
}

export async function updateShopPricingAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: shop } = await supabase.from('shops').select('id').eq('owner_id', user.id).single()
  if (!shop) return { error: 'You must set up your shop profile first.' }

  // Helper to handle optional fields (converts "null" string or empty to actual null)
  const getOptNum = (key: string) => {
      const val = formData.get(key);
      if (!val || val === 'null' || val === '') return null;
      return parseFloat(val as string);
  }

  // Helper for Stock (defaults to 0 if left empty)
  const getOptStock = (key: string) => {
      const val = formData.get(key);
      if (!val || val === 'null' || val === '') return 0;
      return parseInt(val as string);
  }

  const updates = {
      shop_id: shop.id,
      bw_price: parseFloat(formData.get('bw_price') as string),
      color_price: parseFloat(formData.get('color_price') as string),
      double_side_modifier: parseFloat(formData.get('double_side_modifier') as string),
      
      a3_price: getOptNum('a3_price'), a3_stock: getOptStock('a3_stock'),
      a2_price: getOptNum('a2_price'), a2_stock: getOptStock('a2_stock'),
      a1_price: getOptNum('a1_price'), a1_stock: getOptStock('a1_stock'),
      a0_price: getOptNum('a0_price'), a0_stock: getOptStock('a0_stock'),
      
      spiral_binding_price: getOptNum('spiral_binding_price'),
      hard_binding_price: getOptNum('hard_binding_price'),
      stapling_price: getOptNum('stapling_price'),
      transparent_cover_price: formData.get('transparent_cover_price') === 'null' ? null : parseFloat(formData.get('transparent_cover_price') as string),
    paper_folder_price: formData.get('paper_folder_price') === 'null' ? null : parseFloat(formData.get('paper_folder_price') as string),
  lamination_price: formData.get('lamination_price') === 'null' ? null : parseFloat(formData.get('lamination_price') as string),
  
  };

  const { error } = await supabase.from('pricing_configs').upsert(updates, { onConflict: 'shop_id' })
  if (error) return { error: error.message }
  
  revalidatePath('/shop')
  revalidatePath('/shop/pricing')
  return { success: true }
}

export async function setShopStatusAction(shopId: string, isActive: boolean, pausedUntilISO: string | null = null) {
  const supabase = await createClient()

  const { error } = await supabase.from('shops')
    .update({ 
      is_active: isActive, 
      paused_until: pausedUntilISO 
    })
    .eq('id', shopId)

  if (error) return { error: error.message }
  
  revalidatePath('/shop/dashboard')
  return { success: true }
}

export async function getDownloadUrlAction(filePath: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.storage.from('print_files').createSignedUrl(filePath, 3600)
  if (error) return { error: error.message }
  return { url: data?.signedUrl }
}

export async function updateOrderStatusAction(orderId: string, newStatus: string, studentId: string) {
  const supabase = await createClient()
  
  let otp = '';
  let otp_hash = null;
  let otp_expires_at = null;

  if (newStatus === 'READY') {
    otp = crypto.randomInt(100000, 999999).toString();
    otp_hash = crypto.createHash('sha256').update(otp).digest('hex');
    otp_expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); 
  }

  const updateData: any = { status: newStatus }
  if (otp_hash) {
    updateData.otp_hash = otp_hash;
    updateData.otp_expires_at = otp_expires_at;
  }

  const { error } = await supabase.from('orders').update(updateData).eq('id', orderId)
  if (error) return { error: error.message }

  const { data: orderData } = await supabase.from('orders').select('profiles:student_id(email, name), shops(name, address)').eq('id', orderId).single()
  const email = orderData?.profiles?.email;
  const studentName = orderData?.profiles?.name || 'Student';

  // Push Notifications via Database Insert
  let notificationTitle = "Order Update";
  let notificationMessage = `Your order status changed to ${newStatus}.`;

  if (newStatus === 'PRINTING') {
      notificationTitle = "Document Printing";
      notificationMessage = `${orderData?.shops?.name} is printing your document right now!`;
  } else if (newStatus === 'READY') {
      notificationTitle = "Ready for Pickup";
      notificationMessage = `Your prints are ready at ${orderData?.shops?.name}. Check your email for the secure OTP.`;
  }

  await supabase.from('notifications').insert({
      user_id: studentId,
      title: notificationTitle,
      message: notificationMessage,
      type: `ORDER_${newStatus}`
  })

  // Send Email Notification if Ready
  if (newStatus === 'READY' && email) {
    try {
      await sendOrderReadyEmail(email, studentName, orderData?.shops?.name || 'Print Shop', orderData?.shops?.address || '', otp);
    } catch (err) {
      console.error("Nodemailer Error:", err)
    }
  }

  return { success: true }
}

export async function verifyPickupOTPAction(orderId: string, inputOtp: string) {
  const supabase = await createClient()
  
  const { data: order, error } = await supabase.from('orders').select('student_id, otp_hash, otp_expires_at, total_price, profiles:student_id(email, name), shops(name)').eq('id', orderId).single()
  
  if (error || !order) return { error: "Order not found." }
  if (!order.otp_hash) return { error: "OTP not generated for this order." }
  if (new Date(order.otp_expires_at) < new Date()) return { error: "This OTP has expired." }

  const inputHash = crypto.createHash('sha256').update(inputOtp).digest('hex')
  
  if (inputHash === order.otp_hash) {
    const { error: updateError } = await supabase.from('orders').update({ status: 'COMPLETED', otp_hash: null, otp_expires_at: null }).eq('id', orderId)
    if (updateError) return { error: updateError.message }

    // Push Notification for completion
    await supabase.from('notifications').insert({
        user_id: order.student_id,
        title: "Order Completed",
        message: `Thanks for using ${order.shops?.name}!`,
        type: "ORDER_COMPLETED"
    })

    // Send Digital Receipt
    const email = order.profiles?.email;
    if (email) {
       try {
         await sendOrderReceiptEmail(email, order.profiles?.name || 'Student', orderId, order.shops?.name || 'Print Shop', order.total_price);
       } catch (err) { console.error("Failed to send Receipt Email:", err); }
    }

    return { success: true }
  } else {
    return { error: "Invalid OTP. Please try again." }
  }
}

export async function resolveGoogleMapsLinkAction(link: string) {
  try {
    const response = await fetch(link, { method: 'GET', redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
    const finalUrl = response.url;
    const html = await response.text(); 
    
    let lat = null;
    let lng = null;

    const urlPatterns = [
      /@(-?\d+\.\d+),(-?\d+\.\d+)/, /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,
      /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/, /[?&]query=(-?\d+\.\d+),(-?\d+\.\d+)/, /[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/
    ];

    for (const pattern of urlPatterns) {
      const match = finalUrl.match(pattern);
      if (match) { lat = parseFloat(match[1]); lng = parseFloat(match[2]); break; }
    }

    if (!lat || !lng) {
      const centerMatch = html.match(/center=(-?\d+\.\d+)(?:%2C|,)(-?\d+\.\d+)/);
      if (centerMatch) { lat = parseFloat(centerMatch[1]); lng = parseFloat(centerMatch[2]); } 
      else {
        const initMatch = html.match(/\[null,null,(-?\d+\.\d+),(-?\d+\.\d+)\]/);
        if (initMatch) { lat = parseFloat(initMatch[1]); lng = parseFloat(initMatch[2]); }
      }
    }

    if (lat && lng) return { success: true, lat, lng };
    return { error: "Coordinates not found. Please try the pin method." };

  } catch (err) { return { error: "Failed to resolve the link. It may be broken." }; }
}

export async function updateRefundStatusAction(refundId: string, newStatus: 'APPROVED' | 'REJECTED', adminNotes?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Verify shop owns the refund
  const { data: refund, error: refundError } = await supabase
    .from('refunds')
    .select('id, student_id, order_id, status')
    .eq('id', refundId)
    .eq('shop_id', user.id)
    .single()

  if (refundError || !refund) return { error: 'Refund not found' }
  if (refund.status !== 'REQUESTED') return { error: 'Refund already processed' }

  const updateData: any = { status: newStatus, processed_at: new Date().toISOString() }
  if (adminNotes) updateData.admin_notes = adminNotes

  const { error } = await supabase.from('refunds').update(updateData).eq('id', refundId)
  if (error) return { error: error.message }

  // Notify student
  const notificationType = newStatus === 'APPROVED' ? 'REFUND_APPROVED' : 'REFUND_REJECTED'
  const notificationMessage = newStatus === 'APPROVED' 
    ? 'Your refund request has been approved.' 
    : 'Your refund request has been rejected.'

  await supabase.from('notifications').insert({
    user_id: refund.student_id,
    title: 'Refund Update',
    message: notificationMessage,
    type: notificationType
  })

  revalidatePath('/shop/dashboard')
  return { success: true }
}

export async function updateComplaintStatusAction(complaintId: string, newStatus: 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED', adminNotes?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Verify shop owns the complaint
  const { data: complaint, error: complaintError } = await supabase
    .from('complaints')
    .select('id, student_id, status')
    .eq('id', complaintId)
    .eq('shop_id', user.id)
    .single()

  if (complaintError || !complaint) return { error: 'Complaint not found' }

  const updateData: any = { status: newStatus }
  if (newStatus === 'RESOLVED' || newStatus === 'CLOSED') {
    updateData.resolved_at = new Date().toISOString()
  }
  if (adminNotes) updateData.admin_notes = adminNotes

  const { error } = await supabase.from('complaints').update(updateData).eq('id', complaintId)
  if (error) return { error: error.message }

  // Notify student
  const notificationMessage = `Your complaint status has been updated to ${newStatus.toLowerCase().replace('_', ' ')}.`

  await supabase.from('notifications').insert({
    user_id: complaint.student_id,
    title: 'Complaint Update',
    message: notificationMessage,
    type: 'COMPLAINT_UPDATE'
  })

  revalidatePath('/shop/dashboard')
  return { success: true }
}