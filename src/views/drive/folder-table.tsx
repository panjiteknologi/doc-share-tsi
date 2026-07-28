import React from "react";
import { useSession } from "next-auth/react";
import {
  FolderTreeBrowser,
  TreeFolder,
  FolderTreeRole,
} from "@/components/folder-tree";

interface FolderTableProps {
  folders: any[]; // atau ganti dengan tipe folder kamu kalau sudah ada
  onMutate?: () => void; // ← tambahkan ini
}

function driveFolderToTreeFolder(folder: any): TreeFolder {
  return {
    id: folder.id,
    name: folder.name,
    isRoot: folder.isRoot,
    isSustain: folder.isSustain,
    hasProject: folder.hasProject ?? folder.project != null,
    documentCount: Array.isArray(folder.documents)
      ? folder.documents.length
      : folder.documentCount ?? 0,
    childrenCount: folder.childrenCount ?? folder._count?.children ?? 0,
    startDate: folder.startDate,
    endDate: folder.endDate,
    ownerName: folder.user?.name || "",
    createdByName: folder.createdBy?.name || "-",
    createdById: folder.createdById ?? null,
    userId: folder.userId,
    parentId: null,
  };
}

const FolderTable: React.FC<FolderTableProps> = ({ folders, onMutate }) => {
  const { data: session } = useSession();
  const role = (session?.user?.roleCode ?? "client") as FolderTreeRole;

  // The parent already renders a dedicated empty state, so avoid double messaging here
  if (folders.length === 0) return null;

  const treeFolders = folders.map(driveFolderToTreeFolder);

  return (
    <FolderTreeBrowser
      folders={treeFolders}
      role={role}
      onMutateTopLevel={onMutate}
    />
  );
};

export default FolderTable;
