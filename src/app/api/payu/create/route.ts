import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { createPayUPayload } from "@/lib/payu";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { planId } = await req.json();

  const plan = await prisma.plan.findUnique({
    where: { id: planId },
  });

  if (!plan) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const txnid = crypto.randomUUID();

  // Save pending payment
  await prisma.payment.create({
    data: {
      txnid,
      userId: session.user.id,
      amount: plan.price,
      type: "PLAN",
      refId: plan.id,
      status: "PENDING",
    },
  });

  const email =
  session.user.email ||
  `${session.user.phone}@yourapp.local`

  // ✅ Use helper to generate PayU payload
  const payuPayload = createPayUPayload({
    txnid,
    amount: plan.price,
    productinfo: `PLAN:${plan.id}`,
    firstname: session.user.firstName || "User",
    email: email,
    phone: "9999999999",
    surl: `${process.env.BASE_URL}/api/payu/callback`,
    furl: `${process.env.BASE_URL}/api/payu/callback`,
  });

  console.log("PAYLOAD", payuPayload)

  return NextResponse.json({
    action: `${process.env.PAYU_BASE_URL}/_payment`,
    payload: payuPayload,
  });
}
