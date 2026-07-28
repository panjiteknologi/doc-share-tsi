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
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    // Authenticate the request
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { clientId: id } = await params;

    // Fetch client by ID
    const client = await prisma.user.findUnique({
      where: { id },
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
        folders: {
          select: {
            id: true,
            name: true,
            documents: {
              select: { id: true },
            },
            _count: {
              select: { children: true },
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
            project: {
              select: {
                id: true,
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
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Verify this is actually a client
    if (client.role.code !== "client") {
      return NextResponse.json(
        { error: "Requested user is not a client" },
        { status: 400 }
      );
    }

    // Attach each folder's parent path, dropping the raw parent chain from the payload
    const formattedClient = {
      ...client,
      folders: client.folders.map((folder) => {
        const { parent, documents, _count, ...folderRest } = folder;
        return {
          ...folderRest,
          parentPath: getParentPath({ parent }),
          documentCount: documents.length,
          childrenCount: _count.children,
        };
      }),
    };

    return NextResponse.json({ client: formattedClient });
  } catch (error) {
    console.error("Error fetching client:", error);
    return NextResponse.json(
      { error: "Failed to fetch client" },
      { status: 500 }
    );
  }
}
