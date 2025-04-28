import useSWR from "swr";
import axios from "axios";
import { toast } from "sonner";

// Type definitions for folder data
export interface Document {
  id: string;
  url: string;
  fileName: string;
  fileType: string;
  fileExtension: string;
  createdAt: string;
  uploadedBy: string;
  uploadedByEmail: string;
}

export interface Folder {
  id: string;
  name: string;
  isRoot: boolean;
  startDate: string;
  endDate: string;
  createdAt: string;
  documentCount: number;
  createdByName: string;
  userId: string;
  hasProject: boolean;
}

export interface DetailedFolder
  extends Omit<Folder, "documentCount" | "createdByName"> {
  documents: Document[];
  documentCount: number;
  owner: {
    id: string;
    name: string;
    email: string;
  };
  project: {
    id: string;
    auditors: Array<{
      id: string;
      name: string;
      email: string;
    }>;
  } | null;
  isOwner: boolean;
  isAuditor: boolean;
}

export interface PaginatedResponse<T> {
  folders: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface FoldersResponse extends PaginatedResponse<Folder> {}

const fetcher = async (url: string) => {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const errorMessage = error.response.data?.error || error.message;
      throw new Error(errorMessage || "Failed to fetch data");
    }
    throw error;
  }
};

export function useFolders({
  userId,
  page = 1,
  limit = 10,
  search = "",
  sortBy = "createdAt",
  sortOrder = "desc",
}: {
  userId: string | undefined;
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) {
  const searchParams = new URLSearchParams();
  if (userId) searchParams.append("userId", userId);
  searchParams.append("page", page.toString());
  searchParams.append("limit", limit.toString());
  if (search) searchParams.append("search", search);
  searchParams.append("sortBy", sortBy);
  searchParams.append("sortOrder", sortOrder);

  const { data, error, isLoading, mutate } = useSWR<FoldersResponse>(
    userId ? `/api/folders?${searchParams.toString()}` : null,
    fetcher,
    {
      onError: (err) => {
        toast.error(err.message || "Failed to fetch folders");
      },
      revalidateOnFocus: false,
    }
  );

  return {
    folders: data?.folders || [],
    pagination: data?.pagination,
    isLoading,
    error,
    mutate,
  };
}

export function useFolder(folderId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<{ folder: DetailedFolder }>(
    folderId ? `/api/folders/${folderId}` : null,
    fetcher,
    {
      onError: (err) => {
        toast.error(err.message || "Failed to fetch folder details");
      },
      revalidateOnFocus: false,
    }
  );

  return {
    folder: data?.folder,
    isLoading,
    error,
    mutate,
  };
}
