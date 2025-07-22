"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { FileUp, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileUpload } from "@/components/file-upload";
import { useDirectUpload } from "@/hooks/use-direct-upload";
import { useDocuments } from "@/hooks/use-documents"; // ✅ Tambahkan ini

const formSchema = z.object({
  files: z
    .array(
      z
        .instanceof(File)
        .refine((file) => file.size <= 50 * 1024 * 1024, {
          message: "File size must be less than 50MB",
        })
        .refine(
          (file) =>
            [
              "application/pdf",
              // "application/msword",
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
              // "application/vnd.ms-excel",
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            ].includes(file.type),
          {
            message:
              "File type not supported. Please upload PDF files only.",
          }
        )
    )
    .min(1, "Please upload at least one file"),
});

type FormData = z.infer<typeof formSchema>;

interface DialogUploadDocumentProps {
  isOpen: boolean;
  onClose: () => void;
  folderId: string;
  onSuccess?: () => void;
}

export default function DialogUploadDocument({
  isOpen,
  onClose,
  folderId,
  onSuccess,
}: DialogUploadDocumentProps) {
  const { data: session } = useSession();

  const { mutate } = useDocuments({ // ✅ untuk re-fetch table setelah upload
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const { uploadFile, isUploading, progress } = useDirectUpload({
    onSuccess: () => {
      // kosong — kita handle semuanya di bawah setelah selesai upload semua file
    },
    onError: (error) => {
      console.error("Upload error:", error);
      toast.error("Failed to upload one or more documents.");
    },
  });

  const {
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      files: [],
    },
  });

  const fileValues = watch("files");

  const handleFileChange = (files: File[] | null) => {
    const existingFiles = fileValues || []; // Pastikan fileValues tidak null
  
    setValue("files", [...existingFiles, ...(files || [])], {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  // Fungsi untuk menghapus file dari daftar
  const handleRemoveFile = (file: File) => {
    const updatedFiles = fileValues.filter((item) => item !== file);
    setValue("files", updatedFiles, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data: FormData) => {
    if (!session?.user?.id) {
      toast.error("Authentication required");
      return;
    }
  
    setIsSubmitting(true); // ✅ Mulai loading
  
    try {
      for (const file of data.files) {
        await uploadFile(file, folderId);
      }
  
      await mutate(); // Refresh documents
      toast.success("Documents uploaded successfully");
  
      reset();
      if (onSuccess) onSuccess();
      handleClose();
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Upload failed. Please try again.");
    } finally {
      setIsSubmitting(false); // ✅ Hanya dilepas saat close selesai
    }
  };
  
  

  const handleClose = () => {
    if (!isSubmitting && !isUploading) {
      reset();
      onClose();
    }
  };
  

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Upload Documents</DialogTitle>
            <DialogDescription>
              Upload one or more documents to the current folder. Supported formats: PDF (max 50MB each).
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            <FileUpload
              onChange={handleFileChange}
              value={fileValues}
              multiple
              accept={{
                "application/pdf": [".pdf"],
                // "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
                // "application/msword": [".doc"],
                // "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
                // "application/vnd.ms-excel": [".xls"],
              }}
              disabled={isUploading}
              progress={progress}
              handleRemoveFile={handleRemoveFile}
            />
            {errors.files && (
              <p className="text-sm font-medium text-destructive">
                {errors.files.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || fileValues.length === 0}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <FileUp className="mr-2 h-4 w-4" />
                  Upload Documents
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
