"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Search,
  MoreHorizontal,
  UserCog,
  RefreshCcw,
  RefreshCwOff,
  ChevronRight,
  ChevronDown,
  Folder as FolderIcon,
  Building2,
  Loader2,
  AlertTriangle,
} from "lucide-react";

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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataPagination } from "./data-pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuditor, useAuditors } from "@/hooks/use-auditors";
import { useClients } from "@/hooks/use-clients";
import { useFolders, Folder } from "@/hooks/use-folders";
import {
  connectUserWithFolders,
  disconnectUserFromProject,
} from "@/action/user-project";
import DialogEditAuditor from "../dialogs/dialog-edit-auditor";
import DialogDeleteAuditor from "../dialogs/dialog-delete-auditor";
import DialogConnectProject from "../dialogs/dialog-connect-project";
import { CopyButton } from "@/components/copy-button";
import { cn } from "@/lib/utils";

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

interface AuditorFolderTreeItemProps {
  node: FolderTreeNode;
  depth: number;
  selectedIds: Set<string>;
  originalIds: Set<string>;
  onToggle: (folderId: string) => void;
  searchQuery: string;
  disabled: boolean;
}

function AuditorFolderTreeItem({
  node,
  depth,
  selectedIds,
  originalIds,
  onToggle,
  searchQuery,
  disabled,
}: AuditorFolderTreeItemProps) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;
  const isChecked = selectedIds.has(node.folder.id);
  const wasConnected = originalIds.has(node.folder.id);
  const isPendingAdd = isChecked && !wasConnected;
  const isPendingRemove = !isChecked && wasConnected;
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
        className={cn(
          "flex items-center gap-1.5 rounded-md py-1.5 pr-2 hover:bg-muted",
          isPendingAdd && "bg-emerald-500/10",
          isPendingRemove && "bg-destructive/10"
        )}
        style={{ paddingLeft: depth * 20 + 6 }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="shrink-0 rounded p-0.5 text-muted-foreground hover:cursor-pointer hover:bg-muted-foreground/10"
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
          disabled={disabled}
          onCheckedChange={() => onToggle(node.folder.id)}
        />
        <FolderIcon className="h-4 w-4 shrink-0 text-primary" />
        <span
          className={cn(
            "truncate text-sm",
            !selfMatches && "text-muted-foreground",
            isPendingRemove && "line-through text-muted-foreground"
          )}
          title={node.folder.name}
        >
          {node.folder.name}
        </span>
        {isPendingAdd && (
          <Badge className="ml-auto shrink-0 border-emerald-500/30 bg-emerald-500/10 text-[10px] text-emerald-600">
            Baru
          </Badge>
        )}
        {isPendingRemove && (
          <Badge
            variant="outline"
            className="ml-auto shrink-0 border-destructive/30 bg-destructive/10 text-[10px] text-destructive"
          >
            Akan dicabut
          </Badge>
        )}
      </div>
      {hasChildren && effectiveExpanded && (
        <div>
          {visibleChildren.map((child) => (
            <AuditorFolderTreeItem
              key={child.folder.id}
              node={child}
              depth={depth + 1}
              selectedIds={selectedIds}
              originalIds={originalIds}
              onToggle={onToggle}
              searchQuery={searchQuery}
              disabled={disabled}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AuditorConnectionsDetail({
  auditorId,
  onDisconnected,
}: {
  auditorId: string;
  onDisconnected?: () => void;
}) {
  const { auditor, isLoading, mutate } = useAuditor(auditorId);
  const { clients } = useClients({ page: 1, limit: 1000 });
  const { folders } = useFolders({ limit: 1000 });

  const [clientSearch, setClientSearch] = useState("");
  const [expandedClientId, setExpandedClientId] = useState<string | null>(
    null
  );
  const [selectedFolderIds, setSelectedFolderIds] = useState<Set<string>>(
    new Set()
  );
  const [folderSearch, setFolderSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [confirmSave, setConfirmSave] = useState(false);
  // Bumped after every successful save to force the working selection to
  // resync with the freshly-saved data (see the effect below) — a plain
  // background refetch must NOT do this, or it would wipe in-progress edits.
  const [saveVersion, setSaveVersion] = useState(0);
  const hasAutoExpanded = useRef(false);

  // Group the auditor's existing connections by client, so expanding a
  // client row shows that client's own connected/unconnected folders.
  const connectedByClient = useMemo(() => {
    const map = new Map<string, { projectId: string; folderId: string }[]>();
    (auditor?.projects || []).forEach((project) => {
      const clientId = project.folder.user.id;
      if (!map.has(clientId)) map.set(clientId, []);
      map.get(clientId)!.push({ projectId: project.id, folderId: project.folderId });
    });
    return map;
  }, [auditor]);

  const connectedClientIds = useMemo(
    () => Array.from(connectedByClient.keys()),
    [connectedByClient]
  );

  // Auto-expand the first client this auditor already has access to, once,
  // so the panel opens showing existing access instead of a collapsed list.
  useEffect(() => {
    if (
      !hasAutoExpanded.current &&
      !expandedClientId &&
      connectedClientIds.length > 0
    ) {
      setExpandedClientId(connectedClientIds[0]);
      hasAutoExpanded.current = true;
    }
  }, [connectedClientIds, expandedClientId]);

  const originalConnectedIds = useMemo(() => {
    const entries = connectedByClient.get(expandedClientId ?? "") || [];
    return new Set(entries.map((entry) => entry.folderId));
  }, [connectedByClient, expandedClientId]);

  const projectIdByFolderId = useMemo(() => {
    const entries = connectedByClient.get(expandedClientId ?? "") || [];
    return new Map(entries.map((entry) => [entry.folderId, entry.projectId]));
  }, [connectedByClient, expandedClientId]);

  // Reset the working selection to that client's current access whenever a
  // different client row is expanded, or right after a save commits (so the
  // checkboxes reflect the freshly-saved state immediately instead of only
  // after the panel is closed and reopened) — but not on any other
  // background data refresh, to avoid clobbering in-progress edits.
  useEffect(() => {
    setSelectedFolderIds(new Set(originalConnectedIds));
    setFolderSearch("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandedClientId, saveVersion]);

  const clientFolders = useMemo(
    () =>
      folders.filter(
        (folder) => !folder.isRoot && folder.userId === expandedClientId
      ),
    [folders, expandedClientId]
  );
  const tree = useMemo(() => buildFolderTree(clientFolders), [clientFolders]);
  const visibleTree = useMemo(
    () => tree.filter((node) => nodeMatchesSearch(node, folderSearch)),
    [tree, folderSearch]
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

  const allFolderIds = useMemo(
    () => clientFolders.map((folder) => folder.id),
    [clientFolders]
  );
  const isAllSelected =
    allFolderIds.length > 0 &&
    allFolderIds.every((id) => selectedFolderIds.has(id));
  const isSomeSelected = allFolderIds.some((id) => selectedFolderIds.has(id));

  const toggleSelectAll = () => {
    setSelectedFolderIds(isAllSelected ? new Set() : new Set(allFolderIds));
  };

  const toAdd = useMemo(
    () =>
      Array.from(selectedFolderIds).filter(
        (id) => !originalConnectedIds.has(id)
      ),
    [selectedFolderIds, originalConnectedIds]
  );
  const toRemove = useMemo(
    () =>
      Array.from(originalConnectedIds).filter(
        (id) => !selectedFolderIds.has(id)
      ),
    [originalConnectedIds, selectedFolderIds]
  );
  const hasChanges = toAdd.length > 0 || toRemove.length > 0;

  const handleReset = () => setSelectedFolderIds(new Set(originalConnectedIds));

  const handleSave = async () => {
    setConfirmSave(false);
    setIsSaving(true);
    try {
      const results = await Promise.all([
        toAdd.length > 0
          ? connectUserWithFolders({ id: auditorId, folderIds: toAdd })
          : Promise.resolve({ success: true }),
        ...toRemove.map((folderId) =>
          disconnectUserFromProject({
            id: auditorId,
            projectId: projectIdByFolderId.get(folderId)!,
          })
        ),
      ]);

      const failed = results.filter((result) => !result.success);
      if (failed.length === 0) {
        const parts = [
          toAdd.length > 0 ? `${toAdd.length} ditambahkan` : null,
          toRemove.length > 0 ? `${toRemove.length} dicabut` : null,
        ].filter(Boolean);
        toast.success(`Akses folder berhasil diperbarui (${parts.join(", ")})`);
      } else {
        toast.error("Sebagian perubahan gagal disimpan, silakan coba lagi");
      }
      // Wait for the refetch so originalConnectedIds is already fresh by the
      // time saveVersion bumps and the resync effect reads it.
      await mutate();
      onDisconnected?.();
      setSaveVersion((v) => v + 1);
    } catch (error) {
      console.error("Error saving auditor folder access:", error);
      toast.error("Terjadi kesalahan yang tidak terduga");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  const connectedClients = clients.filter((client) =>
    connectedByClient.has(client.id)
  );
  const filteredClients = connectedClients.filter(
    (client) =>
      !clientSearch ||
      client.name.toLowerCase().includes(clientSearch.toLowerCase())
  );

  return (
    <div className="p-3">
      <Card className="py-0 gap-0 overflow-hidden">
        <CardHeader className="border-b bg-background px-4 py-3 [.border-b]:pb-3">
          <p className="text-sm font-bold italic text-[#0a1f44]">
            Kelola akses folder untuk auditor ini
          </p>
          <div className="relative mt-2 w-full max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Cari client..."
              className="h-8 pl-8"
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
            />
          </div>
        </CardHeader>

        <CardContent className="max-h-[420px] overflow-y-auto p-0">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-blue-400 [&_tr]:hover:bg-blue-400">
              <TableRow>
                <TableHead className="w-[36px] text-white font-bold" />
                <TableHead className="text-white font-bold">Client</TableHead>
                <TableHead className="w-[140px] text-white font-bold">
                  Folder Terhubung
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="h-16 text-center text-sm text-muted-foreground"
                  >
                    {connectedClients.length === 0
                      ? "Auditor ini belum terhubung dengan client manapun."
                      : "Tidak ada client yang cocok dengan pencarian."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client) => {
                  const isOpen = expandedClientId === client.id;
                  // Always > 0 here — filteredClients only contains clients
                  // present in connectedByClient.
                  const connectedCount = connectedByClient.get(client.id)!.length;

                  return (
                    <Fragment key={client.id}>
                      <TableRow
                        className="cursor-pointer transition-colors duration-150 hover:bg-blue-50/70 dark:hover:bg-blue-950/20"
                        onClick={() =>
                          setExpandedClientId((prev) =>
                            prev === client.id ? null : client.id
                          )
                        }
                      >
                        <TableCell>
                          <ChevronRight
                            className={cn(
                              "h-4 w-4 text-muted-foreground transition-transform duration-200",
                              isOpen && "rotate-90"
                            )}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                            {client.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="border-blue-500/30 bg-blue-500/10 text-blue-600"
                          >
                            {connectedCount} folder
                          </Badge>
                        </TableCell>
                      </TableRow>
                      {isOpen && (
                        <TableRow className="hover:bg-transparent">
                          <TableCell colSpan={3} className="bg-muted/30 p-3">
                            <div className="relative mb-2 w-full max-w-xs">
                              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="search"
                                placeholder="Cari folder..."
                                className="h-8 border-background bg-background pl-8"
                                value={folderSearch}
                                onChange={(e) => setFolderSearch(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>

                            {tree.length > 0 && (
                              <div
                                className="mb-1 flex items-center gap-1.5 rounded-md py-1 pl-1.5"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Checkbox
                                  checked={
                                    isAllSelected
                                      ? true
                                      : isSomeSelected
                                        ? "indeterminate"
                                        : false
                                  }
                                  onCheckedChange={toggleSelectAll}
                                  disabled={isSaving}
                                />
                                <span className="text-sm text-muted-foreground">
                                  Pilih semua folder &amp; subfolder
                                </span>
                              </div>
                            )}

                            <div
                              className="max-h-64 overflow-y-auto rounded-md border bg-background p-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {tree.length === 0 ? (
                                <p className="p-3 text-sm text-muted-foreground">
                                  Client ini belum memiliki folder project.
                                </p>
                              ) : visibleTree.length === 0 ? (
                                <p className="p-3 text-sm text-muted-foreground">
                                  Tidak ada folder yang cocok dengan pencarian.
                                </p>
                              ) : (
                                visibleTree.map((node) => (
                                  <AuditorFolderTreeItem
                                    key={node.folder.id}
                                    node={node}
                                    depth={0}
                                    selectedIds={selectedFolderIds}
                                    originalIds={originalConnectedIds}
                                    onToggle={toggleFolder}
                                    searchQuery={folderSearch}
                                    disabled={isSaving}
                                  />
                                ))
                              )}
                            </div>

                            <div
                              className="mt-2 flex items-center justify-between gap-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span className="text-xs text-muted-foreground">
                                {hasChanges
                                  ? `${toAdd.length} akan ditambah, ${toRemove.length} akan dicabut`
                                  : "Tidak ada perubahan"}
                              </span>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="hover:cursor-pointer"
                                  onClick={handleReset}
                                  disabled={!hasChanges || isSaving}
                                >
                                  Reset
                                </Button>
                                <Button
                                  size="sm"
                                  className="hover:cursor-pointer"
                                  onClick={() =>
                                    toRemove.length > 0
                                      ? setConfirmSave(true)
                                      : handleSave()
                                  }
                                  disabled={!hasChanges || isSaving}
                                >
                                  {isSaving ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Menyimpan...
                                    </>
                                  ) : (
                                    "Simpan Perubahan"
                                  )}
                                </Button>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={confirmSave}
        onOpenChange={(open) => !open && setConfirmSave(false)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <RefreshCwOff className="h-5 w-5 text-destructive" />
              <DialogTitle>Simpan Perubahan Akses</DialogTitle>
            </div>
            <DialogDescription>
              Konfirmasi perubahan akses folder untuk auditor ini.
            </DialogDescription>
          </DialogHeader>

          <Alert
            variant="default"
            className="bg-destructive/10 border-destructive/20"
          >
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {toAdd.length > 0 && (
                <>{toAdd.length} folder akan ditambahkan. </>
              )}
              {toRemove.length > 0 && (
                <>
                  Auditor akan kehilangan akses ke {toRemove.length} folder
                  yang sebelumnya diberikan.
                </>
              )}
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmSave(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleSave}>
              Ya, Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function TableAuditors() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAuditor, setSelectedAuditor] = useState<any>(null);
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const itemsPerPage = 10;

  // Use the SWR hook to fetch auditors
  const { auditors, pagination, isLoading, mutate } = useAuditors({
    page: currentPage,
    limit: itemsPerPage,
    search: searchQuery,
  });

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  // Open edit dialog
  const handleOpenEditDialog = (auditor: any) => {
    setSelectedAuditor(auditor);
    setEditDialogOpen(true);
  };

  // Open delete dialog
  const handleOpenDeleteDialog = (auditor: any) => {
    setSelectedAuditor(auditor);
    setDeleteDialogOpen(true);
  };

  // Open connect dialog
  const handleOpenConnectDialog = (auditor: any) => {
    setSelectedAuditor(auditor);
    setConnectDialogOpen(true);
  };

  const handleSuccess = () => {
    mutate();
  };

  // Toggle a row's collapse/expand state
  const toggleExpanded = (auditorId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(auditorId)) {
        next.delete(auditorId);
      } else {
        next.add(auditorId);
      }
      return next;
    });
  };

  // console.log('auditor', auditors)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search auditors..."
            className="pl-8"
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border shadow-sm">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-gradient-to-r from-[#0a1f44] to-[#16326e] [&_th]:text-[11px] [&_th]:uppercase [&_th]:tracking-wider">
            <TableRow>
              <TableHead className="w-[40px]" />
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Password</TableHead>
              <TableHead>Connected</TableHead>
              <TableHead>Connect</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Skeleton className="h-5 w-5" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-[140px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-[180px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-[180px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-[40px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-[40px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-[100px]" />
                  </TableCell>
                </TableRow>
              ))
            ) : auditors.length > 0 ? (
              auditors.map((auditor) => {
                const isExpanded = expandedIds.has(auditor.id);
                return (
                <Fragment key={auditor.id}>
                <TableRow
                  className="cursor-pointer transition-colors duration-150 hover:bg-blue-50/70 dark:hover:bg-blue-950/20"
                  onClick={() => toggleExpanded(auditor.id)}
                >
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 hover:cursor-pointer"
                      tabIndex={-1}
                    >
                      <ChevronRight
                        className={`h-4 w-4 transition-transform duration-200 ${
                          isExpanded ? "rotate-90" : ""
                        }`}
                      />
                      <span className="sr-only">Toggle details</span>
                    </Button>
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900/40">
                        <UserCog className="h-3.5 w-3.5 text-blue-600 dark:text-blue-300" />
                      </span>
                      {auditor.name}
                    </div>
                  </TableCell>
                  <TableCell>{auditor.email}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <CopyButton value={auditor.hashedPassword} />
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="gap-1 border-blue-500/30 bg-blue-500/10 text-blue-600"
                    >
                      {auditor.projectCount}{" "}
                      {auditor.projectCount <= 1 ? "folder client" : "folder clients"}
                    </Badge>
                  </TableCell>
                  <TableCell
                    align="left"
                    className="flex items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="outline"
                      size="icon"
                      className="hover:cursor-pointer"
                      onClick={() => handleOpenConnectDialog(auditor)}
                    >
                      <RefreshCcw className="h-4 w-4" />
                      <span className="sr-only">Connect</span>
                    </Button>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleOpenEditDialog(auditor)}
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleOpenDeleteDialog(auditor)}
                          className="text-destructive"
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
                {isExpanded && (
                  <TableRow className="hover:bg-accent/60">
                    <TableCell colSpan={7} className="bg-accent/60 p-0">
                      <AuditorConnectionsDetail
                        auditorId={auditor.id}
                        onDisconnected={mutate}
                      />
                    </TableCell>
                  </TableRow>
                )}
                </Fragment>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No auditors found.
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
          totalItems={pagination.total}
          pageSize={pagination.limit}
        />
      )}

      {/* Edit Auditor Dialog */}
      <DialogEditAuditor
        isOpen={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        auditor={selectedAuditor}
        onSuccess={handleSuccess}
      />

      {/* Delete Auditor Dialog */}
      <DialogDeleteAuditor
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        auditorId={selectedAuditor?.id || null}
        auditorName={selectedAuditor?.name}
        onSuccess={handleSuccess}
      />

      {/* Connect Auditor Dialog */}
      <DialogConnectProject
        isOpen={connectDialogOpen}
        onClose={() => setConnectDialogOpen(false)}
        auditorId={selectedAuditor?.id || null}
        auditorName={selectedAuditor?.name}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
