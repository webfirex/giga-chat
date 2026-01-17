import { NextResponse } from "next/server";
import { verifyPayUPayment } from "@/lib/payu";

export async function POST(req: Request) {
  const { txnid, amount } = await req.json();

  if (!txnid || !amount) {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  const success = await verifyPayUPayment(txnid, amount);

  return NextResponse.json({ success });
}
