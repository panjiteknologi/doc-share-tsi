"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useFolders, useNonRootFolders } from "@/hooks/use-folders";
import {
  Grid3x3,
  List,
  FolderPlus,
  Search,
  Settings2,
  Filter,
  LucideIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import FolderCard from "./folder-card";
import FolderTable from "./folder-table";
import { DialogAddFolder } from "@/views/dashboard/dialogs/dialog-add-folder";

const DriveView = () => {
  const { data: session } = useSession();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const userRole = session?.user?.roleId;
  const userId = session?.user?.id;

  // Fetch folders based on user role
  const { pagination } = useFolders({
    userId: userId,
    page: currentPage,
    limit: 50,
    search: searchQuery,
  });

  const { folders, isLoading, mutate } = useNonRootFolders();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleCreateFolderSuccess = () => {
    mutate();
    toast.success("Folder created successfully");
  };

  return (
    <div className="px-6 py-4 space-y-6">
      {/* Header with title and actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Drive Share</h1>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search folders..."
              className="pl-8"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => {}}
          >
            <Filter className="h-4 w-4" />
            <span className="sr-only">Filter</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => {}}
          >
            <Settings2 className="h-4 w-4" />
            <span className="sr-only">Settings</span>
          </Button>
          <Button onClick={() => setIsCreateFolderOpen(true)}>
            <FolderPlus className="h-4 w-4 mr-2" />
            Create Folder
          </Button>
        </div>
      </div>

      {/* View toggle */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Folders</h2>
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
      </div>

      {/* Folders Display */}
      <div className={cn("w-full", isLoading && "opacity-70")}>
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : folders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 border rounded-lg border-dashed border-muted-foreground/50 p-6">
            <FolderPlus className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-1">No folders found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Get started by creating a new folder
            </p>
            <Button onClick={() => setIsCreateFolderOpen(true)}>
              <FolderPlus className="h-4 w-4 mr-2" />
              Create Folder
            </Button>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {folders.map((folder) => (
              <FolderCard key={folder.id} folder={folder} />
            ))}
          </div>
        ) : (
          <FolderTable folders={folders} />
        )}
      </div>

      {/* Create Folder Dialog */}
      <DialogAddFolder onSuccess={handleCreateFolderSuccess} />
    </div>
  );
};

export default DriveView;
