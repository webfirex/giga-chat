import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const body = await req.formData()

  const txnid = body.get('txnid') as string
  const status = body.get('status') as string
  const payuSubId = body.get('subscription_id') as string

  const payment = await prisma.payment.findUnique({ where: { txnid } })
  if (!payment) return new Response('Invalid txn', { status: 400 })

  if (status !== 'success') {
    await prisma.payment.update({
      where: { txnid },
      data: { status: 'FAILED' }
    })
    return Response.redirect(`${process.env.BASE_URL}/payment-failed`)
  }

  const nextBilling = new Date()
  nextBilling.setMonth(nextBilling.getMonth() + 1)

  await prisma.$transaction([
    prisma.payment.update({
      where: { txnid },
      data: { status: 'SUCCESS' }
    }),
    prisma.user.update({
      where: { id: payment.userId },
      data: {
        planId: payment.refId,
        billingDate: nextBilling,
        payuSubId,
        autopayEnabled: true,
        pendingPlanId: null
      }
    })
  ])

  return Response.redirect(`${process.env.BASE_URL}/payment-success`)
}
