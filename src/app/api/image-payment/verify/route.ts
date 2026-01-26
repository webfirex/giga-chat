import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()

    const txnid = formData.get('txnid') as string
    const status = formData.get('status') as string
    const receivedHash = formData.get('hash') as string
    const email = formData.get('email') as string
    const firstname = formData.get('firstname') as string
    const productinfo = formData.get('productinfo') as string
    const amount = formData.get('amount') as string

    if (!txnid || !status || !receivedHash) {
      return new Response('Invalid Response', { status: 400 })
    }

    const payment = await prisma.payment.findUnique({
      where: { txnid },
    })

    if (!payment || payment.type !== 'IMAGE') {
      return new Response('Transaction not found', { status: 404 })
    }

    // ✅ Idempotency protection
    if (payment.status === 'SUCCESS') {
      return new Response('Already processed', { status: 200 })
    }

    const salt = process.env.PAYU_SALT!
    const merchantKey = process.env.PAYU_MERCHANT_KEY!

    const udf = Array.from({ length: 10 }, (_, i) =>
      formData.get(`udf${i + 1}`) || ''
    )

    const hashString = [
      salt,
      status,
      ...udf.reverse(),
      email,
      firstname,
      productinfo,
      amount,
      txnid,
      merchantKey,
    ].join('|')

    const calculatedHash = crypto
      .createHash('sha512')
      .update(hashString)
      .digest('hex')

    if (calculatedHash !== receivedHash) {
      console.error('Hash mismatch', { txnid })
      return new Response('Security Violation', { status: 400 })
    }

    let finalStatus = 'FAILED'

    if (status === 'success') {
      finalStatus = 'SUCCESS'

      await prisma.$transaction([
        prisma.payment.update({
          where: { txnid },
          data: { status: 'SUCCESS' },
        }),

        // ✅ Add image payment amount to user's totalGiftAmount
        prisma.user.update({
          where: { id: payment.userId },
          data: {
            totalGiftAmount: {
              increment: Number(amount),
            },
          },
        }),
      ])
    } else {
      await prisma.payment.update({
        where: { txnid },
        data: { status: 'FAILED' },
      })
    }

    return new Response(
      `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Payment ${finalStatus}</title>
</head>
<body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh">
  <div style="text-align:center">
    <h2>Payment ${finalStatus}</h2>
    <p>You can close this window.</p>
  </div>

  <script>
    try {
      if (window.opener) {
        window.opener.postMessage(
          {
            type: 'PAYU_PAYMENT_COMPLETED',
            status: '${finalStatus}',
            txnid: '${txnid}'
          },
          window.location.origin
        )
      }
    } catch (e) {}

    setTimeout(() => window.close(), 1500)
  </script>
</body>
</html>`,
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    )
  } catch (err) {
    console.error('Verify Error', err)
    return new Response('Internal Server Error', { status: 500 })
  }
}
