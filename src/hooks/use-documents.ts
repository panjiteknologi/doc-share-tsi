import useSWR from "swr";
import axios from "axios";
import { toast } from "sonner";

// Type definitions for document data
export interface Document {
  id: string;
  url: string;
  fileName: string;
  fileType: string;
  fileExtension: string;
  fileSize: string;
  createdAt: string;
  folder: {
    id: string;
    name: string;
  };
  uploadedBy: string;
  uploadedById: string;
  uploadedByEmail: string;
}

export interface DetailedDocument extends Document {
  isOwner: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface PaginatedResponse<T> {
  documents: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface DocumentsResponse extends PaginatedResponse<Document> {}

// Axios-based fetcher for SWR
const fetcher = async (url: string) => {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      // Extract the error message from the response if available
      const errorMessage = error.response.data?.error || error.message;
      throw new Error(errorMessage || "Failed to fetch data");
    }
    // For non-Axios errors, just throw the original error
    throw error;
  }
};

// Hook for fetching a paginated list of documents
export function useDocuments({
  userId,
  folderId,
  page = 1,
  limit = 10,
  search = "",
  sortBy = "createdAt",
  sortOrder = "desc",
}: {
  userId?: string;
  folderId?: string;
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) {
  const searchParams = new URLSearchParams();
  if (userId) searchParams.append("userId", userId);
  if (folderId) searchParams.append("folderId", folderId);
  searchParams.append("page", page.toString());
  searchParams.append("limit", limit.toString());
  if (search) searchParams.append("search", search);
  searchParams.append("sortBy", sortBy);
  searchParams.append("sortOrder", sortOrder);

  const { data, error, isLoading, mutate } = useSWR<DocumentsResponse>(
    `/api/documents?${searchParams.toString()}`,
    fetcher,
    {
      onError: (err) => {
        toast.error(err.message || "Failed to fetch documents");
      },
      revalidateOnFocus: false,
    }
  );

  return {
    documents: data?.documents || [],
    pagination: data?.pagination,
    isLoading,
    error,
    mutate,
  };
}

// Hook for fetching a single document by ID
export function useDocument(documentId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<{
    document: DetailedDocument;
  }>(documentId ? `/api/documents/${documentId}` : null, fetcher, {
    onError: (err) => {
      toast.error(err.message || "Failed to fetch document details");
    },
    revalidateOnFocus: false,
  });

  return {
    document: data?.document,
    isLoading,
    error,
    mutate,
  };
}
