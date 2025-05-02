import useSWR from "swr";
import axios from "axios";
import { Project } from "@prisma/client";

const fetcher = async (url: string) => {
  const response = await axios.get(url);
  return response.data;
};

export interface Client {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  hashedPassword: string;
  role: {
    name: string;
    code: string;
  };
  projects: Project;
}

export interface PaginatedResponse<T> {
  clients: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ClientsResponse extends PaginatedResponse<Client> {}

export function useClients({
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

  const { data, error, isLoading, mutate } = useSWR<ClientsResponse>(
    `/api/clients?${searchParams.toString()}`,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  return {
    clients: data?.clients || [],
    pagination: data?.pagination,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useClient(id: string) {
  const { data, error, isLoading, mutate } = useSWR<{ client: Client }>(
    id ? `/api/clients/${id}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  return {
    client: data?.client,
    isLoading,
    isError: error,
    mutate,
  };
}
