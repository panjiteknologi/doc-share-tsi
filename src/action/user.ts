"use server";

import prisma from "@/lib/prisma";

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
