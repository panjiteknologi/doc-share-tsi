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
    const userId = searchParams.get("userId") || session.user.id;
    const folderId = searchParams.get("folderId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build query for documents with optional filters
    const where: any = {};

    // If a specific user's documents are requested, add userId filter
    if (userId) {
      where.userId = userId;
    }

    // If a specific folder's documents are requested, add folderId filter
    if (folderId) {
      where.folderId = folderId;

      // Verify that the user has access to this folder
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
        return NextResponse.json(
          { error: "Folder not found" },
          { status: 404 }
        );
      }

      const isOwner = folder.userId === session.user.id;
      const isAuditor = folder.project?.auditors.some(
        (auditor) => auditor.id === session.user.id
      );

      if (!isOwner && !isAuditor) {
        return NextResponse.json(
          { error: "Unauthorized to access this folder" },
          { status: 403 }
        );
      }
    }

    // Add search filter
    if (search) {
      // Based on your database structure, we search in the URL because documents don't have a name field
      where.url = {
        contains: search,
        mode: "insensitive" as any,
      };
    }

    // Fetch documents with pagination
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

    // Format response data - extract filename, file type etc. from URL
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

      // Calculate approximate file size (this would be mock data as we don't store actual size)
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
    console.error("Error fetching documents:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}
