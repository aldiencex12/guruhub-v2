import { api } from "./api";
import type { Student, ApiResponse } from "@/types";

export const studentsService = {
  getAll: async (params?: { page?: number; limit?: number; search?: string; status?: string }): Promise<Student[]> => {
    let path = "/students/";
    const query = new URLSearchParams();
    if (params?.page) query.append("page", String(params.page));
    if (params?.limit) query.append("limit", String(params.limit));
    if (params?.search) query.append("search", params.search);
    if (params?.status) query.append("status", params.status);
    const queryString = query.toString();
    if (queryString) path += `?${queryString}`;
    const res: ApiResponse<Student[]> = await api.get(path);
    return res.data;
  },

  getById: async (id: number): Promise<Student> => {
    const res: ApiResponse<Student> = await api.get(`/students/${id}`);
    return res.data;
  },

  create: async (data: Omit<Student, "id" | "status" | "createdAt">): Promise<Student> => {
    const res: ApiResponse<Student> = await api.post("/students/", data);
    return res.data;
  },

  update: async (id: number, data: Partial<Student>): Promise<Student> => {
    const res: ApiResponse<Student> = await api.put(`/students/${id}`, data);
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/students/${id}`);
  },

  deleteBulk: async (ids: number[]): Promise<void> => {
    await api.post("/students/bulk-delete", { ids });
  },
};
