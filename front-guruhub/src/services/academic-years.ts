import { api } from "./api";

export interface AcademicYear {
  id: number;
  schoolId: number;
  year: string;
  semester: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const academicYearsService = {
  getAll: async () => {
    const response: any = await api.get("/academic-years");
    return response.data;
  },

  getById: async (id: number) => {
    const response: any = await api.get(`/academic-years/${id}`);
    return response.data;
  },

  create: async (data: { year: string; semester: string; isActive?: boolean }) => {
    const response: any = await api.post("/academic-years", data);
    return response.data;
  },

  update: async (id: number, data: Partial<{ year: string; semester: string; isActive: boolean }>) => {
    const response: any = await api.put(`/academic-years/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response: any = await api.delete(`/academic-years/${id}`);
    return response.data;
  },
};
