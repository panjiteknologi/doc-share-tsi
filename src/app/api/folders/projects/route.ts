import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // For auditors: Get folders connected to projects where the current user is assigned
    const folders = await prisma.folder.findMany({
      where: {
        project: {
          auditors: {
            some: {
              id: session.user.id,
            },
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        documents: true,
        project: {
          include: {
            auditors: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ folders });
  } catch (error) {
    console.error("Error fetching auditor project folders:", error);
    return NextResponse.json(
      { error: "Failed to fetch auditor project folders" },
      { status: 500 }
    );
  }
}
