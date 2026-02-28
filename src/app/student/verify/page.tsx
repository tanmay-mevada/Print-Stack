
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import Link from 'next/link'

export default async function VerifyPaymentPage({
    searchParams
}: {
    searchParams: { id?: string, txid?: string } | Promise<{ id?: string, txid?: string }>
}) {
    const resolvedParams = await Promise.resolve(searchParams);
    const orderId = resolvedParams.id;
    const transactionId = resolvedParams.txid;

    if (!orderId || !transactionId) return <div>Invalid Request</div>

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
        <div className="p-8 font-sans max-w-2xl mx-auto text-center mt-20 border border-black p-12 bg-white">
            <h1 className={`text-3xl font-bold uppercase tracking-widest mb-4 ${isSuccess ? 'text-green-600' : 'text-red-600'}`}>
                {isSuccess ? 'Payment Successful!' : 'Payment Failed'}
            </h1>
            <p className="text-gray-600 font-semibold mb-8">
                {isSuccess ? 'Your order is confirmed.' : 'Check your terminal for the error.'}
            </p>
            <Link href="/student/dashboard" className="bg-black text-white font-bold py-4 px-8 uppercase hover:bg-gray-800">
                Return to Dashboard
            </Link>
        </div>
    )
}