"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { getDocumentViewUrl } from "@/action/s3-document";

interface DocumentViewerProps {
  documentId: string;
  className?: string;
}

export function DocumentViewer({ documentId, className }: DocumentViewerProps) {
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDocumentUrl() {
      try {
        setLoading(true);
        setError(null);

        const response = await getDocumentViewUrl(documentId);

        if (response.success && response.url) {
          setDocumentUrl(response.url);
        } else {
          setError(response.error || "Failed to load document");
        }
      } catch (err) {
        console.error("Error fetching document URL:", err);
        setError("An unexpected error occurred while loading the document");
      } finally {
        setLoading(false);
      }
    }

    if (documentId) {
      fetchDocumentUrl();
    }
  }, [documentId]);

  if (loading) {
    return (
      <div
        className={`flex h-full w-full items-center justify-center ${className}`}
      >
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`flex h-full w-full items-center justify-center ${className}`}
      >
        <div className="flex flex-col items-center gap-2 text-center max-w-md">
          <div className="bg-destructive/10 p-3 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-destructive"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold">Error Loading Document</h3>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!documentUrl) {
    return (
      <div
        className={`flex h-full w-full items-center justify-center ${className}`}
      >
        <p className="text-sm text-muted-foreground">No document available</p>
      </div>
    );
  }

  // For PDF files
  if (documentUrl.includes(".pdf")) {
    return (
      <iframe
        src={documentUrl}
        className={`h-full w-full inset-0 border-0 ${className}`}
        style={{ height: "80vh", width: "100%" }}
        allowFullScreen
        allow="fullscreen"
        title="Document viewer"
      />
    );
  }

  // For images
  if (/\.(jpe?g|png|gif|svg)$/i.test(documentUrl)) {
    return (
      <div
        className={`flex h-full w-full items-center justify-center overflow-auto ${className}`}
      >
        <img
          src={documentUrl}
          alt="Document preview"
          className="max-w-full max-h-full object-contain"
        />
      </div>
    );
  }

  // For other file types, provide a download link
  return (
    <div
      className={`flex h-full w-full items-center justify-center ${className}`}
    >
      <div className="flex flex-col items-center gap-4 p-8 text-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="text-lg font-semibold">Preview Not Available</h3>
        <p className="text-sm text-muted-foreground">
          This file type cannot be previewed directly in the browser.
        </p>
        <a
          href={documentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-primary text-primary-foreground mt-2 inline-flex h-9 items-center justify-center rounded-md px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          Download File
        </a>
      </div>
    </div>
  );
}
