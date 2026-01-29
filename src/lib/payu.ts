import crypto from "crypto";

export function createPayUPayload(input: {
  txnid: string;
  amount: number;
  productinfo: string;
  firstname: string;
  email: string;
  phone: string;
  surl: string;
  furl: string;
}) {
  const key = process.env.PAYU_MERCHANT_KEY!.trim();
  const salt = process.env.PAYU_SALT!.trim();
  const amount = input.amount.toFixed(2);

  // udf fields MUST exist
  const udf1 = "";
  const udf2 = "";
  const udf3 = "";
  const udf4 = "";
  const udf5 = "";

  /**
   * EXACT PayU hash formula:
   * key|txnid|amount|productinfo|firstname|email|
   * udf1|udf2|udf3|udf4|udf5||||||SALT
   */
  const hashString =
    `${key}|${input.txnid}|${amount}|${input.productinfo}|` +
    `${input.firstname}|${input.email}|` +
    `${udf1}|${udf2}|${udf3}|${udf4}|${udf5}` +
    `||||||${salt}`;

  const hash = crypto
    .createHash("sha512")
    .update(hashString, "utf8")
    .digest("hex");

  console.log("HASH STRING",hashString)

  return {
    key,
    txnid: input.txnid,
    amount,
    productinfo: input.productinfo,
    firstname: input.firstname,
    email: input.email,
    phone: input.phone,
    surl: input.surl,
    furl: input.furl,
    udf1,
    udf2,
    udf3,
    udf4,
    udf5,
    hash,
  };
}

/**
 * 2. Verify Payment Status (Merchant API)
 */
export async function verifyPayUPayment(txnid: string): Promise<boolean> {
  const key = process.env.PAYU_MERCHANT_KEY!.trim();
  const salt = process.env.PAYU_SALT!.trim();

  /**
   * Hash format for verification:
   * key|command|txnid|salt
   */
  const command = "verify_payment";
  const hashString = `${key}|${command}|${txnid}|${salt}`;

  const hash = crypto
    .createHash("sha512")
    .update(hashString)
    .digest("hex");

  const res = await fetch(
    `${process.env.PAYU_BASE_URL}/merchant/postservice.php?form=2`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        key,
        command,
        var1: txnid,
        hash,
      }),
    }
  );

  const data = await res.json();

  return (
    data?.transaction_details?.[txnid]?.status === "success"
  );
}

export function generatePayUHash({
  key,
  txnid,
  amount,
  productinfo,
  firstname,
  email,
  salt,
}: {
  key: string
  txnid: string
  amount: string 
  productinfo: string
  firstname: string
  email: string
  salt: string
}) {
  const hashString = [
      key,
      txnid,
      amount,
      productinfo,
      firstname,
      email,
      '', '', '', '', '', '', '', '', '', '',
      salt,
    ].join('|');

  return crypto
    .createHash('sha512')
    .update(hashString)
    .digest('hex')
}