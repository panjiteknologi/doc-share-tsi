"use client";

import { Fragment, useState } from "react";
import { toast } from "sonner";
import {
  Search,
  MoreHorizontal,
  UserCog,
  RefreshCcw,
  RefreshCwOff,
  ChevronDown,
  ChevronRight,
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
import { disconnectUserFromProject } from "@/action/user-project";
import DialogEditAuditor from "../dialogs/dialog-edit-auditor";
import DialogDeleteAuditor from "../dialogs/dialog-delete-auditor";
import DialogConnectProject from "../dialogs/dialog-connect-project";
import { CopyButton } from "@/components/copy-button";

function AuditorConnectionsDetail({
  auditorId,
  onDisconnected,
}: {
  auditorId: string;
  onDisconnected?: () => void;
}) {
  const { auditor, isLoading, mutate } = useAuditor(auditorId);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [detailSearch, setDetailSearch] = useState("");
  const [confirmTarget, setConfirmTarget] = useState<{
    projectId: string;
    folderName: string;
    clientName: string;
  } | null>(null);

  const filteredProjects = (auditor?.projects || []).filter((project) => {
    if (!detailSearch) return true;
    const query = detailSearch.toLowerCase();
    const clientName = (
      project.folder.user.name ||
      project.folder.user.email ||
      ""
    ).toLowerCase();
    return (
      project.folder.name.toLowerCase().includes(query) ||
      clientName.includes(query)
    );
  });

  const handleConfirmDisconnect = async () => {
    if (!confirmTarget) return;
    const { projectId, folderName } = confirmTarget;

    // Close the confirmation dialog immediately; the toast reports the result.
    setConfirmTarget(null);
    setDisconnectingId(projectId);
    try {
      const result = await disconnectUserFromProject({
        id: auditorId,
        projectId,
      });

      if (result.success) {
        toast.success(`Akses folder "${folderName}" berhasil dicabut`);
        mutate();
        onDisconnected?.();
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

  if (!auditor || auditor.projects.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        This auditor is not connected to any folder yet.
      </div>
    );
  }

  return (
    <div className="p-3">
      <Card className="py-0 gap-0 overflow-hidden">
        <CardHeader className="border-b bg-background px-4 py-3 [.border-b]:pb-3">
          <p className="text-sm font-bold italic text-[#0a1f44]">
            Akses folder yang di berikan ke auditor sebagai berikut
          </p>
          <div className="relative mt-2 w-full max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Cari client atau folder..."
              className="h-8 pl-8"
              value={detailSearch}
              onChange={(e) => setDetailSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-blue-400 [&_tr]:hover:bg-blue-400">
              <TableRow>
                <TableHead className="text-white font-bold">Client</TableHead>
                <TableHead className="text-white font-bold">Folder</TableHead>
                <TableHead className="w-[80px] text-white font-bold">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="h-20 text-center text-sm text-muted-foreground"
                  >
                    Tidak ada folder/client yang cocok dengan pencarian.
                  </TableCell>
                </TableRow>
              ) : (
                filteredProjects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="whitespace-normal break-words">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                      {project.folder.user.name ||
                        project.folder.user.email ||
                        "Unknown client"}
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-normal break-words">
                    <div className="flex items-center gap-2">
                      <FolderIcon className="h-4 w-4 shrink-0 text-primary" />
                      <span>
                        {project.folder.parentPath.length > 0 && (
                          <span className="text-muted-foreground">
                            {project.folder.parentPath.join(" / ")} /{" "}
                          </span>
                        )}
                        {project.folder.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 hover:cursor-pointer"
                      disabled={disconnectingId === project.id}
                      onClick={() =>
                        setConfirmTarget({
                          projectId: project.id,
                          folderName: project.folder.name,
                          clientName:
                            project.folder.user.name ||
                            project.folder.user.email ||
                            "Unknown client",
                        })
                      }
                    >
                      {disconnectingId === project.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCwOff className="h-4 w-4 text-destructive" />
                      )}
                      <span className="sr-only">Disconnect folder</span>
                    </Button>
                  </TableCell>
                </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
                Auditor tidak akan bisa lagi melihat atau mengakses folder{" "}
                <span className="font-semibold">
                  &quot;{confirmTarget.folderName}&quot;
                </span>{" "}
                milik client{" "}
                <span className="font-semibold">
                  {confirmTarget.clientName}
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

      <div className="rounded-md border">
        <Table>
          <TableHeader className="sticky top-0 z-10">
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
                  className="cursor-pointer"
                  onClick={() => toggleExpanded(auditor.id)}
                >
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 hover:cursor-pointer"
                      tabIndex={-1}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <span className="sr-only">Toggle details</span>
                    </Button>
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <UserCog className="h-4 w-4 text-muted-foreground" />
                      {auditor.name}
                    </div>
                  </TableCell>
                  <TableCell>{auditor.email}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <CopyButton value={auditor.hashedPassword} />
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
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
