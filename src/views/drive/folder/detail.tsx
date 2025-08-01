"use client";

import React, { useState } from "react";
import { useFolder } from "@/hooks/use-folders";
import {
  ArrowLeft,
  FileText,
  Calendar,
  User,
  Clock,
  UploadCloud,
  Loader2,
  Grid3x3,
  List,
  Search,
  Filter,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { TableDocuments } from "@/views/dashboard/tables/table-documents";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import DocumentCard from "../document-card";
// import { DialogAddDocument } from "@/views/dashboard/dialogs/dialog-add-document";
import DialogUploadDocument from "./dialog-upload-document";
import DocumentDrawerViewer from "@/components/document-drawer-viewer";
import { useSession } from "next-auth/react";

interface FolderDetailViewProps {
  folderId: string;
  onMutate?: () => void; // ← tambahkan ini
}

const FolderDetailView: React.FC<FolderDetailViewProps> = ({ folderId, onMutate }) => {
  const { data: session } = useSession();
  const userRole = session?.user.roleCode;

  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDocumentOpen, setIsAddDocumentOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshingDocuments, setIsRefreshingDocuments] = useState(false);

  const { folder, isLoading: isFolderLoading, mutate } = useFolder(folderId);

  if (isFolderLoading) {
    return (
      <div className="px-6 py-4 space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Skeleton className="h-8 w-[200px]" />
        </div>
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }

  if (!folder) {
    return (
      <div className="px-6 py-4 space-y-6">
        <div className="flex items-center gap-2">
          <Link href="/drive">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">
            Folder Not Found
          </h1>
        </div>
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <FileText className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="text-lg text-center">
              The folder you are looking for does not exist or you don't have
              permission to view it.
            </p>
            <Button className="mt-4" asChild>
              <Link href="/drive">Return to Drive</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Format dates for display
  // Format dates for display
  const startDate = new Date(folder.startDate);
  const endDate = new Date(folder.endDate);
  const createdAt = new Date(folder.createdAt);

  const start = `${startDate.toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}`

  const end   = `${endDate.toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}`                  

  const dateRange = `${start} - ${end}`;
  const createdTimeAgo = formatDistanceToNow(createdAt, { addSuffix: true });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleViewDocument = (document: any) => {
    setSelectedDocument(document);
    setIsViewDialogOpen(true);
  };

  const handleRevalidateSuccess = async () => {
    setIsRefreshingDocuments(true); // Mulai loading
    await mutate(); // ⬅️ pastikan ini selesai
    setIsAddDocumentOpen(false); // baru close
    setIsRefreshingDocuments(false); // Selesai loading
    onMutate?.(); // Trigger optional global mutate jika ada
  };
  
  const isDocumentsReady = !isFolderLoading && !isRefreshingDocuments && folder.documents;
  return (
    <div className="px-6 py-4 space-y-6">
      {/* Header with back button and title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/drive">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight truncate">
            {folder.name}
          </h1>
          {folder.isRoot && (
            <Badge variant="outline" className="ml-2">
              Root
            </Badge>
          )}
          {folder.project && <Badge className="ml-2">Project</Badge>}
        </div>
      </div>

      {/* Folder details card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Folder Details</CardTitle>
              <CardDescription>
                View and manage folder information
              </CardDescription>
            </div>
            {/* <Button variant="outline" asChild>
              <Link href={`/folder/${folder.id}/settings`}>
                <Settings2 className="h-4 w-4 mr-2" />
                Manage Folder
              </Link>
            </Button> */}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Audit Date Range
                </h3>
                <div className="flex items-center mt-1">
                  <Calendar className="h-4 w-4 mr-2 text-primary" />
                  <span>{dateRange}</span>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Client Name
                </h3>
                <div className="flex items-center mt-1">
                  <User className="h-4 w-4 mr-2 text-primary" />
                  <span>{folder.owner.name}</span>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Folder Created
                </h3>
                <div className="flex items-center mt-1">
                  <Clock className="h-4 w-4 mr-2 text-primary" />
                  <span>{createdTimeAgo}</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                Access
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-muted rounded-md">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-primary" />
                    <span>{folder.owner.name} (Owner)</span>
                  </div>
                  <Badge>Full Access</Badge>
                </div>

                {folder.project &&
                  folder.project.auditors.map((auditor) => (
                    <div
                      key={auditor.id}
                      className="flex justify-between items-center p-2 bg-muted rounded-md"
                    >
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-primary" />
                        <span>{auditor.name} (Auditor)</span>
                      </div>
                      <Badge variant="outline">View Access</Badge>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents section */}
      <div className="space-y-4">
        {/* Documents header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-xl font-bold">
            Documents ({folder.documents?.length || 0})
          </h2>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search documents..."
                className="pl-8"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
            <Button variant="outline" size="icon" className="h-9 w-9">
              <Filter className="h-4 w-4" />
              <span className="sr-only">Filter</span>
            </Button>
            <Tabs
              defaultValue="grid"
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
            {userRole !== "auditor" && (
              <Button onClick={() => setIsAddDocumentOpen(true)}>
                <UploadCloud className="h-4 w-4 mr-2" />
                Upload
              </Button>
            )}
          </div>
        </div>

        {/* Documents display */}  
        <div>
        {isFolderLoading || isRefreshingDocuments ? (
            viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-36 w-full rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full rounded-md" />
                ))}
              </div>
            )
          ) : folder.documents?.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Documents Found</h3>
                <p className="text-muted-foreground text-center max-w-md mb-4">
                  This folder is empty. Upload documents to get started.
                </p>
                <Button disabled={isRefreshingDocuments} onClick={() => setIsAddDocumentOpen(true)}>
                  {isRefreshingDocuments ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <UploadCloud className="h-4 w-4 mr-2" />
                  )}
                  Upload
                </Button>

              </CardContent>
            </Card>
          ) : viewMode === "grid" ? (
            <div key={folder.documents.map(doc => doc.id).join("-")} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {folder.documents.map((document) => (
                <DocumentCard
                  key={document.id}
                  document={document}
                  onViewDocument={handleViewDocument}
                  onSuccess={handleRevalidateSuccess}
                />
              ))}
            </div>
          ) : (
            <TableDocuments
              key={folder.documents.map(doc => doc.id).join("-")}
              folderId={folder.id}
              showFolderColumn={false}
            />
          )}
        </div>


      </div>

      {/* Add Document Dialog */}
      <DialogUploadDocument
        isOpen={isAddDocumentOpen}
        onClose={() => setIsAddDocumentOpen(false)}
        folderId={folderId}
        onSuccess={handleRevalidateSuccess}
      />

      {/* View Document Dialog */}
      <DocumentDrawerViewer
        isOpen={isViewDialogOpen}
        onClose={() => setIsViewDialogOpen(false)}
        document={selectedDocument}
      />
    </div>
  );
};

export default FolderDetailView;
