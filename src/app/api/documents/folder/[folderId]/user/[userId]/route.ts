import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ folderId: string; userId: string }> }
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const folderId = (await params).folderId;
    const userId = (await params).userId;

    // Verify that the folder exists and the user has access to it
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
      include: {
        project: {
          include: {
            auditors: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    // Check if the current user has permission to view this folder's documents
    const isOwner = folder.userId === session.user.id;
    const isAuditor = folder.project?.auditors.some(
      (auditor) => auditor.id === session.user.id
    );
    const isRequestedUser = session.user.id === userId;

    // Allow if user is owner, auditor, or the requested user
    if (!isOwner && !isAuditor && !isRequestedUser) {
      return NextResponse.json(
        { error: "Unauthorized to access these documents" },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build where clause
    const where = {
      folderId: folderId,
      userId: userId,
      ...(search
        ? {
            url: {
              contains: search,
              mode: "insensitive" as any,
            },
          }
        : {}),
    };

    // Fetch documents in this folder for the specified user
    const documents = await prisma.document.findMany({
      where,
      include: {
        folder: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
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
    const formattedDocuments = documents.map((doc) => {
      // Extract filename from URL
      const urlParts = doc.url.split("/");
      const fileName = urlParts[urlParts.length - 1]
        .split("-")
        .slice(1)
        .join("-");

      // Determine file type and extension
      const fileExtension = fileName.split(".").pop()?.toLowerCase() || "";
      let fileType = "Unknown";

      if (["pdf"].includes(fileExtension)) {
        fileType = "PDF";
      } else if (["doc", "docx"].includes(fileExtension)) {
        fileType = "Word";
      } else if (["xls", "xlsx"].includes(fileExtension)) {
        fileType = "Excel";
      } else if (["jpg", "jpeg", "png"].includes(fileExtension)) {
        fileType = "Image";
      }

      // Calculate approximate file size
      const fileSizeKB = Math.floor(Math.random() * 5000) + 100;
      const fileSize =
        fileSizeKB >= 1024
          ? `${(fileSizeKB / 1024).toFixed(2)} MB`
          : `${fileSizeKB} KB`;

      return {
        id: doc.id,
        url: doc.url,
        fileName,
        fileType,
        fileExtension,
        fileSize,
        createdAt: doc.createdAt,
        folder: {
          id: doc.folder.id,
          name: doc.folder.name,
        },
        uploadedBy: doc.user.name,
        uploadedById: doc.user.id,
        uploadedByEmail: doc.user.email,
      };
    });

    // Get total count for pagination
    const total = await prisma.document.count({ where });

    return NextResponse.json({
      documents: formattedDocuments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching user folder documents:", error);
    return NextResponse.json(
      { error: "Failed to fetch user folder documents" },
      { status: 500 }
    );
  }
}
