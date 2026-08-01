import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "guruhub-super-secret-key-123456";
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";

export interface AccessTokenPayload {
  userId: number;
  schoolId: number;
  email: string;
  role: string;
  type: "access";
}

export interface RefreshTokenPayload {
  userId: number;
  schoolId: number;
  tokenId: string; // UUID of session
  type: "refresh";
}

export function signAccessToken(payload: Omit<AccessTokenPayload, "type">): string {
  return jwt.sign({ ...payload, type: "access" }, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
}

export function signRefreshToken(payload: Omit<RefreshTokenPayload, "type">): string {
  return jwt.sign({ ...payload, type: "refresh" }, JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });
}

export function verifyToken<T>(token: string): T {
  try {
    return jwt.verify(token, JWT_SECRET) as T;
  } catch (error) {
    throw error;
  }
}
