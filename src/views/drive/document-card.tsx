import React, { useState } from "react";
import { Document } from "@/hooks/use-documents";
import { formatDistanceToNow } from "date-fns";
import {
  FileText,
  Eye,
  MoreHorizontal,
  File,
  User,
  Calendar,
  FolderIcon,
  Clock,
  FolderOpen,
  Trash2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  calculateExpiryDate,
  formatTimeRemaining,
  getExpiryStatusColor,
} from "@/lib/cron";
import DialogEditDocument from "../dashboard/dialogs/dialog-edit-document";
import DialogDeleteDocument from "../dashboard/dialogs/dialog-delete-document";

interface DocumentCardProps {
  document: Document;
  onViewDocument?: (document: Document) => void;
  onSuccess: () => void;
}

const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  onViewDocument,
  onSuccess,
}) => {
  const [isViewLoading, setIsViewLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);

  // Format date for display
  const createdAt = new Date(document.createdAt);
  const createdTimeAgo = formatDistanceToNow(createdAt, { addSuffix: true });

  // Calculate expiration date and countdown
  const expiryDate = calculateExpiryDate(document.createdAt);
  const timeRemaining = formatTimeRemaining(expiryDate);
  const expiryStatusClass = getExpiryStatusColor(expiryDate);

  // Get document icon based on file type
  const getDocumentIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "pdf":
        return <FileText className="h-5 w-5 text-red-500" />;
      case "word":
        return <FileText className="h-5 w-5 text-blue-500" />;
      case "excel":
        return <FileText className="h-5 w-5 text-green-500" />;
      case "image":
        return <FileText className="h-5 w-5 text-purple-500" />;
      default:
        return <File className="h-5 w-5 text-gray-500" />;
    }
  };

  // Handle viewing the document
  const handleView = async () => {
    try {
      setIsViewLoading(true);
      onViewDocument?.(document);
    } catch (error) {
      console.error("Error preparing document viewer:", error);
      toast.error("An error occurred while preparing the document viewer");
    } finally {
      setIsViewLoading(false);
    }
  };

  const handleMove = () => {
    setSelectedDocument(document);
    setEditDialogOpen(true);
  };

  const handleDelete = () => {
    setSelectedDocument(document);
    setDeleteDialogOpen(true);
  };

  return (
    <>
      <Card className="overflow-hidden hover:border-primary/50 transition-colors relative">
        <CardHeader className="px-4 flex flex-row items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-md">
              {getDocumentIcon(document.fileType)}
            </div>
            <div className="truncate">
              <div
                className="font-medium text-base hover:underline truncate inline-block max-w-[180px]"
                title={document.fileName}
              >
                {document.fileName}
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleView} disabled={isViewLoading}>
                <Eye className="h-4 w-4 mr-2" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleMove}>
                <FolderOpen className="h-4 w-4 mr-2" />
                Move
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent className="px-4">
          <div className="flex flex-col gap-2">
            {document?.folder && (
              <div className="flex items-center text-sm text-muted-foreground">
                <FolderIcon className="h-4 w-4 mr-2" />
                <span className="truncate" title={document?.folder?.name}>
                  {document?.folder?.name}
                </span>
              </div>
            )}
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 mr-2" />
              <span>{createdTimeAgo}</span>
            </div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <Clock className="h-3 w-3 mr-1" />
              <span>Auto-deletes on {expiryDate.toLocaleDateString()}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="px-4 pt-0 flex justify-between items-center">
          <div className="flex items-center text-xs text-muted-foreground">
            <User className="h-3 w-3 mr-1" />
            <span className="truncate max-w-[125px]">
              {document.uploadedBy}
            </span>
            <span className="ml-auto">{document.fileSize}</span>
          </div>

          {/* Expiry Badge*/}
          <Badge className={`${expiryStatusClass}`}>
            <Clock className="h-3 w-3" />
            {timeRemaining}
          </Badge>
        </CardFooter>
      </Card>

      {/* Edit Document Dialog */}
      <DialogEditDocument
        isOpen={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        document={selectedDocument}
        onSuccess={onSuccess}
      />

      {/* Delete Document Dialog */}
      <DialogDeleteDocument
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        document={selectedDocument}
        onSuccess={onSuccess}
      />
    </>
  );
};

export default DocumentCard;
