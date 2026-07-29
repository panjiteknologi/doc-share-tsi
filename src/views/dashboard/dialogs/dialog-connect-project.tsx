"use client";

import { useMemo, useState } from "react";
import {
  Loader2,
  RefreshCcw,
  ChevronRight,
  ChevronDown,
  Folder as FolderIcon,
  Search,
} from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Combobox } from "@/components/ui/combobox";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { connectUserWithFolders } from "@/action/user-project";
import { useClients } from "@/hooks/use-clients";
import { useFolders, Folder } from "@/hooks/use-folders";
import { useAuditor, useAuditors } from "@/hooks/use-auditors";
import { cn } from "@/lib/utils";

interface DialogConnectProjectProps {
  auditorId: string;
  auditorName?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FolderTreeNode {
  folder: Folder;
  children: FolderTreeNode[];
}

function buildFolderTree(folders: Folder[]): FolderTreeNode[] {
  const byParent = new Map<string, Folder[]>();
  folders.forEach((folder) => {
    const key = folder.parentId ?? "root";
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(folder);
  });

  const build = (parentKey: string): FolderTreeNode[] =>
    (byParent.get(parentKey) || []).map((folder) => ({
      folder,
      children: build(folder.id),
    }));

  return build("root");
}

function nodeMatchesSearch(node: FolderTreeNode, query: string): boolean {
  if (!query) return true;
  const lower = query.toLowerCase();
  if (node.folder.name.toLowerCase().includes(lower)) return true;
  return node.children.some((child) => nodeMatchesSearch(child, query));
}

interface FolderTreeItemProps {
  node: FolderTreeNode;
  depth: number;
  selectedIds: Set<string>;
  connectedIds: Set<string>;
  onToggle: (folderId: string) => void;
  searchQuery: string;
}

function FolderTreeItem({
  node,
  depth,
  selectedIds,
  connectedIds,
  onToggle,
  searchQuery,
}: FolderTreeItemProps) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;
  const isConnected = connectedIds.has(node.folder.id);
  const isChecked = isConnected || selectedIds.has(node.folder.id);
  const selfMatches =
    !searchQuery ||
    node.folder.name.toLowerCase().includes(searchQuery.toLowerCase());
  const visibleChildren = node.children.filter((child) =>
    nodeMatchesSearch(child, searchQuery)
  );
  const effectiveExpanded = searchQuery ? true : expanded;

  return (
    <div>
      <div
        className="flex items-center gap-1.5 rounded-md py-1.5 pr-2 hover:bg-muted"
        style={{ paddingLeft: depth * 20 + 6 }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-muted-foreground/10"
          >
            {effectiveExpanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>
        ) : (
          <span className="w-[22px] shrink-0" />
        )}
        <Checkbox
          checked={isChecked}
          disabled={isConnected}
          onCheckedChange={() => onToggle(node.folder.id)}
        />
        <FolderIcon className="h-4 w-4 shrink-0 text-primary" />
        <span
          className={cn(
            "truncate text-sm",
            !selfMatches && "text-muted-foreground"
          )}
          title={node.folder.name}
        >
          {node.folder.name}
        </span>
        {isConnected && (
          <Badge variant="outline" className="ml-auto shrink-0 text-[10px]">
            Connected
          </Badge>
        )}
      </div>
      {hasChildren && effectiveExpanded && (
        <div>
          {visibleChildren.map((child) => (
            <FolderTreeItem
              key={child.folder.id}
              node={child}
              depth={depth + 1}
              selectedIds={selectedIds}
              connectedIds={connectedIds}
              onToggle={onToggle}
              searchQuery={searchQuery}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function DialogConnectProject({
  auditorId,
  auditorName,
  isOpen,
  onClose,
  onSuccess,
}: DialogConnectProjectProps) {
  const [clientId, setClientId] = useState<string>("");
  const [selectedFolderIds, setSelectedFolderIds] = useState<Set<string>>(
    new Set()
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const { auditor } = useAuditor(auditorId);
  const { mutate } = useAuditors({ page: 1, limit: 1000 });
  const connectedFolderIds = useMemo(
    () => new Set(auditor?.projects?.map((project) => project.folderId) || []),
    [auditor]
  );

  const { clients } = useClients({ page: 1, limit: 1000 });
  const { folders } = useFolders({ limit: 1000 });

  const clientFolders = useMemo(
    () => folders.filter((folder) => !folder.isRoot && folder.userId === clientId),
    [folders, clientId]
  );
  const tree = useMemo(() => buildFolderTree(clientFolders), [clientFolders]);

  const selectableFolderIds = useMemo(
    () =>
      clientFolders
        .filter((folder) => !connectedFolderIds.has(folder.id))
        .map((folder) => folder.id),
    [clientFolders, connectedFolderIds]
  );
  const isAllSelected =
    selectableFolderIds.length > 0 &&
    selectableFolderIds.every((id) => selectedFolderIds.has(id));
  const isSomeSelected = selectableFolderIds.some((id) =>
    selectedFolderIds.has(id)
  );

  const toggleFolder = (folderId: string) => {
    setSelectedFolderIds((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedFolderIds((prev) => {
      if (isAllSelected) {
        const next = new Set(prev);
        selectableFolderIds.forEach((id) => next.delete(id));
        return next;
      }
      return new Set([...prev, ...selectableFolderIds]);
    });
  };

  const handleConnect = async () => {
    if (selectedFolderIds.size === 0 || !auditorId) return;

    setIsLoading(true);

    try {
      const result = await connectUserWithFolders({
        id: auditorId,
        folderIds: Array.from(selectedFolderIds),
      });

      if (result.success) {
        toast.success(
          `Auditor connected to ${selectedFolderIds.size} folder${
            selectedFolderIds.size > 1 ? "s" : ""
          }`
        );
        mutate();

        if (onSuccess) onSuccess();
        handleClose();
      } else {
        toast.error(result.error || "Failed to connect auditor to folders");
      }
    } catch (error) {
      console.error("Error connecting auditor to folders:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setClientId("");
    setSelectedFolderIds(new Set());
    setSearchQuery("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Connect Auditor to Project</DialogTitle>
          <DialogDescription>
            Connect {auditorName || "this auditor"} to one or more project
            folders for a client, including subfolders.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="client">Select Client</Label>
            <Combobox
              id="client"
              options={clients.map((client) => ({
                value: client.id,
                label: client.name ?? "",
              }))}
              value={clientId}
              onValueChange={(value) => {
                setClientId(value);
                setSelectedFolderIds(new Set());
                setSearchQuery("");
              }}
              placeholder="Select a client"
              searchPlaceholder="Search clients..."
              emptyText="No clients available"
              disabled={isLoading}
            />
          </div>

          {clientId && (
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label>Select Project Folders</Label>
                {selectedFolderIds.size > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {selectedFolderIds.size} selected
                  </span>
                )}
              </div>

              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search folders..."
                  className="pl-8 h-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              {selectableFolderIds.length > 0 && (
                <div className="flex items-center gap-1.5 rounded-md py-1 pr-2 pl-1.5">
                  <Checkbox
                    checked={
                      isAllSelected
                        ? true
                        : isSomeSelected
                          ? "indeterminate"
                          : false
                    }
                    onCheckedChange={toggleSelectAll}
                    disabled={isLoading}
                  />
                  <span className="text-sm text-muted-foreground">
                    Select all folders &amp; subfolders
                  </span>
                </div>
              )}

              <div className="max-h-64 overflow-y-auto rounded-md border p-1">
                {tree.length === 0 ? (
                  <p className="p-3 text-sm text-muted-foreground">
                    No project folders for this client.
                  </p>
                ) : (
                  tree.map((node) => (
                    <FolderTreeItem
                      key={node.folder.id}
                      node={node}
                      depth={0}
                      selectedIds={selectedFolderIds}
                      connectedIds={connectedFolderIds}
                      onToggle={toggleFolder}
                      searchQuery={searchQuery}
                    />
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleConnect}
            disabled={isLoading || selectedFolderIds.size === 0}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Connect
                {selectedFolderIds.size > 0 ? ` (${selectedFolderIds.size})` : ""}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
