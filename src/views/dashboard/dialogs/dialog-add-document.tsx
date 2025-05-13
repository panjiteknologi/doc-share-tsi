"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { FolderIcon, FileUp } from "lucide-react";
import { IconFileUpload } from "@tabler/icons-react";

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
import { useDashboardDialog } from "@/store/store-dashboard-dialog";
import { useFolders } from "@/hooks/use-folders";
import { useDocuments } from "@/hooks/use-documents";
import { useDirectUpload } from "@/hooks/use-direct-upload";

// Form validation schema
const FormSchema = z.object({
  folderId: z.string().min(1, "Please select a folder"),
  file: z
    .instanceof(File, { message: "Please upload a document" })
    .refine((file) => file.size <= 20 * 1024 * 1024, {
      message: "File size must be less than 20MB",
    })
    .refine((file) => ["application/pdf"].includes(file.type), {
      message: "File type not supported. Please upload PDF files only.",
    }),
});

type FormData = z.infer<typeof FormSchema>;

export function DialogAddDocument() {
  const { data: session, status } = useSession();
  const { isOpen, dialogType, closeDialog, isLoading, setLoading } =
    useDashboardDialog();
  const isDialogOpen = isOpen && dialogType === "document";

  const { mutate } = useDocuments({
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const { uploadFile, progress } = useDirectUpload({
    onSuccess: () => {
      toast.success("Document uploaded successfully");
      reset();
      closeDialog();
      mutate();
    },
    onError: (error) => {
      console.error("Upload error:", error);
      toast.error("Failed to upload document. Please try again.");
      setLoading(false);
    },
    onProgress: (p) => {
      // Progress is handled by the hook
    },
  });

  // Safe access to userId - only pass it when session is available
  const { folders, isLoading: foldersLoading } = useFolders({});

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
  const selectedFolderId = watch("folderId");

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

    try {
      await uploadFile(data.file, data.folderId);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      reset();
      closeDialog();
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
                progress={progress || null}
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
              disabled={
                isLoading ||
                status === "loading" ||
                foldersLoading ||
                !selectedFolderId ||
                !fileValue
              }
            >
              {isLoading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  Uploading... {progress}%
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
