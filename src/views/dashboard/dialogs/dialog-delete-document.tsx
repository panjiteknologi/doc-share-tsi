"use client";

import { useState } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { deleteDocument } from "@/action/document";
import { Document } from "@/hooks/use-documents";

interface DialogDeleteDocumentProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document | null;
  onSuccess?: () => void;
}

export default function DialogDeleteDocument({
  isOpen,
  onClose,
  document,
  onSuccess,
}: DialogDeleteDocumentProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!document) return;

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("id", document.id);

      const result = await deleteDocument(formData);

      if (result.success) {
        toast.success("Document deleted successfully");
        if (onSuccess) onSuccess();
        onClose();
      } else {
        toast.error(result.error || "Failed to delete document");
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render if there's no document to delete
  if (!document) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <DialogTitle>Delete Document</DialogTitle>
          </div>
          <DialogDescription>
            Are you sure you want to delete "{document.fileName}"? This action
            cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted/50 p-3 my-2 rounded-md">
          <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
            <div className="text-sm text-muted-foreground">File:</div>
            <div className="text-sm font-medium">{document.fileName}</div>

            <div className="text-sm text-muted-foreground">Type:</div>
            <div className="text-sm">{document.fileType}</div>

            <div className="text-sm text-muted-foreground">Size:</div>
            <div className="text-sm">{document.fileSize}</div>

            <div className="text-sm text-muted-foreground">Location:</div>
            <div className="text-sm">{document.folder?.name || "Unknown"}</div>

            <div className="text-sm text-muted-foreground">Uploaded by:</div>
            <div className="text-sm">{document.uploadedBy}</div>
          </div>
        </div>

        <form onSubmit={handleDelete}>
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>

            <Button type="submit" variant="destructive" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Document"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
