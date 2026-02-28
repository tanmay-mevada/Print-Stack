'use server'

import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export async function fetchAvailableShopsAction(lat?: number, lng?: number) {
  const supabase = await createClient()
  let shopsResult: any[] = []
  let type = 'all'

  // 1. Try Nearby Shops
  if (lat && lng) {
    const { data: nearbyShops, error: rpcError } = await supabase.rpc('get_nearby_shops', {
      user_lat: lat, user_lon: lng, radius_meters: 5000
    })
    if (!rpcError && nearbyShops && nearbyShops.length > 0) {
      shopsResult = nearbyShops
      type = 'nearby'
    }
  }

  // 2. Fallback to All Shops
  if (shopsResult.length === 0) {
    const { data: allShops } = await supabase.from('shops').select('id, name, address, phone, latitude, longitude').eq('is_active', true)
    shopsResult = allShops || []
  }

  // 3. FETCH PRICING FOR THESE SHOPS
  if (shopsResult.length > 0) {
    const shopIds = shopsResult.map(s => s.id)
    const { data: pricingData } = await supabase.from('pricing_configs').select('*').in('shop_id', shopIds)
    
    // Merge pricing into the shop objects
    shopsResult = shopsResult.map(shop => ({
      ...shop,
      pricing: pricingData?.find(p => p.shop_id === shop.id) || null
    }))
  }

  return { type, shops: shopsResult }
}

export async function submitOrderAction(payload: {
  shopId: string;
  filePath: string;
  config: { print_type: 'BW' | 'COLOR'; sided: 'SINGLE' | 'DOUBLE'; copies: number; total_pages: number; };
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // 1. Calculate Exact Price Securely
  const { data: pricing } = await supabase.from('pricing_configs').select('*').eq('shop_id', payload.shopId).single()
  if (!pricing) return { error: 'Missing pricing config.' }

  let pricePerPage = payload.config.print_type === 'COLOR' ? pricing.color_price : pricing.bw_price;
  let sideModifier = payload.config.sided === 'DOUBLE' ? pricing.double_side_modifier : 1;
  const finalExactPrice = (pricePerPage * sideModifier) * payload.config.total_pages * payload.config.copies;

  // 2. Insert the 'CREATED' order into Supabase
  const { data: newOrder, error } = await supabase.from('orders').insert({
    student_id: user.id,
    shop_id: payload.shopId,
    file_path: payload.filePath,
    total_pages: payload.config.total_pages,
    print_type: payload.config.print_type,
    sided: payload.config.sided,
    copies: payload.config.copies,
    total_price: finalExactPrice,
    status: 'CREATED' 
  }).select('id').single()

  if (error) return { error: error.message }

  // 3. Construct the PhonePe Payload
  const amountInPaise = Math.round(finalExactPrice * 100)
  const formattedTransactionId = newOrder.id.replace(/-/g, '') // PhonePe doesn't like dashes in TXN IDs

  const paymentPayload = {
    merchantId: process.env.PHONEPE_MERCHANT_ID,
    merchantTransactionId: formattedTransactionId,
    merchantUserId: user.id.replace(/-/g, ''),
    amount: amountInPaise,
    redirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/student/verify?id=${newOrder.id}&txid=${formattedTransactionId}`,
    redirectMode: "REDIRECT",
    paymentInstrument: { type: "PAY_PAGE" }
  }

  // 4. Cryptographically Sign the Request (The "Salt" Checksum)
  const base64Payload = Buffer.from(JSON.stringify(paymentPayload)).toString('base64')
  const saltKey = process.env.PHONEPE_SALT_KEY!
  const saltIndex = process.env.PHONEPE_SALT_INDEX!
  
  const checksum = crypto.createHash('sha256').update(base64Payload + '/pg/v1/pay' + saltKey).digest('hex') + '###' + saltIndex

  // 5. Send to PhonePe UAT Test Endpoint
  const HOST = process.env.PHONEPE_ENV === 'PROD' 
    ? 'https://api.phonepe.com/apis/hermes' 
    : 'https://api-preprod.phonepe.com/apis/pg-sandbox' // <-- TEST MODE URL

  try {
    const res = await fetch(`${HOST}/pg/v1/pay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': checksum
      },
      body: JSON.stringify({ request: base64Payload })
    })

    const data = await res.json()
    
    if (data.success) {
      // Send the PhonePe hosted payment URL back to the frontend
      return { success: true, paymentUrl: data.data.instrumentResponse.redirectInfo.url }
    } else {
      console.error("PhonePe Error:", data)
      return { error: data.message || "Failed to initialize PhonePe." }
    }
  } catch (err) {
    console.error(err)
    return { error: "Payment gateway error." }
  }
}