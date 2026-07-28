import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// Collects ancestor folder names (root-most first), skipping the client's root folder
function getParentPath(folder: {
  parent?: { name: string; isRoot: boolean; parent?: unknown } | null;
}): string[] {
  const names: string[] = [];
  let current = folder.parent as
    | { name: string; isRoot: boolean; parent?: unknown }
    | null
    | undefined;
  while (current) {
    if (!current.isRoot) names.push(current.name);
    current = current.parent as typeof current;
  }
  return names.reverse();
}

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
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
                parent: {
                  select: {
                    name: true,
                    isRoot: true,
                    parent: {
                      select: {
                        name: true,
                        isRoot: true,
                        parent: {
                          select: {
                            name: true,
                            isRoot: true,
                          },
                        },
                      },
                    },
                  },
                },
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

    // Format data to include project count and each folder's parent path
    const formattedAuditor = {
      id: auditor.id,
      name: auditor.name,
      email: auditor.email,
      role: auditor.role,
      projects: auditor.projects.map((project) => {
        const { parent, ...folderRest } = project.folder;
        return {
          ...project,
          folder: {
            ...folderRest,
            parentPath: getParentPath({ parent }),
          },
        };
      }),
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
