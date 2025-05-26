"use client";

import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import { Shield } from "lucide-react";
import { getDocumentViewUrl } from "@/action/s3-document";
import { Document } from "@/hooks/use-documents";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import dynamic from "next/dynamic";

// Dynamically import EnhancedPdfViewer with no SSR
const EnhancedPdfViewer = dynamic(() => import("./enhanced-pdf-viewer"), {
  ssr: false,
  loading: () => <LoadingState />,
});

const EnhancedExcelViewer = dynamic(() => import("./enhanced-excel-viewer"), {
  ssr: false,
  loading: () => <LoadingState />,
});

function LoadingState() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent border-primary"></div>
        <p className="text-sm text-muted-foreground">Loading viewer...</p>
      </div>
    </div>
  );
}

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

  // Reset expanded state when drawer closes
  useEffect(() => {
    if (!isOpen) {
      setIsExpanded(false);
      setShowProtectionAlert(false);
    }
  }, [isOpen]);

  // useEffect(() => {
  //   const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  //   if (!isMobile) return; // hanya untuk mobile

  //   const overlayId = "mobile-screenshot-block-overlay";

  //   // Buat overlay div
  //   const overlay = window.document.createElement("div");
  //   overlay.id = overlayId;
  //   overlay.style.position = "fixed";
  //   overlay.style.top = "0";
  //   overlay.style.left = "0";
  //   overlay.style.width = "100vw";
  //   overlay.style.height = "100vh";
  //   overlay.style.backgroundColor = "black";
  //   overlay.style.zIndex = "999999";
  //   overlay.style.display = "none"; // awalnya sembunyi

  //   window.document.body.appendChild(overlay);

  //   const showOverlay = () => {
  //     overlay.style.display = "block";
  //   };

  //   const hideOverlay = () => {
  //     overlay.style.display = "none";
  //   };

  //   const blockActions = (e: KeyboardEvent) => {
  //     // Blok shortcut keyboard, misal PrintScreen (kalau keyboard ada)
  //     if (
  //       e.key.toLowerCase() === "printscreen" ||
  //       e.key === "F12" ||
  //       (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "s")
  //     ) {
  //       showOverlay();
  //       setTimeout(() => {
  //         hideOverlay();
  //       }, 1500);
  //     }
  //   };

  //   const onVisibilityChange = () => {
  //     if (window.document.hidden) {
  //       showOverlay();
  //       setTimeout(() => {
  //         hideOverlay();
  //       }, 1500);
  //     }
  //   };

  //   const onBlur = () => {
  //     showOverlay();
  //     setTimeout(() => {
  //       hideOverlay();
  //     }, 1500);
  //   };

  //   window.addEventListener("keydown", blockActions);
  //   window.document.addEventListener("visibilitychange", onVisibilityChange);
  //   window.addEventListener("blur", onBlur);

  //   // Cegah seleksi dan klik kanan (opsional)
  //   const preventDefault = (e: Event) => e.preventDefault();
  //   window.document.addEventListener("contextmenu", preventDefault);
  //   window.document.addEventListener("selectstart", preventDefault);

  //   return () => {
  //     window.removeEventListener("keydown", blockActions);
  //     window.document.removeEventListener("visibilitychange", onVisibilityChange);
  //     window.removeEventListener("blur", onBlur);
  //     window.document.removeEventListener("contextmenu", preventDefault);
  //     window.document.removeEventListener("selectstart", preventDefault);

  //     const el = window.document.getElementById(overlayId);
  //     if (el) el.remove();
  //   };
  // })
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 913;

  if (isMobile) {
    window.document.body.innerHTML = `
      <div style="
        position: fixed;
        top: 0; left: 0;
        width: 100vw; height: 100vh;
        background: #000;
        color: #fff;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 1.5rem;
        text-align: center;
        padding: 20px;
        z-index: 9999;
      ">
        Mohon maaf, demi menjaga keamanan dokumen, akses melalui perangkat mobile tidak dapat kami fasilitasi. Terima kasih atas pengertiannya!
      </div>
    `;
  }

  
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const keyCombo = `${e.metaKey ? 'Meta+' : ''}${e.ctrlKey ? 'Ctrl+' : ''}${e.shiftKey ? 'Shift+' : ''}${e.altKey ? 'Alt+' : ''}${e.key}`;
  
      const key = e.key.toLowerCase();
  
      const blockedCombos = [
        "Meta+Shift+S",
        "Ctrl+Shift+S",
        "PrintScreen",
        "Meta",
        "Meta+S",
        "Ctrl+S",
        "Ctrl+Alt+S",
        "Ctrl+Shift+I",
        "F12",
        "Meta+Option+I",
      ];
  
      const isPrintScreen = key === "printscreen" || e.keyCode === 44 || e.code.toLowerCase().includes("printscreen");
  
      if (blockedCombos.includes(keyCombo) || isPrintScreen) {
        window.document.body.innerHTML = "<div style='position:fixed;top:0;left:0;width:100vw;height:100vh;background:black;z-index:9999;'></div>";
        setTimeout(() => location.reload(), 1000);
      }
    };
  
    window.document.addEventListener("keydown", handler);
    window.document.addEventListener("keyup", handler);
  
    return () => {
      window.document.removeEventListener("keydown", handler);
      window.document.removeEventListener("keyup", handler);
    };
  }, []);
  

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

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const overlay = overlayRef.current;

    if (!overlay) return;

    const onWheel = (e: WheelEvent) => {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          { type: "scroll", deltaY: e.deltaY },
          "*"
        );
      }
    };

    overlay.addEventListener("wheel", onWheel);
    return () => {
      overlay.removeEventListener("wheel", onWheel);
    };
  }, []);

  useEffect(() => {
    const handleGlobalContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      setShowProtectionAlert(true);
      setTimeout(() => setShowProtectionAlert(false), 3000);
    };
  
    window.addEventListener("contextmenu", handleGlobalContextMenu);
  
    return () => {
      window.removeEventListener("contextmenu", handleGlobalContextMenu);
    };
  }, []);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowProtectionAlert(true);

    // Hide the alert after 3 seconds
    setTimeout(() => {
      setShowProtectionAlert(false);
    }, 3000);

    return false;
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
      className="absolute left-0 top-1/2 -translate-y-1/2 h-24 w-5 flex items-center justify-center bg-muted/50 hover:bg-muted rounded-r-md cursor-col-resize group z-10"
      onClick={toggleExpand}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="group-hover:text-primary transition-colors"
      >
        {isExpanded ? (
          <polyline points="13 17 18 12 13 7" />
        ) : (
          <polyline points="11 17 6 12 11 7" />
        )}
      </svg>
    </div>
  );

  const mapFileType = (type: string): string => {
    switch (type.toUpperCase()) {
      case "WORD":
        return "DOCX";
      case "EXCEL":
        return "XLSX";
      default:
        return type.toUpperCase();
    }
  };
  
  const normalizedType = mapFileType(document?.fileType || "");

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
            className="flex-1 overflow-hidden"
            onContextMenu={handleContextMenu}
          >
            {loading ? (
              <LoadingState />
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
            ) : documentUrl && normalizedType === "PDF" ? (
            <EnhancedPdfViewer url={documentUrl} />
            ) : documentUrl && ["DOC", "DOCX"].includes(normalizedType) ? (
                <div
                  onContextMenu={(e) => e.preventDefault()}
                  style={{ width: "100%", height: "100%", userSelect: "none" }}
                >
                  <iframe
                    src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(documentUrl)}`}
                    style={{ width: "100%", height: "100%" }}
                    frameBorder="0"
                    title="Word Document Viewer"
                  />
                </div>
            ) : documentUrl && ["XLS", "XLSX"].includes(normalizedType) ? (
              <div
                onContextMenu={handleContextMenu} // cegah klik kanan
                style={{ width: "100%", height: "100%", userSelect: "none" }} // cegah seleksi teks dari luar komponen
              >
                <EnhancedExcelViewer url={documentUrl} />
              </div>
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
                    This file type cannot be previewed directly in the browser.
                    <br />
                    You can download the file instead.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
