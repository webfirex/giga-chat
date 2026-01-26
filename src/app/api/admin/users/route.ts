import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    // 🔐 Get session (App Router compatible)
    const session = await getServerSession(authOptions);

    // 🛑 Authorization check
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // 📄 Pagination
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page") || 1);
    const limit = 50;

    const users = await prisma.randomUser.findMany({
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        fullName: true,
        userName: true,
        pfpUrl: true,
        age: true,
        gender: true,
        city: true,
      },
      orderBy: {
        fullName: "asc",
      },
    });

    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error("❌ ADMIN USERS API ERROR:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}


export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { fullName, userName, age, city, gender, pfpUrl } = body;

    if (!fullName || !userName || !pfpUrl) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const user = await prisma.randomUser.create({
      data: {
        fullName,
        userName,
        age: Number(age),
        city,
        gender,
        pfpUrl,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("❌ ADD USER ERROR:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}


export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "User ID required" },
        { status: 400 }
      );
    }

    const user = await prisma.randomUser.update({
      where: { id },
      data: {
        ...updates,
        age: updates.age ? Number(updates.age) : undefined,
      },
    });

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error("❌ UPDATE USER ERROR:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}


export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { ids } = body;

    if (!Array.isArray(ids) || !ids.length) {
      return NextResponse.json(
        { error: "Invalid IDs" },
        { status: 400 }
      );
    }

    await prisma.randomUser.deleteMany({
      where: {
        id: { in: ids },
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("❌ DELETE USER ERROR:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}