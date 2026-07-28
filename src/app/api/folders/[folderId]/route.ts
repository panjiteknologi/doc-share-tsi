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
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        children: {
          include: {
            documents: {
              select: { id: true },
            },
            createdBy: {
              select: { id: true, name: true, email: true },
            },
            project: {
              select: {
                auditors: { select: { id: true } },
              },
            },
            _count: {
              select: { children: true },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    // Auditors only have access to folders they're explicitly connected to
    // via a Project — access does not cascade from a parent folder to its
    // children, so each folder/subfolder must be checked individually.
    const isAuditor = session.user.roleCode === "auditor";
    if (isAuditor) {
      const hasAccess = folder.project?.auditors.some(
        (auditor) => auditor.id === session.user.id
      );
      if (!hasAccess) {
        return NextResponse.json(
          { error: "You don't have access to this folder" },
          { status: 403 }
        );
      }
    }

    const visibleChildren = isAuditor
      ? folder.children.filter((child) =>
          child.project?.auditors.some(
            (auditor) => auditor.id === session.user.id
          )
        )
      : folder.children;

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
      isSustain: folder.isSustain,
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
      parentId: folder.parentId,
      parent: folder.parent,
      children: visibleChildren.map((child) => ({
        id: child.id,
        name: child.name,
        isRoot: child.isRoot,
        isSustain: child.isSustain,
        startDate: child.startDate,
        endDate: child.endDate,
        createdAt: child.createdAt,
        userId: child.userId,
        createdById: child.createdById,
        documents: child.documents,
        childrenCount: child._count.children,
        user: {
          id: folder.user.id,
          name: folder.user.name,
          email: folder.user.email,
        },
      })),
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
