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
import { toast } from "sonner";

interface DocumentCardProps {
  document: Document;
  onViewDocument?: (document: Document) => void;
}

const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  onViewDocument,
}) => {
  const [isViewLoading, setIsViewLoading] = useState(false);

  // Format date for display
  const createdAt = new Date(document.createdAt);
  const createdTimeAgo = formatDistanceToNow(createdAt, { addSuffix: true });

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

  return (
    <Card className="overflow-hidden hover:border-primary/50 transition-colors">
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
        </div>
      </CardContent>
      <CardFooter className="px-4 pt-0 flex items-center text-xs text-muted-foreground">
        <User className="h-3 w-3 mr-1" />
        <span className="truncate max-w-[125px]">{document.uploadedBy}</span>
        <span className="ml-auto">{document.fileSize}</span>
      </CardFooter>
    </Card>
  );
};

export default DocumentCard;
