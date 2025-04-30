import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const batchRequestSchema = z.object({
  folderIds: z.array(z.string()),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const parsedBody = batchRequestSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    const { folderIds } = parsedBody.data;

    const folders = await prisma.folder.findMany({
      where: {
        id: {
          in: folderIds,
        },
      },
      include: {
        user: true,
        documents: true,
      },
    });

    return NextResponse.json({ folders });
  } catch (error) {
    console.error("Error fetching folders by IDs:", error);
    return NextResponse.json(
      { error: "Failed to fetch folders" },
      { status: 500 }
    );
  }
}
