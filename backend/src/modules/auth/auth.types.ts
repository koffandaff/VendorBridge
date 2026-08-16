import type { UserRole } from "@prisma/client";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
}

export interface AuthUserDto {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string | null;
  emailVerified: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
}

export interface TokenPairDto {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponseDto {
  user: AuthUserDto;
  tokens: TokenPairDto;
}