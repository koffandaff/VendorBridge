import type { RequestHandler } from "express";
import type { UserRole } from "@prisma/client";
import { AuthorizationError } from "../errors/app-error.js";
import { ROLE_PERMISSIONS, type Permission } from "./roles.js";

export function requireRole(...allowedRoles: UserRole[]): RequestHandler {
  return (req, _res, next) => {
    if (req.user && allowedRoles.includes(req.user.role)) {
      next();
      return;
    }

    next(new AuthorizationError("insufficient permissions"));
  };
}

export function requirePermission(...requiredPermissions: Permission[]): RequestHandler {
  return (req, _res, next) => {
    if (req.user) {
      const userPermissions = ROLE_PERMISSIONS[req.user.role];
      if (requiredPermissions.some((permission) => userPermissions.includes(permission))) {
        next();
        return;
      }
    }

    next(new AuthorizationError("insufficient permissions"));
  };
}