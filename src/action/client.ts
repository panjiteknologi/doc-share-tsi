"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

const clientSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  roleId: z.string().optional(),
});

const updateClientSchema = z.object({
  id: z.string(),
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters" })
    .optional(),
  email: z.string().email({ message: "Invalid email address" }).optional(),
});

export async function createClient(formData: FormData) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return { success: false, error: "Unauthorized" };
    }

    const clientRole = await prisma.role.findUnique({
      where: { code: "client" },
    });

    if (!clientRole) {
      return { success: false, error: "Client role not found" };
    }

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const parsed = clientSchema.safeParse({
      name,
      email,
      roleId: clientRole.id,
    });

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.errors.map((e) => e.message).join(", "),
      };
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { success: false, error: "User with this email already exists" };
    }

    const client = await prisma.user.create({
      data: {
        name,
        email,
        hashedPassword: password,
        roleId: clientRole.id,
      },
    });

    revalidatePath("/dashboard");
    return { success: true, data: client };
  } catch (error) {
    console.error("Error creating client:", error);
    return { success: false, error: "Failed to create client" };
  }
}

export async function updateClient(formData: FormData) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return { success: false, error: "Unauthorized" };
    }

    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;

    const parsed = updateClientSchema.safeParse({ id, name, email });

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.errors.map((e) => e.message).join(", "),
      };
    }

    const existingClient = await prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });

    if (!existingClient) {
      return { success: false, error: "Client not found" };
    }

    if (existingClient.role.code !== "client") {
      return { success: false, error: "User is not a client" };
    }

    if (email && email !== existingClient.email) {
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

    const updatedClient = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/dashboard");
    return { success: true, data: updatedClient };
  } catch (error) {
    console.error("Error updating client:", error);
    return { success: false, error: "Failed to update client" };
  }
}

export async function deleteClient(formData: FormData) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return { success: false, error: "Unauthorized" };
    }

    const id = formData.get("id") as string;

    if (!id) {
      return { success: false, error: "Client ID is required" };
    }

    const existingClient = await prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });

    if (!existingClient) {
      return { success: false, error: "Client not found" };
    }

    if (existingClient.role.code !== "client") {
      return { success: false, error: "User is not a client" };
    }

    await prisma.user.delete({
      where: { id },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error deleting client:", error);
    return { success: false, error: "Failed to delete client" };
  }
}
