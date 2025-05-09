import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { url, folderId } = body;

    if (!url || !folderId) {
      return NextResponse.json(
        { error: "url and folderId are required" },
        { status: 400 }
      );
    }

    // Create document record in database
    const document = await prisma.document.create({
      data: {
        url,
        folderId,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ success: true, document });
  } catch (error) {
    console.error("Error creating document record:", error);
    return NextResponse.json(
      { error: "Failed to create document record" },
      { status: 500 }
    );
  }
}
