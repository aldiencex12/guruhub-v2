import { AssessmentCategoriesService } from "../service/assessmentCategoriesService";

const assessmentCategoriesService = new AssessmentCategoriesService();

export class AssessmentCategoriesController {
  async getAll({ schoolId, user }: any) {
    const data = await assessmentCategoriesService.getAllCategories(schoolId, user);
    return {
      success: true,
      message: "Daftar kategori penilaian berhasil diambil",
      data,
    };
  }

  async getById({ schoolId, params }: any) {
    const id = parseInt(params.id, 10);
    const data = await assessmentCategoriesService.getCategoryById(schoolId, id);
    return {
      success: true,
      message: "Detail kategori penilaian berhasil diambil",
      data,
    };
  }

  async create({ schoolId, body, user }: any) {
    const data = await assessmentCategoriesService.createCategory(schoolId, user, body);
    return {
      success: true,
      message: "Kategori penilaian berhasil dibuat",
      data,
    };
  }

  async update({ schoolId, params, body, user }: any) {
    const id = parseInt(params.id, 10);
    const data = await assessmentCategoriesService.updateCategory(schoolId, user, id, body);
    return {
      success: true,
      message: "Kategori penilaian berhasil diperbarui",
      data,
    };
  }

  async delete({ schoolId, params, user }: any) {
    const id = parseInt(params.id, 10);
    await assessmentCategoriesService.deleteCategory(schoolId, user, id);
    return {
      success: true,
      message: "Kategori penilaian berhasil dihapus",
    };
  }
}
