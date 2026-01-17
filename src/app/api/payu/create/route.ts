import { NextResponse } from "next/server";
import { createPayUPayload } from "@/lib/payu";
import crypto from "crypto";

export async function POST(req: Request) {
  const { amount, user } = await req.json();

  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  const txnid = crypto.randomUUID();

  const payload = createPayUPayload({
    txnid,
    amount,
    productinfo: "Chat Gift",
    firstname: user.name,
    email: user.email,
    phone: user.phone,
    successUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/payu/success`,
    failureUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/payu/failure`,
  });

  return NextResponse.json({
    action: `${process.env.PAYU_BASE_URL}/_payment`,
    payload,
  });
}
