import { createClient } from '@/lib/supabase/server'
import ShopNavbar from '@/components/ShopNavbar'
import { toggleShopActiveStatus } from '../actions'
import Link from 'next/link'

export default async function ShopDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch shop details
  const { data: shop } = await supabase
    .from('shops')
    .select('*')
    .eq('owner_id', user?.id)
    .single()

  // Fetch orders assigned to this shop (Empty for now, but ready for later)
  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('shop_id', shop?.id || '')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8 font-sans">
      <ShopNavbar shopName={shop?.name} />
      
      {!shop ? (
        <div className="border border-gray-400 p-6 text-center">
          <p className="mb-4 text-gray-700">Your shop profile is incomplete. Students cannot find you.</p>
          <Link href="/shop/profile" className="border border-gray-400 p-2 px-4 hover:bg-gray-100">
            Setup Shop Details Now
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Active Status Toggle Area */}
          <div className="border border-gray-400 p-6 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold mb-1">Shop Status</h2>
              <p className="text-sm text-gray-600">
                {shop.is_active 
                  ? "You are currently visible to students and accepting orders." 
                  : "You are currently hidden and not accepting orders."}
              </p>
            </div>
            
            <form action={async () => {
              'use server'
              await toggleShopActiveStatus(shop.id, shop.is_active)
            }}>
              <button 
                type="submit" 
                className={`px-6 py-2 border font-bold ${
                  shop.is_active 
                  ? 'border-green-600 bg-green-50 text-green-700 hover:bg-green-100' 
                  : 'border-gray-400 bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {shop.is_active ? 'ACTIVE' : 'INACTIVE'}
              </button>
            </form>
          </div>

          {/* Orders Table */}
          <div>
            <h2 className="text-xl font-bold mb-4">Incoming Orders</h2>
            <div className="border border-gray-400 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-400">
                    <th className="p-3 border-r border-gray-400 font-semibold">Order ID</th>
                    <th className="p-3 border-r border-gray-400 font-semibold">Date</th>
                    <th className="p-3 border-r border-gray-400 font-semibold">Pages</th>
                    <th className="p-3 border-r border-gray-400 font-semibold">Total (₹)</th>
                    <th className="p-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {!orders || orders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-gray-500">
                        No orders yet. Turn your shop ACTIVE to start receiving requests.
                      </td>
                    </tr>
                  ) : (
                    orders.map((order: any) => (
                      <tr key={order.id} className="border-b border-gray-400 last:border-0 hover:bg-gray-50">
                        <td className="p-3 border-r border-gray-400 text-sm">{order.id.split('-')[0]}...</td>
                        <td className="p-3 border-r border-gray-400">{new Date(order.created_at).toLocaleDateString()}</td>
                        <td className="p-3 border-r border-gray-400">{order.total_pages} ({order.print_type})</td>
                        <td className="p-3 border-r border-gray-400 font-bold">{order.total_price}</td>
                        <td className="p-3">
                          <span className="border border-gray-400 px-2 py-1 text-xs">{order.status}</span>
                        </td>
                      </tr>
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