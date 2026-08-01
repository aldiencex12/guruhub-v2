import { Elysia } from "elysia";
import { TeachingJournalsController } from "../controller/teachingJournalsController";
import { CreateTeachingJournalDto, UpdateTeachingJournalDto } from "../dto/teachingJournalsDto";
import { authMiddleware, requireRoles } from "../../../middleware/auth";
import { tenantMiddleware } from "../../../middleware/tenant";

const controller = new TeachingJournalsController();

export const teachingJournalsRoutes = new Elysia({ prefix: "/teaching-journals" })
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

  // Rute Create & Update (SuperAdmin, SchoolAdmin, Principal, Teacher, HomeroomTeacher)
  .group("", (app) =>
    app
      .guard({
        beforeHandle: requireRoles(["SuperAdmin", "SchoolAdmin", "Principal", "Teacher", "HomeroomTeacher"]),
      })
      .post("/", controller.create, {
        body: CreateTeachingJournalDto,
      })
      .put("/:id", controller.update, {
        body: UpdateTeachingJournalDto,
      })
  )

  // Rute Delete (SuperAdmin, SchoolAdmin, Principal, Teacher, HomeroomTeacher)
  .group("", (app) =>
    app
      .guard({
        beforeHandle: requireRoles(["SuperAdmin", "SchoolAdmin", "Principal", "Teacher", "HomeroomTeacher"]),
      })
      .delete("/:id", controller.delete)
  );
