import { Prisma } from "@prisma/client";
import type { PasswordResetToken, Session, UserRole } from "@prisma/client";
import { ConflictError } from "../../core/errors/app-error.js";
import { prisma } from "../../shared/prisma.js";

export const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  phone: true,
  isActive: true,
  emailVerified: true,
  lastLoginAt: true,
  createdAt: true,
} as const;

export type UserRecord = Prisma.UserGetPayload<{ select: typeof userSelect }>;

const userWithPasswordSelect = { ...userSelect, passwordHash: true } as const;

export type UserWithPassword = Prisma.UserGetPayload<{ select: typeof userWithPasswordSelect }>;

export function findUserByEmail(email: string): Promise<UserWithPassword | null> {
  return prisma.user.findUnique({ where: { email }, select: userWithPasswordSelect });
}

export function findUserById(id: string): Promise<UserRecord | null> {
  return prisma.user.findUnique({ where: { id }, select: userSelect });
}

export function findUserByIdWithPassword(id: string): Promise<UserWithPassword | null> {
  return prisma.user.findUnique({ where: { id }, select: userWithPasswordSelect });
}

export async function registerInvitedUser(input: {
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  passwordHash: string;
  otpHash: string;
  otpExpiresAt: Date;
}): Promise<UserRecord> {
  try {
    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: input.name,
          email: input.email,
          role: input.role,
          phone: input.phone,
          passwordHash: input.passwordHash,
        },
        select: userSelect,
      });

      await tx.passwordResetToken.create({
        data: { userId: user.id, token: input.otpHash, expiresAt: input.otpExpiresAt },
      });

      return user;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ConflictError("a user with this email already exists");
    }
    throw error;
  }
}

export async function recordLogin(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } }),
    prisma.session.create({ data: { userId, token: tokenHash, expiresAt } }),
  ]);
}

export function findSessionByToken(
  tokenHash: string,
): Promise<(Session & { user: { id: string; role: UserRole; isActive: boolean } }) | null> {
  return prisma.session.findUnique({
    where: { token: tokenHash },
    include: { user: { select: { id: true, role: true, isActive: true } } },
  });
}

export async function rotateSession(id: string, tokenHash: string, expiresAt: Date): Promise<void> {
  await prisma.session.update({ where: { id }, data: { token: tokenHash, expiresAt } });
}

export function deleteSession(id: string): Promise<Session> {
  return prisma.session.delete({ where: { id } });
}

export function findLatestUnusedOtp(userId: string): Promise<PasswordResetToken | null> {
  return prisma.passwordResetToken.findFirst({
    where: { userId, usedAt: null },
    orderBy: { createdAt: "desc" },
  });
}

export async function createOtpToken(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
  await prisma.$transaction([
    prisma.passwordResetToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    }),
    prisma.passwordResetToken.create({ data: { userId, token: tokenHash, expiresAt } }),
  ]);
}

export function markOtpUsed(id: string): Promise<PasswordResetToken> {
  return prisma.passwordResetToken.update({ where: { id }, data: { usedAt: new Date() } });
}

export async function resetPassword(userId: string, passwordHash: string): Promise<void> {
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { passwordHash } }),
    prisma.session.deleteMany({ where: { userId } }),
  ]);
}