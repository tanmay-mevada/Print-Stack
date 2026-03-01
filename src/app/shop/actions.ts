'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import nodemailer from 'nodemailer'
import crypto from 'crypto'

// --- EXISTING SHOP SETUP ACTIONS ---
export async function updateShopProfileAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const name = formData.get('name') as string
  const address = formData.get('address') as string
  const phone = formData.get('phone') as string
  const latitude = parseFloat(formData.get('latitude') as string)
  const longitude = parseFloat(formData.get('longitude') as string)

  const { data: existingShop } = await supabase.from('shops').select('id').eq('owner_id', user.id).single()

  if (existingShop) {
    const { error } = await supabase.from('shops').update({ name, address, phone, latitude, longitude }).eq('id', existingShop.id)
    if (error) return { error: error.message }
  } else {
    const { error } = await supabase.from('shops').insert({ owner_id: user.id, name, address, phone, latitude, longitude })
    if (error) return { error: error.message }
  }

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

  const bw_price = parseFloat(formData.get('bw_price') as string)
  const color_price = parseFloat(formData.get('color_price') as string)
  const double_side_modifier = parseFloat(formData.get('double_side_modifier') as string)

  const { error } = await supabase.from('pricing_configs').upsert({
    shop_id: shop.id, bw_price, color_price, double_side_modifier
  }, { onConflict: 'shop_id' })

  if (error) return { error: error.message }
  
  revalidatePath('/shop')
  revalidatePath('/shop/pricing')
  return { success: true }
}

export async function toggleShopActiveStatus(shopId: string, currentStatus: boolean) {
  const supabase = await createClient()
  const { error } = await supabase.from('shops').update({ is_active: !currentStatus }).eq('id', shopId)
  if (error) return { error: error.message }
  revalidatePath('/shop/dashboard')
  return { success: true }
}

// --- ORDER MANAGEMENT ACTIONS ---
export async function getDownloadUrlAction(filePath: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.storage.from('print_files').createSignedUrl(filePath, 3600)
  if (error) return { error: error.message }
  return { url: data?.signedUrl }
}

export async function updateOrderStatusAction(orderId: string, newStatus: string, studentId: string) {
  const supabase = await createClient()
  
  // 1. If moving to READY, generate and hash a 6-digit OTP
  let otp = '';
  let otp_hash = null;
  let otp_expires_at = null;

  if (newStatus === 'READY') {
    otp = crypto.randomInt(100000, 999999).toString();
    otp_hash = crypto.createHash('sha256').update(otp).digest('hex');
    otp_expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // Valid for 24 hours
  }

  // 2. Update the database
  const updateData: any = { status: newStatus }
  if (otp_hash) {
    updateData.otp_hash = otp_hash;
    updateData.otp_expires_at = otp_expires_at;
  }

  const { error } = await supabase.from('orders').update(updateData).eq('id', orderId)
  if (error) return { error: error.message }

  // 3. Email Notification Logic
  if (newStatus === 'READY') {
    const { data: profile } = await supabase.from('profiles').select('email, name').eq('id', studentId).single()
    
    if (profile?.email && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
        })

        await transporter.sendMail({
          from: `"PrintStack" <${process.env.EMAIL_USER}>`,
          to: profile.email,
          subject: '⚡ Your Print Order is Ready for Pickup!',
          html: `
            <div style="font-family: sans-serif; border: 2px solid #000; padding: 20px; max-width: 500px;">
              <h2 style="text-transform: uppercase; margin-top: 0;">Order Ready</h2>
              <p>Hi ${profile.name || 'Student'}, your document has been printed and is ready at the shop!</p>
              <div style="background-color: #000; color: #fff; padding: 20px; margin: 20px 0; text-align: center;">
                <p style="margin: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">Your Pickup OTP</p>
                <p style="margin: 10px 0 0 0; font-size: 32px; font-weight: bold; letter-spacing: 5px;">${otp}</p>
              </div>
              <p style="font-size: 12px; color: #666;">Please provide this 6-digit code to the shopkeeper to collect your prints.</p>
            </div>
          `
        })
      } catch (err) {
        console.error("Nodemailer Error:", err)
      }
    }
  }

  return { success: true }
}

export async function verifyPickupOTPAction(orderId: string, inputOtp: string) {
  const supabase = await createClient()
  
  // Fetch the order to get the hash
  const { data: order, error } = await supabase.from('orders').select('otp_hash, otp_expires_at').eq('id', orderId).single()
  
  if (error || !order) return { error: "Order not found." }
  if (!order.otp_hash) return { error: "OTP not generated for this order." }
  
  // Check Expiration
  if (new Date(order.otp_expires_at) < new Date()) {
    return { error: "This OTP has expired." }
  }

  // Verify Hash
  const inputHash = crypto.createHash('sha256').update(inputOtp).digest('hex')
  
  if (inputHash === order.otp_hash) {
    // OTP is correct! Complete the order.
    const { error: updateError } = await supabase.from('orders').update({ 
      status: 'COMPLETED',
      otp_hash: null, // Clear it out for security
      otp_expires_at: null 
    }).eq('id', orderId)
    
    if (updateError) return { error: updateError.message }
    return { success: true }
  } else {
    return { error: "Invalid OTP. Please try again." }
  }
}