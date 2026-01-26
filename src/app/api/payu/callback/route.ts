// /api/payu/callback/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const formData = await req.formData();

  const txnid = formData.get("txnid") as string;
  const status = formData.get("status") as string;

  if (!txnid) {
    return NextResponse.redirect(new URL("/chat?payment=failed", req.url));
  }

  const payment = await prisma.payment.findUnique({ where: { txnid } });

  if (!payment) {
    return NextResponse.redirect(new URL("/chat?payment=failed", req.url));
  }

  if (status === "success") {
    await prisma.$transaction([
      prisma.payment.update({
        where: { txnid },
        data: { status: "SUCCESS" },
      }),
      prisma.user.update({
        where: { id: payment.userId },
        data: { planId: payment.refId },
      }),
    ]);

    return NextResponse.redirect(
      new URL("/chat?payment=success", req.url)
    );
  }

  await prisma.payment.update({
    where: { txnid },
    data: { status: "FAILED" },
  });

  return NextResponse.redirect(
    new URL("/chat?payment=failed", req.url)
  );
}
