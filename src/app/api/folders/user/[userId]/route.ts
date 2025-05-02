import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = (await params).userId;

    const folders = await prisma.folder.findMany({
      where: {
        userId,
      },
      include: {
        user: true,
        documents: true,
      },
    });

    return NextResponse.json({ folders });
  } catch (error) {
    console.error("Error fetching user's folders:", error);
    return NextResponse.json(
      { error: "Failed to fetch folders" },
      { status: 500 }
    );
  }
}
