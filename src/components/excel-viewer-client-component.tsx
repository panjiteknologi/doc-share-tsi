"use client";

import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface XLSXViewerProps {
  url: string;
}

const XLSXViewer: React.FC<XLSXViewerProps> = ({ url }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [sheetIndex, setSheetIndex] = useState(0);
  const [sheetData, setSheetData] = useState<any[][]>([]);
  const [scale, setScale] = useState(1);

  // Load file XLSX dari URL
  const loadXLSXFromUrl = async (fileUrl: string) => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(fileUrl);
      if (!res.ok) throw new Error("Failed to fetch XLSX file");
      const arrayBuffer = await res.arrayBuffer();

      const wb = XLSX.read(arrayBuffer, { type: "array" });
      setWorkbook(wb);
      setSheetIndex(0);

      const firstSheetName = wb.SheetNames[0];
      const ws = wb.Sheets[firstSheetName];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
      setSheetData(data);

      setLoading(false);
    } catch (err: any) {
      setError(err.message || "Error loading XLSX file");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (url) loadXLSXFromUrl(url);
  }, [url]);

  const goToPreviousSheet = () => {
    if (!workbook) return;
    setSheetIndex((prev) => {
      const newIndex = Math.max(prev - 1, 0);
      loadSheetData(newIndex);
      return newIndex;
    });
  };

  const goToNextSheet = () => {
    if (!workbook) return;
    setSheetIndex((prev) => {
      const newIndex = Math.min(prev + 1, workbook.SheetNames.length - 1);
      loadSheetData(newIndex);
      return newIndex;
    });
  };

  const loadSheetData = (index: number) => {
    if (!workbook) return;
    const sheetName = workbook.SheetNames[index];
    const ws = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
    setSheetData(data);
  };

  const zoomIn = () => setScale((s) => Math.min(s + 0.2, 3));
  const zoomOut = () => setScale((s) => Math.max(s - 0.2, 0.5));
  const resetZoom = () => setScale(1);

  if (error)
    return (
      <div className="flex h-full w-full items-center justify-center p-6">
        <div className="flex flex-col items-center gap-2 text-center max-w-md">
          <div className="bg-destructive/10 p-3 rounded-full">
            <span className="h-6 w-6 text-destructive">⚠️</span>
          </div>
          <h3 className="text-lg font-semibold">Error Loading XLSX</h3>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );

  return (
    <div className="w-full h-full flex flex-col">
      {/* Navigation controls */}
      <div className="flex items-center justify-center gap-2 p-2 border-b bg-muted/30">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={goToPreviousSheet}
          disabled={loading || !workbook || sheetIndex <= 0}
          title="Previous Sheet"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <span className="text-sm mx-2">
          {loading ? "-" : workbook?.SheetNames[sheetIndex] || "No Sheet"}
        </span>

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={goToNextSheet}
          disabled={
            loading || !workbook || sheetIndex >= (workbook?.SheetNames.length || 0) - 1
          }
          title="Next Sheet"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-1 ml-4">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={zoomOut}
            disabled={loading || scale <= 0.5}
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={resetZoom}
            disabled={loading}
            title="Reset Zoom"
          >
            {Math.round(scale * 100)}%
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={zoomIn}
            disabled={loading || scale >= 3}
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* XLSX viewer (table) */}
      <div
        className="flex-1 overflow-auto p-4"
        style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}
      >
        {loading ? (
          <Skeleton className="h-[600px] w-full" />
        ) : (
          <table className="border-collapse border border-gray-300 w-full table-auto">
            <tbody>
              {sheetData.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td
                      key={j}
                      className="border border-gray-300 px-2 py-1 whitespace-pre-wrap max-w-xs"
                    >
                      {cell !== undefined && cell !== null ? cell.toString() : ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default XLSXViewer;
