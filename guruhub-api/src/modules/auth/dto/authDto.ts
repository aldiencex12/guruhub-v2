import { t } from "elysia";

export const LoginDto = t.Object({
  email: t.String({ format: "email", error: "Format email tidak valid" }),
  password: t.String({ minLength: 6, error: "Password minimal harus 6 karakter" }),
});

export const RefreshTokenDto = t.Object({
  refreshToken: t.String({ error: "Refresh token harus disertakan" }),
});

export const LogoutDto = t.Object({
  refreshToken: t.String({ error: "Refresh token harus disertakan" }),
});
