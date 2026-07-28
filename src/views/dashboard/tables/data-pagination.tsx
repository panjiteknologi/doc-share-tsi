import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

interface DataPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Total number of items across all pages, if known. */
  totalItems?: number;
  /** Number of items per page, required alongside totalItems to show the item range. */
  pageSize?: number;
}

export function DataPagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
}: DataPaginationProps) {
  if (totalPages <= 1 && !totalItems) return null;

  const rangeStart =
    totalItems && pageSize ? (currentPage - 1) * pageSize + 1 : undefined;
  const rangeEnd =
    totalItems && pageSize
      ? Math.min(currentPage * pageSize, totalItems)
      : undefined;

  return (
    <div className="flex items-center justify-between px-2 mt-4">
      <div className="text-sm text-muted-foreground">
        {rangeStart !== undefined && rangeEnd !== undefined ? (
          <>
            Showing {rangeStart}-{rangeEnd} of {totalItems} · Page{" "}
            {currentPage} of {totalPages}
          </>
        ) : (
          <>
            Page {currentPage} of {totalPages}
          </>
        )}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="h-8 w-8"
          >
            <ChevronsLeft className="h-4 w-4" />
            <span className="sr-only">First page</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous page</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next page</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="h-8 w-8"
          >
            <ChevronsRight className="h-4 w-4" />
            <span className="sr-only">Last page</span>
          </Button>
        </div>
      )}
    </div>
  );
}
