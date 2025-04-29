import { S3Client } from "@aws-sdk/client-s3";
import { env } from "@/env"; // Adjust path as needed

export const BUCKET_NAME = env.NEXT_PUBLIC_S3_BUCKET_NAME;
export const COMPANY = env.NEXT_PUBLIC_S3_COMPANY;

export const s3Client = new S3Client({
  region: env.NEXT_PUBLIC_S3_REGION,
  endpoint: env.NEXT_PUBLIC_S3_ENDPOINT,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});
