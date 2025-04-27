import { env } from "@/env";
import { BUCKET_NAME, COMPANY, s3Client } from "@/lib/s3-client";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function uploadFileToS3(file: File, key: string): Promise<string> {
  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    });

    await s3Client.send(command);

    return `${env.NEXT_PUBLIC_S3_ENDPOINT}/${BUCKET_NAME}/${key}`;
  } catch (error) {
    console.error("Error uploading file to S3:", error);
    throw new Error("Failed to upload file to S3");
  }
}

export async function generatePresignedUrl(
  key: string,
  contentType: string
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  return url;
}

export function generateFileKey(fileName: string, folderId: string): string {
  const timestamp = Date.now();
  const extension = fileName.split(".").pop();
  const sanitizedFileName = fileName
    .split(".")[0]
    .replace(/[^a-zA-Z0-9]/g, "-")
    .toLowerCase();

  return `${COMPANY}/${folderId}/${timestamp}-${sanitizedFileName}.${extension}`;
}
