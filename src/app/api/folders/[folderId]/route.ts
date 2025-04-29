import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ folderId: string }> }
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const folderId = (await params).folderId;

    // Fetch the folder with related data
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
      include: {
        documents: {
          select: {
            id: true,
            url: true,
            createdAt: true,
            userId: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            auditors: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    // Check if user has permission to view this folder
    const isOwner = folder.userId === session.user.id;
    const isAuditor = folder.project?.auditors.some(
      (auditor) => auditor.id === session.user.id
    );

    if (!isOwner && !isAuditor) {
      return NextResponse.json(
        { error: "Unauthorized to view this folder" },
        { status: 403 }
      );
    }

    // Format document URLs and other information
    const formattedDocuments = folder.documents.map((doc) => {
      // Extract filename from URL
      const urlParts = doc.url.split("/");
      const fileName = urlParts[urlParts.length - 1]
        .split("-")
        .slice(1)
        .join("-");

      // Determine file type
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

      return {
        id: doc.id,
        url: doc.url,
        fileName,
        fileType,
        fileExtension,
        createdAt: doc.createdAt,
        uploadedBy: doc.user.name,
        uploadedByEmail: doc.user.email,
      };
    });

    // Format folder data for response
    const formattedFolder = {
      id: folder.id,
      name: folder.name,
      isRoot: folder.isRoot,
      startDate: folder.startDate,
      endDate: folder.endDate,
      createdAt: folder.createdAt,
      documents: formattedDocuments,
      documentCount: formattedDocuments.length,
      owner: {
        id: folder.user.id,
        name: folder.user.name,
        email: folder.user.email,
      },
      project: folder.project
        ? {
            id: folder.project.id,
            auditors: folder.project.auditors,
          }
        : null,
      isOwner,
      isAuditor,
    };

    return NextResponse.json({ folder: formattedFolder });
  } catch (error) {
    console.error("Error fetching folder:", error);
    return NextResponse.json(
      { error: "Failed to fetch folder details" },
      { status: 500 }
    );
  }
}
