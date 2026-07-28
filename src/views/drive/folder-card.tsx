import React, { useState } from "react";
import {
  Folder,
  FolderTree,
  MoreHorizontal,
  FileText,
  Calendar,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Folder as FolderType } from "@/hooks/use-folders";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useFolders } from "@/hooks/use-folders";
import DialogDeleteFolder from "../dashboard/dialogs/dialog-delete-folder";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

interface FolderCardProps {
  folder: any;
  onMutate?: () => void;
}

const FolderCard: React.FC<FolderCardProps> = ({ folder, onMutate }) => {
  const { data: session } = useSession();
  const userId = session?.user.id as string;

  const startDate = new Date(folder.startDate);
  const endDate = new Date(folder.endDate);
  const createdAt = new Date(folder.createdAt);

  const start = startDate.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const end = endDate.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const dateRange = `${start} - ${end}`;
  const createdTimeAgo = formatDistanceToNow(createdAt, { addSuffix: true });
  const ownerInitial = (folder.user?.name || "?").charAt(0).toUpperCase();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<FolderType | null>(null);

  const { folders, mutate } = useFolders({
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const handleOpenDeleteDialog = (folder: FolderType) => {
    setSelectedFolder(folder);
    setDeleteDialogOpen(true);
  };

  const handleSuccess = () => {
    mutate();
    onMutate?.();
    setDeleteDialogOpen(false);
    setSelectedFolder(null);
  };

  return (
    <>
      <Card
        className="group relative overflow-hidden gap-0 p-0 cursor-pointer border-border/60 transition-all hover:-translate-y-1 hover:shadow-lg hover:border-primary/40"
        onClick={() => (window.location.href = `/drive/${folder.id}`)}
      >
        {/* Folder icon visual */}
        <div className="relative p-4 pb-0">
          <div className="relative h-24">
            {/* Tab */}
            <div className="absolute left-0 top-0 h-4 w-16 rounded-t-lg bg-primary" />
            {/* Body */}
            <div className="absolute inset-x-0 top-3 bottom-0 overflow-hidden rounded-b-lg rounded-tr-lg bg-gradient-to-br from-primary to-primary/80 shadow-inner">
              <Folder
                className="absolute -bottom-3 -right-3 h-20 w-20 text-white/10"
                strokeWidth={1.5}
                fill="currentColor"
              />
            </div>

            {(folder.isRoot || folder.isSustain) && (
              <div className="absolute right-2 top-6 flex flex-col items-end gap-1">
                {folder.isRoot && (
                  <Badge
                    variant="outline"
                    className="border-white/40 bg-white/15 text-[10px] text-white backdrop-blur-sm"
                  >
                    Root
                  </Badge>
                )}
                {folder.isSustain && (
                  <Badge
                    variant="success"
                    className="text-[10px] shadow-sm"
                  >
                    Sustain
                  </Badge>
                )}
              </div>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 bottom-1 h-8 w-8 shrink-0 text-white opacity-0 transition-opacity hover:bg-white/20 hover:text-white group-hover:opacity-100 data-[state=open]:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = `/drive/${folder.id}`;
                  }}
                >
                  Open
                </DropdownMenuItem>
                {folder.createdById === userId && (
                  <>
                    <DropdownMenuItem disabled>Rename</DropdownMenuItem>
                    <DropdownMenuItem disabled>Share</DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDeleteDialog(folder);
                      }}
                      className="text-destructive"
                    >
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="px-4 pt-3">
          <Link
            href={`/drive/${folder.id}`}
            className="block truncate font-semibold leading-tight hover:underline"
            title={folder.name}
            onClick={(e) => e.stopPropagation()}
          >
            {folder.name}
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-2 px-4 py-3">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
              folder.documents.length > 0
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground"
            )}
          >
            <FileText className="h-3.5 w-3.5" />
            {folder.documents.length > 0 ? (
              <>
                <span className="font-bold">{folder.documents.length}</span>{" "}
                {folder.documents.length === 1 ? "document" : "documents"}
              </>
            ) : (
              "No documents"
            )}
          </span>
          {typeof folder.childrenCount === "number" &&
            folder.childrenCount > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-600 dark:text-amber-500">
                <FolderTree className="h-3.5 w-3.5" />
                <span className="font-bold">{folder.childrenCount}</span>{" "}
                {folder.childrenCount === 1 ? "subfolder" : "subfolders"}
              </span>
            )}
          <span
            className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground"
            title={dateRange}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span className="max-w-[140px] truncate">{dateRange}</span>
          </span>
        </div>

        <div className="flex items-center gap-2 border-t bg-muted/30 px-4 py-2.5">
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-medium text-primary">
            {ownerInitial}
          </div>
          <span className="truncate text-xs text-muted-foreground">
            {folder.user?.name}
          </span>
          <span className="ml-auto shrink-0 text-xs text-muted-foreground">
            {createdTimeAgo}
          </span>
        </div>
      </Card>

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
    </>
  );
};

export default FolderCard;
