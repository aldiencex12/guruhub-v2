import { t } from "elysia";

const RELIGIONS = ["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Khonghucu"] as const;

export const CreateStudentDto = t.Object({
  nisn: t.String({ 
    minLength: 1,
    maxLength: 20,
    pattern: "^[0-9]{1,20}$",
    error: "NISN harus berupa angka (1-20 digit)" 
  }),
  name: t.String({ 
    minLength: 1, 
    maxLength: 255, 
    error: "Nama siswa wajib diisi dan maksimal 255 karakter" 
  }),
  gender: t.Union([t.Literal("L"), t.Literal("P")], { 
    error: "Gender harus bernilai L (Laki-laki) atau P (Perempuan)" 
  }),
  religion: t.Union(
    RELIGIONS.map(r => t.Literal(r)) as [ReturnType<typeof t.Literal>, ...ReturnType<typeof t.Literal>[]],
    { error: "Agama harus salah satu dari: Islam, Kristen, Katolik, Hindu, Buddha, Khonghucu" }
  ),
  status: t.Optional(t.Union([t.Literal("Aktif"), t.Literal("Nonaktif")], { 
    error: "Status harus bernilai Aktif atau Nonaktif" 
  })),
  userId: t.Optional(t.Numeric({ 
    error: "User ID harus berupa angka" 
  })),
});

export const UpdateStudentDto = t.Partial(CreateStudentDto);
