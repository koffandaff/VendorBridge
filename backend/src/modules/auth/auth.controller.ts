import type { Request, Response } from "express";
import { ok } from "../../core/http/response.js";
import { recordAudit } from "../../shared/helpers/audit.helper.js";
import { notify, notifyRole } from "../../shared/helpers/notification.helper.js";
import * as authService from "./auth.service.js";
import type {
  ChangePasswordRequest,
  ForgotPasswordRequest,
  LoginRequest,
  RefreshRequest,
  RegisterRequest,
  ResetPasswordRequest,
  VerifyOtpRequest,
} from "./auth.types.js";

async function login(req: Request, res: Response): Promise<void> {
  let data;
  try {
    data = await authService.login(req.body as LoginRequest);
  } catch (error) {
    await recordAudit({
      userId: null,
      action: "AUTH.LOGIN_FAILED",
      entityType: "User",
      newValue: {
        email: req.body?.email ?? "unknown",
        reason: error instanceof Error ? error.message : "invalid credentials",
      },
      ipAddress: req.ip ?? null,
    });
    throw error;
  }
  await recordAudit({
    userId: data.user.id,
    action: "AUTH.LOGIN",
    entityType: "User",
    entityId: data.user.id,
    ipAddress: req.ip ?? null,
  });
  ok(res, data);
}

async function register(req: Request, res: Response): Promise<void> {
  const data = await authService.register(req.body as RegisterRequest);
  await recordAudit({
    userId: req.user!.id,
    action: "AUTH.REGISTER",
    entityType: "User",
    entityId: data.id,
    newValue: { name: data.name, email: data.email, role: data.role },
    ipAddress: req.ip ?? null,
  });
  await notify({
    userId: data.id,
    type: "SYSTEM",
    title: "You've been invited to VendorBridge",
    message: `Your ${data.role} account is ready. Use the code sent to ${data.email} to activate it.`,
    entityType: "User",
    entityId: data.id,
  });
  ok(res, data, 201);
}

async function refresh(req: Request, res: Response): Promise<void> {
  const data = await authService.refresh(req.body as RefreshRequest);
  ok(res, data);
}

async function logout(req: Request, res: Response): Promise<void> {
  await authService.logout(req.body as RefreshRequest);
  if (req.user) {
    await recordAudit({
      userId: req.user.id,
      action: "AUTH.LOGOUT",
      entityType: "User",
      entityId: req.user.id,
      ipAddress: req.ip ?? null,
    });
  }
  ok(res, null);
}

async function me(req: Request, res: Response): Promise<void> {
  const data = await authService.me(req.user!.id);
  ok(res, data);
}

async function changePassword(req: Request, res: Response): Promise<void> {
  await authService.changePassword(req.user!.id, req.body as ChangePasswordRequest);
  await recordAudit({
    userId: req.user!.id,
    action: "AUTH.PASSWORD_CHANGED",
    entityType: "User",
    entityId: req.user!.id,
    ipAddress: req.ip ?? null,
  });
  ok(res, null);
}

async function forgotPassword(req: Request, res: Response): Promise<void> {
  await authService.forgotPassword(req.body as ForgotPasswordRequest);
  ok(res, null);
}

async function verifyOtp(req: Request, res: Response): Promise<void> {
  await authService.verifyOtp(req.body as VerifyOtpRequest);
  ok(res, null);
}

async function resetPassword(req: Request, res: Response): Promise<void> {
  await authService.resetPassword(req.body as ResetPasswordRequest);
  ok(res, null);
}

async function acceptInvite(req: Request, res: Response): Promise<void> {
  const data = await authService.acceptInvitation(req.body as ResetPasswordRequest);
  await recordAudit({
    userId: data.id,
    action: "USER.INVITE_ACCEPTED",
    entityType: "User",
    entityId: data.id,
    newValue: { name: data.name, email: data.email, role: data.role },
    ipAddress: req.ip ?? null,
  });
  await notifyRole("ADMIN", {
    type: "SYSTEM",
    title: "Invitation accepted",
    message: `${data.name} (${data.email}) accepted their invitation as ${data.role}.`,
    entityType: "User",
    entityId: data.id,
  });
  ok(res, { id: data.id });
}

export const authController = {
  login,
  register,
  refresh,
  logout,
  me,
  changePassword,
  forgotPassword,
  verifyOtp,
  resetPassword,
  acceptInvite,
};