import { useState } from "react";
import axios from "axios";

interface UploadOptions {
  onSuccess?: (url: string, docId: string) => void;
  onError?: (error: any) => void;
  onProgress?: (progress: number) => void;
}

export function useDirectUpload(options: UploadOptions = {}) {
  const { onSuccess, onError, onProgress } = options;
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadFile = async (file: File, folderId: string) => {
    setIsUploading(true);
    setProgress(0);

    try {
      // Step 1: Get a presigned URL
      const presignedResponse = await axios.post("/api/presigned-upload", {
        fileName: file.name,
        fileType: file.type,
        folderId,
      });

      const { presignedUrl, url } = presignedResponse.data;

      console.log("presignedUrl : ", presignedUrl);

      // Step 2: Upload file directly to S3
      await axios.put(presignedUrl, file, {
        headers: {
          "Content-Type": file.type,
        },
        onUploadProgress: (progressEvent) => {
          const progress = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;

          setProgress(progress);
          if (onProgress) onProgress(progress);
        },
      });

      // Step 3: Create document record
      const docResponse = await axios.post("/api/documents/create", {
        url,
        folderId,
      });

      const { document } = docResponse.data;

      if (onSuccess) onSuccess(url, document.id);
      return { url, document };
    } catch (error) {
      console.error("Upload error:", error);
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
