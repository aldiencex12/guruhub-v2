import { Elysia, t } from "elysia";
import { AttendanceController } from "../controller/attendanceController";
import { CreateAttendanceDto, UpdateAttendanceDto, CreateClassDailyAttendanceDto } from "../dto/attendanceDto";
import { authMiddleware, requireRoles } from "../../../middleware/auth";
import { tenantMiddleware } from "../../../middleware/tenant";

const controller = new AttendanceController();

export const attendanceRoutes = new Elysia({ prefix: "/attendances" })
  .use(tenantMiddleware)
  .use(authMiddleware)
  .model({
    AttendanceModel: t.Object({
      id: t.Number(),
      schoolId: t.Number(),
      scheduleId: t.Number(),
      teacherId: t.Number(),
      attendanceDate: t.Any(),
      notes: t.Union([t.String(), t.Null()]),
      createdAt: t.Any(),
      updatedAt: t.Any()
    }),
    AttendanceDetailModel: t.Object({
      id: t.Number(),
      attendanceId: t.Number(),
      studentId: t.Number(),
      studentName: t.Optional(t.Union([t.String(), t.Null()])),
      status: t.Union([t.Literal("PRESENT"), t.Literal("SICK"), t.Literal("PERMISSION"), t.Literal("ABSENT")]),
      notes: t.Union([t.String(), t.Null()]),
      createdAt: t.Any(),
      updatedAt: t.Any()
    }),
    AttendanceResponse: t.Object({
      success: t.Boolean(),
      message: t.String(),
      data: t.Object({
        id: t.Number(),
        schoolId: t.Number(),
        scheduleId: t.Number(),
        teacherId: t.Number(),
        attendanceDate: t.Any(),
        notes: t.Union([t.String(), t.Null()]),
        createdAt: t.Any(),
        updatedAt: t.Any(),
        details: t.Array(t.Object({
          id: t.Number(),
          attendanceId: t.Number(),
          studentId: t.Number(),
          studentName: t.Optional(t.Union([t.String(), t.Null()])),
          status: t.Union([t.Literal("PRESENT"), t.Literal("SICK"), t.Literal("PERMISSION"), t.Literal("ABSENT")]),
          notes: t.Union([t.String(), t.Null()]),
          createdAt: t.Any(),
          updatedAt: t.Any()
        }))
      })
    }),
    AttendanceListResponse: t.Object({
      success: t.Boolean(),
      message: t.String(),
      data: t.Array(t.Object({
        id: t.Number(),
        schoolId: t.Number(),
        scheduleId: t.Number(),
        teacherId: t.Number(),
        attendanceDate: t.Any(),
        notes: t.Union([t.String(), t.Null()]),
        createdAt: t.Any(),
        updatedAt: t.Any()
      }))
    }),
    DeleteAttendanceResponse: t.Object({
      success: t.Boolean(),
      message: t.String()
    })
  })
  
  // Rute Pembacaan (Boleh diakses oleh SuperAdmin, SchoolAdmin, Principal, Teacher, HomeroomTeacher, BKTeacher, Counselor, Polsis)
  .group("", (app) =>
    app
      .guard({
        beforeHandle: requireRoles(["SuperAdmin", "SchoolAdmin", "Principal", "Teacher", "HomeroomTeacher", "BKTeacher", "Counselor", "Polsis"])
      })
      // 1. GET /attendances
      .get("/", controller.getAll, {
        response: {
          200: "AttendanceListResponse"
        }
      })
      // GET /attendances/recap
      .get("/recap", controller.getRecap, {
        query: t.Object({
          classId: t.Numeric({ error: "Class ID harus berupa angka" }),
          month: t.Optional(t.String()),
          semester: t.Optional(t.Numeric()),
          year: t.Optional(t.Numeric())
        })
      })
      // 2. GET /attendances/:id
      .get("/:id", controller.getById, {
        response: {
          200: "AttendanceResponse"
        }
      })
  )

  // Rute Modifikasi (Boleh diakses oleh SuperAdmin, SchoolAdmin, Principal, Teacher, BKTeacher, Counselor)
  .group("", (app) =>
    app
      .guard({
        beforeHandle: requireRoles(["SuperAdmin", "SchoolAdmin", "Principal", "Teacher", "BKTeacher", "Counselor"])
      })
      // 3. POST /attendances
      .post("/", controller.create, {
        body: CreateAttendanceDto,
        response: {
          200: "AttendanceResponse"
        }
      })
      // 3b. POST /attendances/daily (Input Presensi Harian BK per Kelas)
      .post("/daily", controller.createDaily, {
        body: CreateClassDailyAttendanceDto,
      })
      // 4. PUT /attendances/:id
      .put("/:id", controller.update, {
        body: UpdateAttendanceDto,
        response: {
          200: "AttendanceResponse"
        }
      })
  )


  // Rute Penghapusan (Hanya boleh diakses oleh SuperAdmin, SchoolAdmin, Principal)
  .group("", (app) =>
    app
      .guard({
        beforeHandle: requireRoles(["SuperAdmin", "SchoolAdmin", "Principal"])
      })
      // 5. DELETE /attendances/:id
      .delete("/:id", controller.delete, {
        response: {
          200: "DeleteAttendanceResponse"
        }
      })
  );
