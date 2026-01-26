import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // adjust path if needed

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId || typeof userId !== "string") {
      return NextResponse.json(
        { error: "Invalid username" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        username: true,
        firstName: true,
        lastName: true,
        gender: true,
        genderMatch: true,
        interests: true,
        city: true,
        state: true,
        age: true,
        pfpUrl: true,
        totalGiftAmount: true,
        totalImageAmount: true,
        plan: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Shape response for mod consumption
    const userDetails = {
      username: user.username!,
      firstName: user.firstName,
      lastName: user.lastName,
      gender: user.gender,
      genderMatch:user.genderMatch,
      interests: user.interests ?? [],
      city: user.city,
      state: user.state,
      age: user.age,
      avatarUrl: user.pfpUrl,
      totalGiftAmount: user.totalGiftAmount,
      totalImageAmount: user.totalImageAmount,
      planName: user.plan?.name ?? null,
    };

    return NextResponse.json({ user: userDetails });
  } catch (error) {
    console.error("[GET_USER_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to fetch user details" },
      { status: 500 }
    );
  }
}
