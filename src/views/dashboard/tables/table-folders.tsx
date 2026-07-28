"use client";

import { useState } from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { DataPagination } from "./data-pagination";
import { useFolders } from "@/hooks/use-folders";
import { FolderTreeBrowser, TreeFolder } from "@/components/folder-tree";

export function TableFolders() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;

  // Only fetch root-level folders created by the current user; subfolders/files
  // are lazy-loaded per node when expanded (see FolderTreeBrowser)
  const { folders, pagination, isLoading, mutate } = useFolders({
    page: currentPage,
    limit: itemsPerPage,
    search: searchQuery,
    sortBy: "createdAt",
    sortOrder: "desc",
    topLevelOnly: true,
    createdByMe: true,
  });

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const treeFolders: TreeFolder[] = folders.map((folder) => ({
    id: folder.id,
    name: folder.name,
    isRoot: folder.isRoot,
    isSustain: folder.isSustain,
    hasProject: folder.hasProject,
    documentCount: folder.documentCount,
    childrenCount: folder.childrenCount ?? 0,
    startDate: folder.startDate,
    endDate: folder.endDate,
    ownerName: folder.owner,
    createdByName: folder.createdByName,
    createdById: folder.createdBy?.id ?? null,
    userId: folder.userId,
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search folders..."
            className="pl-8"
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>
      </div>

      <FolderTreeBrowser
        folders={treeFolders}
        isLoading={isLoading}
        role="surveyor"
        onMutateTopLevel={mutate}
      />

      {pagination && pagination.totalPages > 0 && (
        <DataPagination
          currentPage={currentPage}
          totalPages={pagination.totalPages}
          onPageChange={setCurrentPage}
          totalItems={pagination.total}
          pageSize={pagination.limit}
        />
      )}
    </div>
  );
}
