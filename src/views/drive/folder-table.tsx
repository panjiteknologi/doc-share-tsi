import React from "react";
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

interface FolderTableProps {
  folders: FolderType[];
}

const FolderTable: React.FC<FolderTableProps> = ({ folders }) => {
  return (
    <div className={`${folders.length > 0 && "rounded-md border"}`}>
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
            // Format dates for display
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
                      href={`/folder/${folder.id}`}
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
                      <DropdownMenuItem>Open</DropdownMenuItem>
                      <DropdownMenuItem>Rename</DropdownMenuItem>
                      <DropdownMenuItem>Share</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
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
    </div>
  );
};

export default FolderTable;
