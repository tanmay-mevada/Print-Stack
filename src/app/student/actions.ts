'use server'

import { createClient } from '@/lib/supabase/server'

export async function fetchAvailableShopsAction(lat?: number, lng?: number) {
  const supabase = await createClient()

  // 1. If we have coordinates, try finding nearby shops first (5000 meters = 5km)
  if (lat && lng) {
    const { data: nearbyShops, error: rpcError } = await supabase.rpc('get_nearby_shops', {
      user_lat: lat,
      user_lon: lng,
      radius_meters: 5000
    })

    // If we found shops nearby, return them!
    if (!rpcError && nearbyShops && nearbyShops.length > 0) {
      return { type: 'nearby', shops: nearbyShops }
    }
  }

  // 2. FALLBACK: If no coordinates OR no shops nearby, just fetch ALL active shops
  const { data: allShops, error } = await supabase
    .from('shops')
    .select('id, name, address, phone, latitude, longitude')
    .eq('is_active', true)

  if (error) return { error: error.message }
  
  return { type: 'all', shops: allShops || [] }
}

export async function submitOrderAction(payload: {
  shopId: string;
  filePath: string;
  config: {
    print_type: 'BW' | 'COLOR';
    sided: 'SINGLE' | 'DOUBLE';
    copies: number;
    total_pages: number;
  };
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // 1. MVP Price Calculation (You will want to fetch actual shop prices later)
  const basePricePerPage = payload.config.print_type === 'COLOR' ? 10 : 2; // ₹10 color, ₹2 bw
  const sideMultiplier = payload.config.sided === 'DOUBLE' ? 0.8 : 1; // 20% discount per page for double-sided
  const totalPrice = (payload.config.total_pages * basePricePerPage * sideMultiplier) * payload.config.copies;

  // 2. Insert exactly matching your strict schema
  const { error } = await supabase.from('orders').insert({
    student_id: user.id,
    shop_id: payload.shopId,
    file_path: payload.filePath,
    total_pages: payload.config.total_pages,
    print_type: payload.config.print_type,
    sided: payload.config.sided,
    copies: payload.config.copies,
    total_price: totalPrice,
    status: 'CREATED' // Must match order_status ENUM
  })

  if (error) return { error: error.message }
  return { success: true }
}