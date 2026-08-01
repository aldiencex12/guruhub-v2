import { AuthRepository } from "../modules/auth/repository/authRepository";
import { BadRequestError, NotFoundError } from "../errors/customErrors";

const authRepository = new AuthRepository();

export const tenantMiddleware = (app: any) =>
  app.derive(async ({ headers }: any) => {
    const schoolIdStr = headers["x-school-id"];
    if (!schoolIdStr) {
      throw new BadRequestError("Header x-school-id diperlukan untuk multi-tenant");
    }

    const schoolId = parseInt(schoolIdStr, 10);
    if (isNaN(schoolId)) {
      throw new BadRequestError("Header x-school-id harus berupa angka");
    }

    const school = await authRepository.findSchoolById(schoolId);
    if (!school) {
      throw new NotFoundError("Sekolah tidak ditemukan atau tenant tidak valid");
    }

    return {
      schoolId,
      schoolName: school.name,
    };
  });
