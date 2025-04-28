"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

const updateAuditorSchema = z.object({
  id: z.string(),
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters" })
    .optional(),
  email: z.string().email({ message: "Invalid email address" }).optional(),
});

export async function updateAuditor(formData: FormData) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return { success: false, error: "Unauthorized" };
    }

    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;

    const parsed = updateAuditorSchema.safeParse({ id, name, email });

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.errors.map((e) => e.message).join(", "),
      };
    }

    const existingAuditor = await prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });

    if (!existingAuditor) {
      return { success: false, error: "Auditor not found" };
    }

    if (existingAuditor.role.code !== "auditor") {
      return { success: false, error: "User is not an auditor" };
    }

    if (email && email !== existingAuditor.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });

      if (emailExists) {
        return { success: false, error: "Email already in use" };
      }
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;

    const updatedAuditor = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/dashboard");
    return { success: true, data: updatedAuditor };
  } catch (error) {
    console.error("Error updating auditor:", error);
    return { success: false, error: "Failed to update auditor" };
  }
}

export async function deleteAuditor(formData: FormData) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return { success: false, error: "Unauthorized" };
    }

    const id = formData.get("id") as string;

    if (!id) {
      return { success: false, error: "Auditor ID is required" };
    }

    const existingAuditor = await prisma.user.findUnique({
      where: { id },
      include: { role: true, projects: true },
    });

    if (!existingAuditor) {
      return { success: false, error: "Auditor not found" };
    }

    if (existingAuditor.role.code !== "auditor") {
      return { success: false, error: "User is not an auditor" };
    }

    if (existingAuditor.projects.length > 0) {
      return {
        success: false,
        error:
          "Cannot delete auditor that is assigned to projects. Remove from projects first.",
      };
    }

    await prisma.user.delete({
      where: { id },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error deleting auditor:", error);
    return { success: false, error: "Failed to delete auditor" };
  }
}
