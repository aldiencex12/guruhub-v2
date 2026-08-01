import { Elysia, t } from "elysia";
import { SchedulesController } from "../controller/schedulesController";
import { CreateScheduleDto, UpdateScheduleDto } from "../dto/schedulesDto";
import { authMiddleware, requireRoles } from "../../../middleware/auth";
import { tenantMiddleware } from "../../../middleware/tenant";

const controller = new SchedulesController();

export const schedulesRoutes = new Elysia({ prefix: "/schedules" })
  .use(tenantMiddleware)
  .use(authMiddleware)

  // 1. GET /schedules (Semua user terautentikasi di tenant tersebut boleh membaca)
  .get("/", controller.getAll)

  // 2. GET /schedules/:id
  .get("/:id", controller.getById)

  // Rute Modifikasi yang membutuhkan role SchoolAdmin, Principal, atau SuperAdmin
  .group("", (app) =>
    app
      .guard({
        beforeHandle: requireRoles(["SuperAdmin", "SchoolAdmin", "Principal"])
      })
      // 3. POST /schedules
      .post("/", controller.create, {
        body: CreateScheduleDto
      })
      // 4. PUT /schedules/:id
      .put("/:id", controller.update, {
        body: UpdateScheduleDto
      })
      // 5. DELETE /schedules/:id
      .delete("/:id", controller.delete)
      // 6. POST /schedules/bulk-delete
      .post("/bulk-delete", controller.bulkDelete, {
        body: t.Object({
          ids: t.Array(t.Numeric())
        })
      })
      // 7. DELETE /schedules/delete-all
      .delete("/delete-all", controller.deleteAll)
  );
