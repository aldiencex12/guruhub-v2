import { t } from "elysia";

export const CreateScheduleDto = t.Object({
  classId: t.Numeric({ 
    error: "Class ID harus berupa angka" 
  }),
  subjectId: t.Numeric({ 
    error: "Subject ID harus berupa angka" 
  }),
  teacherId: t.Numeric({ 
    error: "Teacher ID harus berupa angka" 
  }),
  academicYearId: t.Numeric({ 
    error: "Academic Year ID harus berupa angka" 
  }),
  dayOfWeek: t.Union([
    t.Literal("Senin"), t.Literal("Selasa"), t.Literal("Rabu"), 
    t.Literal("Kamis"), t.Literal("Jumat"), t.Literal("Sabtu"), t.Literal("Minggu")
  ], { 
    error: "Day of week harus bernilai antara Senin sampai Minggu" 
  }),
  startTime: t.String({
    pattern: "^\\d{2}:\\d{2}(:\\d{2})?$",
    error: "startTime wajib diisi dalam format HH:MM atau HH:MM:SS"
  }),
  endTime: t.String({
    pattern: "^\\d{2}:\\d{2}(:\\d{2})?$",
    error: "endTime wajib diisi dalam format HH:MM atau HH:MM:SS"
  }),
  status: t.Optional(t.Union([t.Literal("Aktif"), t.Literal("Nonaktif")], { 
    error: "Status harus bernilai Aktif atau Nonaktif" 
  })),
});

export const UpdateScheduleDto = t.Partial(CreateScheduleDto);
