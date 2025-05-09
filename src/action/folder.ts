"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

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

const UpdateFolderSchema = z.object({
  id: z.string().min(1, "Folder ID is required"),
  name: z
    .string()
    .min(1, "Folder name is required")
    .max(100, "Folder name must be less than 100 characters")
    .refine((val) => /^[a-zA-Z0-9\s\-_]+$/.test(val), {
      message:
        "Folder name can only contain letters, numbers, spaces, hyphens, and underscores",
    })
    .optional(),
  isRoot: z.boolean().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

export type FolderFormData = z.infer<typeof FolderSchema>;
export type UpdateFolderFormData = z.infer<typeof UpdateFolderSchema>;

export async function createFolder(data: FolderFormData) {
  try {
    const session = await auth();
    if (!session) {
      return { success: false, error: "Not authenticated" };
    }

    const validatedData = FolderSchema.parse(data);

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

    // Use a transaction to ensure both folder and project are created atomically
    const result = await prisma.$transaction(async (tx) => {
      // Create the folder
      const folder = await tx.folder.create({
        data: validatedData,
      });

      // Create the project for this folder
      if (!validatedData.isRoot) {
        // Optional: only create projects for non-root folders
        await tx.project.create({
          data: {
            folderId: folder.id,
          },
        });
      }

      return folder;
    });

    revalidatePath("/dashboard");
    revalidatePath("/drive");

    return { success: true, folder: result };
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

export async function updateFolder(formData: FormData) {
  try {
    const session = await auth();
    if (!session) {
      return { success: false, error: "Not authenticated" };
    }

    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const isRootStr = formData.get("isRoot") as string;
    const startDateStr = formData.get("startDate") as string;
    const endDateStr = formData.get("endDate") as string;

    const updateData: any = { id };
    if (name) updateData.name = name;
    if (isRootStr) updateData.isRoot = isRootStr === "true";
    if (startDateStr) updateData.startDate = new Date(startDateStr);
    if (endDateStr) updateData.endDate = new Date(endDateStr);

    const validationResult = UpdateFolderSchema.safeParse(updateData);
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.errors.map((e) => e.message).join(", "),
      };
    }

    const existingFolder = await prisma.folder.findUnique({
      where: { id },
    });

    if (!existingFolder) {
      return { success: false, error: "Folder not found" };
    }

    if (name && name !== existingFolder.name) {
      const folderWithSameName = await prisma.folder.findFirst({
        where: {
          name,
          userId: existingFolder.userId,
          id: { not: id },
        },
      });

      if (folderWithSameName) {
        return {
          success: false,
          error: "A folder with this name already exists",
        };
      }
    }

    if (updateData.startDate && updateData.endDate) {
      if (updateData.endDate <= updateData.startDate) {
        return {
          success: false,
          error: "End date must be after start date",
        };
      }
    } else if (updateData.startDate && !updateData.endDate) {
      if (updateData.startDate >= existingFolder.endDate) {
        return {
          success: false,
          error: "Start date must be before end date",
        };
      }
    } else if (!updateData.startDate && updateData.endDate) {
      if (existingFolder.startDate >= updateData.endDate) {
        return {
          success: false,
          error: "End date must be after start date",
        };
      }
    }

    delete updateData.id;

    const updatedFolder = await prisma.folder.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/dashboard");
    revalidatePath("/drive");
    revalidatePath(`/folder/${id}`);

    return { success: true, folder: updatedFolder };
  } catch (error) {
    console.error("Error updating folder:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors.map((e) => e.message).join(", "),
      };
    }

    return {
      success: false,
      error: "Failed to update folder. Please try again later.",
    };
  }
}

export async function deleteFolder(formData: FormData) {
  try {
    const session = await auth();
    if (!session) {
      return { success: false, error: "Not authenticated" };
    }

    const id = formData.get("id") as string;

    if (!id) {
      return { success: false, error: "Folder ID is required" };
    }

    const existingFolder = await prisma.folder.findUnique({
      where: { id },
      include: { documents: true },
    });

    if (!existingFolder) {
      return { success: false, error: "Folder not found" };
    }

    if (existingFolder.documents.length > 0) {
      return {
        success: false,
        error:
          "Cannot delete folder that contains documents. Remove documents first.",
      };
    }

    // Use a transaction to delete both the project and folder atomically
    await prisma.$transaction(async (tx) => {
      // First, delete any project associated with this folder
      await tx.project.deleteMany({
        where: { folderId: id },
      });

      // Then delete the folder
      await tx.folder.delete({
        where: { id },
      });
    });

    revalidatePath("/dashboard");
    revalidatePath("/drive");

    return { success: true };
  } catch (error) {
    console.error("Error deleting folder:", error);
    return {
      success: false,
      error: "Failed to delete folder. Please try again later.",
    };
  }
}
