import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import type {
  CreateUserInput,
  UpdateUserInput,
  UserQueryFilters,
  SafeUser,
} from "./user.types.js";

const safeUserSelect = {
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

export class UserRepository {
  async createUser(data: CreateUserInput & { passwordHash: string }): Promise<SafeUser> {
    return prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash: data.passwordHash,
        role: data.role,
        phone: data.phone || null,
        vendorId: data.vendorId || null,
      },
      select: safeUserSelect,
    });
  }

  async findUserById(id: string): Promise<SafeUser | null> {
    return prisma.user.findUnique({
      where: { id },
      select: safeUserSelect,
    });
  }

  async findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  async listUsers(filters: UserQueryFilters): Promise<{ items: SafeUser[]; totalItems: number }> {
    const {
      search,
      role,
      isActive,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = filters;

    const where: Prisma.UserWhereInput = {};

    if (role) {
      where.role = role;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [items, totalItems] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: safeUserSelect,
      }),
      prisma.user.count({ where }),
    ]);

    return { items, totalItems };
  }

  async updateUser(id: string, data: UpdateUserInput): Promise<SafeUser> {
    return prisma.user.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.phone !== undefined && { phone: data.phone || null }),
        ...(data.role !== undefined && { role: data.role }),
        ...(data.vendorId !== undefined && { vendorId: data.vendorId || null }),
      },
      select: safeUserSelect,
    });
  }

  async updateUserStatus(id: string, isActive: boolean): Promise<SafeUser> {
    return prisma.user.update({
      where: { id },
      data: { isActive },
      select: safeUserSelect,
    });
  }

  async updatePasswordHash(id: string, passwordHash: string): Promise<SafeUser> {
    return prisma.user.update({
      where: { id },
      data: { passwordHash },
      select: safeUserSelect,
    });
  }
}
