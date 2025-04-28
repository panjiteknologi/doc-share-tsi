"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { FolderIcon, FileUp } from "lucide-react";

import axios from "axios";

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
import { FileUpload } from "@/components/file-upload";
import { createDocument } from "@/action/document";
import { useDashboardDialog } from "@/store/store-dashboard-dialog";
import { useFolders } from "@/hooks/use-folders";
import { IconFileUpload } from "@tabler/icons-react";
import { useDocuments } from "@/hooks/use-documents";

// Form validation schema
const FormSchema = z.object({
  folderId: z.string().min(1, "Please select a folder"),
  file: z
    .instanceof(File, { message: "Please upload a document" })
    .refine((file) => file.size <= 10 * 1024 * 1024, {
      message: "File size must be less than 10MB",
    })
    .refine((file) => ["application/pdf"].includes(file.type), {
      message: "File type not supported. Please upload PDF files only.",
    }),
});

type FormData = z.infer<typeof FormSchema>;

export function DialogAddDocument() {
  const { isOpen, dialogType, closeDialog, isLoading, setLoading } =
    useDashboardDialog();
  const isDialogOpen = isOpen && dialogType === "document";
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const { data: session, status } = useSession();

  const { mutate } = useDocuments({ page: 1, limit: 10 });

  // Safe access to userId - only pass it when session is available
  const { folders, isLoading: foldersLoading } = useFolders(
    status === "authenticated" && session?.user?.id
      ? { userId: session.user.id }
      : {}
  );

  const {
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      folderId: "",
    },
  });

  const fileValue = watch("file");

  const handleFileChange = (file: File | null) => {
    setValue("file", file as File, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  const onSubmit = async (data: FormData) => {
    if (!session?.user?.id) {
      toast.error("Authentication required");
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", data.file);
      formData.append("folderId", data.folderId || "");

      const response = await axios.post("/api/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;

          setUploadProgress(percentCompleted);
        },
      });

      // setUploadProgress(100);

      const result = await createDocument({
        url: response.data.url,
        folderId: data.folderId,
        userId: session.user.id,
      });

      if (result.success) {
        toast.success("Document uploaded successfully");
        reset();
        mutate();
        closeDialog();
      } else {
        toast.error(result.error || "Failed to upload document");
      }
    } catch (error) {
      console.error("Error uploading document:", error);
      if (axios.isAxiosError(error) && error.response) {
        toast.error(
          `Upload failed: ${error.response.data.error || error.message}`
        );
      } else {
        toast.error("Failed to upload document. Please try again.");
      }
    } finally {
      setLoading(false);
      setUploadProgress(null);
    }
  };

  const handleClose = () => {
    setUploadProgress(null);

    if (!isLoading) {
      reset();
      closeDialog();
      setUploadProgress(null);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-primary/10 p-2 rounded-md">
                <IconFileUpload className="h-5 w-5 text-primary" />
              </div>
              <DialogTitle>Add New Document</DialogTitle>
            </div>
            <DialogDescription>
              Select a folder and upload a document file to store in the system.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="folder">
                Select Folder <span className="text-destructive">*</span>
              </Label>
              <Select
                onValueChange={(value) =>
                  setValue("folderId", value, { shouldValidate: true })
                }
              >
                <SelectTrigger id="folder" className="w-full">
                  <SelectValue placeholder="Select a folder" />
                </SelectTrigger>
                <SelectContent>
                  {status === "loading" || foldersLoading ? (
                    <SelectItem value="loading" disabled>
                      Loading folders...
                    </SelectItem>
                  ) : folders.length === 0 ? (
                    <SelectItem value="empty" disabled>
                      No folders available
                    </SelectItem>
                  ) : (
                    folders.map((folder) => (
                      <SelectItem key={folder.id} value={folder.id}>
                        <span className="flex items-center gap-2">
                          <FolderIcon className="h-4 w-4" />
                          {folder.name}
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

            <div className="grid gap-2">
              <Label htmlFor="file">
                Document File <span className="text-destructive">*</span>
              </Label>
              <FileUpload
                onChange={handleFileChange}
                value={fileValue}
                accept={{
                  "application/pdf": [".pdf"],
                }}
                disabled={isLoading}
                progress={uploadProgress || null}
              />
              {errors.file && (
                <p className="text-sm font-medium text-destructive">
                  {errors.file.message}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
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
              disabled={isLoading || status === "loading" || foldersLoading}
            >
              {isLoading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <FileUp className="mr-2 h-4 w-4" />
                  Upload Document
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
