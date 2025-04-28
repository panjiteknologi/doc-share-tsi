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

// Schema for document updates
const UpdateDocumentSchema = z.object({
  id: z.string().min(1, "Document ID is required"),
  url: z
    .string()
    .min(1, "Document URL is required")
    .refine((value) => value.startsWith("http"), {
      message: "URL must include protocol (http:// or https://)",
    })
    .optional(),
  folderId: z.string().min(1, "Folder ID is required").optional(),
});

export type DocumentFormData = z.infer<typeof DocumentSchema>;
export type UpdateDocumentFormData = z.infer<typeof UpdateDocumentSchema>;

export async function createDocument(data: DocumentFormData) {
  try {
    const session = await auth();
    if (!session) {
      return { success: false, error: "Not authenticated" };
    }

    if (session.user.id !== data.userId) {
      return { success: false, error: "Unauthorized operation" };
    }

    const validatedData = DocumentSchema.parse(data);

    const folder = await prisma.folder.findUnique({
      where: {
        id: validatedData.folderId,
        userId: validatedData.userId,
      },
    });

    if (!folder) {
      return { success: false, error: "Folder not found or access denied" };
    }

    const document = await prisma.document.create({
      data: validatedData,
    });

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

export async function updateDocument(formData: FormData) {
  try {
    const session = await auth();
    if (!session) {
      return { success: false, error: "Not authenticated" };
    }

    const id = formData.get("id") as string;
    const url = formData.get("url") as string;
    const folderId = formData.get("folderId") as string;

    const updateData: any = { id };
    if (url) updateData.url = url;
    if (folderId) updateData.folderId = folderId;

    const validationResult = UpdateDocumentSchema.safeParse(updateData);
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.errors.map((e) => e.message).join(", "),
      };
    }

    const existingDocument = await prisma.document.findUnique({
      where: { id },
      include: {
        folder: true,
      },
    });

    if (!existingDocument) {
      return { success: false, error: "Document not found" };
    }

    if (existingDocument.userId !== session.user.id) {
      return { success: false, error: "Unauthorized operation" };
    }

    if (folderId && folderId !== existingDocument.folderId) {
      const folder = await prisma.folder.findUnique({
        where: {
          id: folderId,
          userId: session.user.id,
        },
      });

      if (!folder) {
        return { success: false, error: "Folder not found or access denied" };
      }
    }

    delete updateData.id;

    const updatedDocument = await prisma.document.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/dashboard");
    revalidatePath("/drive");
    revalidatePath(`/folder/${existingDocument.folderId}`);
    if (folderId && folderId !== existingDocument.folderId) {
      revalidatePath(`/folder/${folderId}`);
    }

    return { success: true, document: updatedDocument };
  } catch (error) {
    console.error("Error updating document:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors.map((e) => e.message).join(", "),
      };
    }

    return {
      success: false,
      error: "Failed to update document. Please try again later.",
    };
  }
}

export async function deleteDocument(formData: FormData) {
  try {
    const session = await auth();
    if (!session) {
      return { success: false, error: "Not authenticated" };
    }

    const id = formData.get("id") as string;

    if (!id) {
      return { success: false, error: "Document ID is required" };
    }

    const existingDocument = await prisma.document.findUnique({
      where: { id },
    });

    if (!existingDocument) {
      return { success: false, error: "Document not found" };
    }

    if (existingDocument.userId !== session.user.id) {
      return { success: false, error: "Unauthorized operation" };
    }

    const folderId = existingDocument.folderId;

    await prisma.document.delete({
      where: { id },
    });

    revalidatePath("/dashboard");
    revalidatePath("/drive");
    revalidatePath(`/folder/${folderId}`);

    return { success: true };
  } catch (error) {
    console.error("Error deleting document:", error);
    return {
      success: false,
      error: "Failed to delete document. Please try again later.",
    };
  }
}
