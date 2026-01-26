import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const formData = await request.formData();
  const image = formData.get("image");

  if (!image) {
    return NextResponse.json(
      { success: false, message: "Missing information" },
      { status: 400 }
    );
  }

  try {
    // Upload image to imgbb
    const imgbbResponse = await fetch(
      "http://imgbb.webepex.com/upload.php?key=hjbd34uyf875g48bqru",
      {
        method: "POST",
        body: formData,
      }
    );

    const imgbbData = await imgbbResponse.json();

    if (!imgbbData.success) {
      console.log("IMAGE-BB-DATA", imgbbData);
      return NextResponse.json({
        success: false,
        message: "Error uploading image",
        data: imgbbData,
      });
    }

    const imageUrl = imgbbData.data.url.replace("https://", "http://");

    // ✅ Insert into Image table
    const imageRecord = await prisma.image.create({
      data: {
        imageUrl,
      },
    });

    // ✅ Return image ID
    return NextResponse.json({
      success: true,
      imageId: imageRecord.id,
    });

  } catch (error) {
    console.error("UPLOAD IMAGE ERROR", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
