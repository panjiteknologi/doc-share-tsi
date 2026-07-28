"use client";

import { Fragment, useMemo, useState, useRef } from "react";
import Link from "next/link";
import {
  Search,
  MoreHorizontal,
  ChevronRight,
  Folder as FolderIcon,
  UserCog,
  Building2,
  FileText,
  RefreshCcw,
  RefreshCwOff,
  Loader2,
  AlertTriangle,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Combobox } from "@/components/ui/combobox";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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
import { useClient, useClients } from "@/hooks/use-clients";
import { useAuditor, useAuditors } from "@/hooks/use-auditors";
import { useFolders } from "@/hooks/use-folders";
import {
  connectUserWithFolders,
  disconnectUserFromProject,
} from "@/action/user-project";
import { deleteClient, updateClient } from "@/action/client";
import DialogEditClient from "../dialogs/dialog-edit-client";
import DialogDeleteClient from "../dialogs/dialog-delete-client";
import { CopyButton } from "@/components/copy-button";

function DialogConnectAuditorToClient({
  clientId,
  clientName,
  isOpen,
  onClose,
  onSuccess,
}: {
  clientId: string;
  clientName?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const [auditorId, setAuditorId] = useState("");
  const [selectedFolderIds, setSelectedFolderIds] = useState<Set<string>>(
    new Set()
  );
  const [isLoading, setIsLoading] = useState(false);

  const { auditors } = useAuditors({ page: 1, limit: 1000 });
  const { auditor, isLoading: isLoadingAuditor } = useAuditor(auditorId);
  const { folders } = useFolders({ limit: 1000 });

  const clientFolders = useMemo(
    () => folders.filter((folder) => !folder.isRoot && folder.userId === clientId),
    [folders, clientId]
  );

  const connectedFolderIds = useMemo(
    () => new Set(auditor?.projects?.map((project) => project.folderId) || []),
    [auditor]
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

  const handleClose = () => {
    setAuditorId("");
    setSelectedFolderIds(new Set());
    onClose();
  };

  const handleConnect = async () => {
    if (!auditorId || selectedFolderIds.size === 0) return;

    const folderIds = Array.from(selectedFolderIds);

    // Close the dialog immediately; the toast reports the result.
    handleClose();
    setIsLoading(true);
    try {
      const result = await connectUserWithFolders({
        id: auditorId,
        folderIds,
      });

      if (result.success) {
        toast.success(
          `Auditor connected to ${folderIds.length} folder${
            folderIds.length > 1 ? "s" : ""
          }`
        );
        onSuccess?.();
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Connect Auditor</DialogTitle>
          <DialogDescription>
            Connect an auditor to one or more folders of{" "}
            {clientName || "this client"}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="auditor">Select Auditor</Label>
            <Combobox
              id="auditor"
              options={auditors.map((a) => ({
                value: a.id,
                label: a.name || a.email || "",
              }))}
              value={auditorId}
              onValueChange={(value) => {
                setAuditorId(value);
                setSelectedFolderIds(new Set());
              }}
              placeholder="Select an auditor"
              searchPlaceholder="Search auditors..."
              emptyText="No auditors available"
              disabled={isLoading}
            />
          </div>

          {auditorId && (
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label>Select Folders</Label>
                {selectedFolderIds.size > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {selectedFolderIds.size} selected
                  </span>
                )}
              </div>

              <div className="max-h-64 space-y-1 overflow-y-auto rounded-md border p-1">
                {isLoadingAuditor ? (
                  <div className="space-y-2 p-2">
                    <Skeleton className="h-7 w-full" />
                    <Skeleton className="h-7 w-full" />
                    <Skeleton className="h-7 w-full" />
                  </div>
                ) : clientFolders.length === 0 ? (
                  <p className="p-3 text-sm text-muted-foreground">
                    No project folders for this client.
                  </p>
                ) : (
                  clientFolders.map((folder) => {
                    const isConnected = connectedFolderIds.has(folder.id);
                    const isChecked =
                      isConnected || selectedFolderIds.has(folder.id);
                    return (
                      <div
                        key={folder.id}
                        className="flex items-center gap-1.5 rounded-md py-1.5 pr-2 pl-2 hover:bg-muted"
                      >
                        <Checkbox
                          checked={isChecked}
                          disabled={isConnected}
                          onCheckedChange={() => toggleFolder(folder.id)}
                        />
                        <FolderIcon className="h-4 w-4 shrink-0 text-primary" />
                        <span className="truncate text-sm" title={folder.name}>
                          {folder.name}
                        </span>
                        {isConnected && (
                          <Badge
                            variant="outline"
                            className="ml-auto shrink-0 text-[10px]"
                          >
                            Connected
                          </Badge>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleConnect}
            disabled={isLoadingAuditor || !auditorId || selectedFolderIds.size === 0}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Connect
            {selectedFolderIds.size > 0 ? ` (${selectedFolderIds.size})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ClientAuditorsDetail({
  clientId,
  clientName,
  onConnected,
}: {
  clientId: string;
  clientName?: string;
  onConnected?: () => void;
}) {
  const { client, isLoading, mutate } = useClient(clientId);
  const [detailSearch, setDetailSearch] = useState("");
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<{
    projectId: string;
    auditorId: string;
    auditorName: string;
    folderName: string;
  } | null>(null);

  const rows = (client?.folders || []).flatMap((folder) =>
    (folder.project?.auditors || []).map((auditor) => ({
      key: `${folder.id}-${auditor.id}`,
      folderId: folder.id,
      folderName: folder.name,
      parentPath: folder.parentPath,
      documentCount: folder.documentCount,
      childrenCount: folder.childrenCount,
      auditorId: auditor.id,
      auditorName: auditor.name || auditor.email || "Unknown auditor",
      projectId: folder.project!.id,
    }))
  );

  const filteredRows = rows.filter((row) => {
    if (!detailSearch) return true;
    const query = detailSearch.toLowerCase();
    return (
      row.folderName.toLowerCase().includes(query) ||
      row.auditorName.toLowerCase().includes(query)
    );
  });

  const handleConnectSuccess = () => {
    mutate();
    onConnected?.();
  };

  const handleConfirmDisconnect = async () => {
    if (!confirmTarget) return;
    const { projectId, auditorId, folderName } = confirmTarget;

    // Close the confirmation dialog immediately; the toast reports the result.
    setConfirmTarget(null);
    setDisconnectingId(projectId + auditorId);
    try {
      const result = await disconnectUserFromProject({
        id: auditorId,
        projectId,
      });

      if (result.success) {
        toast.success(`Akses folder "${folderName}" berhasil dicabut`);
        mutate();
        onConnected?.();
      } else {
        toast.error(result.error || "Gagal mencabut akses folder");
      }
    } catch (error) {
      console.error("Error disconnecting auditor from project:", error);
      toast.error("Terjadi kesalahan yang tidak terduga");
    } finally {
      setDisconnectingId(null);
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

  return (
    <div className="p-3">
      <Card className="py-0 gap-0 overflow-hidden">
        <CardHeader className="border-b bg-background px-4 py-3 [.border-b]:pb-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-bold italic text-[#0a1f44]">
              Auditor yang memiliki akses ke folder client ini sebagai berikut
            </p>
            <Button
              size="sm"
              className="h-8 shrink-0 hover:cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setConnectDialogOpen(true);
              }}
            >
              <RefreshCcw className="h-4 w-4" />
              Connect Auditor
            </Button>
          </div>
          <div className="relative mt-2 w-full max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Cari folder atau auditor..."
              className="h-8 pl-8"
              value={detailSearch}
              onChange={(e) => setDetailSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">
              No auditor has access to this client&apos;s folders yet.
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-blue-400 [&_tr]:hover:bg-blue-400">
                <TableRow>
                  <TableHead className="text-white font-bold">
                    Auditor
                  </TableHead>
                  <TableHead className="text-white font-bold">
                    Folder
                  </TableHead>
                  <TableHead className="w-[80px] text-white font-bold">
                    Aksi
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="h-20 text-center text-sm text-muted-foreground"
                    >
                      Tidak ada folder/auditor yang cocok dengan pencarian.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRows.map((row) => {
                    const rowKey = row.projectId + row.auditorId;
                    return (
                      <TableRow key={row.key}>
                        <TableCell className="whitespace-normal break-words">
                          <div className="flex items-center gap-2">
                            <UserCog className="h-4 w-4 shrink-0 text-muted-foreground" />
                            {row.auditorName}
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-normal break-words">
                          <div className="flex flex-wrap items-center gap-2">
                            <FolderIcon className="h-4 w-4 shrink-0 text-primary" />
                            <span>
                              {row.parentPath.length > 0 && (
                                <span className="text-muted-foreground">
                                  {row.parentPath.join(" / ")} /{" "}
                                </span>
                              )}
                              <Link
                                href={`/drive/${row.folderId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {row.folderName}
                              </Link>
                            </span>
                            {row.childrenCount > 0 && (
                              <Badge
                                variant="outline"
                                className="shrink-0 gap-1 border-orange-500/30 bg-orange-500/10 text-[10px] text-orange-600"
                                title={`${row.childrenCount} subfolder${
                                  row.childrenCount > 1 ? "s" : ""
                                }`}
                              >
                                <FolderIcon className="h-3 w-3" />
                                {row.childrenCount}
                              </Badge>
                            )}
                            {row.documentCount > 0 && (
                              <Badge
                                variant="outline"
                                className="shrink-0 gap-1 border-blue-500/30 bg-blue-500/10 text-[10px] text-blue-600"
                                title={`${row.documentCount} document${
                                  row.documentCount > 1 ? "s" : ""
                                }`}
                              >
                                <FileText className="h-3 w-3" />
                                {row.documentCount}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 hover:cursor-pointer"
                            disabled={disconnectingId === rowKey}
                            onClick={() =>
                              setConfirmTarget({
                                projectId: row.projectId,
                                auditorId: row.auditorId,
                                auditorName: row.auditorName,
                                folderName: row.folderName,
                              })
                            }
                          >
                            {disconnectingId === rowKey ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCwOff className="h-4 w-4 text-destructive" />
                            )}
                            <span className="sr-only">Disconnect auditor</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <DialogConnectAuditorToClient
        clientId={clientId}
        clientName={clientName}
        isOpen={connectDialogOpen}
        onClose={() => setConnectDialogOpen(false)}
        onSuccess={handleConnectSuccess}
      />

      <Dialog
        open={!!confirmTarget}
        onOpenChange={(open) => !open && setConfirmTarget(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <RefreshCwOff className="h-5 w-5 text-destructive" />
              <DialogTitle>Cabut Akses Folder</DialogTitle>
            </div>
            <DialogDescription>
              Konfirmasi untuk mencabut akses folder ini dari auditor.
            </DialogDescription>
          </DialogHeader>

          {confirmTarget && (
            <Alert
              variant="default"
              className="bg-destructive/10 border-destructive/20"
            >
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Auditor{" "}
                <span className="font-semibold">
                  {confirmTarget.auditorName}
                </span>{" "}
                tidak akan bisa lagi melihat atau mengakses folder{" "}
                <span className="font-semibold">
                  &quot;{confirmTarget.folderName}&quot;
                </span>
                .
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmTarget(null)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleConfirmDisconnect}>
              Ya, Cabut Akses
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function TableClients() {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const editFormRef = useRef<HTMLFormElement>(null);
  const deleteFormRef = useRef<HTMLFormElement>(null);

  const itemsPerPage = 10;

  // Toggle a row's collapse/expand state
  const toggleExpanded = (clientId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(clientId)) {
        next.delete(clientId);
      } else {
        next.add(clientId);
      }
      return next;
    });
  };

  // Fetch clients using SWR
  const { clients, pagination, isLoading, mutate } = useClients({
    page: currentPage,
    limit: itemsPerPage,
    search: searchQuery,
  });

  // Handle search with debounce
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  // Handle edit client form submission
  const handleEditClient = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editFormRef.current) return;

    const formData = new FormData(editFormRef.current);

    try {
      const result = await updateClient(formData);

      if (result.success) {
        toast.success("Client updated successfully");
        setIsEditDialogOpen(false);
        mutate(); // Refresh clients data
      } else {
        toast.error(result.error || "Failed to update client");
      }
    } catch (error) {
      toast.error("An error occurred while updating client");
    }
  };

  // Handle delete client
  const handleDeleteClient = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!deleteFormRef.current || !selectedClientId) return;

    const formData = new FormData(deleteFormRef.current);

    try {
      const result = await deleteClient(formData);

      if (result.success) {
        toast.success("Client deleted successfully");
        setIsDeleteDialogOpen(false);
        mutate(); // Refresh clients data
      } else {
        toast.error(result.error || "Failed to delete client");
      }
    } catch (error) {
      toast.error("An error occurred while deleting client");
    }
  };

  // Selected client for editing
  const selectedClient = selectedClientId
    ? clients.find((client) => client.id === selectedClientId)
    : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search clients..."
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
                    <Skeleton className="h-5 w-[150px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-[200px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-[200px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-[40px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-10" />
                  </TableCell>
                </TableRow>
              ))
            ) : clients.length > 0 ? (
              clients.map((client) => {
                const isExpanded = expandedIds.has(client.id);
                return (
                <Fragment key={client.id}>
                <TableRow
                  className="cursor-pointer transition-colors duration-150 hover:bg-blue-50/70 dark:hover:bg-blue-950/20"
                  onClick={() => toggleExpanded(client.id)}
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
                  <TableCell className="font-medium whitespace-normal break-words">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900/40">
                        <Building2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-300" />
                      </span>
                      {client.name}
                    </div>
                  </TableCell>
                  <TableCell>{client.email}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <CopyButton value={client.hashedPassword} />
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="gap-1 border-blue-500/30 bg-blue-500/10 text-blue-600"
                    >
                      {client.auditorCount}{" "}
                      {client.auditorCount <= 1 ? "auditor" : "auditors"}
                    </Badge>
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
                          onClick={() => {
                            setSelectedClientId(client.id);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedClientId(client.id);
                            setIsDeleteDialogOpen(true);
                          }}
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
                    <TableCell colSpan={6} className="bg-accent/60 p-0">
                      <ClientAuditorsDetail
                        clientId={client.id}
                        clientName={client.name}
                        onConnected={mutate}
                      />
                    </TableCell>
                  </TableRow>
                )}
                </Fragment>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No clients found.
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

      <DialogEditClient
        isEditDialogOpen={isEditDialogOpen}
        setIsEditDialogOpen={setIsEditDialogOpen}
        selectedClient={selectedClient}
        editFormRef={editFormRef}
        handleEditClient={handleEditClient}
      />

      <DialogDeleteClient
        isDeleteDialogOpen={isDeleteDialogOpen}
        setIsDeleteDialogOpen={setIsDeleteDialogOpen}
        selectedClientId={selectedClientId}
        deleteFormRef={deleteFormRef}
        handleDeleteClient={handleDeleteClient}
      />
    </div>
  );
}
