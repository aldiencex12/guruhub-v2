import { Elysia } from "elysia";
import { AssessmentsController } from "../controller/assessmentsController";
import { CreateAssessmentDto, UpdateAssessmentDto, InputScoresDto } from "../dto/assessmentsDto";
import { authMiddleware, requireRoles } from "../../../middleware/auth";
import { tenantMiddleware } from "../../../middleware/tenant";

const controller = new AssessmentsController();

export const assessmentsRoutes = new Elysia({ prefix: "/assessments" })
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

  // Rute Create, Update, & Input Scores (SuperAdmin, SchoolAdmin, Principal, Teacher)
  .group("", (app) =>
    app
      .guard({
        beforeHandle: requireRoles(["SuperAdmin", "SchoolAdmin", "Principal", "Teacher"]),
      })
      .post("/", controller.create, {
        body: CreateAssessmentDto,
      })
      .put("/:id", controller.update, {
        body: UpdateAssessmentDto,
      })
      .post("/:id/scores", controller.inputScores, {
        body: InputScoresDto,
      })
  )

  // Rute Delete (SuperAdmin, SchoolAdmin, Principal)
  .group("", (app) =>
    app
      .guard({
        beforeHandle: requireRoles(["SuperAdmin", "SchoolAdmin", "Principal"]),
      })
      .delete("/:id", controller.delete)
  );
