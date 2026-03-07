import crypto from 'crypto'

const HOST =
  process.env.PHONEPE_ENV === 'PROD'
    ? 'https://api.phonepe.com/apis/pg'
    : 'https://api-preprod.phonepe.com/apis/pg-sandbox'

export async function initiatePhonePeRefund(params: {
  merchantRefundId: string
  originalMerchantOrderId: string
  amountInPaise: number
}): Promise<{ success: boolean; refundId?: string; error?: string }> {
  const saltKey = process.env.PHONEPE_SALT_KEY!
  const saltIndex = process.env.PHONEPE_SALT_INDEX!
  const merchantId = process.env.PHONEPE_MERCHANT_ID!

  const payload = {
    merchantId,
    merchantRefundId: params.merchantRefundId,
    originalMerchantOrderId: params.originalMerchantOrderId,
    amount: params.amountInPaise,
  }

  const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64')
  const checksum = crypto
    .createHash('sha256')
    .update(base64Payload + '/payments/v2/refund' + saltKey)
    .digest('hex') + '###' + saltIndex

  try {
    const res = await fetch(`${HOST}/payments/v2/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': checksum,
        'X-MERCHANT-ID': merchantId,
      },
      body: JSON.stringify({ request: base64Payload }),
    })

    const data = await res.json()

    if (data.success) {
      const decoded = JSON.parse(Buffer.from(data.data.response, 'base64').toString())
      return { success: true, refundId: decoded.refundId }
    }

    const message = data.message || (data.data?.response ? JSON.parse(Buffer.from(data.data.response, 'base64').toString()) : null)?.message || 'Refund failed'
    return { success: false, error: message }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Refund request failed'
    return { success: false, error: msg }
  }
}
