import { t } from "elysia";

export const CreateClassDto = t.Object({
  name: t.String({ 
    minLength: 1, 
    maxLength: 50, 
    error: "Nama kelas wajib diisi dan maksimal 50 karakter" 
  }),
  academicYearId: t.Numeric({ 
    error: "Academic Year ID harus berupa angka" 
  }),
  homeroomTeacherId: t.Optional(t.Nullable(t.Numeric({ 
    error: "Homeroom Teacher ID harus berupa angka" 
  }))),
  gradeLevel: t.Union([
    t.Literal("7"), t.Literal("8"), t.Literal("9"), 
    t.Literal("10"), t.Literal("11"), t.Literal("12")
  ], { 
    error: "Grade Level harus bernilai antara 7 sampai 12" 
  }),
  status: t.Optional(t.Union([t.Literal("Aktif"), t.Literal("Nonaktif")], { 
    error: "Status harus bernilai Aktif atau Nonaktif" 
  })),
});

export const UpdateClassDto = t.Partial(CreateClassDto);
