'use client'

import { logoutAction } from '@/app/(auth)/actions'

export default function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button 
        type="submit"
        className="border border-gray-400 px-4 py-2 text-sm"
      >
        Log Out
      </button>
    </form>
  )
}