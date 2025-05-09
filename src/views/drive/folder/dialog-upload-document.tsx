"use client";

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
import { useChunkedUpload } from "@/hooks/use-chunked-upload";

// Form validation schema
const formSchema = z.object({
  file: z
    .instanceof(File, { message: "Please upload a document" })
    .refine((file) => file.size <= 20 * 1024 * 1024, {
      message: "File size must be less than 20MB",
    })
    .refine((file) => ["application/pdf"].includes(file.type), {
      message: "File type not supported. Please upload PDF files only.",
    }),
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

  const { uploadFile, isUploading, progress } = useChunkedUpload({
    onSuccess: () => {
      toast.success("Document uploaded successfully");
      reset();
      if (onSuccess) onSuccess();
      handleClose();
    },
    onError: (error) => {
      console.error("Upload error:", error);
      toast.error("Failed to upload document. Please try again.");
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

    try {
      await uploadFile(data.file, folderId);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      reset();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Upload a document to the current folder. Supported format: PDF
              (max 20MB).
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            <FileUpload
              onChange={handleFileChange}
              value={fileValue}
              accept={{
                "application/pdf": [".pdf"],
              }}
              disabled={isUploading}
              progress={progress}
            />
            {errors.file && (
              <p className="text-sm font-medium text-destructive">
                {errors.file.message}
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
            <Button type="submit" disabled={isUploading || !fileValue}>
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
