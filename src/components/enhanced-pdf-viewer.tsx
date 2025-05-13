"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { Shield } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Dynamic import with no SSR
const PDFViewer = dynamic(() => import("./pdf-viewer-client-component"), {
  ssr: false,
});

interface EnhancedPdfViewerProps {
  url: string;
}

const EnhancedPdfViewer: React.FC<EnhancedPdfViewerProps> = ({ url }) => {
  const [showProtectionAlert, setShowProtectionAlert] = useState(false);

  // Prevent right-click and show security alert
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowProtectionAlert(true);

    // Hide the alert after 3 seconds
    setTimeout(() => {
      setShowProtectionAlert(false);
    }, 3000);

    return false;
  };

  return (
    <div
      className="flex flex-col h-full w-full bg-muted/20 overflow-hidden"
      onContextMenu={handleContextMenu}
    >
      {/* Protection alert message */}
      {showProtectionAlert && (
        <Alert className="absolute top-16 left-1/2 transform -translate-x-1/2 z-50 bg-red-600 text-white animate-in fade-in slide-in-from-top duration-300">
          <Shield className="h-4 w-4 text-white" />
          <AlertDescription className="text-white">
            This document is protected. Downloading is not allowed.
          </AlertDescription>
        </Alert>
      )}

      {/* PDF viewer content */}
      <div className="flex-1 overflow-auto flex justify-center">
        <PDFViewer url={url} />
      </div>
    </div>
  );
};

export default EnhancedPdfViewer;
