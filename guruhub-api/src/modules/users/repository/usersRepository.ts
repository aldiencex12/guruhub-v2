import { eq, and, sql, like } from "drizzle-orm";
import { db } from "../../../db";
import { users } from "../../../schema/users";

export class UsersRepository {
  async findAll(
    schoolId: number,
    options: { page: number; limit: number; search?: string; role?: string; status?: string }
  ) {
    const offset = (options.page - 1) * options.limit;
    const conditions: any[] = [eq(users.schoolId, schoolId)];

    if (options.role) {
      conditions.push(eq(users.role, options.role as any));
    }
    if (options.status) {
      conditions.push(eq(users.status, options.status as any));
    }
    if (options.search) {
      conditions.push(like(users.email, `%${options.search}%`));
    }

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(and(...conditions));

    const totalItems = Number(countResult?.count || 0);
    const totalPages = Math.ceil(totalItems / options.limit);

    const data = await db
      .select({
        id: users.id,
        schoolId: users.schoolId,
        email: users.email,
        role: users.role,
        status: users.status,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(and(...conditions))
      .limit(options.limit)
      .offset(offset)
      .orderBy(users.id); // Or order by created at

    return {
      data,
      pagination: {
        totalItems,
        totalPages,
        currentPage: options.page,
        limit: options.limit,
      },
    };
  }

  async findById(schoolId: number, id: number) {
    const result = await db
      .select({
        id: users.id,
        schoolId: users.schoolId,
        email: users.email,
        role: users.role,
        status: users.status,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(
        and(
          eq(users.schoolId, schoolId),
          eq(users.id, id)
        )
      )
      .limit(1);

    return result[0] || null;
  }

  async findByEmail(schoolId: number, email: string) {
    const result = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.schoolId, schoolId),
          eq(users.email, email)
        )
      )
      .limit(1);

    return result[0] || null;
  }

  async create(schoolId: number, data: Omit<typeof users.$inferInsert, "schoolId" | "id">) {
    const [inserted] = await db.insert(users).values({
      ...data,
      schoolId,
    });

    return await this.findById(schoolId, inserted.insertId);
  }

  async update(schoolId: number, id: number, data: Partial<typeof users.$inferInsert>) {
    await db
      .update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(users.schoolId, schoolId),
          eq(users.id, id)
        )
      );

    return await this.findById(schoolId, id);
  }

  async updatePassword(schoolId: number, id: number, passwordHash: string) {
    await db
      .update(users)
      .set({
        passwordHash,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(users.schoolId, schoolId),
          eq(users.id, id)
        )
      );
  }

  async delete(schoolId: number, id: number) {
    await db
      .delete(users)
      .where(
        and(
          eq(users.schoolId, schoolId),
          eq(users.id, id)
        )
      );
  }
}
