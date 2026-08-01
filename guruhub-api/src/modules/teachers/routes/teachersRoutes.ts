import { Elysia, t } from "elysia";
import { TeachersController } from "../controller/teachersController";
import { CreateTeacherDto, UpdateTeacherDto } from "../dto/teachersDto";
import { authMiddleware, requireRoles } from "../../../middleware/auth";
import { tenantMiddleware } from "../../../middleware/tenant";

const controller = new TeachersController();

export const teachersRoutes = new Elysia({ prefix: "/teachers" })
  .use(tenantMiddleware)
  .use(authMiddleware)
  .model({
    TeacherModel: t.Object({
      id: t.Number(),
      schoolId: t.Number(),
      userId: t.Union([t.Number(), t.Null()]),
      nip: t.Union([t.String(), t.Null()]),
      name: t.String(),
      phone: t.Union([t.String(), t.Null()]),
      gender: t.Union([t.Literal("L"), t.Literal("P")]),
      createdAt: t.Any(),
      updatedAt: t.Any()
    }),
    TeacherResponse: t.Object({
      success: t.Boolean(),
      message: t.String(),
      data: t.Object({
        id: t.Number(),
        schoolId: t.Number(),
        userId: t.Union([t.Number(), t.Null()]),
        nip: t.Union([t.String(), t.Null()]),
        name: t.String(),
        phone: t.Union([t.String(), t.Null()]),
        gender: t.Union([t.Literal("L"), t.Literal("P")]),
        createdAt: t.Any(),
        updatedAt: t.Any()
      })
    }),
    TeachersListResponse: t.Object({
      success: t.Boolean(),
      message: t.String(),
      data: t.Array(t.Object({
        id: t.Number(),
        schoolId: t.Number(),
        userId: t.Union([t.Number(), t.Null()]),
        nip: t.Union([t.String(), t.Null()]),
        name: t.String(),
        phone: t.Union([t.String(), t.Null()]),
        gender: t.Union([t.Literal("L"), t.Literal("P")]),
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
    DeleteTeacherResponse: t.Object({
      success: t.Boolean(),
      message: t.String()
    })
  })
  
  // 1. GET /teachers (Semua user terautentikasi di tenant tersebut boleh membaca)
  .get("/", controller.getAll, {
    query: t.Object({
      page: t.Optional(t.Numeric({ default: 1 })),
      limit: t.Optional(t.Numeric({ default: 10 })),
      search: t.Optional(t.String()),
      status: t.Optional(t.String())
    }),
    response: {
      200: "TeachersListResponse"
    }
  })
  
  // 2. GET /teachers/:id
  .get("/:id", controller.getById, {
    response: {
      200: "TeacherResponse"
    }
  })
  
  // Rute Modifikasi yang membutuhkan role SchoolAdmin, Principal, atau SuperAdmin
  .group("", (app) =>
    app
      .guard({
        beforeHandle: requireRoles(["SuperAdmin", "SchoolAdmin", "Principal"])
      })
      // 3. POST /teachers
      .post("/", controller.create, {
        body: CreateTeacherDto,
        response: {
          200: "TeacherResponse"
        }
      })
      // 4. PUT /teachers/:id
      .put("/:id", controller.update, {
        body: UpdateTeacherDto,
        response: {
          200: "TeacherResponse"
        }
      })
      // 5. DELETE /teachers/:id
      .delete("/:id", controller.delete, {
        response: {
          200: "DeleteTeacherResponse"
        }
      })
  );
