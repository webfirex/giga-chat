import { NextResponse } from "next/server";
import sharp from "sharp";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("image") as File;

  if (!file) {
    return NextResponse.json({ error: "No image provided" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const blurredImage = await sharp(buffer)
    .blur(10) // blur strength (1–100)
    .toBuffer();

  const blurredImage2 = await sharp(blurredImage)
    .blur(10) // blur strength (1–100)
    .toBuffer();

  return new NextResponse(blurredImage2, {
    headers: {
      "Content-Type": "image/png",
    },
  });
}
