import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import Link from 'next/link'
import { CheckCircle2, XCircle, ArrowRight, Receipt } from 'lucide-react'

export default async function VerifyPaymentPage({
    searchParams
}: {
    searchParams: { id?: string, txid?: string } | Promise<{ id?: string, txid?: string }>
}) {
    const resolvedParams = await Promise.resolve(searchParams);
    const orderId = resolvedParams.id;
    const transactionId = resolvedParams.txid;

    if (!orderId || !transactionId) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white/50 font-bold tracking-widest uppercase">
                Invalid Request
            </div>
        )
    }

    const merchantId = process.env.PHONEPE_MERCHANT_ID!
    const saltKey = process.env.PHONEPE_SALT_KEY!
    const saltIndex = process.env.PHONEPE_SALT_INDEX!

    const endpoint = `/pg/v1/status/${merchantId}/${transactionId}`
    const checksum = crypto.createHash('sha256').update(endpoint + saltKey).digest('hex') + '###' + saltIndex

    const HOST = process.env.PHONEPE_ENV === 'PROD'
        ? 'https://api.phonepe.com/apis/hermes'
        : 'https://api-preprod.phonepe.com/apis/pg-sandbox'

    let isSuccess = false;

    console.log("==== PAYMENT VERIFICATION TRIGGERED ====")
    console.log("1. Order ID:", orderId)
    console.log("2. TXN ID:", transactionId)

    try {
        const res = await fetch(`${HOST}${endpoint}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-VERIFY': checksum,
                'X-MERCHANT-ID': merchantId
            },
            cache: 'no-store'
        })

        const data = await res.json()
        console.log("3. PhonePe API Response:", JSON.stringify(data, null, 2))

        // Sometimes PhonePe returns SUCCESS inside data.code, sometimes inside data.responseCode
        if (data.code === 'PAYMENT_SUCCESS' || data.success === true) {
            isSuccess = true;
        }
    } catch (err) {
        console.error("3. Fetch Error:", err)
    }

    console.log("4. Is Success Evaluated To:", isSuccess)

    // 5. Update Your Database using the Admin Key (Bypasses RLS)
    if (isSuccess) {
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY! // <-- This tells Supabase "I am the server, let me through"
        )

        const { error: updateError } = await supabaseAdmin
            .from('orders')
            .update({ status: 'PAID' })
            .eq('id', orderId)

        if (updateError) {
            console.error("SUPABASE ERROR:", updateError.message)
        } else {
            console.log("SUPABASE SUCCESS: Updated to PAID")
        }
    }

    console.log("========================================")

   return (
  <div className="min-h-screen bg-black text-white font-sans flex items-center justify-center px-6">

    <div className="w-full max-w-xl">

      {/* Brand */}
      <div className="flex justify-center mb-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white text-black flex items-center justify-center">
            <Receipt className="w-5 h-5" />
          </div>
          <span className="text-2xl font-semibold tracking-tight">
            PrintStack++
          </span>
        </div>
      </div>

      {/* Card */}
      <div className="border border-white/20 p-12 rounded-3xl text-center">

        {/* Status Icon */}
        <div className={`w-24 h-24 rounded-full border mx-auto mb-8 flex items-center justify-center transition ${
          isSuccess ? 'border-white bg-white text-black' : 'border-white/30 text-white'
        }`}>
          {isSuccess ? (
            <CheckCircle2 className="w-12 h-12" />
          ) : (
            <XCircle className="w-12 h-12" />
          )}
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-semibold mb-4 tracking-tight">
          {isSuccess ? 'Payment Successful' : 'Payment Failed'}
        </h1>

        {/* Description */}
        <p className="text-white/60 text-sm leading-relaxed mb-8">
          {isSuccess
            ? 'Your order has been confirmed and forwarded to the print shop.'
            : 'The transaction could not be completed. Please try again.'}
        </p>

        {/* TXN Badge */}
        <div className="inline-block border border-white/20 px-4 py-2 text-xs font-mono tracking-widest text-white/50 mb-10">
          TXN: {transactionId}
        </div>

        {/* Button */}
        <Link
          href="/student/dashboard"
          className={`w-full block py-4 rounded-xl text-sm font-semibold uppercase tracking-widest border transition ${
            isSuccess
              ? 'bg-white text-black border-white hover:bg-gray-200'
              : 'border-white hover:bg-white hover:text-black'
          }`}
        >
          Return to Dashboard
        </Link>

      </div>

    </div>
  </div>
)
}