// /api/payu/callback/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const formData = await req.formData();

  const txnid = formData.get("txnid") as string;
  const status = formData.get("status") as string;

  if (!txnid) {
    return NextResponse.redirect(
      new URL("/chat?payment=failed", req.url),
      { status: 303 }
    );
  }

  const payment = await prisma.payment.findUnique({ where: { txnid } });

  if (!payment) {
    return NextResponse.redirect(
      new URL("/chat?payment=failed", req.url),
      { status: 303 }
    );
    
  }
  const plan = await prisma.plan.findUnique({
    where: { id: payment.refId },
  });

  if (!plan) {
    throw new Error("Plan not found");
  }

  if (status === "success") {
    await prisma.$transaction([
      prisma.payment.update({
        where: { txnid },
        data: { status: "SUCCESS" },
      }),
      prisma.user.update({
        where: { id: payment.userId },
        data: {
          planId: payment.refId,
          billingDate: new Date(),
          chatCount:plan.maxDailyChats
        },
      }),
    ]);

    return NextResponse.redirect(
      new URL("/chat?payment=success", req.url),
      { status: 303 }
    );
    
  }

  await prisma.payment.update({
    where: { txnid },
    data: { status: "FAILED" },
  });

  return NextResponse.redirect(
    new URL("/chat?payment=failed", req.url),
    { status: 303 }
  );
  
}
