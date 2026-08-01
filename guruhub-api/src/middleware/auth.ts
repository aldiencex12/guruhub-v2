import { verifyToken } from "../utils/jwt";
import type { AccessTokenPayload } from "../utils/jwt";
import { UnauthorizedError, ForbiddenError } from "../errors/customErrors";

export const authMiddleware = (app: any) =>
  app.derive(async ({ headers, schoolId }: any) => {
    const authHeader = headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedError("Token otentikasi diperlukan (format: Bearer <token>)");
    }

    const token = authHeader.split(" ")[1];
    let payload: AccessTokenPayload;

    try {
      payload = verifyToken<AccessTokenPayload>(token);
      if (payload.type !== "access") {
        throw new Error();
      }
    } catch {
      throw new UnauthorizedError("Sesi atau token tidak valid atau telah kedaluwarsa");
    }

    // Tenant Isolation Check: Pastikan token berasal dari sekolah yang sama dengan tenant yang diakses
    if (payload.schoolId !== schoolId) {
      console.log(`[Tenant Mismatch Debug] payload.schoolId: ${payload.schoolId} (type: ${typeof payload.schoolId}), schoolId: ${schoolId} (type: ${typeof schoolId})`);
      throw new ForbiddenError("Akses antar tenant (sekolah) dilarang");
    }

    return {
      user: {
        id: payload.userId,
        email: payload.email,
        role: payload.role,
        schoolId: payload.schoolId,
      },
    };
  });

/**
 * Helper middleware generator to check if the user has required roles.
 */
export const requireRoles = (allowedRoles: string[]) => {
  return ({ user }: any) => {
    // Jika middleware auth belum berjalan, user tidak ada
    if (!user) {
      throw new UnauthorizedError("Pengguna belum terautentikasi");
    }

    if (!allowedRoles.includes(user.role)) {
      throw new ForbiddenError("Anda tidak memiliki hak akses untuk halaman/operasi ini");
    }
  };
};
