import { Elysia, t } from "elysia";
import { UsersController } from "../controller/usersController";
import { CreateUserDto, UpdateUserDto, ResetPasswordDto } from "../dto/usersDto";
import { authMiddleware, requireRoles } from "../../../middleware/auth";
import { tenantMiddleware } from "../../../middleware/tenant";

const controller = new UsersController();

export const usersRoutes = new Elysia({ prefix: "/users" })
  .use(tenantMiddleware)
  .use(authMiddleware)
  .model({
    UserResponse: t.Object({
      success: t.Boolean(),
      message: t.String(),
      data: t.Object({
        id: t.Number(),
        schoolId: t.Number(),
        email: t.String(),
        role: t.String(),
        status: t.String(),
        createdAt: t.Any(),
        updatedAt: t.Any()
      })
    }),
    UsersListResponse: t.Object({
      success: t.Boolean(),
      message: t.String(),
      data: t.Array(t.Object({
        id: t.Number(),
        schoolId: t.Number(),
        email: t.String(),
        role: t.String(),
        status: t.String(),
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
    GenericResponse: t.Object({
      success: t.Boolean(),
      message: t.String()
    })
  })
  
  // Modul Users hanya boleh diakses SuperAdmin dan SchoolAdmin
  .group("", (app) =>
    app
      .guard({
        beforeHandle: requireRoles(["SuperAdmin", "SchoolAdmin"])
      })
      .get("/", controller.getAll, {
        query: t.Object({
          page: t.Optional(t.Numeric({ default: 1 })),
          limit: t.Optional(t.Numeric({ default: 10 })),
          search: t.Optional(t.String()),
          role: t.Optional(t.String()),
          status: t.Optional(t.String())
        }),
        response: {
          200: "UsersListResponse"
        }
      })
      .get("/:id", controller.getById, {
        response: {
          200: "UserResponse"
        }
      })
      .post("/", controller.create, {
        body: CreateUserDto,
        response: {
          200: "UserResponse"
        }
      })
      .put("/:id", controller.update, {
        body: UpdateUserDto,
        response: {
          200: "UserResponse"
        }
      })
      .put("/:id/password", controller.resetPassword, {
        body: ResetPasswordDto,
        response: {
          200: "GenericResponse"
        }
      })
      .post("/generate-bulk", controller.generateBulk)
      .delete("/delete-bulk", controller.deleteBulk)
      .delete("/:id", controller.delete)
  );
