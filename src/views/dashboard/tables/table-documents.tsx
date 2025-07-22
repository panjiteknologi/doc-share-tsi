"use client";

import React, { useState } from "react";
import {
  Search,
  FileText,
  MoreHorizontal,
  Eye,
  FolderOpen,
  Trash2,
  FolderIcon,
  Loader2,
  Clock,
  HardDriveDownload
} from "lucide-react";
import { toast } from "sonner";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataPagination } from "./data-pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useDocuments } from "@/hooks/use-documents";
import DialogEditDocument from "../dialogs/dialog-edit-document";
import DialogDeleteDocument from "../dialogs/dialog-delete-document";
import DocumentDrawerViewer from "@/components/document-drawer-viewer";
import {
  calculateExpiryDate,
  formatTimeRemaining,
  getExpiryStatusColor,
} from "@/lib/cron";
import { useSession } from "next-auth/react";

interface TableDocumentsProps {
  folderId?: string;
  showFolderColumn?: boolean;
  onMutate?: () => void; // ← tambahkan ini
}

export function TableDocuments({
  folderId,
  showFolderColumn = true,
  onMutate
}: TableDocumentsProps) {
  const { data: session } = useSession();
  const userId = session?.user.id as string;
  const userRole = session?.user.roleCode;
  const [searchQuery, setSearchQuery] = useState(""); // State untuk pencarian
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [isLoadingActions, setIsLoadingActions] = useState<{
    [key: string]: { view?: boolean; download?: boolean };
  }>({});

  const itemsPerPage = 10;

  // Fetch documents
  const { documents, pagination, isLoading, mutate } = useDocuments({
    folderId,
    page: currentPage,
    limit: itemsPerPage,
    search: searchQuery, // Kirim searchQuery ke API untuk filter
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  // Handle search input
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset halaman ke 1 saat pencarian dilakukan
  };

  // Filter documents based on search query
  const filteredDocuments = documents.filter((document) =>
    document.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenEditDialog = (document: any) => {
    setSelectedDocument(document);
    setEditDialogOpen(true);
  };

  const handleOpenDeleteDialog = (document: any) => {
    setSelectedDocument(document);
    setDeleteDialogOpen(true);
  };

  const handleDownloadDocument = async (doc: any) => {
    try {
      setIsLoadingActions((prev) => ({
        ...prev,
        [doc.id]: { ...prev[doc.id], download: true },
      }));

      const downloadUrl = `/api/documents/${doc.id}/download?operation=download`;
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.target = "_blank"; // Open in new tab
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download document.");
    } finally {
      setIsLoadingActions((prev) => ({
        ...prev,
        [doc.id]: { ...prev[doc.id], download: false },
      }));
    }
  };

  const handleViewDocument = async (document: any) => {
    try {
      setIsLoadingActions((prev) => ({
        ...prev,
        [document.id]: { ...prev[document.id], view: true },
      }));

      setSelectedDocument(document);
      setViewDialogOpen(true);
    } catch (error) {
      console.error("Error opening document viewer:", error);
      toast.error("An error occurred while preparing the document viewer");
    } finally {
      setIsLoadingActions((prev) => ({
        ...prev,
        [document.id]: { ...prev[document.id], view: false },
      }));
    }
  };

  const handleSuccess = () => {
    mutate(); // Re-fetch the data after action is successful
    onMutate?.();
  };

  // Get document icon based on file type
  const getDocumentIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "pdf":
        return <FileText className="h-4 w-4 text-red-500" />;
      case "word":
        return <FileText className="h-4 w-4 text-blue-500" />;
      case "excel":
        return <FileText className="h-4 w-4 text-green-500" />;
      case "image":
        return <FileText className="h-4 w-4 text-purple-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search bar remains outside of grid/table */}
      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search documents..."
            className="pl-8"
            value={searchQuery}
            onChange={handleSearch} // Update search query
          />
        </div>
      </div>

      {/* Table or Grid based on viewMode */}
      <div  key={filteredDocuments.length} className="rounded-md border">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-muted">
            <TableRow>
              <TableHead>Document Name</TableHead>
              <TableHead>Type</TableHead>
              {showFolderColumn && <TableHead>Folder</TableHead>}
              <TableHead>Size</TableHead>
              <TableHead>Upload By</TableHead>
              <TableHead>Upload Date</TableHead>
              <TableHead>Auto-Delete</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Skeleton className="h-5 w-[180px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-[50px]" />
                  </TableCell>
                  {showFolderColumn && (
                    <TableCell>
                      <Skeleton className="h-5 w-[120px]" />
                    </TableCell>
                  )}
                  <TableCell>
                    <Skeleton className="h-5 w-[60px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-[100px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-[80px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-[80px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-10" />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredDocuments.length > 0 ? (
              filteredDocuments.map((document) => (
                <TableRow
                  key={document.id}
                  onClick={() => handleViewDocument(document)}
                  className="cursor-pointer"
                >
                  <TableCell className="font-medium flex items-center">
                    {getDocumentIcon(document.fileType)}
                    <span className="ml-2 truncate">{document.fileName}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{document.fileType}</Badge>
                  </TableCell>
                  {showFolderColumn && (
                    <TableCell className="flex items-center">
                      <FolderIcon className="h-4 w-4 text-muted-foreground mr-1" />
                      <span className="truncate max-w-[150px]">
                        {document?.folder?.name ?? ""}
                      </span>
                    </TableCell>
                  )}
                  <TableCell>{document.fileSize}</TableCell>
                  <TableCell className="truncate max-w-[150px]">{document.uploadedBy}</TableCell>
                  <TableCell>{new Date(document.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}</TableCell>
                  <TableCell>
                    {(() => {
                      const expiryDate = calculateExpiryDate(document.createdAt);
                      const timeRemaining = formatTimeRemaining(expiryDate);
                      const expiryStatusClass = getExpiryStatusColor(expiryDate);

                      return (
                        <Badge className={expiryStatusClass}>
                          <Clock className="h-3 w-3 mr-1" />
                          {timeRemaining}
                        </Badge>
                      );
                    })()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDocument(document)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        {(userRole === "surveyor" || userId === document?.uploadedById) && (
                          <>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadDocument(document);
                              }}
                            >
                              <HardDriveDownload className="h-4 w-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDeleteDialog(document);
                              }}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}
                        {(userRole === "surveyor") && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditDialog(document);
                            }}
                          >
                            <FolderOpen className="h-4 w-4 mr-2" />
                            Move
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={showFolderColumn ? 7 : 6} className="h-24 text-center">
                  No documents found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && pagination.totalPages > 0 && (
        <DataPagination
          currentPage={currentPage}
          totalPages={pagination.totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Edit Document Dialog */}
      <DialogEditDocument
        isOpen={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        document={selectedDocument}
        onSuccess={handleSuccess}
      />

      {/* Delete Document Dialog */}
      <DialogDeleteDocument
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        document={selectedDocument}
        onSuccess={handleSuccess}
      />

      {/* View Document Drawer */}
      <DocumentDrawerViewer
        isOpen={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        document={selectedDocument}
      />
    </div>
  );
}
