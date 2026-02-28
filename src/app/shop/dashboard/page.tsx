import { createClient } from '@/lib/supabase/server'
import ShopNavbar from '@/components/ShopNavbar'
import { toggleShopActiveStatus } from '../actions'
import Link from 'next/link'
import OrderRow from '@/components/OrderRow'

export default async function ShopDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch shop details
  const { data: shop } = await supabase
    .from('shops')
    .select('*')
    .eq('owner_id', user?.id)
    .single()

  // Fetch orders assigned to this shop
  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('shop_id', shop?.id || '')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8 font-sans max-w-6xl mx-auto text-gray-900">
      <ShopNavbar shopName={shop?.name} />
      
      {!shop ? (
        <div className="border border-black p-12 text-center mt-8">
          <p className="mb-6 font-bold uppercase tracking-widest">Your shop profile is incomplete.</p>
          <Link href="/shop/profile" className="bg-black text-white font-bold py-3 px-6 uppercase tracking-widest hover:bg-gray-800 transition-colors">
            Setup Shop Details Now
          </Link>
        </div>
      ) : (
        <div className="space-y-8 mt-8">
          
          {/* Active Status Toggle */}
          <div className="border border-black p-6 flex justify-between items-center bg-gray-50">
            <div>
              <h2 className="text-lg font-bold uppercase tracking-wider mb-1">Storefront Visibility</h2>
              <p className="text-sm text-gray-600 font-semibold">
                {shop.is_active 
                  ? "Your shop is LIVE on the map. Students can send orders." 
                  : "Your shop is HIDDEN. You are not receiving new orders."}
              </p>
            </div>
            
            <form action={async () => {
              'use server'
              await toggleShopActiveStatus(shop.id, shop.is_active)
            }}>
              <button type="submit" className={`px-8 py-3 font-bold uppercase tracking-widest border-2 transition-colors ${
                  shop.is_active 
                  ? 'border-green-600 bg-green-50 text-green-700 hover:bg-green-100' 
                  : 'border-black bg-black text-white hover:bg-gray-800'
                }`}
              >
                {shop.is_active ? '● ACCEPTING ORDERS' : '○ PAUSED'}
              </button>
            </form>
          </div>

          {/* Orders Table */}
          <div>
            <h2 className="text-xl font-bold mb-4 uppercase tracking-wider">Order Queue</h2>
            <div className="border border-black overflow-x-auto bg-white shadow-sm">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-black text-white uppercase text-xs tracking-widest">
                    <th className="p-4 border-r border-gray-700 w-24">Order ID</th>
                    <th className="p-4 border-r border-gray-700 w-32">Date</th>
                    <th className="p-4 border-r border-gray-700">Print Details</th>
                    <th className="p-4 border-r border-gray-700 w-32">Total</th>
                    <th className="p-4 border-r border-gray-700 w-48">Document</th>
                    <th className="p-4 w-48">Status Update</th>
                  </tr>
                </thead>
                <tbody>
                  {!orders || orders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-gray-500 font-bold uppercase tracking-widest">
                        Your order queue is currently empty.
                      </td>
                    </tr>
                  ) : (
                    orders.map((order: any) => (
                      <OrderRow key={order.id} order={order} />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}