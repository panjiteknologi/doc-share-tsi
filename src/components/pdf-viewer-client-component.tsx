"use client";

import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { Document as PDFDocument, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

interface PDFViewerProps {
  url: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ url }) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const options = useMemo(
    () => ({
      cMapUrl: "/pdfjs-dist/web/cmaps/",
      cMapPacked: true,
      standardFontDataUrl: "/pdfjs-dist/web/standard_fonts/",
    }),
    []
  );

  // Handle document load success
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
  };

  // Handle document load error
  const onDocumentLoadError = (error: Error) => {
    setError(
      "Failed to load PDF. The document might be corrupted or inaccessible."
    );
    setLoading(false);
  };

  // Page navigation
  const goToPreviousPage = () => {
    setPageNumber((prev) => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    if (numPages) {
      setPageNumber((prev) => Math.min(prev + 1, numPages));
    }
  };

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center p-6">
        <div className="flex flex-col items-center gap-2 text-center max-w-md">
          <div className="bg-destructive/10 p-3 rounded-full">
            <span className="h-6 w-6 text-destructive">⚠️</span>
          </div>
          <h3 className="text-lg font-semibold">Error Loading Document</h3>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Navigation controls */}
      <div className="flex items-center justify-center gap-2 p-2 border-b bg-muted/30">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={goToPreviousPage}
          disabled={pageNumber <= 1 || loading}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <span className="text-sm mx-2">
          {loading ? "-" : pageNumber} / {numPages || "-"}
        </span>

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={goToNextPage}
          disabled={!numPages || pageNumber >= numPages || loading}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* PDF viewer */}
      <div
        className="flex-1 overflow-auto flex justify-center"
        style={{
          maxHeight: "calc(100% - 40px)",
          maxWidth: "100%",
        }}
      >
        <PDFDocument
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={
            <div className="flex h-full w-full items-center justify-center">
              <Skeleton className="h-[600px] w-[450px]" />
            </div>
          }
          noData={
            <div className="flex flex-col items-center justify-center p-6">
              <div className="bg-muted p-3 rounded-full mb-4">
                <span className="h-6 w-6 text-muted-foreground">📄</span>
              </div>
              <p className="text-lg font-medium">No PDF data found</p>
            </div>
          }
          options={options}
        >
          <Page
            pageNumber={pageNumber}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            scale={1.2}
            loading={<Skeleton className="h-[600px] w-[450px]" />}
          />
        </PDFDocument>
      </div>
    </div>
  );
};

export default PDFViewer;
