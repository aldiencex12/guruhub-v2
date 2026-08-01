import { Elysia, t } from "elysia";
import { SubjectsController } from "../controller/subjectsController";
import { CreateSubjectDto, UpdateSubjectDto } from "../dto/subjectsDto";
import { authMiddleware, requireRoles } from "../../../middleware/auth";
import { tenantMiddleware } from "../../../middleware/tenant";

const controller = new SubjectsController();

export const subjectsRoutes = new Elysia({ prefix: "/subjects" })
  .use(tenantMiddleware)
  .use(authMiddleware)

  // 1. GET /subjects (Semua user terautentikasi di tenant tersebut boleh membaca)
  .get("/", controller.getAll)

  // 2. GET /subjects/:id
  .get("/:id", controller.getById)

  // Rute Modifikasi yang membutuhkan role SchoolAdmin, Principal, atau SuperAdmin
  .group("", (app) =>
    app
      .guard({
        beforeHandle: requireRoles(["SuperAdmin", "SchoolAdmin", "Principal"])
      })
      // 3. POST /subjects
      .post("/", controller.create, {
        body: CreateSubjectDto
      })
      // 4. PUT /subjects/:id
      .put("/:id", controller.update, {
        body: UpdateSubjectDto
      })
      // 5. DELETE /subjects/:id
      .delete("/:id", controller.delete)
      // 6. POST /subjects/bulk-delete
      .post("/bulk-delete", controller.deleteBulk, {
        body: t.Object({
          ids: t.Array(t.Number())
        })
      })
  );
