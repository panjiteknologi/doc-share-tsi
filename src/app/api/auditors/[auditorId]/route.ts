import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ auditorId: string }> }
) {
  try {
    // Authenticate the request
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const auditorId = (await params).auditorId;

    // Fetch auditor by ID
    const auditor = await prisma.user.findUnique({
      where: { id: auditorId },
      select: {
        id: true,
        name: true,
        email: true,
        role: {
          select: {
            name: true,
            code: true,
          },
        },
        projects: {
          select: {
            id: true,
            folderId: true,
            folder: {
              select: {
                name: true,
                startDate: true,
                endDate: true,
              },
            },
          },
        },
      },
    });

    if (!auditor) {
      return NextResponse.json({ error: "Auditor not found" }, { status: 404 });
    }

    // Verify this is actually an auditor
    if (auditor.role.code !== "auditor") {
      return NextResponse.json(
        { error: "Requested user is not an auditor" },
        { status: 400 }
      );
    }

    // Format data to include project count
    const formattedAuditor = {
      id: auditor.id,
      name: auditor.name,
      email: auditor.email,
      role: auditor.role,
      projects: auditor.projects,
      projectCount: auditor.projects.length,
    };

    return NextResponse.json({ auditor: formattedAuditor });
  } catch (error) {
    console.error("Error fetching auditor:", error);
    return NextResponse.json(
      { error: "Failed to fetch auditor" },
      { status: 500 }
    );
  }
}
