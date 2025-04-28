"use client";

import { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";

interface Auditor {
  id: string;
  name: string;
  email: string;
  status: "active" | "inactive";
  projects: number;
  createdAt: string;
}

export function TableAuditors() {
  const [auditors, setAuditors] = useState<Auditor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [newAuditor, setNewAuditor] = useState({ name: "", email: "" });

  const itemsPerPage = 10;

  // Mock data - in a real app, this would be fetched from an API
  useEffect(() => {
    const mockAuditors = Array.from({ length: 18 }, (_, i) => ({
      id: `auditor-${i + 1}`,
      name: `Auditor ${i + 1}`,
      email: `auditor${i + 1}@example.com`,
      status:
        Math.random() > 0.3 ? "active" : ("inactive" as "active" | "inactive"),
      projects: Math.floor(Math.random() * 10),
      createdAt: new Date(
        Date.now() - Math.random() * 10000000000
      ).toISOString(),
    }));

    setTimeout(() => {
      setAuditors(mockAuditors);
      setLoading(false);
    }, 1000);
  }, []);

  // Filter auditors based on search query
  const filteredAuditors = auditors.filter(
    (auditor) =>
      auditor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      auditor.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredAuditors.length / itemsPerPage);
  const paginatedAuditors = filteredAuditors.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Add new auditor (mock)
  const handleAddAuditor = () => {
    if (!newAuditor.name || !newAuditor.email) {
      toast.error("Name and email are required");
      return;
    }

    const newAuditorData = {
      id: `auditor-${auditors.length + 1}`,
      name: newAuditor.name,
      email: newAuditor.email,
      status: "active" as "active",
      projects: 0,
      createdAt: new Date().toISOString(),
    };

    setAuditors([newAuditorData, ...auditors]);
    setNewAuditor({ name: "", email: "" });
    toast.success("Auditor added successfully");
  };

  // Toggle auditor status (mock)
  const toggleAuditorStatus = (id: string) => {
    setAuditors(
      auditors.map((auditor) =>
        auditor.id === id
          ? {
              ...auditor,
              status: auditor.status === "active" ? "inactive" : "active",
            }
          : auditor
      )
    );
    toast.success("Auditor status updated");
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
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Projects</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Skeleton className="h-5 w-[140px]" />
                  </TableCell>
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
                    <Skeleton className="h-5 w-[100px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-10" />
                  </TableCell>
                </TableRow>
              ))
            ) : paginatedAuditors.length > 0 ? (
              paginatedAuditors.map((auditor) => (
                <TableRow key={auditor.id}>
                  <TableCell className="font-medium">{auditor.name}</TableCell>
                  <TableCell>{auditor.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        auditor.status === "active" ? "default" : "secondary"
                      }
                    >
                      {auditor.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{auditor.projects}</TableCell>
                  <TableCell>
                    {new Date(auditor.createdAt).toLocaleDateString()}
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
                          onClick={() => toast.info("Edit feature coming soon")}
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => toggleAuditorStatus(auditor.id)}
                        >
                          {auditor.status === "active"
                            ? "Deactivate"
                            : "Activate"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            toast.info("Assign to project feature coming soon")
                          }
                        >
                          Assign to project
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No auditors found.
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
