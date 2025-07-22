import React, { useState } from "react";
import { Folder as FolderType } from "@/hooks/use-folders";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Folder, MoreHorizontal, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useFolders } from "@/hooks/use-folders";
import DialogDeleteFolder from "../dashboard/dialogs/dialog-delete-folder";

interface FolderTableProps {
  folders: any[]; // atau ganti dengan tipe folder kamu kalau sudah ada
  onMutate?: () => void; // ← tambahkan ini
}

const FolderTable: React.FC<FolderTableProps> = ({ folders, onMutate }) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<FolderType | null>(null);

  // Get mutate function for refreshing data
  const { mutate } = useFolders({
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const handleOpenDeleteDialog = (folder: FolderType) => {
    setSelectedFolder(folder);
    setDeleteDialogOpen(true);
  };

  const handleSuccess = () => {
    mutate(); // lokal
    onMutate?.(); // ⬅️ trigger mutate global
    setDeleteDialogOpen(false);
    setSelectedFolder(null);
  };

  return (
    <div  key={folders.length} className={`${folders.length > 0 && "rounded-md border"}`}>
      <Table>
        <TableHeader>
          {folders.length > 0 && (
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Documents</TableHead>
              <TableHead>Date Range</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          )}
        </TableHeader>
        <TableBody>
          {folders.map((folder) => {
            const startDate = new Date(folder.startDate);
            const endDate = new Date(folder.endDate);
            const createdAt = new Date(folder.createdAt);
            const dateRange = `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
            const createdTimeAgo = formatDistanceToNow(createdAt, {
              addSuffix: true,
            });

            return (
              <TableRow key={folder.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Folder className="h-4 w-4 text-primary" />
                    <Link
                      href={`/drive/${folder.id}`}
                      className="hover:underline font-medium"
                    >
                      {folder.name}
                    </Link>
                  </div>
                </TableCell>
                <TableCell>
                  {folder.documents.length}{" "}
                  {folder.documents.length <= 1 ? "file" : "files"}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs">{dateRange}</span>
                  </div>
                </TableCell>
                <TableCell className="truncate max-w-[150px]">
                  {folder.user.name}
                </TableCell>
                <TableCell>{createdTimeAgo}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/drive/${folder.id}`}>Open</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled>Rename</DropdownMenuItem>
                      <DropdownMenuItem disabled>Share</DropdownMenuItem>
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
            );
          })}
        </TableBody>
      </Table>

      {/* Delete Dialog */}
      {selectedFolder && (
        <DialogDeleteFolder
          isOpen={deleteDialogOpen}
          onClose={() => {
            setDeleteDialogOpen(false);
            setSelectedFolder(null);
          }}
          folderId={selectedFolder.id}
          folderName={selectedFolder.name}
          documentCount={selectedFolder.documents.length}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
};

export default FolderTable;
