import type { AuthenticatedUser } from "../core/auth/types.js";

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      user?: AuthenticatedUser;
    }
  }
}

export {};