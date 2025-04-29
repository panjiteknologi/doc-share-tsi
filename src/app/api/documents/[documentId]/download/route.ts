import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { BUCKET_NAME, s3Client } from "@/lib/s3-client";
import prisma from "@/lib/prisma";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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
    const operation = request.nextUrl.searchParams.get("operation") || "view";

    // Fetch the document with related data
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        folder: {
          select: {
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

    // Check permissions
    const isOwner = document.userId === session.user.id;
    const isFolderOwner = document.folder.userId === session.user.id;
    const isAuditor = document.folder.project?.auditors.some(
      (auditor) => auditor.id === session.user.id
    );

    if (!isOwner && !isFolderOwner && !isAuditor) {
      return NextResponse.json(
        { error: "Unauthorized to access this document" },
        { status: 403 }
      );
    }

    // Extract the key from the URL
    const url = new URL(document.url);
    const key = url.pathname.substring(1).split("/").slice(1).join("/");

    // Extract filename
    const urlParts = document.url.split("/");
    const fileName = urlParts[urlParts.length - 1]
      .split("-")
      .slice(1)
      .join("-");

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ResponseContentDisposition:
        operation === "download"
          ? `attachment; filename="${fileName}"`
          : "inline",
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });

    return NextResponse.redirect(signedUrl);
  } catch (error) {
    console.error("Error processing document request:", error);
    return NextResponse.json(
      { error: "Failed to process document request" },
      { status: 500 }
    );
  }
}
