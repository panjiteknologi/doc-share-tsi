import useSWR, { useSWRConfig } from "swr";
import axios from "axios";

const fetcher = async (url: string) => {
  const response = await axios.get(url);
  return response.data;
};

export interface Auditor {
  id: string;
  name: string;
  email: string;
  hashedPassword: string;
  role: {
    name: string;
    code: string;
  };
  projectCount: number;
  createdAt: string;
}

export interface DetailedAuditor extends Auditor {
  projects: Array<{
    id: string;
    folderId: string;
    folder: {
      name: string;
      startDate: string;
      endDate: string;
      parentPath: string[];
      documentCount: number;
      childrenCount: number;
      user: {
        id: string;
        name: string | null;
        email: string | null;
      };
    };
  }>;
}

export interface PaginatedResponse<T> {
  auditors: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AuditorsResponse extends PaginatedResponse<Auditor> {}

export function useAuditors({
  page = 1,
  limit = 10,
  search = "",
}: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  const searchParams = new URLSearchParams();
  searchParams.append("page", page.toString());
  searchParams.append("limit", limit.toString());
  if (search) searchParams.append("search", search);

  const { data, error, isLoading } = useSWR<AuditorsResponse>(
    `/api/auditors?${searchParams.toString()}`,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  const { mutate: globalMutate } = useSWRConfig();

  // Revalidate every /api/auditors cache entry, not just this hook's own
  // page/limit/search key, so auditor lists elsewhere (e.g. a different page
  // or search filter) update without a full page refresh.
  const mutate = () =>
    globalMutate(
      (key) => typeof key === "string" && key.startsWith("/api/auditors")
    );

  return {
    auditors: data?.auditors || [],
    pagination: data?.pagination,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useAuditor(id: string) {
  const { data, error, isLoading, mutate } = useSWR<{
    auditor: DetailedAuditor;
  }>(id ? `/api/auditors/${id}` : null, fetcher, {
    revalidateOnFocus: false,
  });

  return {
    auditor: data?.auditor,
    isLoading,
    isError: error,
    mutate,
  };
}
