import { useState } from "react";
import axios from "axios";

interface ChunkedUploadOptions {
  chunkSize?: number; // Size of each chunk in bytes
  onProgress?: (progress: number) => void;
  onSuccess?: (url: string, document: any) => void;
  onError?: (error: any) => void;
}

export function useChunkedUpload(options: ChunkedUploadOptions = {}) {
  const {
    chunkSize = 5 * 1024 * 1024, // 5MB chunks by default
    onProgress,
    onSuccess,
    onError,
  } = options;

  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadFile = async (file: File, folderId: string) => {
    setIsUploading(true);
    setProgress(0);

    try {
      const totalChunks = Math.ceil(file.size / chunkSize);
      let fileKey: string | null = null;
      let sessionId: string | null = null;

      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * chunkSize;
        const end = Math.min(file.size, start + chunkSize);
        const chunk = file.slice(start, end);

        // Create FormData for this chunk
        const formData = new FormData();
        formData.append("file", chunk);
        formData.append("folderId", folderId);
        formData.append("chunkIndex", chunkIndex.toString());
        formData.append("totalChunks", totalChunks.toString());
        formData.append("fileName", file.name);
        formData.append("fileType", file.type);

        // Add fileKey and sessionId for all chunks after the first
        if (fileKey && sessionId) {
          formData.append("fileKey", fileKey);
          formData.append("sessionId", sessionId);
        }

        // Upload this chunk
        const response = await axios.post("/api/chunked-upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        // Save fileKey and sessionId from the first chunk response
        if (chunkIndex === 0) {
          fileKey = response.data.fileKey;
          sessionId = response.data.sessionId;
        }

        // Calculate and report progress
        const currentProgress = Math.round(
          ((chunkIndex + 1) / totalChunks) * 100
        );
        setProgress(currentProgress);
        if (onProgress) onProgress(currentProgress);

        // If this is the last chunk and upload is complete
        if (response.data.isComplete) {
          if (onSuccess) onSuccess(response.data.url, response.data.document);
          return response.data;
        }
      }

      throw new Error("Upload did not complete successfully");
    } catch (error) {
      console.error("Chunked upload error:", error);
      if (onError) onError(error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadFile,
    isUploading,
    progress,
  };
}
