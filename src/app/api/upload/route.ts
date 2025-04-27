import { NextResponse } from "next/server";
import { generateFileKey, uploadFileToS3 } from "@/action/s3";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folderId = formData.get("folderId") as string;

    if (!file || !folderId) {
      return NextResponse.json(
        { error: "File and folderId are required" },
        { status: 400 }
      );
    }

    const fileKey = generateFileKey(file.name, folderId);
    const fileUrl = await uploadFileToS3(file, fileKey);

    return NextResponse.json({ success: true, url: fileUrl });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
