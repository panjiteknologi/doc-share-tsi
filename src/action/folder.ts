"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// Define schema for folder creation
const FolderSchema = z
  .object({
    name: z
      .string()
      .min(1, "Folder name is required")
      .max(100, "Folder name must be less than 100 characters")
      .refine((val) => /^[a-zA-Z0-9\s\-_]+$/.test(val), {
        message:
          "Folder name can only contain letters, numbers, spaces, hyphens, and underscores",
      }),
    userId: z.string().min(1, "User ID is required"),
    isRoot: z.boolean().default(false),
    startDate: z.date(),
    endDate: z.date(),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: "End date must be after start date",
    path: ["endDate"],
  });

export type FolderFormData = z.infer<typeof FolderSchema>;

export async function createFolder(data: FolderFormData) {
  try {
    // Verify authentication
    const session = await auth();
    if (!session) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify authorization (user can only create folders for themselves)
    if (session.user.id !== data.userId) {
      return { success: false, error: "Unauthorized operation" };
    }

    // Validate the input data against our schema
    const validatedData = FolderSchema.parse(data);

    // Check if folder name already exists for this user
    const existingFolder = await prisma.folder.findFirst({
      where: {
        name: validatedData.name,
        userId: validatedData.userId,
      },
    });

    if (existingFolder) {
      return {
        success: false,
        error: "A folder with this name already exists",
      };
    }

    // Create folder in database
    const folder = await prisma.folder.create({
      data: validatedData,
    });

    // Revalidate relevant paths to update UI
    revalidatePath("/dashboard");
    revalidatePath("/drive");

    return { success: true, folder };
  } catch (error) {
    console.error("Error creating folder:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors.map((e) => e.message).join(", "),
      };
    }

    return {
      success: false,
      error: "Failed to create folder. Please try again later.",
    };
  }
}
