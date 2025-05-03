"use client";

import * as React from "react";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";
import { Upload, File, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface FileUploadProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  onChange: (file: File | null) => void;
  value?: File | null;
  accept?: Record<string, string[]>;
  maxSize?: number;
  maxFiles?: number;
  disabled?: boolean;
  progress?: number | null;
}

export function FileUpload({
  onChange,
  value,
  accept,
  maxSize = 5242880, // 5MB
  maxFiles = 1,
  disabled = false,
  progress,
  className,
  ...props
}: FileUploadProps) {
  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop: (acceptedFiles) => {
        if (acceptedFiles?.length) {
          onChange(acceptedFiles[0]);
        }
      },
      accept,
      maxSize,
      maxFiles,
      multiple: false,
      disabled,
    });

  const fileRejectionError = fileRejections[0]?.errors[0];

  const getErrorMessage = () => {
    if (!fileRejectionError) return null;

    if (fileRejectionError.code === "file-too-large") {
      return `File is too large. Max size is ${maxSize / 1024 / 1024}MB`;
    }

    if (fileRejectionError.code === "file-invalid-type") {
      return "File type not supported";
    }

    return fileRejectionError.message;
  };

  const errorMessage = getErrorMessage();

  return (
    <div className="grid gap-2">
      <div
        {...getRootProps()}
        className={cn(
          "group relative flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-muted-foreground/25 px-5 py-4 text-center transition hover:bg-accent/25",
          isDragActive && "border-muted-foreground/50 bg-accent/50",
          errorMessage && "border-destructive/50",
          disabled && "cursor-not-allowed opacity-60",
          className
        )}
        {...props}
      >
        <input {...getInputProps()} />

        {value ? (
          <div className="flex w-full flex-row items-center justify-center gap-3">
            <File className="h-8 w-8 text-muted-foreground" />
            <div className="flex flex-1 flex-col items-start text-sm">
              <span className="line-clamp-1 font-medium">{value.name}</span>
              <span className="text-xs text-muted-foreground">
                {value.size ? (value.size / 1024).toFixed(2) + " KB" : ""}
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Remove file</span>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-2 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-muted-foreground/25">
              <Upload className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="flex flex-col space-y-1 text-center">
              <span className="text-sm font-medium">
                Drag and drop file here or click to browse
              </span>
              <span className="text-xs text-muted-foreground">
                PDF or DOC (Max {maxSize / 1024 / 1024}
                MB)
              </span>
            </div>
          </div>
        )}

        {/* Add progress bar when uploading */}
        {typeof progress === "number" && progress > 0 && progress < 100 && (
          <div className="absolute bottom-1 left-1 right-1">
            <Progress value={progress} className="h-1" />
          </div>
        )}
      </div>

      {errorMessage && (
        <p className="text-sm font-medium text-destructive">{errorMessage}</p>
      )}
    </div>
  );
}
