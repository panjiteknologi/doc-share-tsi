import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import LayoutDashboard from "@/layout/LayoutDashboard";
import FolderDetailView from "@/views/drive/folder/detail";

export const metadata: Metadata = {
  title: "Folder Details | TSI Audit Document Share",
  description:
    "View and manage documents within a folder in the TSI Audit Document Share system.",
  keywords: "folder details, document management, audit documents, TSI",
};

interface FolderPageProps {
  params: Promise<{
    folderId: string;
  }>;
}

export default async function FolderPage({ params }: FolderPageProps) {
  const folderId = (await params).folderId;
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  return (
    <LayoutDashboard>
      <FolderDetailView folderId={folderId} />
    </LayoutDashboard>
  );
}
