"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { Shield } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Dynamic import tanpa SSR
const XLSXViewer = dynamic(() => import("./excel-viewer-client-component"), {
  ssr: false,
});

interface EnhancedXLSXViewerProps {
  url: string;
}

const EnhancedExcelViewer: React.FC<EnhancedXLSXViewerProps> = ({ url }) => {
  const [showProtectionAlert, setShowProtectionAlert] = useState(false);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowProtectionAlert(true);

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
      {showProtectionAlert && (
        <Alert className="absolute top-16 left-1/2 transform -translate-x-1/2 z-50 bg-red-600 text-white animate-in fade-in slide-in-from-top duration-300">
          <Shield className="h-4 w-4 text-white" />
          <AlertDescription className="text-white">
            This document is protected. Downloading or copying is not allowed.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex-1 overflow-auto flex justify-center">
        <XLSXViewer url={url} />
      </div>
    </div>
  );
};

export default EnhancedExcelViewer;
