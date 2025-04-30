import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const folders = await prisma.folder.findMany({
      where: {
        isRoot: false,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: true,
        documents: true,
      },
    });

    return NextResponse.json({ folders });
  } catch (error) {
    console.error("Error fetching non-root folders:", error);
    return NextResponse.json(
      { error: "Failed to fetch folders" },
      { status: 500 }
    );
  }
}
