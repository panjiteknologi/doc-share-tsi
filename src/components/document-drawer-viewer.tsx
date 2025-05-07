"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Shield,
} from "lucide-react";
import { getDocumentViewUrl } from "@/action/s3-document";
import { Document } from "@/hooks/use-documents";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "./ui/alert";

interface DocumentDrawerViewerProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document | null;
}

export default function DocumentDrawerViewer({
  isOpen,
  onClose,
  document,
}: DocumentDrawerViewerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showProtectionAlert, setShowProtectionAlert] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Reset expanded state when drawer closes
  useEffect(() => {
    if (!isOpen) {
      setIsExpanded(false);
      setShowProtectionAlert(false);
    }
  }, [isOpen]);

  // Fetch document URL when document changes
  useEffect(() => {
    async function fetchDocumentUrl() {
      if (!document || !isOpen) return;

      try {
        setLoading(true);
        setError(null);

        const response = await getDocumentViewUrl(document.id);

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

    fetchDocumentUrl();
  }, [document, isOpen]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowProtectionAlert(true);

    // Hide the alert after 3 seconds
    setTimeout(() => {
      setShowProtectionAlert(false);
    }, 3000);

    return false;
  };

  const handleIframeLoad = () => {
    try {
      const iframe = iframeRef.current;
      if (iframe && iframe.contentWindow) {
        // Try to add event listener to iframe content
        iframe.contentWindow.document.addEventListener("contextmenu", (e) => {
          e.preventDefault();
          return false;
        });

        // Add style to prevent selection inside iframe
        const style = iframe.contentWindow.document.createElement("style");
        style.textContent = `
          * {
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
            -webkit-touch-callout: none;
          }
          ::selection { background: transparent; }
        `;
        iframe.contentWindow.document.head.appendChild(style);
      }
    } catch (e) {
      // Silent catch - may fail due to cross-origin restrictions
      console.log(
        "Could not modify iframe content due to security restrictions"
      );
    }
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // Get document icon based on file type
  const getDocumentIcon = () => {
    if (!document) return null;

    switch (document.fileType) {
      case "PDF":
        return (
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
        );
      case "Word":
        return (
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
        );
      default:
        return (
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
        );
    }
  };

  // Handle resize button on left side
  const ResizeHandle = () => (
    <div
      className="absolute left-0 top-1/2 -translate-y-1/2 h-24 w-5 flex items-center justify-center bg-muted/50 hover:bg-muted rounded-r-md cursor-col-resize group"
      onClick={toggleExpand}
    >
      {isExpanded ? (
        <ChevronRight className="h-4 w-4 group-hover:text-primary transition-colors" />
      ) : (
        <ChevronLeft className="h-4 w-4 group-hover:text-primary transition-colors" />
      )}
    </div>
  );

  if (!document) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className={cn(
          "p-0 overflow-hidden",
          isExpanded ? "sm:max-w-[85%] w-[85%]" : "sm:max-w-[50%] w-[80%]"
        )}
        style={{
          transition: "max-width 0.3s ease-in-out, width 0.3s ease-in-out",
        }}
      >
        <ResizeHandle />

        <div className="flex h-full flex-col">
          <SheetHeader className="flex flex-row items-center border-b px-4 py-3 bg-background">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex-shrink-0">{getDocumentIcon()}</div>
              <SheetTitle className="text-lg truncate">
                {document.fileName}
              </SheetTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={toggleExpand}
              >
                {isExpanded ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
                <span className="sr-only">
                  {isExpanded ? "Reduce Size" : "Expand Size"}
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
          </SheetHeader>

          {/* Protection alert message */}
          {showProtectionAlert && (
            <Alert className="absolute top-16 left-1/2 transform -translate-x-1/2 z-50 bg-red-600 text-white animate-in fade-in slide-in-from-top duration-300">
              <Shield className="h-4 w-4 text-white" />
              <AlertDescription className="text-white">
                This document is protected. Downloading is not allowed.
              </AlertDescription>
            </Alert>
          )}

          <div
            className="flex-1 overflow-auto"
            onContextMenu={handleContextMenu}
          >
            {loading ? (
              <div className="flex h-full w-full items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent border-primary"></div>
                  <p className="text-sm text-muted-foreground">
                    Loading document...
                  </p>
                </div>
              </div>
            ) : error ? (
              <div className="flex h-full w-full items-center justify-center p-6">
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
                  <h3 className="text-lg font-semibold">
                    Error Loading Document
                  </h3>
                  <p className="text-sm text-muted-foreground">{error}</p>
                </div>
              </div>
            ) : (
              <div
                className="h-full w-full overflow-auto bg-muted/20"
                style={{ pointerEvents: "none" }}
                onContextMenu={handleContextMenu}
              >
                {documentUrl && document.fileType === "PDF" ? (
                  <iframe
                    ref={iframeRef}
                    onLoad={handleIframeLoad}
                    src={`${documentUrl}#view=FitH&toolbar=0&navpanes=0`}
                    className="h-full w-full border-0"
                    title={document.fileName || "Document"}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setShowProtectionAlert(true);
                      setTimeout(() => setShowProtectionAlert(false), 3000);
                      return false;
                    }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center p-6">
                    <div className="flex flex-col items-center gap-4">
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
                      <h3 className="text-lg font-semibold">
                        Preview Not Available
                      </h3>
                      <p className="text-sm text-muted-foreground text-center">
                        This file type cannot be previewed directly in the
                        browser.
                        <br />
                        You can download the file instead.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
