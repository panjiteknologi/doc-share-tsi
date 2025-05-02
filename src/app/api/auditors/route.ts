import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Authenticate the request
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get the auditor role
    const auditorRole = await prisma.role.findUnique({
      where: { code: "auditor" },
    });

    if (!auditorRole) {
      return NextResponse.json(
        { error: "Auditor role not found" },
        { status: 404 }
      );
    }

    // Query conditions
    const where = {
      roleId: auditorRole.id,
      OR: search
        ? [
            { name: { contains: search, mode: "insensitive" as any } },
            { email: { contains: search, mode: "insensitive" as any } },
          ]
        : undefined,
    };

    // Fetch auditors with pagination
    const auditors = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        hashedPassword: true,
        role: {
          select: {
            name: true,
            code: true,
          },
        },
        projects: {
          select: {
            id: true,
          },
        },
      },
      skip,
      take: limit,
    });

    // Format data to include project count
    const formattedAuditors = auditors.map((auditor) => ({
      id: auditor.id,
      name: auditor.name,
      email: auditor.email,
      role: auditor.role,
      projectCount: auditor.projects.length,
      projects: auditor.projects,
    }));

    // Get total count for pagination
    const total = await prisma.user.count({ where });

    return NextResponse.json({
      auditors: formattedAuditors,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching auditors:", error);
    return NextResponse.json(
      { error: "Failed to fetch auditors" },
      { status: 500 }
    );
  }
}
