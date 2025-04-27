import useSWR from "swr";
import axios from "axios";
import { toast } from "sonner";
import { Folder } from "@/generated/prisma";

// Axios-based fetcher for SWR
const fetcher = async (url: string) => {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      // Extract the error message from the response if available
      const errorMessage = error.response.data?.error || error.message;
      throw new Error(errorMessage || "Failed to fetch folders");
    }
    // For non-Axios errors, just throw the original error
    throw error;
  }
};

export function useFolders(userId: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<Folder[]>(
    userId ? `/api/folders?userId=${userId}` : null,
    fetcher,
    {
      onError: (err) => {
        toast.error(err.message);
      },
      revalidateOnFocus: false,
    }
  );

  return {
    folders: data || [],
    isLoading,
    error,
    mutate,
  };
}
