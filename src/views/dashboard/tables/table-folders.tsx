"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Search, FolderOpen, MoreHorizontal, Calendar } from "lucide-react";

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
import { useFolders } from "@/hooks/use-folders";
import DialogEditFolder from "../dialogs/dialog-edit-folder";
import DialogDeleteFolder from "../dialogs/dialog-delete-folder";

export function TableFolders() {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<any>(null);

  const userId = session?.user?.id;
  const itemsPerPage = 10;

  // Use the SWR hook to fetch folders
  const { folders, pagination, isLoading, mutate } = useFolders({
    userId,
    page: currentPage,
    limit: itemsPerPage,
    search: searchQuery,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  // Open edit dialog
  const handleOpenEditDialog = (folder: any) => {
    setSelectedFolder(folder);
    setEditDialogOpen(true);
  };

  // Open delete dialog
  const handleOpenDeleteDialog = (folder: any) => {
    setSelectedFolder(folder);
    setDeleteDialogOpen(true);
  };

  // Handle refresh after successful operation
  const handleSuccess = () => {
    mutate(); // Refresh the folders data
  };

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

      <div className="rounded-md border">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-muted">
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Documents</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Created By</TableHead>
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
                    <Skeleton className="h-5 w-[80px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-[40px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-[120px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-[100px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-10" />
                  </TableCell>
                </TableRow>
              ))
            ) : folders.length > 0 ? (
              folders.map((folder) => (
                <TableRow key={folder.id}>
                  <TableCell className="font-medium flex items-center">
                    <FolderOpen className="h-4 w-4 text-muted-foreground mr-2" />
                    {folder.name}
                  </TableCell>
                  <TableCell>
                    <Badge variant={folder.isRoot ? "default" : "secondary"}>
                      {folder.isRoot
                        ? "Root"
                        : folder.hasProject
                        ? "Project"
                        : "Standard"}
                    </Badge>
                  </TableCell>
                  <TableCell>{folder.documentCount}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs">
                        {new Date(folder.startDate).toLocaleDateString()} -{" "}
                        {new Date(folder.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{folder.createdByName}</TableCell>
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
                          onClick={() => handleOpenEditDialog(folder)}
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleOpenDeleteDialog(folder)}
                          className="text-destructive"
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No folders found.
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

      {/* Edit Folder Dialog */}
      <DialogEditFolder
        isOpen={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        folder={selectedFolder}
        onSuccess={handleSuccess}
      />

      {/* Delete Folder Dialog */}
      <DialogDeleteFolder
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        folderId={selectedFolder?.id || null}
        folderName={selectedFolder?.name}
        documentCount={selectedFolder?.documentCount || 0}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
