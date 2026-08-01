import { t } from "elysia";

export const CreateAttendanceDto = t.Object({
  scheduleId: t.Numeric({ 
    error: "Schedule ID harus berupa angka" 
  }),
  attendanceDate: t.String({
    pattern: "^\\d{4}-\\d{2}-\\d{2}$",
    error: "attendanceDate wajib diisi dalam format YYYY-MM-DD"
  }),
  notes: t.Optional(t.String()),
  details: t.Array(
    t.Object({
      studentId: t.Numeric({
        error: "Student ID harus berupa angka"
      }),
      status: t.Union([
        t.Literal("PRESENT"),
        t.Literal("SICK"),
        t.Literal("PERMISSION"),
        t.Literal("ABSENT")
      ], {
        error: "Status kehadiran harus bernilai PRESENT, SICK, PERMISSION, atau ABSENT"
      }),
      notes: t.Optional(t.String()),
    }),
    { error: "Details absensi harus berupa list data kehadiran siswa" }
  ),
});

export const UpdateAttendanceDto = t.Object({
  notes: t.Optional(t.String()),
  details: t.Optional(
    t.Array(
      t.Object({
        studentId: t.Numeric({
          error: "Student ID harus berupa angka"
        }),
        status: t.Union([
          t.Literal("PRESENT"),
          t.Literal("SICK"),
          t.Literal("PERMISSION"),
          t.Literal("ABSENT")
        ], {
          error: "Status kehadiran harus bernilai PRESENT, SICK, PERMISSION, atau ABSENT"
        }),
        notes: t.Optional(t.String()),
      })
    )
  ),
});

export const CreateClassDailyAttendanceDto = t.Object({
  classId: t.Numeric({ 
    error: "Class ID harus berupa angka" 
  }),
  attendanceDate: t.String({
    pattern: "^\\d{4}-\\d{2}-\\d{2}$",
    error: "attendanceDate wajib diisi dalam format YYYY-MM-DD"
  }),
  notes: t.Optional(t.String()),
  details: t.Array(
    t.Object({
      studentId: t.Numeric({
        error: "Student ID harus berupa angka"
      }),
      status: t.Union([
        t.Literal("PRESENT"),
        t.Literal("SICK"),
        t.Literal("PERMISSION"),
        t.Literal("ABSENT")
      ], {
        error: "Status kehadiran harus bernilai PRESENT, SICK, PERMISSION, atau ABSENT"
      }),
      notes: t.Optional(t.String()),
    }),
    { error: "Details absensi harus berupa list data kehadiran siswa" }
  ),
});
