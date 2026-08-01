import { AuthRepository } from "../repository/authRepository";
import { verifyPassword } from "../../../utils/password";
import {
  signAccessToken,
  signRefreshToken,
  verifyToken,
} from "../../../utils/jwt";
import type { RefreshTokenPayload } from "../../../utils/jwt";
import { BadRequestError, UnauthorizedError, NotFoundError } from "../../../errors/customErrors";
import { randomUUID } from "crypto";

// Baca School ID dari environment (single-tenant, default school 719)
const DEFAULT_SCHOOL_ID = parseInt(process.env.DEFAULT_SCHOOL_ID || "719", 10);

export class AuthService {
  private repository = new AuthRepository();

  async login(
    email: string,
    password: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    const schoolId = DEFAULT_SCHOOL_ID;

    if (!schoolId) {
      throw new BadRequestError("Konfigurasi sekolah tidak ditemukan di server");
    }

    // 1. Validasi sekolah
    const school = await this.repository.findSchoolById(schoolId);
    if (!school) {
      throw new NotFoundError("Sekolah tidak ditemukan");
    }

    // 2. Cari user berdasarkan email
    const user = await this.repository.findUserByEmail(schoolId, email);
    if (!user) {
      await this.repository.createAuditLog({
        schoolId,
        action: "LOGIN_FAILED",
        tableName: "users",
        ipAddress,
        newValues: { email, reason: "User not found" },
      });
      throw new UnauthorizedError("Email atau password salah");
    }

    // 3. Validasi status user
    if (user.status === "Nonaktif") {
      await this.repository.createAuditLog({
        schoolId,
        userId: user.id,
        action: "LOGIN_FAILED",
        tableName: "users",
        recordId: user.id,
        ipAddress,
        newValues: { email, reason: "Account inactive" },
      });
      throw new UnauthorizedError("Akun dinonaktifkan, silakan hubungi admin sekolah");
    }

    // 4. Verifikasi password
    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      await this.repository.createAuditLog({
        schoolId,
        userId: user.id,
        action: "LOGIN_FAILED",
        tableName: "users",
        recordId: user.id,
        ipAddress,
        newValues: { email, reason: "Invalid password" },
      });
      throw new UnauthorizedError("Email atau password salah");
    }

    // 5. Generate Session token_id (UUID)
    const tokenId = randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Valid selama 7 hari

    // 6. Simpan sesi ke database
    await this.repository.createSession({
      schoolId,
      userId: user.id,
      tokenId,
      userAgent,
      ipAddress,
      expiresAt,
    });

    // 7. Catat audit log sukses
    await this.repository.createAuditLog({
      schoolId,
      userId: user.id,
      action: "LOGIN_SUCCESS",
      tableName: "users",
      recordId: user.id,
      ipAddress,
      newValues: { email },
    });

    // 8. Generate JWT
    const accessToken = signAccessToken({
      userId: user.id,
      schoolId,
      email: user.email,
      role: user.role,
    });

    const refreshToken = signRefreshToken({
      userId: user.id,
      schoolId,
      tokenId,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        schoolId,
      },
      accessToken,
      refreshToken,
    };
  }

  async refresh(
    refreshToken: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    let payload: RefreshTokenPayload;
    try {
      payload = verifyToken<RefreshTokenPayload>(refreshToken);
      if (payload.type !== "refresh") {
        throw new Error();
      }
    } catch {
      throw new UnauthorizedError("Refresh token tidak valid atau telah kedaluwarsa");
    }

    const { schoolId, userId, tokenId } = payload;

    // 1. Temukan sesi
    const session = await this.repository.findSession(schoolId, userId, tokenId);
    if (!session || session.isRevoked || new Date() > new Date(session.expiresAt)) {
      throw new UnauthorizedError("Sesi telah kedaluwarsa atau dicabut");
    }

    // 2. Validasi user aktif
    const user = await this.repository.findUserById(schoolId, userId);
    if (!user || user.status === "Nonaktif") {
      throw new UnauthorizedError("Pengguna tidak aktif");
    }

    // 3. Revoke sesi lama (Token Rotation)
    await this.repository.revokeSession(schoolId, userId, tokenId);

    // 4. Buat sesi baru
    const newTokenId = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.repository.createSession({
      schoolId,
      userId,
      tokenId: newTokenId,
      userAgent,
      ipAddress,
      expiresAt,
    });

    // 5. Generate token baru
    const newAccessToken = signAccessToken({
      userId: user.id,
      schoolId,
      email: user.email,
      role: user.role,
    });

    const newRefreshToken = signRefreshToken({
      userId: user.id,
      schoolId,
      tokenId: newTokenId,
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(refreshToken: string, ipAddress?: string) {
    let payload: RefreshTokenPayload;
    try {
      payload = verifyToken<RefreshTokenPayload>(refreshToken);
      if (payload.type !== "refresh") {
        throw new Error();
      }
    } catch {
      throw new UnauthorizedError("Refresh token tidak valid");
    }

    const { schoolId, userId, tokenId } = payload;

    // Revoke sesi
    await this.repository.revokeSession(schoolId, userId, tokenId);

    // Catat audit log
    await this.repository.createAuditLog({
      schoolId,
      userId,
      action: "LOGOUT_SUCCESS",
      tableName: "users",
      recordId: userId,
      ipAddress,
    });
  }
}
