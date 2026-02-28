'use client'

import { useState } from 'react'
import Link from 'next/link'
import { logoutAction } from '@/app/(auth)/actions'

export default function ShopNavbar({ shopName }: { shopName?: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="flex justify-between items-center border-b border-gray-400 pb-4 mb-8 relative">
      <h1 className="text-2xl font-bold">
        {shopName ? `${shopName} - Dashboard` : 'Shop Dashboard'}
      </h1>

      {/* Profile Circle */}
      <div>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="w-10 h-10 border border-gray-800 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-sm font-bold"
        >
          {shopName ? shopName.charAt(0).toUpperCase() : 'S'}
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-48 border border-gray-400 shadow-sm z-10">
            <div className="p-2 border-b border-gray-200">
              <Link href="/shop/profile" className="block p-2 hover:bg-gray-100 text-sm">
                Edit Shop Details
              </Link>
            </div>
            <div className="p-2 border-b border-gray-200">
              <Link href="/shop/pricing" className="block p-2 hover:bg-gray-100 text-sm">
                Edit Prices
              </Link>
            </div>
            <div className="p-2">
              <form action={logoutAction}>
                <button type="submit" className="w-full text-left p-2 hover:bg-gray-100 text-sm text-red-600">
                  Log Out
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}