import { Elysia } from "elysia";
import { ClassMembersController } from "../controller/classMembersController";
import { CreateClassMemberDto, UpdateClassMemberDto, PromoteStudentsDto } from "../dto/classMembersDto";
import { authMiddleware, requireRoles } from "../../../middleware/auth";
import { tenantMiddleware } from "../../../middleware/tenant";

const controller = new ClassMembersController();

export const classMembersRoutes = new Elysia({ prefix: "/class-members" })
  .use(tenantMiddleware)
  .use(authMiddleware)
  
  // Rute Read-only (SuperAdmin, SchoolAdmin, Principal, Teacher, HomeroomTeacher)
  .group("", (app) =>
    app
      .guard({
        beforeHandle: requireRoles(["SuperAdmin", "SchoolAdmin", "Principal", "Teacher", "HomeroomTeacher"])
      })
      // 1. GET /class-members
      .get("/", controller.getAll)
      
      // 2. GET /class-members/:id
      .get("/:id", controller.getById)
  )
  
  // Rute Modifikasi (SuperAdmin, SchoolAdmin, Principal)
  .group("", (app) =>
    app
      .guard({
        beforeHandle: requireRoles(["SuperAdmin", "SchoolAdmin", "Principal"])
      })
      // 3. POST /class-members
      .post("/", controller.create, {
        body: CreateClassMemberDto
      })
      // 4. PUT /class-members/:id
      .put("/:id", controller.update, {
        body: UpdateClassMemberDto
      })
      // 5. DELETE /class-members/:id
      .delete("/:id", controller.delete)
      // 6. POST /class-members/promote
      .post("/promote", controller.promote, {
        body: PromoteStudentsDto
      })
  );
