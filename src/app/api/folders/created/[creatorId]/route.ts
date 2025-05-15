import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ creatorId: string }> }
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const creatorId = (await params).creatorId;

    const folders = await prisma.folder.findMany({
      where: {
        createdById: creatorId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        documents: true,
        project: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Format response data
    const formattedFolders = folders.map((folder) => ({
      id: folder.id,
      name: folder.name,
      isRoot: folder.isRoot,
      startDate: folder.startDate,
      endDate: folder.endDate,
      createdAt: folder.createdAt,
      documentCount: folder.documents.length,
      documents: folder.documents,
      userId: folder.userId,
      user: {
        id: folder.user.id,
        name: folder.user.name,
        email: folder.user.email,
      },
      createdById: folder.createdById,
      createdBy: {
        id: folder.createdBy?.id,
        name: folder.createdBy?.name,
        email: folder.createdBy?.email,
      },
      hasProject: folder.project !== null,
    }));

    return NextResponse.json({ folders: formattedFolders });
  } catch (error) {
    console.error("Error fetching folders by creator:", error);
    return NextResponse.json(
      { error: "Failed to fetch folders" },
      { status: 500 }
    );
  }
}
