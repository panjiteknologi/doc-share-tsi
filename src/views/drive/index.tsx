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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import FolderCard from "./folder-card";
import FolderTable from "./folder-table";
import DocumentCard from "./document-card";
import DocumentTable from "./document-table";
import DocumentDrawerViewer from "@/components/document-drawer-viewer";
import DialogCreateFolder from "./dialog-create-folder";
import { Input } from "@/components/ui/input";

const DriveView = () => {
  const { data: session } = useSession();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState(""); // State untuk pencarian folder
  const [isCreateFolderDialogOpen, setIsCreateFolderDialogOpen] = useState(false);

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
  const { folders: foldersProjects, mutate: revalidateFoldersProject } = useFoldersProjects(userRole);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value); // Update search query state
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

  // Ubah kembali ke array & filter berdasarkan pencarian
  const filteredFolders = Array.from(uniqueFoldersMap.values()).filter((folder) =>
    folder.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenCreateFolder = () => {
    setIsCreateFolderDialogOpen(true);
  };

  const loadingFolders = isFoldersLoading || isFoldersByIdLoading;

  return (
    <div className="px-6 py-4 space-y-6">
      {/* Header with title and actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Drive Share</h1>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Tabs
              defaultValue="list"
              value={viewMode}
              onValueChange={(value) => setViewMode(value as "grid" | "list")}
              className="w-auto"
            >
              <TabsList className="grid w-[120px] grid-cols-2">
                <TabsTrigger value="grid">
                  <Grid3x3 className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="list">
                  <List className="h-4 w-4" />
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          {userRole !== "auditor" && userRole !== "client" && (
            <Button onClick={handleOpenCreateFolder}>
              <FolderPlus className="h-4 w-4 mr-2" />
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
        {loadingFolders && (
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

        {!loadingFolders && userRole === "surveyor" && (
          <>
            {viewMode === "grid" ? (
              <div  key={filteredFolders.length} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredFolders.map((folder) => (
                  <FolderCard key={folder.id} folder={folder} onMutate={handleMutateAll}/>
                ))}
              </div>
            ) : (
              <FolderTable folders={filteredFolders} onMutate={handleMutateAll}/>
            )}
          </>
        )}

        {!loadingFolders && userRole === "client" && (
          <>
            {viewMode === "grid" ? (
              <div  key={filteredFolders.length} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredFolders.map((folder) => (
                  <FolderCard key={folder.id} folder={folder} onMutate={handleMutateAll}/>
                ))}
              </div>
            ) : (
              <FolderTable folders={filteredFolders} onMutate={handleMutateAll} />
            )}
          </>
        )}

        {!loadingFolders && userRole === "auditor" && (
          <>
            {viewMode === "grid" ? (
              <div  key={filteredFolders.length} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredFolders.map((folder) => (
                  <FolderCard key={folder.id} folder={folder} onMutate={handleMutateAll}/>
                ))}
              </div>
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
