import { t } from "elysia";

export const CreateSubjectDto = t.Object({
  name: t.String({ 
    minLength: 1, 
    maxLength: 100, 
    error: "Nama mata pelajaran wajib diisi dan maksimal 100 karakter" 
  }),
  code: t.String({ 
    minLength: 1, 
    maxLength: 20, 
    error: "Kode mata pelajaran wajib diisi dan maksimal 20 karakter" 
  }),
  gradeLevel: t.Union([
    t.Literal("7"), t.Literal("8"), t.Literal("9"), 
    t.Literal("10"), t.Literal("11"), t.Literal("12")
  ], { 
    error: "Grade Level harus bernilai antara 7 sampai 12" 
  }),
  religionGroup: t.Optional(t.Union([
    t.Literal("Islam"), t.Literal("Kristen"), t.Literal("Katolik"),
    t.Literal("Hindu"), t.Literal("Buddha"), t.Literal("Khonghucu"),
    t.Literal("UMUM")
  ], { 
    error: "Religion group harus bernilai Islam, Kristen, Katolik, Hindu, Buddha, Khonghucu, atau UMUM" 
  })),
  description: t.Optional(t.String({ 
    maxLength: 255, 
    error: "Deskripsi mata pelajaran maksimal 255 karakter" 
  })),
  status: t.Optional(t.Union([t.Literal("Aktif"), t.Literal("Nonaktif")], { 
    error: "Status harus bernilai Aktif atau Nonaktif" 
  })),
});

export const UpdateSubjectDto = t.Partial(CreateSubjectDto);
