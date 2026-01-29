import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/* ---------------- GET FRIENDS ---------------- */
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { friends: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: user.friends ?? {}
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/* ---------------- ADD FRIEND + CHAT ---------------- */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const {
      username,
      fullName,
      avatarUrl,
      city
    } = await req.json();

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const friends = (user.friends as Record<string, any>) ?? {};

    if (friends[username]) {
      return NextResponse.json(
        { error: "Friend already exists" },
        { status: 400 }
      );
    }

    // ✅ create chat
    const chat = await prisma.chat.create({
      data: { chats: [] }
    });

    friends[username] = {
      username,
      chatId: chat.id,
      fullName,
      avatarUrl,
      city
    };

    await prisma.user.update({
      where: { id: session.user.id },
      data: { friends }
    });

    return NextResponse.json({
      success: true,
      data: friends[username]
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/* ---------------- REMOVE FRIEND ---------------- */
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { username } = await req.json();

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const friends = (user.friends as Record<string, any>) ?? {};

    if (!friends[username]) {
      return NextResponse.json(
        { error: "Friend not found" },
        { status: 404 }
      );
    }

    const chatId = friends[username].chatId;

    delete friends[username];

    await prisma.user.update({
      where: { id: session.user.id },
      data: { friends }
    });

    // Optional: delete chat as well
    if (chatId) {
      await prisma.chat.delete({
        where: { id: chatId }
      });
    }

    return NextResponse.json({
      success: true,
      message: "Friend removed"
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
