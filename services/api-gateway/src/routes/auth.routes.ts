import { Router } from "express";
import { signAccessToken } from "../services/auth.service";

export const authRouter = Router();

authRouter.post("/dev-login", (req, res) => {
  const { userId, tenantId, role } = req.body;

  if (!userId || !tenantId || !role) {
    return res.status(400).json({
      error: "userId, tenantId and role are required",
    });
  }

  const token = signAccessToken({
    userId,
    tenantId,
    role,
  });

  return res.json({ accessToken: token });
});