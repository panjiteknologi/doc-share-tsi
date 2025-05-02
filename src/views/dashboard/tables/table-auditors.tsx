"use client";

import { useState } from "react";
import {
  Search,
  MoreHorizontal,
  UserCog,
  RefreshCcw,
  RefreshCwOff,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataPagination } from "./data-pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useAuditors } from "@/hooks/use-auditors";
import DialogEditAuditor from "../dialogs/dialog-edit-auditor";
import DialogDeleteAuditor from "../dialogs/dialog-delete-auditor";
import DialogConnectProject from "../dialogs/dialog-connect-project";
import DialogDisconnectProject from "../dialogs/dialog-disconnect-project";
import { CopyButton } from "@/components/copy-button";

export function TableAuditors() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAuditor, setSelectedAuditor] = useState<any>(null);
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);

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

  // Open disconnect dialog
  const handleOpenDisconnectDialog = (auditor: any) => {
    setSelectedAuditor(auditor);
    setDisconnectDialogOpen(true);
  };

  const handleSuccess = () => {
    mutate();
  };

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
          <TableHeader className="sticky top-0 z-10 bg-muted">
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Password</TableHead>
              <TableHead>Clients</TableHead>
              <TableHead>Connect</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
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
              auditors.map((auditor) => (
                <TableRow key={auditor.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <UserCog className="h-4 w-4 text-muted-foreground" />
                      {auditor.name}
                    </div>
                  </TableCell>
                  <TableCell>{auditor.email}</TableCell>
                  <TableCell>
                    <CopyButton value={auditor.hashedPassword} />
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {auditor.projectCount}{" "}
                      {auditor.projectCount <= 1 ? "client" : "clients"}
                    </Badge>
                  </TableCell>
                  <TableCell align="left" className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="hover:cursor-pointer"
                      onClick={() => handleOpenConnectDialog(auditor)}
                    >
                      <RefreshCcw className="h-4 w-4" />
                      <span className="sr-only">Connect</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="hover:cursor-pointer"
                      onClick={() => handleOpenDisconnectDialog(auditor)}
                    >
                      <RefreshCwOff className="h-4 w-4" />
                      <span className="sr-only">Disconnect</span>
                    </Button>
                  </TableCell>
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
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
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

      {/* Disconnect Auditor Dialog */}
      <DialogDisconnectProject
        isOpen={disconnectDialogOpen}
        onClose={() => setDisconnectDialogOpen(false)}
        auditorId={selectedAuditor?.id || null}
        auditorName={selectedAuditor?.name}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
