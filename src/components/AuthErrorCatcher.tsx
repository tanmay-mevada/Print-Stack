'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function AuthErrorCatcher() {
  const router = useRouter()

  useEffect(() => {
    // Check if the URL has a hash fragment containing an error
    const hash = window.location.hash;
    
    if (hash && hash.includes('error_code=otp_expired')) {
      // 1. Show a professional error message
      toast.error(
        "Your recovery link expired or was clicked by an email security scanner. Please request a new one.", 
        { duration: 6000 }
      );
      
      // 2. Clean the ugly hash out of the URL bar
      window.history.replaceState(null, '', window.location.pathname);
      
      // 3. Redirect them back to the forgot password page to try again
      router.replace('/forgot-password');
    }
  }, [router])

  return null // This component is invisible
}