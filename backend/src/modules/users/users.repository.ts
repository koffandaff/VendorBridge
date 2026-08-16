import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import type {
  CreateUserInput,
  UpdateUserInput,
  UserQueryFilters,
} from "./users.types.js";

export const userListItemSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  phone: true,
  vendorId: true,
  isActive: true,
  emailVerified: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

export type UserListItemRecord = Prisma.UserGetPayload<{
  select: typeof userListItemSelect;
}>;

export class UserRepository {
  async listUsers(filters: UserQueryFilters): Promise<{
    items: UserListItemRecord[];
    totalItems: number;
  }> {
    const where = this.buildWhere(filters);
    const orderBy: Prisma.UserOrderByWithRelationInput =
      filters.sortBy === "name"
        ? { name: filters.sortOrder }
        : filters.sortBy === "email"
          ? { email: filters.sortOrder }
          : filters.sortBy === "role"
            ? { role: filters.sortOrder }
            : { createdAt: filters.sortOrder };

    const [items, totalItems] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        select: userListItemSelect,
        orderBy,
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      prisma.user.count({ where }),
    ]);

    return { items, totalItems };
  }

  async findUserById(id: string): Promise<UserListItemRecord | null> {
    return prisma.user.findUnique({ where: { id }, select: userListItemSelect });
  }

  async findUserByEmail(email: string): Promise<UserListItemRecord | null> {
    return prisma.user.findUnique({ where: { email }, select: userListItemSelect });
  }

  async createUser(
    data: CreateUserInput & { passwordHash: string }
  ): Promise<UserListItemRecord> {
    return prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash: data.passwordHash,
        role: data.role,
        phone: data.phone || null,
        vendor: data.vendorId ? { connect: { id: data.vendorId } } : undefined,
      },
      select: userListItemSelect,
    });
  }

  async updateUser(id: string, input: UpdateUserInput): Promise<UserListItemRecord> {
    const data: Prisma.UserUpdateInput = {};

    if (input.name !== undefined) {
      data.name = input.name;
    }
    if (input.phone !== undefined) {
      data.phone = input.phone === "" ? null : input.phone;
    }
    if (input.role !== undefined) {
      data.role = input.role;
    }
    if (input.vendorId !== undefined) {
      data.vendor =
        input.vendorId === "" || input.vendorId === null
          ? { disconnect: true }
          : { connect: { id: input.vendorId } };
    }

    return prisma.user.update({ where: { id }, data, select: userListItemSelect });
  }

  async updatePasswordHash(id: string, passwordHash: string): Promise<UserListItemRecord> {
    return prisma.user.update({
      where: { id },
      data: { passwordHash },
      select: userListItemSelect,
    });
  }

  async updateUserStatus(id: string, isActive: boolean): Promise<UserListItemRecord> {
    return prisma.user.update({
      where: { id },
      data: { isActive },
      select: userListItemSelect,
    });
  }

  private buildWhere(filters: UserQueryFilters): Prisma.UserWhereInput {
    const conditions: Prisma.UserWhereInput[] = [];

    if (filters.search?.trim()) {
      conditions.push({
        OR: [
          { name: { contains: filters.search.trim(), mode: "insensitive" } },
          { email: { contains: filters.search.trim(), mode: "insensitive" } },
        ],
      });
    }
    if (filters.role) {
      conditions.push({ role: filters.role });
    }
    if (filters.isActive !== undefined) {
      conditions.push({ isActive: filters.isActive });
    }

    return conditions.length > 0 ? { AND: conditions } : {};
  }
}