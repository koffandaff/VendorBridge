import bcrypt from "bcryptjs";
import { UserRepository } from "./user.repository.js";
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
} from "../../core/errors/AppError.js";
import type {
  CreateUserInput,
  UpdateUserInput,
  UpdateUserStatusInput,
  ResetPasswordInput,
  UserQueryFilters,
} from "./user.types.js";
import type { PaginationMeta } from "../../core/http/response.js";

const SALT_ROUNDS = 10;

export class UserService {
  constructor(private readonly repository: UserRepository = new UserRepository()) {}

  async createUser(input: CreateUserInput) {
    // 1. Check email uniqueness
    const existing = await this.repository.findUserByEmail(input.email);
    if (existing) {
      throw new ConflictError(`User with email '${input.email}' already exists`);
    }

    // 2. Validate vendorId assignment according to docs/Schema.md §4.1
    // Internal manager roles (ADMIN, PROCUREMENT_OFFICER, APPROVER) must have vendorId = null
    let finalVendorId = input.vendorId || null;
    if (input.role !== "VENDOR" && finalVendorId !== null) {
      finalVendorId = null; // Enforce null for internal managers
    }

    // 3. Hash password securely using bcryptjs
    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

    return this.repository.createUser({
      ...input,
      vendorId: finalVendorId,
      passwordHash,
    });
  }

  async getUserById(id: string) {
    const user = await this.repository.findUserById(id);
    if (!user) {
      throw new NotFoundError("User not found");
    }
    return user;
  }

  async listUsers(filters: UserQueryFilters) {
    const { items, totalItems } = await this.repository.listUsers(filters);
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const totalPages = Math.ceil(totalItems / limit) || 1;

    const pagination: PaginationMeta = {
      page,
      limit,
      totalItems,
      totalPages,
    };

    return { items, pagination };
  }

  async updateUser(id: string, input: UpdateUserInput) {
    const user = await this.getUserById(id);

    let finalVendorId = input.vendorId;
    const targetRole = input.role || user.role;

    if (targetRole !== "VENDOR") {
      finalVendorId = null;
    }

    return this.repository.updateUser(id, {
      ...input,
      vendorId: finalVendorId,
    });
  }

  async updateUserStatus(id: string, input: UpdateUserStatusInput) {
    await this.getUserById(id);
    return this.repository.updateUserStatus(id, input.isActive);
  }

  async resetPassword(id: string, input: ResetPasswordInput) {
    await this.getUserById(id);
    if (!input.newPassword || input.newPassword.length < 8) {
      throw new BadRequestError("Password must be at least 8 characters");
    }

    const passwordHash = await bcrypt.hash(input.newPassword, SALT_ROUNDS);
    return this.repository.updatePasswordHash(id, passwordHash);
  }

  /**
   * Safe soft-deletion per docs/Schema.md §38 (Users: isActive = false).
   */
  async softDeleteUser(id: string) {
    await this.getUserById(id);
    return this.repository.updateUserStatus(id, false);
  }
}
