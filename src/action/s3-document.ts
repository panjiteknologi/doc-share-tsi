"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { BUCKET_NAME, s3Client } from "@/lib/s3-client";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function getDocumentViewUrl(documentId: string) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return { success: false, error: "Not authenticated" };
    }

    // Fetch the document to verify permissions
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        folder: {
          select: {
            userId: true,
            project: {
              include: {
                auditors: {
                  select: { id: true },
                },
              },
            },
          },
        },
      },
    });

    if (!document) {
      return { success: false, error: "Document not found" };
    }

    const isOwner = document.userId === session.user.id;
    const isFolderOwner = document.folder.userId === session.user.id;
    const isAuditor = document.folder.project?.auditors.some(
      (auditor) => auditor.id === session.user.id
    );

    if (!isOwner && !isFolderOwner && !isAuditor) {
      return {
        success: false,
        error: "You don't have permission to view this document",
      };
    }

    const url = new URL(document.url);
    const key = url.pathname.substring(1).split("/").slice(1).join("/");

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ResponseContentDisposition: "inline",
    });

    const viewUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });

    return { success: true, url: viewUrl };
  } catch (error) {
    console.error("Error generating view URL:", error);
    return {
      success: false,
      error: "Failed to generate document view URL",
    };
  }
}

export async function getDocumentDownloadUrl(documentId: string) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return { success: false, error: "Not authenticated" };
    }

    // Fetch the document to verify permissions and get filename
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        folder: {
          select: {
            userId: true,
            project: {
              include: {
                auditors: {
                  select: { id: true },
                },
              },
            },
          },
        },
      },
    });

    if (!document) {
      return { success: false, error: "Document not found" };
    }

    const isOwner = document.userId === session.user.id;
    const isFolderOwner = document.folder.userId === session.user.id;
    const isAuditor = document.folder.project?.auditors.some(
      (auditor) => auditor.id === session.user.id
    );

    if (!isOwner && !isFolderOwner && !isAuditor) {
      return {
        success: false,
        error: "You don't have permission to download this document",
      };
    }

    const url = new URL(document.url);
    const key = url.pathname.substring(1).split("/").slice(1).join("/");

    const urlParts = document.url.split("/");
    const fileName = urlParts[urlParts.length - 1]
      .split("-")
      .slice(1)
      .join("-");

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ResponseContentDisposition: `attachment; filename="${fileName}"`,
    });

    const downloadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 900,
    });

    return { success: true, url: downloadUrl, fileName };
  } catch (error) {
    console.error("Error generating download URL:", error);
    return {
      success: false,
      error: "Failed to generate document download URL",
    };
  }
}
