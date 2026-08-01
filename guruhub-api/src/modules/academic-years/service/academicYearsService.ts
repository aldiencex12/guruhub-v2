import { AcademicYearsRepository } from "../repository/academicYearsRepository";
import { NotFoundError, ConflictError } from "../../../errors/customErrors";
import { academicYears } from "../../../schema/academicYears";
import { db } from "../../../db";
import { eq, and } from "drizzle-orm";

export class AcademicYearsService {
  private repository = new AcademicYearsRepository();

  async getAllAcademicYears(schoolId: number) {
    return await this.repository.findAll(schoolId);
  }

  async getAcademicYearById(schoolId: number, id: number) {
    const item = await this.repository.findById(schoolId, id);
    if (!item) {
      throw new NotFoundError("Tahun ajaran tidak ditemukan");
    }
    return item;
  }

  async createAcademicYear(
    schoolId: number,
    data: Omit<typeof academicYears.$inferInsert, "schoolId" | "id">
  ) {
    const existing = await this.repository.findByYearAndSemester(schoolId, data.year, data.semester);
    if (existing) {
      throw new ConflictError("Tahun ajaran dengan semester tersebut sudah ada");
    }

    const newRecord = await this.repository.create(schoolId, data);

    if (data.isActive) {
      await this.repository.deactivateAllOtherYears(schoolId, newRecord.id);
    }

    return newRecord;
  }

  async updateAcademicYear(
    schoolId: number,
    id: number,
    data: Partial<typeof academicYears.$inferInsert>
  ) {
    const item = await this.repository.findById(schoolId, id);
    if (!item) {
      throw new NotFoundError("Tahun ajaran tidak ditemukan");
    }

    if (data.year || data.semester) {
      const targetYear = data.year || item.year;
      const targetSemester = data.semester || item.semester;
      const existing = await this.repository.findByYearAndSemester(schoolId, targetYear, targetSemester as any);
      if (existing && existing.id !== id) {
        throw new ConflictError("Tahun ajaran dengan semester tersebut sudah ada");
      }
    }

    const updated = await this.repository.update(schoolId, id, data);

    if (data.isActive && updated) {
      await this.repository.deactivateAllOtherYears(schoolId, updated.id);
    }

    return updated;
  }

  async deleteAcademicYear(schoolId: number, id: number) {
    const item = await this.repository.findById(schoolId, id);
    if (!item) {
      throw new NotFoundError("Tahun ajaran tidak ditemukan");
    }

    if (item.isActive) {
      throw new ConflictError("Tahun ajaran aktif tidak dapat dihapus. Silakan aktifkan tahun ajaran lain terlebih dahulu.");
    }

    await db.delete(academicYears).where(
      and(
        eq(academicYears.schoolId, schoolId),
        eq(academicYears.id, id)
      )
    );
  }
}
