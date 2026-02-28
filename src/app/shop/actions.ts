'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import nodemailer from 'nodemailer'

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
    const { error } = await supabase.from('shops')
      .update({ name, address, phone, latitude, longitude })
      .eq('id', existingShop.id)
    if (error) return { error: error.message }
  } else {
    const { error } = await supabase.from('shops')
      .insert({ owner_id: user.id, name, address, phone, latitude, longitude })
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

// --- NEW: ORDER MANAGEMENT ACTIONS ---

export async function getDownloadUrlAction(filePath: string) {
  const supabase = await createClient()
  
  // Creates a secure signed URL valid for 1 hour (3600 seconds)
  const { data, error } = await supabase.storage
    .from('print_files')
    .createSignedUrl(filePath, 3600)

  if (error) return { error: error.message }
  return { url: data?.signedUrl }
}

export async function updateOrderStatusAction(orderId: string, newStatus: string, studentId: string) {
  const supabase = await createClient()
  
  // 1. Update the database
  const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId)
  if (error) return { error: error.message }

  // 2. Email Notification Logic
  if (newStatus === 'READY') {
    const { data: profile } = await supabase.from('profiles').select('email').eq('id', studentId).single()
  console.log("==== DEBUG EMAIL TRIGGER ====")
  console.log("1. Student ID:", studentId)
  console.log("2. Email found in DB:", profile?.email)
  console.log("3. Has EMAIL_USER in .env?:", !!process.env.EMAIL_USER)
  console.log("4. Has EMAIL_PASS in .env?:", !!process.env.EMAIL_PASS)
    if (profile?.email && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
        })

        await transporter.sendMail({
          from: `"PrintStack" <${process.env.EMAIL_USER}>`,
          to: profile.email,
          subject: 'Your Print Order is Ready!',
          html: `
            <div style="font-family: sans-serif; border: 2px solid #000; padding: 20px; max-width: 500px;">
              <h2 style="text-transform: uppercase; margin-top: 0;">Order Ready for Pickup</h2>
              <p>Great news! Your document has been printed and is waiting for you at the shop.</p>
              <div style="background-color: #f3f4f6; padding: 10px; margin: 20px 0;">
                <p style="margin: 0; font-family: monospace;"><strong>Order ID:</strong> ${orderId.split('-')[0]}</p>
              </div>
              <p style="font-size: 12px; color: #666;">Please show your Order ID at the counter to collect your prints.</p>
            </div>
          `
        })
        console.log("Email successfully sent to:", profile.email)
      } catch (err) {
        console.error("Nodemailer Error:", err)
      }
    } else {
      console.log("Status updated to READY, but email was skipped (Missing email or ENV variables).")
    }
  }

  revalidatePath('/shop/dashboard')
  return { success: true }
}