import { Elysia } from "elysia";
import { AssessmentCategoriesController } from "../controller/assessmentCategoriesController";
import { CreateAssessmentCategoryDto, UpdateAssessmentCategoryDto } from "../dto/assessmentCategoriesDto";
import { authMiddleware, requireRoles } from "../../../middleware/auth";
import { tenantMiddleware } from "../../../middleware/tenant";

const controller = new AssessmentCategoriesController();

export const assessmentCategoriesRoutes = new Elysia({ prefix: "/assessment-categories" })
  .use(tenantMiddleware)
  .use(authMiddleware)

  // Rute Read (SuperAdmin, SchoolAdmin, Principal, Teacher, HomeroomTeacher)
  .group("", (app) =>
    app
      .guard({
        beforeHandle: requireRoles(["SuperAdmin", "SchoolAdmin", "Principal", "Teacher", "HomeroomTeacher"]),
      })
      .get("/", controller.getAll)
      .get("/:id", controller.getById)
  )

  // Rute Write (SuperAdmin, SchoolAdmin, Principal, Teacher, HomeroomTeacher)
  .group("", (app) =>
    app
      .guard({
        beforeHandle: requireRoles(["SuperAdmin", "SchoolAdmin", "Principal", "Teacher", "HomeroomTeacher"]),
      })
      .post("/", controller.create, {
        body: CreateAssessmentCategoryDto,
      })
      .put("/:id", controller.update, {
        body: UpdateAssessmentCategoryDto,
      })
      .delete("/:id", controller.delete)
  );
