// src/app/api/cron/document-cleanup/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { BUCKET_NAME, s3Client } from "@/lib/s3-client";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";

// Secret key for securing the cron endpoint
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  try {
    // Verify the request has the proper secret key
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Calculate date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Find documents older than 30 days
    const expiredDocuments = await prisma.document.findMany({
      where: {
        createdAt: {
          lt: thirtyDaysAgo,
        },
      },
    });

    // Log for debugging
    console.log(`Found ${expiredDocuments.length} expired documents`);

    // Delete each document from S3 and the database
    const results = await Promise.allSettled(
      expiredDocuments.map(async (document) => {
        try {
          // Extract the S3 key from the URL
          const url = new URL(document.url);
          const key = url.pathname.substring(1).split("/").slice(1).join("/");

          // Delete from S3
          await s3Client.send(
            new DeleteObjectCommand({
              Bucket: BUCKET_NAME,
              Key: key,
            })
          );

          // Delete from database
          await prisma.document.delete({
            where: {
              id: document.id,
            },
          });

          return { id: document.id, success: true };
        } catch (error) {
          console.error(`Error deleting document ${document.id}:`, error);
          return { id: document.id, success: false, error };
        }
      })
    );

    // Count successes and failures
    const successes = results.filter(
      (result) => result.status === "fulfilled" && result.value.success
    ).length;
    const failures = results.filter(
      (result) => !(result.status === "fulfilled" && result.value.success)
    ).length;

    return NextResponse.json({
      success: true,
      message: `Cleanup completed. Deleted ${successes} documents. Failed to delete ${failures} documents.`,
    });
  } catch (error) {
    console.error("Error in document cleanup cron job:", error);
    return NextResponse.json(
      { error: "Failed to run document cleanup" },
      { status: 500 }
    );
  }
}
