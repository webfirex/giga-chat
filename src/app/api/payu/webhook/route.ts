import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const data: Record<string, string> = {};
    formData.forEach((v, k) => (data[k] = v.toString()));

    const {
      txnid,
      status,
      amount,
      productinfo,
      firstname,
      email,
      hash: receivedHash,
      udf1 = '',
      udf2 = '',
      udf3 = '',
      udf4 = '',
      udf5 = '',
      udf6 = '',
      udf7 = '',
      udf8 = '',
      udf9 = '',
      udf10 = '',
    } = data;

    if (!txnid || !status || !receivedHash) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const payment = await prisma.payment.findUnique({
      where: { txnid },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // 🔁 Idempotency
    if (payment.status === 'SUCCESS') {
      return NextResponse.json({ status: 'already_processed' });
    }

    // 🔐 Verify PayU RESPONSE hash (reverse hash)
    const salt = process.env.PAYU_SALT!;
    const key = process.env.PAYU_MERCHANT_KEY!;

    const hashString = [
      salt,
      status,
      udf10,
      udf9,
      udf8,
      udf7,
      udf6,
      udf5,
      udf4,
      udf3,
      udf2,
      udf1,
      email,
      firstname,
      productinfo,
      amount,
      txnid,
      key,
    ].join('|');

    const calculatedHash = crypto
      .createHash('sha512')
      .update(hashString)
      .digest('hex');

    if (calculatedHash !== receivedHash) {
      console.error('PayU hash mismatch', { txnid });
      return NextResponse.json({ error: 'Hash mismatch' }, { status: 400 });
    }

    // -----------------------------
    // ✅ SUCCESS / FAILURE HANDLING
    // -----------------------------

    if (status === 'success') {
      // 🔒 Use transaction to avoid partial updates
      await prisma.$transaction(async (tx) => {
        // 1️⃣ Mark payment success
        await tx.payment.update({
          where: { txnid },
          data: {
            status: 'SUCCESS',
            createdAt: new Date(),
          },
        });

        // 2️⃣ Type-specific side effects
        if (payment.type === 'PLAN') {
          const plan = await tx.plan.findUnique({
            where: { id: payment.refId },
          });

          if (!plan) throw new Error('Plan not found');

          await tx.user.update({
            where: { id: payment.userId },
            data: {
              planId: plan.id,
              billingDate: new Date(),
              chatCount: plan.maxDailyChats,
            },
          });
        }

        if (payment.type === 'IMAGE') {
          await tx.user.update({
            where: { id: payment.userId },
            data: {
              totalImageAmount: {
                increment: Number(amount),
              },
            },
          });
        }

        if (payment.type === 'GIFT') {
          await tx.user.update({
            where: { id: payment.userId },
            data: {
              totalGiftAmount: {
                increment: Number(amount),
              },
            },
          });
        }
      });
    } else {
      // ❌ FAILED payment
      await prisma.payment.update({
        where: { txnid },
        data: { status: 'FAILED' },
      });
    }

    return NextResponse.json({ status: 'ok' });
  } catch (err) {
    console.error('PayU Webhook Error', err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
