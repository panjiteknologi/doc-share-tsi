import React, { useState } from "react";
import { Document } from "@/hooks/use-documents";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface DocumentTableProps {
  documents: Document[];
  onViewDocument: (document: Document) => void;
  isLoading?: boolean;
}

const DocumentTable: React.FC<DocumentTableProps> = ({
  documents,
  onViewDocument,
}) => {
  const [loadingActions, setLoadingActions] = useState<{
    [key: string]: { view?: boolean; download?: boolean };
  }>({});

  // Get document icon based on file type
  const getDocumentIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "pdf":
        return <FileText className="h-4 w-4 text-red-500" />;
      case "word":
        return <FileText className="h-4 w-4 text-blue-500" />;
      case "excel":
        return <FileText className="h-4 w-4 text-green-500" />;
      case "image":
        return <FileText className="h-4 w-4 text-purple-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleViewDocument = async (document: Document) => {
    try {
      setLoadingActions((prev) => ({
        ...prev,
        [document.id]: { ...prev[document.id], view: true },
      }));

      onViewDocument(document);
    } catch (error) {
      console.error("Error preparing document view:", error);
      toast.error("An error occurred while preparing the document viewer");
    } finally {
      setLoadingActions((prev) => ({
        ...prev,
        [document.id]: { ...prev[document.id], view: false },
      }));
    }
  };

  return (
    <div className={`${documents.length > 0 && "rounded-md border"}`}>
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-muted">
          {documents.length > 0 && (
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Folder</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Uploaded By</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          )}
        </TableHeader>
        <TableBody>
          {documents.map((document) => (
            <TableRow key={document.id}>
              <TableCell className="font-medium flex items-center">
                {getDocumentIcon(document.fileType)}
                <span className="ml-2 truncate max-w-[200px]">
                  {document.fileName}
                </span>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{document.fileType}</Badge>
              </TableCell>
              <TableCell className="truncate max-w-[150px]">
                {document?.folder?.name ?? ""}
              </TableCell>
              <TableCell>{document.fileSize}</TableCell>
              <TableCell className="truncate max-w-[150px]">
                {document.uploadedBy}
              </TableCell>
              <TableCell>
                {formatDistanceToNow(new Date(document.createdAt), {
                  addSuffix: true,
                })}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleViewDocument(document)}
                    disabled={loadingActions[document.id]?.view}
                  >
                    {loadingActions[document.id]?.view ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                    <span className="sr-only">View</span>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default DocumentTable;
