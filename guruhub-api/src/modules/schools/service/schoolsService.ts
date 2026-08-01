import { db } from "../../../db";
import { schools } from "../../../schema/schools";
import { eq } from "drizzle-orm";

export class SchoolsService {
  async getSchoolSettings(schoolId: number) {
    const list = await db
      .select()
      .from(schools)
      .where(eq(schools.id, schoolId))
      .limit(1);

    if (list.length === 0) {
      throw new Error("404: School settings not found");
    }
    return list[0];
  }

  async updateSchoolSettings(schoolId: number, data: any) {
    const {
      foundationName,
      regionalName,
      accreditation,
      name,
      address,
      phone,
      email,
      website,
      logoUrl,
      kopSuratUrl,
      principalName,
      principalNip,
    } = data;

    await db
      .update(schools)
      .set({
        foundationName: foundationName !== undefined ? foundationName : undefined,
        regionalName: regionalName !== undefined ? regionalName : undefined,
        accreditation: accreditation !== undefined ? accreditation : undefined,
        name: name !== undefined ? name : undefined,
        address: address !== undefined ? address : undefined,
        phone: phone !== undefined ? phone : undefined,
        email: email !== undefined ? email : undefined,
        website: website !== undefined ? website : undefined,
        logoUrl: logoUrl !== undefined ? logoUrl : undefined,
        kopSuratUrl: kopSuratUrl !== undefined ? kopSuratUrl : undefined,
        principalName: principalName !== undefined ? principalName : undefined,
        principalNip: principalNip !== undefined ? principalNip : undefined,
        updatedAt: new Date(),
      })
      .where(eq(schools.id, schoolId));

    return this.getSchoolSettings(schoolId);
  }

  async uploadAsset(schoolId: number, file: File, type: "logo" | "kop"): Promise<{ url: string }> {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = file.type || (file.name.endsWith(".png") ? "image/png" : "image/jpeg");
    const base64 = buffer.toString("base64");
    const dataUri = `data:${mimeType};base64,${base64}`;

    if (type === "logo") {
      await this.updateSchoolSettings(schoolId, { logoUrl: dataUri });
    } else {
      await this.updateSchoolSettings(schoolId, { kopSuratUrl: dataUri });
    }

    return { url: dataUri };
  }
}
