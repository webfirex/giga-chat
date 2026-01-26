import { NextResponse } from "next/server";
import crypto from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";


export async function POST(req: Request) {

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    console.log("SESSION",session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { amount } = await req.json();

  // const txnid = crypto.randomUUID();

  const key = process.env.PAYU_MERCHANT_KEY!;
  const salt = process.env.PAYU_MERCHANT_SALT!;

  const txnid = `TXN_${Date.now()}`;
  const productinfo = "Gift";
  const firstname = session.user.firstName;
  const email = "user@email.com";

  // Hash sequence for PayU
  const hashString = `${key}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|||||||||||${salt}`;

  const hash = crypto
    .createHash("sha512")
    .update(hashString)
    .digest("hex");

  return NextResponse.json({
    key,
    txnid,
    amount,
    productinfo,
    firstname,
    email,
    phone:"2222222222",
    hash,

    action: `${process.env.PAYU_BASE_URL}/_payment`
  });
}

