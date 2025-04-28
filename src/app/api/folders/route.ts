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
    const userId = searchParams.get("userId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build query for folders with optional search
    const where: any = {
      userId,
    };

    if (search) {
      where.name = {
        contains: search,
        mode: "insensitive" as any,
      };
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
      startDate: folder.startDate,
      endDate: folder.endDate,
      createdAt: folder.createdAt,
      documentCount: folder.documents.length,
      createdByName: folder.user.name,
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
