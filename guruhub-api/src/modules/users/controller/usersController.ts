import { UsersService } from "../service/usersService";

const service = new UsersService();

export class UsersController {
  async getAll({ schoolId, query }: any) {
    const page = query.page ? parseInt(query.page, 10) : 1;
    const limit = query.limit ? parseInt(query.limit, 10) : 10;
    const search = query.search || undefined;
    const role = query.role || undefined;
    const status = query.status || undefined;

    const data = await service.getAllUsers(schoolId, { page, limit, search, role, status });
    return {
      success: true,
      message: "Daftar akun berhasil diambil",
      ...data,
    };
  }

  async getById({ schoolId, params }: any) {
    const id = parseInt(params.id, 10);
    const data = await service.getUserById(schoolId, id);
    return {
      success: true,
      message: "Detail akun berhasil diambil",
      data,
    };
  }

  async create({ schoolId, body }: any) {
    const data = await service.createUser(schoolId, body);
    return {
      success: true,
      message: "Akun berhasil ditambahkan",
      data,
    };
  }

  async update({ schoolId, params, body }: any) {
    const id = parseInt(params.id, 10);
    const data = await service.updateUser(schoolId, id, body);
    return {
      success: true,
      message: "Akun berhasil diperbarui",
      data,
    };
  }

  async resetPassword({ schoolId, params, body }: any) {
    const id = parseInt(params.id, 10);
    await service.resetPassword(schoolId, id, body.newPassword);
    return {
      success: true,
      message: "Kata sandi berhasil direset",
    };
  }

  async delete({ schoolId, params, set }: any) {
    try {
      const id = parseInt(params.id, 10);
      await service.deleteUser(schoolId, id);
      return {
        success: true,
        message: "Akun berhasil dihapus",
      };
    } catch (error: any) {
      set.status = error.statusCode || 500;
      return {
        success: false,
        error: error.message || "Gagal menghapus akun",
      };
    }
  }

  generateBulk = async ({ schoolId, set }: any) => {
    try {
      const result = await service.generateBulkAccounts(schoolId);
      return {
        success: true,
        message: "Generate akun massal berhasil",
        data: result
      };
    } catch (error: any) {
      set.status = error.statusCode || 500;
      return {
        success: false,
        error: error.message || "Terjadi kesalahan internal"
      };
    }
  };

  deleteBulk = async ({ schoolId, set }: any) => {
    try {
      const result = await service.deleteBulkAccounts(schoolId);
      return {
        success: true,
        message: `Berhasil menghapus ${result.deleted} akun massal`,
        data: result
      };
    } catch (error: any) {
      set.status = error.statusCode || 500;
      return {
        success: false,
        error: error.message || "Terjadi kesalahan internal"
      };
    }
  };
}
