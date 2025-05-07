"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  Search,
  FileText,
  MoreHorizontal,
  Eye,
  FolderOpen,
  Trash2,
  FolderIcon,
  Loader2,
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

interface TableDocumentsProps {
  folderId?: string;
  showFolderColumn?: boolean;
}

export function TableDocuments({
  folderId,
  showFolderColumn = true,
}: TableDocumentsProps) {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [isLoadingActions, setIsLoadingActions] = useState<{
    [key: string]: { view?: boolean; download?: boolean };
  }>({});

  const userId = session?.user?.id;
  const itemsPerPage = 10;

  const { documents, pagination, isLoading, mutate } = useDocuments({
    userId,
    folderId,
    page: currentPage,
    limit: itemsPerPage,
    search: searchQuery,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleOpenEditDialog = (document: any) => {
    setSelectedDocument(document);
    setEditDialogOpen(true);
  };

  const handleOpenDeleteDialog = (document: any) => {
    setSelectedDocument(document);
    setDeleteDialogOpen(true);
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
    mutate();
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
      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search documents..."
            className="pl-8"
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-muted">
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              {showFolderColumn && <TableHead>Folder</TableHead>}
              <TableHead>Size</TableHead>
              <TableHead>Uploaded By</TableHead>
              <TableHead>Date</TableHead>
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
                    <Skeleton className="h-5 w-10" />
                  </TableCell>
                </TableRow>
              ))
            ) : documents.length > 0 ? (
              documents.map((document) => (
                <TableRow key={document.id}>
                  <TableCell className="font-medium flex items-center">
                    {getDocumentIcon(document.fileType)}
                    <span className="ml-2 truncate max-w-[200px]">
                      {document.fileName}
                    </span>
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
                  <TableCell className="truncate max-w-[150px]">
                    {document.uploadedBy}
                  </TableCell>
                  <TableCell>
                    {new Date(document.createdAt).toLocaleDateString()}
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
                        <DropdownMenuItem
                          onClick={() => handleViewDocument(document)}
                          disabled={isLoadingActions[document.id]?.view}
                        >
                          {isLoadingActions[document.id]?.view ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Preparing...
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleOpenEditDialog(document)}
                        >
                          <FolderOpen className="h-4 w-4 mr-2" />
                          Move
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleOpenDeleteDialog(document)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={showFolderColumn ? 7 : 6}
                  className="h-24 text-center"
                >
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
