import { t } from "elysia";

export const CreateTeacherDto = t.Object({
  nip: t.Optional(t.String({ 
    pattern: "^[0-9]{18}$", 
    error: "NIP harus berupa 18 digit angka" 
  })),
  name: t.String({ 
    minLength: 1, 
    maxLength: 255, 
    error: "Nama guru wajib diisi dan maksimal 255 karakter" 
  }),
  phone: t.Optional(t.String({ 
    maxLength: 20, 
    error: "Nomor telepon maksimal 20 karakter" 
  })),
  gender: t.Union([t.Literal("L"), t.Literal("P")], { 
    error: "Gender harus bernilai L (Laki-laki) atau P (Perempuan)" 
  }),
  userId: t.Optional(t.Numeric({ 
    error: "User ID harus berupa angka" 
  })),
});

export const UpdateTeacherDto = t.Partial(CreateTeacherDto);
