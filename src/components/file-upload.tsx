"use client";

import * as React from "react";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";
import { Upload, File, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface FileUploadProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  onChange: (files: File[] | null) => void;
  value?: File[] | null;
  accept?: Record<string, string[]>;
  maxSize?: number;
  disabled?: boolean;
  progress?: number | null;
  multiple?: boolean;
  handleRemoveFile: (file: File) => void; // Tambahkan properti handleRemoveFile
}


export function FileUpload({
  onChange,
  value = [], // Keep it as an array of files
  accept,
  maxSize = 52428800, // 50MB
  disabled = false,
  progress,
  multiple = false,
  handleRemoveFile, // Terima handleRemoveFile dari props
  className,
  ...props
}: FileUploadProps) {
  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop: (acceptedFiles) => {
        if (acceptedFiles?.length) {
          onChange(multiple ? acceptedFiles : [acceptedFiles[0]]);
        }
      },
      accept,
      maxSize,
      multiple,
      disabled,
    });

  const fileRejectionError = fileRejections[0]?.errors[0];

  const getErrorMessage = () => {
    if (!fileRejectionError) return null;
    if (fileRejectionError.code === "file-too-large")
      return `File is too large. Max size is ${maxSize / 1024 / 1024}MB`;
    if (fileRejectionError.code === "file-invalid-type")
      return "File type not supported";
    return fileRejectionError.message;
  };

  const errorMessage = getErrorMessage();

  return (
    <div className="grid gap-2">
      <div
        {...getRootProps()}
        className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-muted-foreground/25 px-5 py-4 text-center transition hover:bg-accent/25 ${isDragActive && "border-muted-foreground/50 bg-accent/50"} ${errorMessage && "border-destructive/50"} ${disabled && "cursor-not-allowed opacity-60"} ${className}`}
        {...props}
      >
        <input {...getInputProps()} />

        {value && value.length > 0 ? (
          <div className="w-full space-y-2">
            {value.map((file, index) => (
              <div key={index} className="flex items-center justify-between gap-3 border p-2 rounded">
                <div className="flex items-center gap-2">
                  <div className="text-sm">
                    <div className="line-clamp-1 font-medium">{file.name}</div>
                    <div className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</div>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveFile(file)} // Panggil handleRemoveFile saat tombol di klik
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-2 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-muted-foreground/25">
              <Upload className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="flex flex-col space-y-1 text-center">
              <span className="text-sm font-medium">Drag and drop files here or click to browse</span>
              <span className="text-xs text-muted-foreground">PDF (Max {maxSize / 1024 / 1024}MB)</span>
            </div>
          </div>
        )}

        {typeof progress === "number" && progress > 0 && progress < 100 && (
          <div className="absolute bottom-1 left-1 right-1">
            <Progress value={progress} className="h-1" />
          </div>
        )}
      </div>

      {errorMessage && <p className="text-sm font-medium text-destructive">{errorMessage}</p>}
    </div>
  );
}

