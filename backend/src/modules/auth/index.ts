import { Router } from "express";

export const authRouter: Router = Router();

authRouter.get("/status", (_req, res) => {
  res.json({ message: "Auth module endpoint placeholder" });
});
