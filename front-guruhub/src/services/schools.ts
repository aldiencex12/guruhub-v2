import { api } from "./api";

export interface SchoolSettings {
  id: number;
  npsn: string;
  name: string;
  foundationName?: string;
  regionalName?: string;
  accreditation?: string;
  level?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
  kopSuratUrl?: string;
  principalName?: string;
  principalNip?: string;
}

export const schoolsService = {
  getCurrent: async (): Promise<SchoolSettings> => {
    const res = await api.get<any>("/schools/current");
    return res.data || res;
  },

  updateCurrent: async (data: Partial<SchoolSettings>): Promise<SchoolSettings> => {
    const res = await api.put<any>("/schools/current", data);
    return res.data || res;
  },

  uploadLogo: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post<any>("/schools/upload-logo", formData);
    return res.data || res;
  },

  uploadKop: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post<any>("/schools/upload-kop", formData);
    return res.data || res;
  },
};
