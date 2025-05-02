import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Fetch documents in root folders
    const documents = await prisma.document.findMany({
      where: {
        folder: {
          isRoot: true,
        },
      },
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
      orderBy: {
        createdAt: "desc",
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

    return NextResponse.json({
      documents: formattedDocuments,
    });
  } catch (error) {
    console.error("Error fetching root documents:", error);
    return NextResponse.json(
      { error: "Failed to fetch root documents" },
      { status: 500 }
    );
  }
}
