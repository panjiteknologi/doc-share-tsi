"use client";

import { useState, useEffect } from "react";
import { Search, FolderOpen, MoreHorizontal, Calendar } from "lucide-react";
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

interface Folder {
  id: string;
  name: string;
  isRoot: boolean;
  documentCount: number;
  createdBy: string;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export function TableFolders() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;

  // Mock data - in a real app, this would be fetched from an API
  useEffect(() => {
    const mockFolders = Array.from({ length: 22 }, (_, i) => {
      const startDate = new Date(Date.now() - Math.random() * 10000000000);
      const endDate = new Date(
        startDate.getTime() + Math.random() * 60 * 24 * 60 * 60 * 1000
      );

      return {
        id: `folder-${i + 1}`,
        name: `Project Folder ${i + 1}`,
        isRoot: i < 3, // First few are root folders
        documentCount: Math.floor(Math.random() * 15),
        createdBy: "Admin User",
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        createdAt: startDate.toISOString(),
      };
    });

    setTimeout(() => {
      setFolders(mockFolders);
      setLoading(false);
    }, 1000);
  }, []);

  // Filter folders based on search query
  const filteredFolders = folders.filter((folder) =>
    folder.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredFolders.length / itemsPerPage);
  const paginatedFolders = filteredFolders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Delete folder (mock)
  const handleDeleteFolder = (id: string) => {
    setFolders(folders.filter((folder) => folder.id !== id));
    toast.success("Folder deleted successfully");
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
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
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
            {loading ? (
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
            ) : paginatedFolders.length > 0 ? (
              paginatedFolders.map((folder) => (
                <TableRow key={folder.id}>
                  <TableCell className="font-medium flex items-center">
                    <FolderOpen className="h-4 w-4 text-muted-foreground mr-2" />
                    {folder.name}
                  </TableCell>
                  <TableCell>
                    <Badge variant={folder.isRoot ? "default" : "secondary"}>
                      {folder.isRoot ? "Root" : "Project"}
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
                  <TableCell>{folder.createdBy}</TableCell>
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
                          onClick={() =>
                            toast.info("View folder feature coming soon")
                          }
                        >
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => toast.info("Edit feature coming soon")}
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteFolder(folder.id)}
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

      <DataPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
