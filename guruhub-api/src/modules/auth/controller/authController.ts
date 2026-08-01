import { Elysia } from "elysia";
import { AuthService } from "../service/authService";
import { LoginDto, RefreshTokenDto, LogoutDto } from "../dto/authDto";
import { authMiddleware, requireRoles } from "../../../middleware/auth";
import { tenantMiddleware } from "../../../middleware/tenant";

const authService = new AuthService();

export const authController = new Elysia({ prefix: "/auth" })
  // 1. Login — single-tenant, tidak membutuhkan schoolId dari body
  .post("/login", async ({ body, headers, request }) => {
    const { email, password } = body;
    const ipAddress = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = headers["user-agent"] || "Unknown";
    
    return await authService.login(email, password, ipAddress, userAgent);
  }, {
    body: LoginDto
  })
  
  // 2. Refresh Token (schoolId ada di payload JWT)
  .post("/refresh", async ({ body, headers, request }) => {
    const { refreshToken } = body;
    const ipAddress = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = headers["user-agent"] || "Unknown";
    
    return await authService.refresh(refreshToken, ipAddress, userAgent);
  }, {
    body: RefreshTokenDto
  })
  
  // 3. Logout
  .post("/logout", async ({ body, request }) => {
    const { refreshToken } = body;
    const ipAddress = request.headers.get("x-forwarded-for") || "127.0.0.1";
    
    await authService.logout(refreshToken, ipAddress);
    return { message: "Logout berhasil" };
  }, {
    body: LogoutDto
  })
  
  // Grouping routes yang memerlukan Tenant & Auth Middleware
  .group("/protected", (app) => 
    app
      .use(tenantMiddleware)
      .use(authMiddleware)
      // 4. Get Profil Me
      .get("/me", ({ user, schoolName }) => {
        return {
          message: "Profil berhasil diambil",
          user,
          schoolName,
        };
      })
      // 5. Admin & Principal Only RBAC Route
      .get("/admin-only", ({ user }) => {
        return {
          message: "Akses admin berhasil diverifikasi",
          user,
        };
      }, {
        beforeHandle: requireRoles(["SuperAdmin", "SchoolAdmin", "Principal"])
      })
  );
