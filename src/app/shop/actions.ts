'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateShopProfileAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Extract all fields, including the new phone field
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

  // Must have a shop first to attach pricing to
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
  
  const { error } = await supabase
    .from('shops')
    .update({ is_active: !currentStatus })
    .eq('id', shopId)

  if (error) return { error: error.message }
  
  revalidatePath('/shop')
  return { success: true }
}