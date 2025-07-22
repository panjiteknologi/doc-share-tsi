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
import { useFolders, useFoldersByCreator } from "@/hooks/use-folders";
import { useDocuments } from "@/hooks/use-documents";
import { useDirectUpload } from "@/hooks/use-direct-upload";

// Form validation schema
const FormSchema = z.object({
  folderId: z.string().min(1, "Please select a folder"),
  file: z
    .array(z.instanceof(File).refine((file) => file.size <= 50 * 1024 * 1024, {
      message: "File size must be less than 50MB",
    }))
    .refine((files) => files.every((file) =>
      ["application/pdf"].includes(file.type)
    ), {
      message: "Invalid file types. Only PDF are allowed.",
    })
});

type FormData = z.infer<typeof FormSchema>;

export function DialogAddDocument() {
  const { data: session, status } = useSession();
  const userId = session?.user.id as string;
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

  const { folders, isLoading: foldersLoading } = useFoldersByCreator(userId);

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
      file: [],
    },
  });

  const fileValue = watch("file");
  const selectedFolderId = watch("folderId");

  const handleFileChange = (files: File[] | null) => {
    // Handle file change by setting the array of files
    if (files && files.length > 0) {
      setValue("file", files, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
    } else {
      setValue("file", [], {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
    }
  };

  const handleRemoveFile = (file: File) => {
    const updatedFiles = fileValue.filter((item) => item !== file); // Menghapus file yang dipilih
    setValue("file", updatedFiles, {
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
      for (const file of data.file) {
        await uploadFile(file, data.folderId); // Upload satu file per iterasi
      }
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
                value={fileValue || []} // Ensure it's an array or empty array
                accept={{
                  "application/pdf": [".pdf"],
                  // "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
                  // "application/msword": [".doc"],
                  // "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
                  // "application/vnd.ms-excel": [".xls"],
                }}
                disabled={isLoading}
                progress={progress || null}
                handleRemoveFile={handleRemoveFile} 
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
                !fileValue || fileValue.length === 0
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
