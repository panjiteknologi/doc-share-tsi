"use client";

import { useState, useRef } from "react";
import { Search, MoreHorizontal } from "lucide-react";
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
import { useClients } from "@/hooks/use-clients";
import { deleteClient, updateClient } from "@/action/client";
import DialogEditClient from "../dialogs/dialog-edit-client";
import DialogDeleteClient from "../dialogs/dialog-delete-client";
import { CopyButton } from "@/components/copy-button";

export function TableClients() {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const editFormRef = useRef<HTMLFormElement>(null);
  const deleteFormRef = useRef<HTMLFormElement>(null);

  const itemsPerPage = 10;

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

      <div className="rounded-md border">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-muted">
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Password</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
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
                    <Skeleton className="h-5 w-[120px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-10" />
                  </TableCell>
                </TableRow>
              ))
            ) : clients.length > 0 ? (
              clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>{client.email}</TableCell>
                  <TableCell>
                    <CopyButton value={client.hashedPassword} />
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
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
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
