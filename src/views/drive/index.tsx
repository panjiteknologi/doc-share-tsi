"use client";

import React, { useState } from "react";
import {
  Search,
} from "lucide-react";
import { useSession } from "next-auth/react";
import {
  useFoldersByCreator,
  useFoldersByUserId,
  useFoldersProjects,
  useFolder,
  useNonRootFolders,
} from "@/hooks/use-folders";
import {
  useRootDocuments,
  useRootDocumentsByUserId,
} from "@/hooks/use-documents";
import { Grid3x3, List, FolderPlus, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import FolderCard from "./folder-card";
import FolderTable from "./folder-table";
import DocumentCard from "./document-card";
import DocumentTable from "./document-table";
import DocumentDrawerViewer from "@/components/document-drawer-viewer";
import DialogCreateFolder from "./dialog-create-folder";
import { Input } from "@/components/ui/input";
import { DataPagination } from "../dashboard/tables/data-pagination";

const FOLDERS_PER_PAGE = 12;

const DriveView = () => {
  const { data: session, status: sessionStatus } = useSession();
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [searchQuery, setSearchQuery] = useState(""); // State untuk pencarian folder
  const [isCreateFolderDialogOpen, setIsCreateFolderDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const handleMutateAll = () => {
    revalidateNonRootFolders(undefined, { revalidate: true });
    revalidateFoldersByUserId(undefined, { revalidate: true });
    revalidateFoldersProject(undefined, { revalidate: true });
  };
  // Determine user role
  const userRole = session?.user?.roleCode ?? "";
  const userId = session?.user?.id ?? "";
  

  // Fetch folders LS
  const {
    folders,
    isLoading: isFoldersLoading,
    mutate: revalidateNonRootFolders,
  } = useFoldersByCreator(userId);
  
  // Fetch folders Client
  const {
    folders: foldersByUserId,
    isLoading: isFoldersByIdLoading,
    mutate: revalidateFoldersByUserId,
  } = useFoldersByUserId(userId, userRole);

  // Fetch folders Auditor
  const {
    folders: foldersProjects,
    isLoading: isFoldersProjectsLoading,
    mutate: revalidateFoldersProject,
  } = useFoldersProjects(userRole);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value); // Update search query state
    setCurrentPage(1); // Reset to first page on new search
  };

  // Filter folders based on search query
  // const filteredFolders = [
  //   ...folders.filter((folder) =>
  //     folder.name.toLowerCase().includes(searchQuery.toLowerCase())
  //   ),
  //   ...foldersByUserId.filter((folder) =>
  //     folder.name.toLowerCase().includes(searchQuery.toLowerCase())
  //   ),
  //   ...foldersProjects.filter((folder) =>
  //     folder.name.toLowerCase().includes(searchQuery.toLowerCase())
  //   ),
  // ];

  // Gabungkan semua folder dari berbagai sumber
  const allFolders = [
    ...folders.map((f) => ({ ...f, source: "creator" })),
    ...foldersByUserId.map((f) => ({ ...f, source: "client" })),
    ...foldersProjects.map((f) => ({ ...f, source: "auditor" })),
  ];

  // Hilangkan duplikat berdasarkan ID
  const uniqueFoldersMap = new Map();
  allFolders.forEach((folder) => {
    uniqueFoldersMap.set(folder.id, folder); // folder.id akan overwrite duplikat
  });

  // Ubah kembali ke array & filter berdasarkan pencarian, urutkan dari yang
  // terbaru — perlu di-sort ulang di sini karena hasil gabungan tiga sumber
  // folder di atas tidak menjamin urutan createdAt yang konsisten.
  const filteredFolders = Array.from(uniqueFoldersMap.values())
    .filter((folder) =>
      folder.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  const handleOpenCreateFolder = () => {
    setIsCreateFolderDialogOpen(true);
  };

  // While the session is still resolving, userId/userRole are blank and the
  // fetch hooks skip their request entirely (isLoading stays false) — without
  // this check "No folders found" flashes before the real fetch even starts.
  const loadingFolders =
    sessionStatus === "loading" ||
    isFoldersLoading ||
    isFoldersByIdLoading ||
    isFoldersProjectsLoading;

  // Client-side pagination for the grid view
  const totalPages = Math.max(
    1,
    Math.ceil(filteredFolders.length / FOLDERS_PER_PAGE)
  );
  const safePage = Math.min(currentPage, totalPages);
  const paginatedFolders = filteredFolders.slice(
    (safePage - 1) * FOLDERS_PER_PAGE,
    safePage * FOLDERS_PER_PAGE
  );

  return (
    <div className="px-6 py-4 space-y-6">
      {/* Header with title and actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Drive Share</h1>
        <div className="flex items-center gap-2">
          <div
            role="tablist"
            aria-label="View mode"
            className="relative inline-flex h-10 w-[184px] items-center rounded-full bg-blue-50 p-1 shadow-inner dark:bg-blue-950/40"
          >
            <div
              aria-hidden
              className={cn(
                "absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-gradient-to-r from-[#0a1f44] to-blue-600 shadow-md transition-transform duration-300 ease-out",
                viewMode === "list" && "translate-x-full"
              )}
            />
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === "grid"}
              onClick={() => setViewMode("grid")}
              className={cn(
                "relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-full py-1.5 text-sm font-medium transition-all duration-300 hover:cursor-pointer active:scale-95",
                viewMode === "grid"
                  ? "text-white"
                  : "text-blue-700/70 hover:text-blue-700 dark:text-blue-300/70 dark:hover:text-blue-200"
              )}
            >
              <Grid3x3 className="h-4 w-4" />
              Grid
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === "list"}
              onClick={() => setViewMode("list")}
              className={cn(
                "relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-full py-1.5 text-sm font-medium transition-all duration-300 hover:cursor-pointer active:scale-95",
                viewMode === "list"
                  ? "text-white"
                  : "text-blue-700/70 hover:text-blue-700 dark:text-blue-300/70 dark:hover:text-blue-200"
              )}
            >
              <List className="h-4 w-4" />
              List
            </button>
          </div>
          {userRole !== "auditor" && userRole !== "client" && (
            <Button
              onClick={handleOpenCreateFolder}
              className={cn(
                "h-10 gap-1.5 rounded-full bg-gradient-to-r from-[#0a1f44] to-blue-600 px-5 text-white shadow-md",
                "transition-all duration-300 hover:cursor-pointer hover:shadow-lg hover:shadow-blue-600/25 hover:brightness-110 active:scale-95"
              )}
            >
              <FolderPlus className="h-4 w-4" />
              Create Folder
            </Button>
          )}
        </div>
      </div>

      {/* Folder Search */}
      <div className="flex items-center justify-between pt-4">
        <h2 className="text-lg font-medium">Folders</h2>
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search Folder..."
            className="pl-8"
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>
      </div>

      {/* Folders Grid or Table View */}
      <div className={cn("w-full", loadingFolders && "opacity-70")}>
        {loadingFolders && filteredFolders.length === 0 && (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}

        {!loadingFolders && filteredFolders.length === 0 && (
          <div  key={filteredFolders.length} className="flex flex-col items-center justify-center h-40 border rounded-lg border-dashed border-muted-foreground/50 p-6">
            <FolderPlus className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-1">No folders found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Get started by creating a new folder
            </p>
          </div>
        )}

        {/* Keep these mounted during background revalidation (not gated on
            loadingFolders) so client-side UI state like expanded folder tree
            rows in the list view survives an upload/delete refresh. */}
        {filteredFolders.length > 0 && userRole === "surveyor" && (
          <>
            {viewMode === "grid" ? (
              <>
                <div key={filteredFolders.length} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {paginatedFolders.map((folder) => (
                    <FolderCard key={folder.id} folder={folder} onMutate={handleMutateAll}/>
                  ))}
                </div>
                <DataPagination
                  currentPage={safePage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  totalItems={filteredFolders.length}
                  pageSize={FOLDERS_PER_PAGE}
                />
              </>
            ) : (
              <FolderTable folders={filteredFolders} onMutate={handleMutateAll}/>
            )}
          </>
        )}

        {filteredFolders.length > 0 && userRole === "client" && (
          <>
            {viewMode === "grid" ? (
              <>
                <div key={filteredFolders.length} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {paginatedFolders.map((folder) => (
                    <FolderCard key={folder.id} folder={folder} onMutate={handleMutateAll}/>
                  ))}
                </div>
                <DataPagination
                  currentPage={safePage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  totalItems={filteredFolders.length}
                  pageSize={FOLDERS_PER_PAGE}
                />
              </>
            ) : (
              <FolderTable folders={filteredFolders} onMutate={handleMutateAll} />
            )}
          </>
        )}

        {filteredFolders.length > 0 && userRole === "auditor" && (
          <>
            {viewMode === "grid" ? (
              <>
                <div key={filteredFolders.length} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {paginatedFolders.map((folder) => (
                    <FolderCard key={folder.id} folder={folder} onMutate={handleMutateAll}/>
                  ))}
                </div>
                <DataPagination
                  currentPage={safePage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  totalItems={filteredFolders.length}
                  pageSize={FOLDERS_PER_PAGE}
                />
              </>
            ) : (
              <FolderTable folders={filteredFolders} onMutate={handleMutateAll}/>
            )}
          </>
        )}
      </div>

      {/* Create Folder Dialog */}
      <DialogCreateFolder
        isOpen={isCreateFolderDialogOpen}
        onClose={() => setIsCreateFolderDialogOpen(false)}
        onSuccess={handleMutateAll}
      />
    </div>
  );
};

export default DriveView;
