import bcrypt from "bcryptjs";
import { BadRequestError, ConflictError, NotFoundError } from "../../core/errors/AppError.js";
import { generateOtp, hashOtp, otpExpiryDate } from "../../core/auth/otp.js";
import { sendInviteEmail } from "../../shared/email.js";
import { createOtpToken } from "../auth/auth.repository.js";
import { recordAudit } from "../../shared/helpers/audit.helper.js";
import { notify } from "../../shared/helpers/notification.helper.js";
import { UserRepository, type UserListItemRecord } from "./users.repository.js";
import type {
  CreateUserInput,
  ResetPasswordInput,
  UpdateUserInput,
  UpdateUserStatusInput,
  UserListResult,
  UserQueryFilters,
} from "./users.types.js";

const SALT_ROUNDS = 10;

export class UserService {
  constructor(private readonly repository: UserRepository = new UserRepository()) {}

  async createUser(
    input: CreateUserInput,
    actor: { id: string }
  ): Promise<UserListItemRecord> {
    const existing = await this.repository.findUserByEmail(input.email);
    if (existing) {
      throw new ConflictError(`User with email '${input.email}' already exists`);
    }

    let finalVendorId: string | null = input.vendorId ?? null;
    if (input.role !== "VENDOR") {
      finalVendorId = null;
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
    const created = await this.repository.createUser({
      ...input,
      vendorId: finalVendorId,
      passwordHash,
    });
    await recordAudit({
      userId: actor.id,
      action: "USER.CREATED",
      entityType: "User",
      entityId: created.id,
      newValue: { name: created.name, email: created.email, role: created.role },
    });
    await notify({
      userId: created.id,
      type: "SYSTEM",
      title: "Welcome to VendorBridge",
      message: `You have been invited as ${created.role}. Use the code sent to ${created.email} to activate your account.`,
      entityType: "User",
      entityId: created.id,
    });
    return created;
  }

  async listUsers(filters: UserQueryFilters): Promise<UserListResult> {
    const { items, totalItems } = await this.repository.listUsers(filters);
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const totalPages = Math.ceil(totalItems / limit) || 1;

    return {
      items,
      pagination: { page, limit, totalItems, totalPages },
    };
  }

  async getUserById(id: string): Promise<UserListItemRecord> {
    const user = await this.repository.findUserById(id);
    if (!user) {
      throw new NotFoundError("User not found");
    }
    return user;
  }

  async updateUser(
    id: string,
    input: UpdateUserInput,
    actor: { id: string }
  ): Promise<UserListItemRecord> {
    const existing = await this.getUserById(id);

    if (id === actor.id && input.role && input.role !== existing.role) {
      throw new BadRequestError("You cannot change your own role");
    }

    let finalVendorId: string | null | undefined = input.vendorId;
    const targetRole = input.role || existing.role;
    if (targetRole !== "VENDOR") {
      finalVendorId = null;
    }

    const updated = await this.repository.updateUser(id, {
      ...input,
      vendorId: finalVendorId,
    });
    await recordAudit({
      userId: actor.id,
      action: "USER.UPDATED",
      entityType: "User",
      entityId: id,
      oldValue: { name: existing.name, phone: existing.phone, role: existing.role },
      newValue: { name: updated.name, phone: updated.phone, role: updated.role },
    });
    return updated;
  }

  async updateUserStatus(
    id: string,
    input: UpdateUserStatusInput,
    actor: { id: string }
  ): Promise<UserListItemRecord> {
    const existing = await this.getUserById(id);

    if (id === actor.id && !input.isActive) {
      throw new BadRequestError("You cannot deactivate your own account");
    }

    const updated = await this.repository.updateUserStatus(id, input.isActive);
    await recordAudit({
      userId: actor.id,
      action: input.isActive ? "USER.ACTIVATED" : "USER.DEACTIVATED",
      entityType: "User",
      entityId: id,
      oldValue: { isActive: existing.isActive },
      newValue: { isActive: updated.isActive },
    });
    return updated;
  }

  async resendInvite(id: string, actor: { id: string }): Promise<UserListItemRecord> {
    const user = await this.getUserById(id);

    if (!user.isActive) {
      throw new ConflictError("Cannot send an invite to a deactivated user");
    }

    const otp = generateOtp();
    await createOtpToken(user.id, hashOtp(otp), otpExpiryDate());
    await sendInviteEmail(user.email, user.name, otp);
    await recordAudit({
      userId: actor.id,
      action: "USER.INVITE_RESENT",
      entityType: "User",
      entityId: id,
    });
    return user;
  }

  async resetPassword(
    id: string,
    input: ResetPasswordInput,
    actor: { id: string }
  ): Promise<UserListItemRecord> {
    const user = await this.getUserById(id);
    if (!user.isActive) {
      throw new BadRequestError("Cannot reset the password of a deactivated user");
    }

    const passwordHash = await bcrypt.hash(input.newPassword, SALT_ROUNDS);
    const updated = await this.repository.updatePasswordHash(id, passwordHash);
    await recordAudit({
      userId: actor.id,
      action: "USER.PASSWORD_RESET",
      entityType: "User",
      entityId: id,
    });
    return updated;
  }

  async softDeleteUser(id: string, actor: { id: string }): Promise<UserListItemRecord> {
    const existing = await this.getUserById(id);

    if (id === actor.id) {
      throw new BadRequestError("You cannot deactivate your own account");
    }

    const updated = await this.repository.updateUserStatus(id, false);
    await recordAudit({
      userId: actor.id,
      action: "USER.DEACTIVATED",
      entityType: "User",
      entityId: id,
      oldValue: { isActive: existing.isActive },
      newValue: { isActive: updated.isActive },
    });
    return updated;
  }
}