import crypto from "crypto";

type CreatePaymentInput = {
  txnid: string;
  amount: number; // INR
  productinfo: string;
  firstname: string;
  email: string;
  phone: string;
  successUrl: string;
  failureUrl: string;
};

export function createPayUPayload(input: CreatePaymentInput) {
  const key = process.env.PAYU_MERCHANT_KEY!;
  const salt = process.env.PAYU_SALT!;

  const {
    txnid,
    amount,
    productinfo,
    firstname,
    email,
    successUrl,
    failureUrl,
  } = input;

  const hashString = [
    key,
    txnid,
    amount.toFixed(2),
    productinfo,
    firstname,
    email,
    "", "", "", "", "", "", "", "", "",
    salt,
  ].join("|");

  const hash = crypto.createHash("sha512").update(hashString).digest("hex");

  return {
    key,
    txnid,
    amount: amount.toFixed(2),
    productinfo,
    firstname,
    email,
    phone: input.phone,
    surl: successUrl,
    furl: failureUrl,
    hash,
  };
}

export async function verifyPayUPayment(
  txnid: string,
  amount: number
): Promise<boolean> {
  const key = process.env.PAYU_MERCHANT_KEY!;
  const salt = process.env.PAYU_SALT!;
  const command = "verify_payment";

  const hash = crypto
    .createHash("sha512")
    .update(`${key}|${command}|${txnid}|${salt}`)
    .digest("hex");

  const body = new URLSearchParams({
    key,
    command,
    hash,
    var1: txnid,
  });

  const res = await fetch(process.env.PAYU_VERIFY_URL!, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const data = await res.json();
  const txn = data?.transaction_details?.[txnid];

  if (!txn) return false;

  return txn.status === "success" && Number(txn.amt) === Number(amount);
}
