import { prisma } from "@/lib/prisma";
import sharp from "sharp";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 403 });
  }

  const { id } = await params;

  const image = await prisma.image.findUnique({
    where: { id },
  });

  if (!image) {
    return new Response("Not found", { status: 404 });
  }

  const payment = await prisma.payment.findFirst({
    where: {
      refId: id,
      // userId,
      type: "IMAGE",
      status: "SUCCESS",
    },
  });

  // ✅ Fetch remote image as buffer
  const imageResponse = await fetch(image.imageUrl);

  if (!imageResponse.ok) {
    return new Response("Failed to fetch image", { status: 500 });
  }

  const arrayBuffer = await imageResponse.arrayBuffer();
  const originalBuffer = Buffer.from(arrayBuffer);

  if(session.user.role == "MOD"){
    return new Response(originalBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
      },
    });
  }
  // 🔐 Blur if not paid
  const outputBuffer = payment
    ? originalBuffer
    : await sharp(originalBuffer).blur(25).toBuffer();

  return new Response(outputBuffer, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-store",
    },
  });
}
