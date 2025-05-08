"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const userProjectSchema = z.object({
  id: z.string().min(1, "User ID is required"),
  projectId: z.string().min(1, "Project ID is required"),
});

export async function connectUserWithProject(data: {
  id: string;
  projectId: string;
}) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return { success: false, error: "Not authenticated" };
    }

    const validatedData = userProjectSchema.parse(data);

    // First, check if the folder exists
    const folder = await prisma.folder.findUnique({
      where: {
        id: validatedData.projectId,
      },
      include: {
        project: true,
      },
    });

    if (!folder) {
      return { success: false, error: "Folder not found" };
    }

    // Check if project needs to be created (project doesn't exist and folder is not root)
    let projectId = folder.project?.id;

    if (!folder.project && !folder.isRoot) {
      // Create a project for this folder since it doesn't exist yet
      const newProject = await prisma.project.create({
        data: {
          folderId: folder.id,
        },
      });
      projectId = newProject.id;
    } else if (!folder.project && folder.isRoot) {
      return { success: false, error: "Cannot connect users to root folders" };
    }

    // Now connect the user to the project (either existing or newly created)
    const user = await prisma.user.update({
      where: {
        id: validatedData.id,
      },
      data: {
        projects: {
          connect: { id: projectId },
        },
      },
    });

    revalidatePath("/dashboard");

    return { success: true, user, error: null };
  } catch (error) {
    console.error("Error connecting user with project:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors.map((e) => e.message).join(", "),
      };
    }

    return {
      success: false,
      error: "Failed to connect user with project",
    };
  }
}

export async function disconnectUserFromProject(data: {
  id: string;
  projectId: string;
}) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return { success: false, error: "Not authenticated" };
    }

    const validatedData = userProjectSchema.parse(data);

    const projectExists = await prisma.project.findUnique({
      where: {
        id: validatedData.projectId,
      },
    });

    if (!projectExists) {
      return { success: false, error: "Project not found" };
    }

    const user = await prisma.user.update({
      where: {
        id: validatedData.id,
      },
      data: {
        projects: {
          disconnect: { id: validatedData.projectId },
        },
      },
    });

    revalidatePath("/dashboard");

    return { success: true, user };
  } catch (error) {
    console.error("Error disconnecting user from project:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors.map((e) => e.message).join(", "),
      };
    }

    return {
      success: false,
      error: "Failed to disconnect user from project",
    };
  }
}

export async function deleteUser(data: { id: string }) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return { success: false, error: "Not authenticated" };
    }

    const validatedData = z
      .object({
        id: z.string().min(1, "User ID is required"),
      })
      .parse(data);

    await prisma.user.delete({
      where: {
        id: validatedData.id,
      },
    });

    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Error deleting user:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors.map((e) => e.message).join(", "),
      };
    }

    return {
      success: false,
      error: "Failed to delete user",
    };
  }
}
