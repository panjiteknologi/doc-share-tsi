import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(["development", "production"]),
    DATABASE_URL: z.string().url(),
    NEXTAUTH_SECRET: z.string().min(1),
    NEXTAUTH_URL: z.string().url(),
    S3_ACCESS_KEY_ID: z.string().min(1),
    S3_SECRET_ACCESS_KEY: z.string().min(1),
  },

  client: {
    // Client-side environment variables (if any) go here
    // S3 Configuration - all server-side only
    NEXT_PUBLIC_S3_ENDPOINT: z.string().url(),
    NEXT_PUBLIC_S3_REGION: z.string().min(1),
    NEXT_PUBLIC_S3_BUCKET_NAME: z.string().min(1),
    NEXT_PUBLIC_S3_COMPANY: z.string().min(1),

    NEXT_PUBLIC_API_URL: z.string().url(),
  },

  // Include all environment variables here
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,

    // S3 Configuration
    NEXT_PUBLIC_S3_ENDPOINT: process.env.NEXT_PUBLIC_S3_ENDPOINT,
    NEXT_PUBLIC_S3_REGION: process.env.NEXT_PUBLIC_S3_REGION,
    NEXT_PUBLIC_S3_BUCKET_NAME: process.env.NEXT_PUBLIC_S3_BUCKET_NAME,
    NEXT_PUBLIC_S3_COMPANY: process.env.NEXT_PUBLIC_S3_COMPANY,

    // S3 Secret
    S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID,
    S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY,

    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
});
