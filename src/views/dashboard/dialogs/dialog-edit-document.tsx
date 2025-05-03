"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, FolderIcon } from "lucide-react";
import { IconFileText } from "@tabler/icons-react";
import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Document } from "@/hooks/use-documents";
import { updateDocument } from "@/action/document";
import { useFolders } from "@/hooks/use-folders";

// Form validation schema
const formSchema = z.object({
  id: z.string(),
  folderId: z.string().min(1, "Please select a folder"),
});

type FormData = z.infer<typeof formSchema>;

interface DialogEditDocumentProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document | null;
  onSuccess?: () => void;
}

export default function DialogEditDocument({
  isOpen,
  onClose,
  document,
  onSuccess,
}: DialogEditDocumentProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();
  const userId = session?.user?.id;

  // Fetch available folders
  const { folders, isLoading: foldersLoading } = useFolders({
    userId,
    limit: 100, // Get more folders for the dropdown
  });

  const {
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: document
      ? {
          id: document.id,
          folderId: document.folder?.id ?? "",
        }
      : undefined,
  });

  // Watch form fields
  const selectedFolderId = watch("folderId");

  // Reset form when document changes
  useEffect(() => {
    if (document) {
      reset({
        id: document.id,
        folderId: document.folder?.id ?? "",
      });
    }
  }, [document, reset]);

  const onSubmit = async (data: FormData) => {
    if (!document) return;

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("id", data.id);
      formData.append("folderId", data.folderId);

      const result = await updateDocument(formData);

      if (result.success) {
        toast.success("Document updated successfully");
        if (onSuccess) onSuccess();
        onClose();
      } else {
        toast.error(result.error || "Failed to update document");
      }
    } catch (error) {
      console.error("Error updating document:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      reset();
      onClose();
    }
  };

  // Don't render if there's no document to edit
  if (!document) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-primary/10 p-2 rounded-md">
                <IconFileText className="h-5 w-5 text-primary" />
              </div>
              <DialogTitle>Move Document</DialogTitle>
            </div>
            <DialogDescription>
              You can move this document to a different folder. Select a
              destination folder below.
            </DialogDescription>
          </DialogHeader>

          <input type="hidden" name="id" value={document.id} />

          <div className="grid gap-4 py-4">
            {/* File information display */}
            <div className="bg-muted/50 p-3 rounded-md flex items-center gap-3">
              <div className="bg-primary/5 p-2 rounded">
                <IconFileText className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {document.fileName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {document.fileType} • {document.fileSize} • Uploaded by{" "}
                  {document.uploadedBy}
                </p>
              </div>
            </div>

            <div className="grid gap-2 mt-2">
              <Label htmlFor="folder">
                Destination Folder <span className="text-destructive">*</span>
              </Label>
              <Select
                defaultValue={document.folder?.id ?? ""}
                onValueChange={(value) =>
                  setValue("folderId", value, { shouldValidate: true })
                }
                disabled={isLoading || foldersLoading}
              >
                <SelectTrigger id="folder">
                  <SelectValue placeholder="Select a folder" />
                </SelectTrigger>
                <SelectContent>
                  {foldersLoading ? (
                    <SelectItem value="loading" disabled>
                      Loading folders...
                    </SelectItem>
                  ) : folders.length === 0 ? (
                    <SelectItem value="empty" disabled>
                      No folders available
                    </SelectItem>
                  ) : (
                    folders.map((folder) => (
                      <SelectItem
                        key={folder.id}
                        value={folder.id}
                        disabled={folder.id === document.folder?.id}
                      >
                        <span className="flex items-center gap-2">
                          <FolderIcon className="h-4 w-4" />
                          <span
                            className="truncate max-w-[300px]"
                            title={folder.name}
                          >
                            {folder.name}
                          </span>
                          {folder.id === document.folder?.id && " (Current)"}
                        </span>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.folderId && (
                <p className="text-sm font-medium text-destructive">
                  {errors.folderId.message}
                </p>
              )}
            </div>

            {/* Show current location */}
            <div className="text-sm text-muted-foreground mt-1">
              Current location:{" "}
              <span className="font-medium">{document?.folder?.name}</span>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isLoading ||
                selectedFolderId === document.folder?.id ||
                foldersLoading
              }
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Moving...
                </>
              ) : (
                "Move Document"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
