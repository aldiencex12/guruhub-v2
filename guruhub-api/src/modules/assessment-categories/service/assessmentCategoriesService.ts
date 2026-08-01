import { AssessmentCategoriesRepository } from "../repository/assessmentCategoriesRepository";
import { NotFoundError, ConflictError, BadRequestError } from "../../../errors/customErrors";
import { assessmentCategories } from "../../../schema/assessmentCategories";
import { UserContext, getTeacherIdFromUserId } from "../../../utils/rbac";

export class AssessmentCategoriesService {
  private repository = new AssessmentCategoriesRepository();

  async getAllCategories(schoolId: number, user: UserContext) {
    let teacherId: number | null = null;
    if (user.role === "Teacher" || user.role === "HomeroomTeacher") {
      teacherId = await getTeacherIdFromUserId(schoolId, user.id);
    }
    return await this.repository.findAll(schoolId, teacherId);
  }

  async getCategoryById(schoolId: number, id: number) {
    const data = await this.repository.findById(schoolId, id);
    if (!data) {
      throw new NotFoundError("Kategori penilaian tidak ditemukan");
    }
    return data;
  }

  async createCategory(schoolId: number, user: UserContext, data: Omit<typeof assessmentCategories.$inferInsert, "schoolId" | "id">) {
    let teacherId: number | null = null;
    if (user.role === "Teacher" || user.role === "HomeroomTeacher") {
      teacherId = await getTeacherIdFromUserId(schoolId, user.id);
      data.teacherId = teacherId; // Assign ownership
    } else {
      data.teacherId = null; // Global category
    }
    if (data.weight < 0 || data.weight > 100) {
      throw new BadRequestError("Bobot harus antara 0 dan 100");
    }

    // Nama unik dalam ruang lingkup guru (atau global jika teacherId null)
    const existing = await this.repository.findByName(schoolId, data.name, teacherId);
    if (existing) {
      throw new ConflictError("Kategori penilaian dengan nama tersebut sudah ada");
    }

    // Total bobot tidak boleh melebihi 100 (Hanya untuk kategori aktif)
    if (data.isActive !== false) {
      const currentTotal = await this.repository.getTotalWeight(schoolId, undefined, teacherId);
      if (currentTotal + data.weight > 100) {
        throw new BadRequestError("Total bobot kategori aktif tidak boleh melebihi 100%");
      }
    }

    return await this.repository.create(schoolId, data);
  }

  async updateCategory(schoolId: number, user: UserContext, id: number, data: Partial<typeof assessmentCategories.$inferInsert>) {
    const category = await this.repository.findById(schoolId, id);
    if (!category) {
      throw new NotFoundError("Kategori penilaian tidak ditemukan");
    }

    let teacherId: number | null = null;
    if (user.role === "Teacher" || user.role === "HomeroomTeacher") {
      teacherId = await getTeacherIdFromUserId(schoolId, user.id);
      if (category.teacherId !== teacherId) {
        throw new ForbiddenError("Anda tidak memiliki hak untuk mengubah kategori standar sekolah");
      }
    } else {
      if (category.teacherId !== null) {
        // Admin mengedit kategori guru, kita tetap biarkan tapi gunakan context teacherId-nya
        teacherId = category.teacherId;
      }
    }

    // Validasi nama unik jika diubah
    if (data.name !== undefined && data.name !== category.name) {
      const existing = await this.repository.findByName(schoolId, data.name, teacherId);
      if (existing && existing.id !== id) {
        throw new ConflictError("Kategori penilaian dengan nama tersebut sudah ada");
      }
    }

    // Validasi total bobot jika diubah
    const newWeight = data.weight !== undefined ? data.weight : category.weight;
    if (newWeight < 0 || newWeight > 100) {
      throw new BadRequestError("Bobot harus antara 0 dan 100");
    }

    const isActive = data.isActive !== undefined ? data.isActive : category.isActive;

    if (isActive) {
      const currentTotal = await this.repository.getTotalWeight(schoolId, id, teacherId);
      if (currentTotal + newWeight > 100) {
        throw new BadRequestError("Total bobot kategori aktif tidak boleh melebihi 100%");
      }
    }

    return await this.repository.update(schoolId, id, data);
  }

  async deleteCategory(schoolId: number, user: UserContext, id: number) {
    const category = await this.repository.findById(schoolId, id);
    if (!category) {
      throw new NotFoundError("Kategori penilaian tidak ditemukan");
    }

    if (user.role === "Teacher" || user.role === "HomeroomTeacher") {
      const teacherId = await getTeacherIdFromUserId(schoolId, user.id);
      if (category.teacherId !== teacherId) {
        throw new ForbiddenError("Anda tidak memiliki hak untuk menghapus kategori standar sekolah");
      }
    }

    // Kategori default tidak boleh dihapus
    if (category.isDefault) {
      throw new BadRequestError("Kategori default tidak boleh dihapus");
    }

    await this.repository.softDelete(schoolId, id);
  }
}
