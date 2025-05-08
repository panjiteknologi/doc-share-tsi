import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { BUCKET_NAME, s3Client } from "@/lib/s3-client";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const documentId = (await params).documentId;

    // Fetch the document with related data
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        folder: {
          select: {
            id: true,
            name: true,
            userId: true,
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
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Format document data
    // Extract filename from URL
    const urlParts = document.url.split("/");
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

    const formattedDocument = {
      id: document.id,
      url: document.url,
      fileName,
      fileType,
      fileExtension,
      fileSize,
      createdAt: document.createdAt,
      folder: {
        id: document.folder.id,
        name: document.folder.name,
      },
      uploadedBy: document.user.name,
      uploadedById: document.user.id,
      uploadedByEmail: document.user.email,
    };

    return NextResponse.json({ document: formattedDocument });
  } catch (error) {
    console.error("Error fetching document:", error);
    return NextResponse.json(
      { error: "Failed to fetch document details" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const documentId = (await params).documentId;

    // Fetch the document to verify ownership
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        folder: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Check if the current user has permission to delete this document
    const isDocumentOwner = document.userId === session.user.id;
    const isFolderOwner = document.folder.userId === session.user.id;

    if (!isDocumentOwner && !isFolderOwner) {
      return NextResponse.json(
        { error: "Unauthorized to delete this document" },
        { status: 403 }
      );
    }

    // Extract the S3 key from the URL
    const url = new URL(document.url);
    const key = url.pathname.substring(1).split("/").slice(1).join("/");

    try {
      // Delete the file from S3
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key,
        })
      );
    } catch (s3Error) {
      console.error("Error deleting file from S3:", s3Error);
      // You might decide to continue with database deletion
      // despite S3 errors, or fail the entire operation
    }

    // Delete the document record from the database
    await prisma.document.delete({
      where: { id: documentId },
    });

    return NextResponse.json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}
