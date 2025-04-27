"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// Define schema for document creation
const DocumentSchema = z.object({
  url: z
    .string()
    .min(1, "Document URL is required")
    .refine((value) => value.startsWith("http"), {
      message: "URL must include protocol (http:// or https://)",
    }),
  folderId: z.string().min(1, "Folder ID is required"),
  userId: z.string().min(1, "User ID is required"),
});

export type DocumentFormData = z.infer<typeof DocumentSchema>;

export async function createDocument(data: DocumentFormData) {
  try {
    // Verify authentication
    const session = await auth();
    if (!session) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify authorization (user can only create documents for themselves)
    if (session.user.id !== data.userId) {
      return { success: false, error: "Unauthorized operation" };
    }

    console.log("Creating document with data: ", data);

    // Validate the input data against our schema
    const validatedData = DocumentSchema.parse(data);

    // Verify that the folder exists and belongs to the user
    const folder = await prisma.folder.findUnique({
      where: {
        id: validatedData.folderId,
        userId: validatedData.userId,
      },
    });

    if (!folder) {
      return { success: false, error: "Folder not found or access denied" };
    }

    // Create document in database
    const document = await prisma.document.create({
      data: validatedData,
    });

    // Revalidate relevant paths to update UI
    revalidatePath("/dashboard");
    revalidatePath("/drive");
    revalidatePath(`/folder/${validatedData.folderId}`);

    return { success: true, document };
  } catch (error) {
    console.error("Error creating document:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors.map((e) => e.message).join(", "),
      };
    }

    return {
      success: false,
      error: "Failed to create document. Please try again later.",
    };
  }
}
