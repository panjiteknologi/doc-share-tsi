import { NextRequest, NextResponse } from "next/server";
import { generateFileKey, uploadFileToS3 } from "@/action/s3";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Increase the body size limit just for this route
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "50mb", // Adjust as needed, but keep it reasonable
    },
    responseLimit: "50mb",
  },
};

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folderId = formData.get("folderId") as string;
    const chunkIndex = parseInt(formData.get("chunkIndex") as string);
    const totalChunks = parseInt(formData.get("totalChunks") as string);
    const fileName = formData.get("fileName") as string;
    const fileType = formData.get("fileType") as string;

    if (
      !file ||
      !folderId ||
      isNaN(chunkIndex) ||
      isNaN(totalChunks) ||
      !fileName
    ) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // For the first chunk, generate a file key and session ID
    let fileKey;
    let sessionId;

    if (chunkIndex === 0) {
      fileKey = generateFileKey(fileName, folderId);
      sessionId = Math.random().toString(36).substring(2, 15);

      // Store in session or temporary storage
      // For simplicity, we'll return it to the client
    } else {
      // For subsequent chunks, get the fileKey from the request
      fileKey = formData.get("fileKey") as string;
      sessionId = formData.get("sessionId") as string;
    }

    // Handle the chunk
    // In a real implementation, you'd want to store chunks and combine them
    // For simplicity in this example, we'll assume each chunk is processed independently

    let fileUrl;

    // If it's the last chunk, finalize the upload
    if (chunkIndex === totalChunks - 1) {
      // In a real implementation, you'd combine chunks here
      fileUrl = await uploadFileToS3(file, fileKey);

      // Create document in database
      const document = await prisma.document.create({
        data: {
          url: fileUrl,
          folderId,
          userId: session.user.id,
        },
      });

      return NextResponse.json({
        success: true,
        url: fileUrl,
        document,
        isComplete: true,
      });
    }

    // For non-final chunks, just acknowledge receipt
    return NextResponse.json({
      success: true,
      fileKey,
      sessionId,
      isComplete: false,
      chunkIndex,
      totalChunks,
    });
  } catch (error) {
    console.error("Error handling chunked upload:", error);
    return NextResponse.json(
      { error: "Failed to process upload chunk" },
      { status: 500 }
    );
  }
}
