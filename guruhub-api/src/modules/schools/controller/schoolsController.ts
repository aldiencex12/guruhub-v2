import { SchoolsService } from "../service/schoolsService";

export class SchoolsController {
  private service = new SchoolsService();

  async getSettings(schoolId: number) {
    return this.service.getSchoolSettings(schoolId);
  }

  async updateSettings(schoolId: number, body: any) {
    return this.service.updateSchoolSettings(schoolId, body);
  }

  async uploadLogo(schoolId: number, file: File) {
    return this.service.uploadAsset(schoolId, file, "logo");
  }

  async uploadKop(schoolId: number, file: File) {
    return this.service.uploadAsset(schoolId, file, "kop");
  }
}
