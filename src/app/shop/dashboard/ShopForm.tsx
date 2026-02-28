'use client'

import { useState } from 'react'
import { saveShopAction } from '../actions'

// Allow passing existing data so the shopkeeper can edit their profile later
export default function ShopForm({ initialShop, initialPricing }: { initialShop?: any, initialPricing?: any }) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)
    
    const formData = new FormData(e.currentTarget)
    const res = await saveShopAction(formData)
    
    if (res?.error) setError(res.error)
    if (res?.success) setSuccess(true)
    
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
      {error && <div className="text-red-600 font-semibold">Error: {error}</div>}
      {success && <div className="text-green-600 font-semibold">Shop details saved successfully!</div>}

      <div className="border border-gray-400 p-4">
        <h2 className="font-bold mb-4 border-b border-gray-400 pb-2">1. Shop Details</h2>
        
        <label className="block mb-1">Shop Name</label>
        <input name="name" type="text" required defaultValue={initialShop?.name} className="border border-gray-400 p-2 w-full mb-3" />

        <label className="block mb-1">Address</label>
        <input name="address" type="text" required defaultValue={initialShop?.address} className="border border-gray-400 p-2 w-full mb-3" />

        <div className="flex gap-4 mb-3">
          <div className="flex-1">
            <label className="block mb-1">Latitude</label>
            <input name="latitude" type="number" step="any" required defaultValue={initialShop?.latitude} className="border border-gray-400 p-2 w-full" placeholder="e.g. 21.1702" />
          </div>
          <div className="flex-1">
            <label className="block mb-1">Longitude</label>
            <input name="longitude" type="number" step="any" required defaultValue={initialShop?.longitude} className="border border-gray-400 p-2 w-full" placeholder="e.g. 72.8311" />
          </div>
        </div>

        <label className="flex items-center gap-2 mt-4 cursor-pointer">
          <input name="is_active" type="checkbox" defaultChecked={initialShop?.is_active} className="w-4 h-4" />
          <span>Shop is active and accepting orders</span>
        </label>
      </div>

      <div className="border border-gray-400 p-4">
        <h2 className="font-bold mb-4 border-b border-gray-400 pb-2">2. Pricing Configuration (₹)</h2>
        
        <label className="block mb-1">B&W Price per page</label>
        <input name="bw_price" type="number" step="0.5" required defaultValue={initialPricing?.bw_price} className="border border-gray-400 p-2 w-full mb-3" />

        <label className="block mb-1">Color Price per page</label>
        <input name="color_price" type="number" step="0.5" required defaultValue={initialPricing?.color_price} className="border border-gray-400 p-2 w-full mb-3" />

        <label className="block mb-1">Double-Sided Modifier (Add/Subtract)</label>
        <input name="double_side_modifier" type="number" step="0.5" required defaultValue={initialPricing?.double_side_modifier || 0} className="border border-gray-400 p-2 w-full" />
        <span className="text-xs text-gray-500">Amount to add to the base price if printed on both sides.</span>
      </div>

      <button disabled={loading} className="border border-gray-400 bg-gray-100 p-2 w-full hover:bg-gray-200 disabled:opacity-50">
        {loading ? 'Saving...' : 'Save Settings'}
      </button>
    </form>
  )
}