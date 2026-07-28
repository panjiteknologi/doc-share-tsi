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

    // Get the client role
    const clientRole = await prisma.role.findUnique({
      where: { code: "client" },
    });

    if (!clientRole) {
      return NextResponse.json(
        { error: "Client role not found" },
        { status: 404 }
      );
    }

    // Query conditions
    const where = {
      roleId: clientRole.id,
      OR: search
        ? [
            { name: { contains: search } },
            { email: { contains: search } },
          ]
        : undefined,
    };

    // Fetch clients with pagination
    const clients = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        hashedPassword: true,
        createdAt: true,
        role: {
          select: {
            name: true,
            code: true,
          },
        },
        projects: true,
        folders: {
          select: {
            project: {
              select: {
                auditors: {
                  select: {
                    id: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });

    // Count distinct auditors connected across all of this client's folders
    const formattedClients = clients.map(({ folders, ...client }) => {
      const auditorIds = new Set<string>();
      folders.forEach((folder) => {
        folder.project?.auditors.forEach((auditor) =>
          auditorIds.add(auditor.id)
        );
      });

      return {
        ...client,
        auditorCount: auditorIds.size,
      };
    });

    // Get total count for pagination
    const total = await prisma.user.count({ where });

    return NextResponse.json({
      clients: formattedClients,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json(
      { error: "Failed to fetch clients" },
      { status: 500 }
    );
  }
}
