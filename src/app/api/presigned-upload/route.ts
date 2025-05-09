import { NextRequest, NextResponse } from "next/server";
import { generateFileKey } from "@/action/s3";
import { auth } from "@/lib/auth";
import { BUCKET_NAME, s3Client } from "@/lib/s3-client";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { fileName, fileType, folderId } = body;

    if (!fileName || !fileType || !folderId) {
      return NextResponse.json(
        { error: "fileName, fileType, and folderId are required" },
        { status: 400 }
      );
    }

    // Generate a key for the file
    const fileKey = generateFileKey(fileName, folderId);

    // Create command for generating presigned URL
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
      ContentType: fileType,
    });

    // Generate presigned URL (valid for 10 minutes)
    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 600,
    });

    // Return presigned URL and the file key
    return NextResponse.json({
      success: true,
      presignedUrl,
      fileKey,
      url: `${process.env.NEXT_PUBLIC_S3_ENDPOINT}/${BUCKET_NAME}/${fileKey}`,
    });
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return NextResponse.json(
      { error: "Failed to generate presigned URL" },
      { status: 500 }
    );
  }
}
