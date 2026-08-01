import { api } from "./api";
import type { ClassMember, ApiResponse } from "@/types";

export const classMembersService = {
  getAll: async (params: { classId: number }): Promise<ClassMember[]> => {
    let path = `/class-members/?classId=${params.classId}`;
    const res: ApiResponse<ClassMember[]> = await api.get(path);
    return res.data;
  },

  add: async (data: { classId: number; studentId: number }): Promise<ClassMember> => {
    const res: ApiResponse<ClassMember> = await api.post("/class-members/", data);
    return res.data;
  },

  remove: async (id: number): Promise<void> => {
    await api.delete(`/class-members/${id}`);
  },

  promote: async (data: { sourceClassId: number; targetClassId: number; studentIds: number[] }): Promise<any> => {
    const res: ApiResponse<any> = await api.post("/class-members/promote", data);
    return res.data;
  },
};
