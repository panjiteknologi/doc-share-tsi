"use client";

import { useState, useEffect } from "react";
import {
  Search,
  FileText,
  MoreHorizontal,
  Download,
  Eye,
  FolderOpen,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataPagination } from "./data-pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface Document {
  id: string;
  name: string;
  type: string;
  folder: string;
  folderId: string;
  size: string;
  uploadedBy: string;
  createdAt: string;
}

interface Folder {
  id: string;
  name: string;
}

export function TableDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;

  // Mock data - in a real app, this would be fetched from an API
  useEffect(() => {
    // Mock folders
    const mockFolders = Array.from({ length: 8 }, (_, i) => ({
      id: `folder-${i + 1}`,
      name: `Project Folder ${i + 1}`,
    }));

    // Mock documents
    const documentTypes = ["PDF", "DOCX", "XLSX", "JPG", "PNG", "CSV"];
    const mockDocuments = Array.from({ length: 35 }, (_, i) => {
      const folder =
        mockFolders[Math.floor(Math.random() * mockFolders.length)];
      const type =
        documentTypes[Math.floor(Math.random() * documentTypes.length)];
      const size = Math.floor(Math.random() * 10000) + 100; // Random size in KB

      return {
        id: `doc-${i + 1}`,
        name: `Document-${i + 1}.${type.toLowerCase()}`,
        type,
        folder: folder.name,
        folderId: folder.id,
        size: `${(size / 1024).toFixed(2)} MB`,
        uploadedBy: "Admin User",
        createdAt: new Date(
          Date.now() - Math.random() * 10000000000
        ).toISOString(),
      };
    });

    setTimeout(() => {
      setFolders(mockFolders);
      setDocuments(mockDocuments);
      setLoading(false);
    }, 1000);
  }, []);

  // Filter documents based on search query
  const filteredDocuments = documents.filter(
    (doc) =>
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.folder.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage);
  const paginatedDocuments = filteredDocuments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Delete document (mock)
  const handleDeleteDocument = (id: string) => {
    setDocuments(documents.filter((doc) => doc.id !== id));
    toast.success("Document deleted successfully");
  };

  // Get document icon based on file type
  const getDocumentIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "pdf":
        return <FileText className="h-4 w-4 text-red-500" />;
      case "docx":
      case "doc":
        return <FileText className="h-4 w-4 text-blue-500" />;
      case "xlsx":
      case "xls":
        return <FileText className="h-4 w-4 text-green-500" />;
      case "jpg":
      case "png":
      case "jpeg":
        return <FileText className="h-4 w-4 text-purple-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search documents..."
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
              <TableHead>Folder</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Uploaded By</TableHead>
              <TableHead>Date</TableHead>
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
                    <Skeleton className="h-5 w-[50px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-[120px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-[60px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-[100px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-[80px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-10" />
                  </TableCell>
                </TableRow>
              ))
            ) : paginatedDocuments.length > 0 ? (
              paginatedDocuments.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium flex items-center">
                    {getDocumentIcon(doc.type)}
                    <span className="ml-2">{doc.name}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{doc.type}</Badge>
                  </TableCell>
                  <TableCell className="flex items-center">
                    <FolderOpen className="h-4 w-4 text-muted-foreground mr-1" />
                    {doc.folder}
                  </TableCell>
                  <TableCell>{doc.size}</TableCell>
                  <TableCell>{doc.uploadedBy}</TableCell>
                  <TableCell>
                    {new Date(doc.createdAt).toLocaleDateString()}
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
                          onClick={() =>
                            toast.info("View document feature coming soon")
                          }
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            toast.info("Download feature coming soon")
                          }
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteDocument(doc.id)}
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
                <TableCell colSpan={7} className="h-24 text-center">
                  No documents found.
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
