import { api } from "./api";

export interface User {
  id: number;
  schoolId: number;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

export interface UsersResponse {
  success: boolean;
  message: string;
  data: User[];
  pagination: PaginationMeta;
}

export const usersService = {
  getAll: async (params?: { page?: number; limit?: number; search?: string; role?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append("page", params.page.toString());
    if (params?.limit) query.append("limit", params.limit.toString());
    if (params?.search) query.append("search", params.search);
    if (params?.role) query.append("role", params.role);
    if (params?.status) query.append("status", params.status);

    const queryString = query.toString();
    const url = `/users${queryString ? `?${queryString}` : ""}`;
    const response = await api.get(url);
    return response as UsersResponse;
  },

  getById: async (id: number) => {
    const response = await api.get(`/users/${id}`);
    return response;
  },

  create: async (data: { email: string; password?: string; role: string; status?: string }) => {
    const response = await api.post("/users", data);
    return response;
  },

  update: async (id: number, data: Partial<{ email: string; role: string; status: string }>) => {
    const response = await api.put(`/users/${id}`, data);
    return response;
  },

  resetPassword: async (id: number, data: { newPassword: string }) => {
    const response = await api.put(`/users/${id}/password`, data);
    return response;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/users/${id}`);
    return response;
  },

  generateBulk: async () => {
    const response = await api.post("/users/generate-bulk");
    return response;
  },

  deleteBulk: async () => {
    const response = await api.delete("/users/delete-bulk");
    return response;
  },
};
