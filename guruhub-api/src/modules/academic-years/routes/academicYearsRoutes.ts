import { Elysia, t } from "elysia";
import { AcademicYearsController } from "../controller/academicYearsController";
import { CreateAcademicYearDto, UpdateAcademicYearDto } from "../dto/academicYearsDto";
import { authMiddleware, requireRoles } from "../../../middleware/auth";
import { tenantMiddleware } from "../../../middleware/tenant";

const controller = new AcademicYearsController();

export const academicYearsRoutes = new Elysia({ prefix: "/academic-years" })
  .use(tenantMiddleware)
  .use(authMiddleware)
  .model({
    AcademicYearResponse: t.Object({
      success: t.Boolean(),
      message: t.String(),
      data: t.Object({
        id: t.Number(),
        schoolId: t.Number(),
        year: t.String(),
        semester: t.String(),
        isActive: t.Boolean(),
        createdAt: t.Any(),
        updatedAt: t.Any()
      })
    }),
    AcademicYearsListResponse: t.Object({
      success: t.Boolean(),
      message: t.String(),
      data: t.Array(t.Object({
        id: t.Number(),
        schoolId: t.Number(),
        year: t.String(),
        semester: t.String(),
        isActive: t.Boolean(),
        createdAt: t.Any(),
        updatedAt: t.Any()
      }))
    }),
    DeleteAcademicYearResponse: t.Object({
      success: t.Boolean(),
      message: t.String()
    })
  })
  
  // Semua role bisa membaca tahun ajaran
  .get("/", controller.getAll, {
    response: {
      200: "AcademicYearsListResponse"
    }
  })
  .get("/:id", controller.getById, {
    response: {
      200: "AcademicYearResponse"
    }
  })

  // Modifikasi hanya SuperAdmin, SchoolAdmin, Principal
  .group("", (app) =>
    app
      .guard({
        beforeHandle: requireRoles(["SuperAdmin", "SchoolAdmin", "Principal"])
      })
      .post("/", controller.create, {
        body: CreateAcademicYearDto,
        response: {
          200: "AcademicYearResponse"
        }
      })
      .put("/:id", controller.update, {
        body: UpdateAcademicYearDto,
        response: {
          200: "AcademicYearResponse"
        }
      })
      .delete("/:id", controller.delete, {
        response: {
          200: "DeleteAcademicYearResponse"
        }
      })
  );
