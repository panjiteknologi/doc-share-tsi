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
import { deleteFolder } from "@/action/folder";

interface DialogDeleteFolderProps {
  isOpen: boolean;
  onClose: () => void;
  folderId: string | null;
  folderName?: string;
  documentCount?: number;
  onSuccess?: () => void;
}

export default function DialogDeleteFolder({
  isOpen,
  onClose,
  folderId,
  folderName,
  documentCount = 0,
  onSuccess,
}: DialogDeleteFolderProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!folderId) return;

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("id", folderId);

      const result = await deleteFolder(formData);

      if (result.success) {
        toast.success("Folder deleted successfully");
        if (onSuccess) onSuccess();
        onClose();
      } else {
        toast.error(result.error || "Failed to delete folder");
      }
    } catch (error) {
      console.error("Error deleting folder:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const hasDocuments = documentCount > 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <DialogTitle>Delete Folder</DialogTitle>
          </div>
          <DialogDescription>
            Are you sure you want to delete{" "}
            {folderName ? `"${folderName}"` : "this folder"}?
            {hasDocuments ? (
              <span className="block mt-2 text-destructive font-medium">
                This folder contains {documentCount} document
                {documentCount === 1 ? "" : "s"}. You must remove all documents
                before deleting the folder.
              </span>
            ) : (
              " This action cannot be undone."
            )}
          </DialogDescription>
        </DialogHeader>

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

            <Button
              type="submit"
              variant="destructive"
              disabled={isLoading || hasDocuments}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Folder"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
