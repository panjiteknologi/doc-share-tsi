"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { FileUp, Loader2 } from "lucide-react";
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
import { FileUpload } from "@/components/file-upload";
import { createDocument } from "@/action/document";

// Form validation schema
const formSchema = z.object({
  file: z
    .instanceof(File, { message: "Please upload a document" })
    .refine((file) => file.size <= 10 * 1024 * 1024, {
      message: "File size must be less than 10MB",
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
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const { data: session } = useSession();

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

    setIsLoading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", data.file);
      formData.append("folderId", folderId);

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

      const result = await createDocument({
        url: response.data.url,
        folderId: folderId,
        userId: session.user.id,
      });

      if (result.success) {
        toast.success("Document uploaded successfully");
        reset();
        if (onSuccess) onSuccess();
        handleClose();
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
      setIsLoading(false);
      setUploadProgress(null);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      reset();
      setUploadProgress(null);
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
              (max 10MB).
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            <FileUpload
              onChange={handleFileChange}
              value={fileValue}
              accept={{
                "application/pdf": [".pdf"],
              }}
              disabled={isLoading}
              progress={uploadProgress}
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
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !fileValue}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
