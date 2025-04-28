"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DocumentViewer } from "@/components/document-viewer";
import { Download, X, Maximize2, Minimize2 } from "lucide-react";
import { useState } from "react";
import { getDocumentDownloadUrl } from "@/action/s3-document";
import { toast } from "sonner";
import { Document } from "@/hooks/use-documents";

interface DialogViewDocumentProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document | null;
}

export default function DialogViewDocument({
  isOpen,
  onClose,
  document,
}: DialogViewDocumentProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!document) return;

    try {
      setIsDownloading(true);
      toast.info(`Preparing download...`);

      const response = await getDocumentDownloadUrl(document.id);

      if (response.success && response.url) {
        // Create an anchor element to trigger the download
        const link = window.document.createElement("a");
        link.href = response.url;
        link.download = response.fileName || document.fileName;
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);

        toast.success(`Download started for ${document.fileName}`);
      } else {
        toast.error(
          response.error || "Failed to generate download URL for document"
        );
      }
    } catch (error) {
      console.error("Error downloading document:", error);
      toast.error(
        "An error occurred while preparing the document for download"
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (!document) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={`${
          isFullscreen ? "fixed max-w-none rounded-none border-0" : "max-w-4xl"
        } p-0 overflow-hidden transition-all duration-200`}
      >
        <div className="flex h-full flex-col">
          <DialogHeader className="flex flex-row items-center border-b px-4 py-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex-shrink-0">
                {document.fileType === "PDF" ? (
                  <svg
                    className="h-6 w-6 text-red-500"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                ) : document.fileType === "Word" ? (
                  <svg
                    className="h-6 w-6 text-blue-500"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                ) : document.fileType === "Excel" ? (
                  <svg
                    className="h-6 w-6 text-green-500"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                ) : document.fileType === "Image" ? (
                  <svg
                    className="h-6 w-6 text-purple-500"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                ) : (
                  <svg
                    className="h-6 w-6 text-gray-500"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                )}
              </div>
              <DialogTitle className="text-lg truncate">
                {document.fileName}
              </DialogTitle>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={handleDownload}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <svg
                    className="h-4 w-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
                  <Download className="h-4 w-4" />
                )}
                <span className="sr-only">Download</span>
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={toggleFullscreen}
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
                <span className="sr-only">
                  {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                </span>
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
          </DialogHeader>

          <div
            className={`flex-1 overflow-hidden ${
              isFullscreen ? "h-[calc(100vh-56px)]" : "h-[70vh]"
            }`}
          >
            <DocumentViewer documentId={document.id} className="h-full" />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
