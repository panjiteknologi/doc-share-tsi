"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const userSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(5, "Password must be at least 5 characters"),
});

export type UserFormData = z.infer<typeof userSchema>;

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
}) {
  try {
    // Find the admin role by code
    const adminRole = await prisma.role.findUnique({
      where: {
        code: "surveyor", // Using surveyor as admin role based on seed.ts
      },
    });

    if (!adminRole) {
      throw new Error("Admin role not found");
    }

    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: {
        email: data.email,
      },
    });

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Create the user
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        hashedPassword: data.password, // Note: In a production app, you should hash the password
        roleId: adminRole.id,
      },
    });

    return { success: true, user };
  } catch (error) {
    console.error("Error creating user:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function addClient(data: UserFormData) {
  try {
    const validatedData = userSchema.parse(data);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return { success: false, error: "A user with this email already exists" };
    }

    // Get the client role ID
    const clientRole = await prisma.role.findUnique({
      where: { code: "client" },
    });

    if (!clientRole) {
      return { success: false, error: "Client role not found" };
    }

    // Create the new client
    const newClient = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        hashedPassword: validatedData.password, // In production, this should be properly hashed
        roleId: clientRole.id,
      },
    });

    return { success: true, data: newClient };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: "Failed to create client" };
  }
}

export async function addAuditor(data: UserFormData) {
  try {
    const validatedData = userSchema.parse(data);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return { success: false, error: "A user with this email already exists" };
    }

    // Get the auditor role ID
    const auditorRole = await prisma.role.findUnique({
      where: { code: "auditor" },
    });

    if (!auditorRole) {
      return { success: false, error: "Auditor role not found" };
    }

    // Create the new auditor
    const newAuditor = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        hashedPassword: validatedData.password, // In production, this should be properly hashed
        roleId: auditorRole.id,
      },
    });

    return { success: true, data: newAuditor };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: "Failed to create auditor" };
  }
}

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(5, "Password must be at least 5 characters"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export async function changePassword(data: ChangePasswordFormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const validatedData = changePasswordSchema.parse(data);

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    if (user.hashedPassword !== validatedData.currentPassword) {
      return { success: false, error: "Current password is incorrect" };
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { hashedPassword: validatedData.newPassword },
    });

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: "Failed to change password" };
  }
}
