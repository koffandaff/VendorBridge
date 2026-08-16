import type { RequestHandler } from "express";
import { prisma } from "../../shared/prisma.js";
import { AuthenticationError } from "../errors/app-error.js";
import { verifyAccessToken } from "./jwt.js";

export const authenticate: RequestHandler = async (req, _res, next) => {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      throw new AuthenticationError("access token required");
    }

    const token = header.slice("Bearer ".length).trim();
    if (!token) {
      throw new AuthenticationError("access token required");
    }

    const payload = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });

    if (!user) {
      throw new AuthenticationError("user no longer exists");
    }

    if (!user.isActive) {
      throw new AuthenticationError("account is disabled");
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    next(error);
  }
};