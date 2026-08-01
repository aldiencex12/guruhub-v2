import { Elysia, t } from "elysia";
import { ClassesController } from "../controller/classesController";
import { CreateClassDto, UpdateClassDto } from "../dto/classesDto";
import { authMiddleware, requireRoles } from "../../../middleware/auth";
import { tenantMiddleware } from "../../../middleware/tenant";

const controller = new ClassesController();

export const classesRoutes = new Elysia({ prefix: "/classes" })
  .use(tenantMiddleware)
  .use(authMiddleware)
  .model({
    ClassModel: t.Object({
      id: t.Number(),
      schoolId: t.Number(),
      academicYearId: t.Number(),
      homeroomTeacherId: t.Union([t.Number(), t.Null()]),
      name: t.String(),
      gradeLevel: t.Union([t.Literal("7"), t.Literal("8"), t.Literal("9"), t.Literal("10"), t.Literal("11"), t.Literal("12")]),
      status: t.Union([t.Literal("Aktif"), t.Literal("Nonaktif")]),
      createdAt: t.Any(),
      updatedAt: t.Any(),
      deletedAt: t.Any()
    }),
    ClassResponse: t.Object({
      success: t.Boolean(),
      message: t.String(),
      data: t.Object({
        id: t.Number(),
        schoolId: t.Number(),
        academicYearId: t.Number(),
        homeroomTeacherId: t.Union([t.Number(), t.Null()]),
        name: t.String(),
        gradeLevel: t.Union([t.Literal("7"), t.Literal("8"), t.Literal("9"), t.Literal("10"), t.Literal("11"), t.Literal("12")]),
        status: t.Union([t.Literal("Aktif"), t.Literal("Nonaktif")]),
        createdAt: t.Any(),
        updatedAt: t.Any(),
        deletedAt: t.Any()
      })
    }),
    ClassesListResponse: t.Object({
      success: t.Boolean(),
      message: t.String(),
      data: t.Array(t.Object({
        id: t.Number(),
        schoolId: t.Number(),
        academicYearId: t.Number(),
        homeroomTeacherId: t.Union([t.Number(), t.Null()]),
        name: t.String(),
        gradeLevel: t.Union([t.Literal("7"), t.Literal("8"), t.Literal("9"), t.Literal("10"), t.Literal("11"), t.Literal("12")]),
        status: t.Union([t.Literal("Aktif"), t.Literal("Nonaktif")]),
        createdAt: t.Any(),
        updatedAt: t.Any(),
        deletedAt: t.Any()
      })),
      pagination: t.Object({
        totalItems: t.Number(),
        totalPages: t.Number(),
        currentPage: t.Number(),
        limit: t.Number()
      })
    }),
    DeleteClassResponse: t.Object({
      success: t.Boolean(),
      message: t.String()
    })
  })

  // 1. GET /classes (Semua user terautentikasi di tenant tersebut boleh membaca)
  .get("/", controller.getAll, {
    query: t.Object({
      page: t.Optional(t.Numeric({ default: 1 })),
      limit: t.Optional(t.Numeric({ default: 10 })),
      search: t.Optional(t.String()),
      status: t.Optional(t.Union([t.Literal("Aktif"), t.Literal("Nonaktif")]))
    }),
    response: {
      200: "ClassesListResponse"
    }
  })

  // 2. GET /classes/:id
  .get("/:id", controller.getById, {
    response: {
      200: "ClassResponse"
    }
  })

  // Rute Modifikasi yang membutuhkan role SchoolAdmin, Principal, atau SuperAdmin
  .group("", (app) =>
    app
      .guard({
        beforeHandle: requireRoles(["SuperAdmin", "SchoolAdmin", "Principal"])
      })
      // 3. POST /classes
      .post("/", controller.create, {
        body: CreateClassDto,
        response: {
          200: "ClassResponse"
        }
      })
      // 4. PUT /classes/:id
      .put("/:id", controller.update, {
        body: UpdateClassDto,
        response: {
          200: "ClassResponse"
        }
      })
      // 5. DELETE /classes/:id
      .delete("/:id", controller.delete, {
        response: {
          200: "DeleteClassResponse"
        }
      })
      // 6. POST /classes/bulk-delete
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
