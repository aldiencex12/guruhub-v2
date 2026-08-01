import { Elysia, t } from "elysia";
import { StudentsController } from "../controller/studentsController";
import { CreateStudentDto, UpdateStudentDto } from "../dto/studentsDto";
import { authMiddleware, requireRoles } from "../../../middleware/auth";
import { tenantMiddleware } from "../../../middleware/tenant";

const controller = new StudentsController();

export const studentsRoutes = new Elysia({ prefix: "/students" })
  .use(tenantMiddleware)
  .use(authMiddleware)
  .model({
    StudentModel: t.Object({
      id: t.Number(),
      schoolId: t.Number(),
      userId: t.Union([t.Number(), t.Null()]),
      nisn: t.String(),
      name: t.String(),
      gender: t.Union([t.Literal("L"), t.Literal("P")]),
      religion: t.Union([
        t.Literal("Islam"), t.Literal("Kristen"), t.Literal("Katolik"), 
        t.Literal("Hindu"), t.Literal("Buddha"), t.Literal("Khonghucu")
      ]),
      status: t.Union([t.Literal("Aktif"), t.Literal("Nonaktif")]),
      createdAt: t.Any(),
      updatedAt: t.Any()
    }),
    StudentResponse: t.Object({
      success: t.Boolean(),
      message: t.String(),
      data: t.Object({
        id: t.Number(),
        schoolId: t.Number(),
        userId: t.Union([t.Number(), t.Null()]),
        nisn: t.String(),
        name: t.String(),
        gender: t.Union([t.Literal("L"), t.Literal("P")]),
        religion: t.Union([
          t.Literal("Islam"), t.Literal("Kristen"), t.Literal("Katolik"), 
          t.Literal("Hindu"), t.Literal("Buddha"), t.Literal("Khonghucu")
        ]),
        status: t.Union([t.Literal("Aktif"), t.Literal("Nonaktif")]),
        createdAt: t.Any(),
        updatedAt: t.Any()
      })
    }),
    StudentsListResponse: t.Object({
      success: t.Boolean(),
      message: t.String(),
      data: t.Array(t.Object({
        id: t.Number(),
        schoolId: t.Number(),
        userId: t.Union([t.Number(), t.Null()]),
        nisn: t.String(),
        name: t.String(),
        gender: t.Union([t.Literal("L"), t.Literal("P")]),
        religion: t.Union([
          t.Literal("Islam"), t.Literal("Kristen"), t.Literal("Katolik"), 
          t.Literal("Hindu"), t.Literal("Buddha"), t.Literal("Khonghucu")
        ]),
        status: t.Union([t.Literal("Aktif"), t.Literal("Nonaktif")]),
        createdAt: t.Any(),
        updatedAt: t.Any()
      })),
      pagination: t.Object({
        totalItems: t.Number(),
        totalPages: t.Number(),
        currentPage: t.Number(),
        limit: t.Number()
      })
    }),
    DeleteStudentResponse: t.Object({
      success: t.Boolean(),
      message: t.String()
    })
  })
  
  // 1. GET /students (Semua user terautentikasi di tenant tersebut boleh membaca)
  .get("/", controller.getAll, {
    query: t.Object({
      page: t.Optional(t.Numeric({ default: 1 })),
      limit: t.Optional(t.Numeric({ default: 10 })),
      search: t.Optional(t.String()),
      status: t.Optional(t.Union([t.Literal("Aktif"), t.Literal("Nonaktif")])),
      classId: t.Optional(t.Numeric())
    }),
    response: {
      200: "StudentsListResponse"
    }
  })
  
  // 2. GET /students/:id
  .get("/:id", controller.getById, {
    response: {
      200: "StudentResponse"
    }
  })
  
  // Rute Modifikasi yang membutuhkan role SchoolAdmin, Principal, atau SuperAdmin
  .group("", (app) =>
    app
      .guard({
        beforeHandle: requireRoles(["SuperAdmin", "SchoolAdmin", "Principal"])
      })
      // 3. POST /students
      .post("/", controller.create, {
        body: CreateStudentDto,
        response: {
          200: "StudentResponse"
        }
      })
      // 4. PUT /students/:id
      .put("/:id", controller.update, {
        body: UpdateStudentDto,
        response: {
          200: "StudentResponse"
        }
      })
      // 5. DELETE /students/:id
      .delete("/:id", controller.delete, {
        response: {
          200: "DeleteStudentResponse"
        }
      })
      // 6. POST /students/bulk-delete
      .post("/bulk-delete", controller.deleteBulk, {
        body: t.Object({
          ids: t.Array(t.Number())
        }),
        response: {
          200: t.Object({
            success: t.Boolean(),
            message: t.String()
          })
        }
      })
  );
