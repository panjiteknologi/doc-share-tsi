import useSWR from "swr";
import axios from "axios";
import { toast } from "sonner";
import { User } from "@prisma/client";

// Type definitions for folder data
export interface Document {
  id: string;
  url: string;
  fileName: string;
  fileType: string;
  fileExtension: string;
  fileSize: string;
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
  owner: string;
  userId: string;
  hasProject: boolean;
  documents: Document[];
  user: User;
  createdBy: User;
}

export interface DetailedFolder
  extends Omit<Folder, "documentCount" | "createdByName" | "owner"> {
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

// Hook for fetching a paginated list of folders
export function useFolders({
  page = 1,
  limit = 10,
  search = "",
  sortBy = "createdAt",
  sortOrder = "desc",
}: {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
} = {}) {
  // Add default empty object
  const searchParams = new URLSearchParams();
  searchParams.append("page", page.toString());
  searchParams.append("limit", limit.toString());
  if (search) searchParams.append("search", search);
  searchParams.append("sortBy", sortBy);
  searchParams.append("sortOrder", sortOrder);

  const { data, error, isLoading, mutate } = useSWR<FoldersResponse>(
    `/api/folders?${searchParams.toString()}`,
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

// Hook for fetching a single folder by ID
export function useFolder(folderId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<{ folder: DetailedFolder }>(
    folderId ? `/api/folders/${folderId}` : null,
    fetcher,
    {
      onError: (err) => {
        toast.error(err.message || "Failed to fetch folder details");
      },
      revalidateOnFocus: false,
      revalidateOnMount: true,     // ⬅️ Tambah ini
      revalidateIfStale: true,     // ⬅️ Tambah ini
    }
  );

  return {
    folder: data?.folder,
    isLoading,
    error,
    mutate,
  };
}

// Hook for fetching all non-root folders
export function useNonRootFolders(userRole: string) {
  const shouldFetch = userRole === "surveyor";

  const { data, error, isLoading, mutate } = useSWR<{ folders: Folder[] }>(
    shouldFetch ? "/api/folders/non-root" : null,
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
    isLoading,
    error,
    mutate,
  };
}

// Hook for fetching non-root folders by user ID
export function useNonRootFoldersByUserId(userId: string) {
  const { data, error, isLoading, mutate } = useSWR<{ folders: Folder[] }>(
    userId ? `/api/folders/non-root/${userId}` : null,
    fetcher,
    {
      onError: (err) => {
        toast.error(err.message || "Failed to fetch user folders");
      },
      revalidateOnFocus: false,
    }
  );

  return {
    folders: data?.folders || [],
    isLoading,
    error,
    mutate,
  };
}

// Hook for fetching the root folder
export function useRootFolder() {
  const { data, error, isLoading, mutate } = useSWR<{ folder: Folder | null }>(
    "/api/folders/root",
    fetcher,
    {
      onError: (err) => {
        toast.error(err.message || "Failed to fetch root folder");
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

// Hook for fetching the current user's root folder
export function useCurrentUserRootFolder() {
  const { data, error, isLoading, mutate } = useSWR<{ folder: Folder | null }>(
    "/api/folders/root/user",
    fetcher,
    {
      onError: (err) => {
        toast.error(err.message || "Failed to fetch your root folder");
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

// Hook for fetching folders by their IDs
export function useFoldersProjects(userRole: string) {
  const shouldFetch = userRole === "auditor";

  const { data, error, isLoading, mutate } = useSWR<{ folders: Folder[] }>(
    shouldFetch ? "/api/folders/projects" : null,
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
    isLoading: shouldFetch ? isLoading : false,
    error,
    mutate,
  };
}

// Hook for fetching all folders by user ID
export function useFoldersByUserId(userId: string, userRole: string) {
  const shouldFetch = userId && userRole === "client";

  const { data, error, isLoading, mutate } = useSWR<{ folders: Folder[] }>(
    shouldFetch ? `/api/folders/user/${userId}` : null,
    fetcher,
    {
      onError: (err) => {
        toast.error(err.message || "Failed to fetch user folders");
      },
      revalidateOnFocus: false,
    }
  );

  return {
    folders: data?.folders || [],
    isLoading,
    error,
    mutate,
  };
}

// Hook for fetching all folders by Creator/Admin ID
export function useFoldersByCreator(creatorId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<{ folders: Folder[] }>(
    creatorId ? `/api/folders/created/${creatorId}` : null,
    fetcher,
    {
      onError: (err) => {
        toast.error(err.message || "Failed to fetch created folders");
      },
      revalidateOnFocus: false,
    }
  );

  return {
    folders: data?.folders || [],
    isLoading,
    error,
    mutate,
  };
}
