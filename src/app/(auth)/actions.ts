'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import crypto from 'crypto'
import nodemailer from 'nodemailer'

// ============================================================================
// 1. AUTHENTICATION ACTIONS
// ============================================================================

export async function loginAction(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // 1. Sign in the user
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  
  if (error) return { error: error.message }
  
  // 2. Fetch the role from the user's metadata (saved during signup)
  const role = data.user.user_metadata?.role || 'student'
  
  // 3. Return the role to the frontend instead of redirecting from the server
  return { success: true, role }
}

export async function signupAction(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const name = formData.get('name') as string
  
  // Capture the role from the hidden input field we added to the signup page
  const role = formData.get('role') as string || 'student' 

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { 
        name,
        role // Save the role to Supabase user metadata
      } 
    }
  })

  if (error) return { error: error.message }
  return { success: true, email }
}

export async function verifyOtpAction(email: string, token: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'signup'
  })

  if (error) return { error: error.message }
  
  // After verifying OTP, check their role and redirect appropriately
  const role = data?.user?.user_metadata?.role || 'student'
  
  if (role === 'shopkeeper' || role === 'admin') {
    redirect('/shop/dashboard')
  } else {
    redirect('/student/dashboard')
  }
}

export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function signInWithGoogleAction() {
  const supabase = await createClient()
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`
    }
  })

  if (error) {
    console.error('Google Auth Error:', error.message)
    return { error: error.message }
  }

  if (data.url) {
    redirect(data.url)
  }
}

// ============================================================================
// 2. SHOP SETUP ACTIONS
// ============================================================================

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

// ============================================================================
// 3. STUDENT ORDER SUBMISSION
// ============================================================================

export async function submitOrderAction({ shopId, filePath, config }: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, error: "Not logged in" }

  const base = config.print_type === 'COLOR' ? 10 : 2;
  const modifier = config.sided === 'DOUBLE' ? 0.8 : 1;
  const totalPrice = ((base * modifier) * config.total_pages * config.copies).toFixed(2);

  const { data, error } = await supabase
      .from('orders')
      .insert({
          shop_id: shopId,
          student_id: user.id,
          file_path: filePath,
          print_type: config.print_type,
          sided: config.sided,
          copies: config.copies,
          total_pages: config.total_pages,
          total_price: totalPrice,
          status: 'PENDING'
      })
      .select()
      .single()

  if (error) return { success: false, error: error.message }
  return { success: true, orderId: data.id } 
}

// ============================================================================
// 4. ORDER MANAGEMENT & SECURE OTP VERIFICATION
// ============================================================================

export async function getDownloadUrlAction(filePath: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.storage.from('print_files').createSignedUrl(filePath, 3600)
  if (error) return { error: error.message }
  return { url: data?.signedUrl }
}

export async function updateOrderStatusAction(orderId: string, newStatus: string, studentId: string) {
  try {
      const supabase = await createClient()
      
      let otp = '';
      let otp_hash = null;
      let otp_expires_at = null;

      // 1. If READY, generate OTP and fetch student email
      if (newStatus === 'READY') {
          otp = crypto.randomInt(100000, 999999).toString();
          otp_hash = crypto.createHash('sha256').update(otp).digest('hex');
          otp_expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); 

          const { data: profile } = await supabase.from('profiles').select('email, name').eq('id', studentId).single();

          if (!profile?.email) {
              return { success: false, error: "Student email not found in database." }
          }

          // --- BULLETPROOF NODEMAILER SETUP ---
          const emailUser = process.env.EMAIL_USER;
          const emailPass = process.env.EMAIL_PASS || process.env.EMAIL_APP_PASSWORD;

          if (!emailUser || !emailPass) {
              console.error(`ENV Check Failed -> USER: ${!!emailUser}, PASS: ${!!emailPass}`);
              return { success: false, error: "Server could not read email credentials from .env.local" };
          }

          const transporter = nodemailer.createTransport({
              host: 'smtp.gmail.com',
              port: 465,
              secure: true,
              auth: {
                  user: emailUser,
                  pass: emailPass, 
              },
          });

          // --- PREMIUM THEMED EMAIL TEMPLATE ---
          await transporter.sendMail({
              from: `"PrintStack" <${emailUser}>`,
              to: profile.email,
              subject: '⚡ Your Print Order is Ready for Pickup',
              html: `
              <!DOCTYPE html>
              <html>
              <body style="margin: 0; padding: 0; background-color: #f4f4f0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f4f0; padding: 40px 20px;">
                      <tr>
                          <td align="center">
                              <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05); max-width: 500px; margin: 0 auto;">
                                  
                                  <tr>
                                      <td align="center" style="background-color: #050505; padding: 30px 40px;">
                                          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.5px;">PrintStack<span style="color: #a8a29e;">++</span></h1>
                                      </td>
                                  </tr>
                                  
                                  <tr>
                                      <td align="center" style="padding: 40px 30px;">
                                          <h2 style="color: #050505; margin: 0 0 15px 0; font-size: 28px; font-weight: 900; letter-spacing: -0.5px;">Your stack is ready.</h2>
                                          <p style="color: #57534e; margin: 0 0 35px 0; font-size: 16px; line-height: 1.6; font-weight: 500;">
                                              Hi ${profile.name || 'Student'}, your document has been printed and is waiting for you at the print shop.
                                          </p>
                                          
                                          <div style="background-color: #faf9f6; border: 1px solid #e7e5e4; border-radius: 16px; padding: 35px 20px; margin-bottom: 30px;">
                                              <p style="color: #a8a29e; margin: 0 0 15px 0; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px;">Secure Pickup Code</p>
                                              <p style="color: #22c55e; margin: 0; font-size: 46px; font-weight: 900; letter-spacing: 12px; font-family: monospace;">
                                                  ${otp}
                                              </p>
                                          </div>
                                          
                                          <p style="color: #78716c; margin: 0; font-size: 14px; font-weight: 500; line-height: 1.5;">
                                              Please present this 6-digit code to the shopkeeper to verify your identity and collect your documents securely.
                                          </p>
                                      </td>
                                  </tr>
                                  
                                  <tr>
                                      <td align="center" style="background-color: #faf9f6; padding: 25px 30px; border-top: 1px solid #f0f0f0;">
                                          <p style="color: #a8a29e; margin: 0; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
                                              Print Smarter. Skip the queue.
                                          </p>
                                      </td>
                                  </tr>
                                  
                              </table>
                          </td>
                      </tr>
                  </table>
              </body>
              </html>
              `,
          });
          console.log("OTP Email successfully sent to:", profile.email);
      }

      // 3. Update the database (Storing ONLY the hash, not the raw OTP, for maximum security)
      const updateData: any = { status: newStatus }
      if (newStatus === 'READY') {
          updateData.otp_hash = otp_hash;
          updateData.otp_expires_at = otp_expires_at;
      }

      const { error } = await supabase.from('orders').update(updateData).eq('id', orderId)
      
      if (error) throw error;

      revalidatePath('/shop/dashboard')
      revalidatePath('/student/dashboard')
      
      return { success: true }
      
  } catch (err: any) {
      console.error("Action Error:", err);
      return { success: false, error: err.message }
  }
}

export async function verifyPickupOTPAction(orderId: string, inputOtp: string) {
  const supabase = await createClient()
  
  // Fetch the order to get the hash
  const { data: order, error } = await supabase.from('orders').select('otp_hash, otp_expires_at').eq('id', orderId).single()
  
  if (error || !order) return { success: false, error: "Order not found." }
  if (!order.otp_hash) return { success: false, error: "OTP not generated for this order." }
  
  // Check Expiration
  if (new Date(order.otp_expires_at) < new Date()) {
    return { success: false, error: "This OTP has expired." }
  }

  // Verify Hash
  const inputHash = crypto.createHash('sha256').update(inputOtp).digest('hex')
  
  if (inputHash === order.otp_hash) {
    // OTP is correct! Complete the order and scrub the OTPs from the DB for security
    const { error: updateError } = await supabase.from('orders').update({ 
      status: 'COMPLETED',
      otp_hash: null, 
      otp_expires_at: null
    }).eq('id', orderId)
    
    if (updateError) return { success: false, error: updateError.message }
    
    revalidatePath('/shop/dashboard')
    revalidatePath('/student/dashboard')
    return { success: true }
  } else {
    return { success: false, error: "Invalid OTP. Please check your email and try again." }
  }
}