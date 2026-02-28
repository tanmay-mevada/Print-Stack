'use server'

import { createClient } from '@/lib/supabase/server'

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

  // 1. SECURE PRICE CALCULATION: Fetch the specific shop's exact pricing from the DB
  const { data: pricing, error: pricingError } = await supabase.from('pricing_configs').select('*').eq('shop_id', payload.shopId).single()
  
  if (pricingError || !pricing) {
    return { error: 'Could not calculate exact price because shop pricing configuration is missing.' }
  }

  // 2. Do the math securely on the server
  let pricePerPage = payload.config.print_type === 'COLOR' ? pricing.color_price : pricing.bw_price;
  let sideModifier = payload.config.sided === 'DOUBLE' ? pricing.double_side_modifier : 1;
  
  // Total = (Base Price * Sided Modifier) * Pages * Copies
  const finalExactPrice = (pricePerPage * sideModifier) * payload.config.total_pages * payload.config.copies;

  // 3. Insert into database
  const { error } = await supabase.from('orders').insert({
    student_id: user.id,
    shop_id: payload.shopId,
    file_path: payload.filePath,
    total_pages: payload.config.total_pages,
    print_type: payload.config.print_type,
    sided: payload.config.sided,
    copies: payload.config.copies,
    total_price: finalExactPrice,
    status: 'CREATED' 
  })

  if (error) return { error: error.message }
  return { success: true }
}