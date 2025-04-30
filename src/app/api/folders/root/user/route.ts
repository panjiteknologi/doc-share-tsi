import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const folder = await prisma.folder.findFirst({
      where: {
        isRoot: true,
      },
    });

    return NextResponse.json({ folder });
  } catch (error) {
    console.error("Error fetching root folder:", error);
    return NextResponse.json(
      { error: "Failed to fetch root folder" },
      { status: 500 }
    );
  }
}
