import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const topLevelOnly = searchParams.get("topLevelOnly") === "true";
    const createdByMe = searchParams.get("createdByMe") === "true";

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build query for folders with optional search
    const where: any = {};

    if (search) {
      where.name = {
        contains: search
      };
    }

    // Restrict to root-level folders only, for tree views that lazy-load children
    if (topLevelOnly) {
      where.parentId = null;
    }

    // Restrict to folders created by the requesting user
    if (createdByMe) {
      where.createdById = session.user.id;
    }

    // Fetch folders with pagination
    const folders = await prisma.folder.findMany({
      where,
      include: {
        documents: {
          select: {
            id: true,
          },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        user: {
          select: {
            name: true,
          },
        },
        project: {
          select: {
            id: true,
          },
        },
        _count: {
          select: { children: true },
        },
      },
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
    });

    // Format response data
    const formattedFolders = folders.map((folder) => ({
      id: folder.id,
      name: folder.name,
      isRoot: folder.isRoot,
      isSustain: folder.isSustain,
      parentId: folder.parentId,
      startDate: folder.startDate,
      endDate: folder.endDate,
      createdAt: folder.createdAt,
      documentCount: folder.documents.length,
      childrenCount: folder._count.children,
      createdByName: folder.createdBy?.name,
      createdBy: folder.createdBy,
      owner: folder.user.name,
      userId: folder.userId,
      hasProject: folder.project !== null,
    }));

    // Get total count for pagination
    const total = await prisma.folder.count({ where });

    return NextResponse.json({
      folders: formattedFolders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching folders:", error);
    return NextResponse.json(
      { error: "Failed to fetch folders" },
      { status: 500 }
    );
  }
}
