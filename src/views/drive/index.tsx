"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import {
  useFoldersByUserId,
  useFoldersProjects,
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
import { DialogAddFolder } from "@/views/dashboard/dialogs/dialog-add-folder";
import DialogViewDocument from "@/views/dashboard/dialogs/dialog-view-document";

const DriveView = () => {
  const { data: session } = useSession();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);

  // Determine user role
  const userRole = session?.user?.roleCode || "";
  const userId = session?.user?.id as string;

  // Fetch folders LS
  const { folders, isLoading: isFoldersLoading } = useNonRootFolders(userRole);
  // Fetch folders Client
  const { folders: foldersByUserId, isLoading: isFoldersByIdLoading } =
    useFoldersByUserId(userId, userRole);
  // Fetch folders Auditor
  const { folders: foldersProjects } = useFoldersProjects(userRole);

  // Fetch documents LS
  const { documents, isLoading: isLoadingDocuments } =
    useRootDocuments(userRole);
  //Fetch documents Client
  const { documents: documentsByUserId, isLoading: isDocumentsRootLoading } =
    useRootDocumentsByUserId(userId, userRole);

  const handleViewDocument = (document: any) => {
    setSelectedDocument(document);
    setIsViewDialogOpen(true);
  };

  const loadingDocuments = isLoadingDocuments || isDocumentsRootLoading;
  const loadingFolders = isFoldersLoading || isFoldersByIdLoading;

  const noDocumentsFound = documents.length === 0;
  const noFoldersFound =
    folders.length === 0 &&
    foldersByUserId.length === 0 &&
    foldersProjects.length === 0;

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
          {userRole !== "auditor" && (
            <Button onClick={() => setIsCreateFolderOpen(true)}>
              <FolderPlus className="h-4 w-4 mr-2" />
              Create Folder
            </Button>
          )}
        </div>
      </div>

      {/* ================================= | FILE / DOCUMENTS | ================================= */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Documents</h2>
      </div>

      <div className={cn("w-full", loadingDocuments && "opacity-70")}>
        {loadingDocuments && (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}

        {!loadingDocuments && noDocumentsFound && (
          <div className="flex flex-col items-center justify-center h-40 border rounded-lg border-dashed border-muted-foreground/50 p-6">
            <File className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-1">No documents found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              There are no documents available in your drive
            </p>
          </div>
        )}

        {!loadingDocuments && userRole === "surveyor" && (
          <>
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {documents.map((document) => (
                  <DocumentCard
                    key={document.id}
                    document={document}
                    onViewDocument={handleViewDocument}
                  />
                ))}
              </div>
            ) : (
              <DocumentTable
                documents={documents}
                onViewDocument={handleViewDocument}
              />
            )}
          </>
        )}

        {!loadingDocuments && userRole === "client" && (
          <>
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {documentsByUserId.map((document) => (
                  <DocumentCard
                    key={document.id}
                    document={document}
                    onViewDocument={handleViewDocument}
                  />
                ))}
              </div>
            ) : (
              <DocumentTable
                documents={documents}
                onViewDocument={handleViewDocument}
              />
            )}
          </>
        )}
      </div>

      {/* ================================= | FOLDER | ================================= */}
      <div className="flex items-center justify-between pt-4">
        <h2 className="text-lg font-medium">Folders</h2>
      </div>

      <div className={cn("w-full", isFoldersLoading && "opacity-70")}>
        {loadingFolders && (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}

        {!loadingFolders && noFoldersFound && (
          <div className="flex flex-col items-center justify-center h-40 border rounded-lg border-dashed border-muted-foreground/50 p-6">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {folders.map((folder) => (
                  <FolderCard key={folder.id} folder={folder} />
                ))}
              </div>
            ) : (
              <FolderTable folders={folders} />
            )}
          </>
        )}

        {!loadingFolders && userRole === "client" && (
          <>
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {foldersByUserId.map((folder) => (
                  <FolderCard key={folder.id} folder={folder} />
                ))}
              </div>
            ) : (
              <FolderTable folders={foldersByUserId} />
            )}
          </>
        )}
      </div>

      {/* Create Folder Dialog */}
      <DialogAddFolder />

      {/* View Document Dialog */}
      <DialogViewDocument
        isOpen={isViewDialogOpen}
        onClose={() => setIsViewDialogOpen(false)}
        document={selectedDocument}
      />
    </div>
  );
};

export default DriveView;
