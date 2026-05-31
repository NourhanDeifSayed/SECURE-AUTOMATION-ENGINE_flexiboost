import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../services/auth.service";

export type AuthenticatedRequest = Request & {
  user?: {
    userId: string;
    tenantId: string;
    role: "admin" | "editor" | "viewer";
  };
  tenantId?: string;
};

export function tenantMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  console.log("Authorization header:", authHeader);

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Missing or invalid Authorization header",
    });
  }

  try {
    const token = authHeader.replace("Bearer ", "").trim();

    console.log("Extracted token:", token.slice(0, 25) + "...");

    const payload = verifyAccessToken(token);

    console.log("JWT payload:", payload);

    req.user = payload;
    req.tenantId = payload.tenantId;

    return next();
  } catch (error) {
    console.error("JWT verification failed:", error);

    return res.status(401).json({
      error: "Invalid or expired token",
    });
  }
}