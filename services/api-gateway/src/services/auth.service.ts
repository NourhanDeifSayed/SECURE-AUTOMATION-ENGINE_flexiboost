import jwt from "jsonwebtoken";

const JWT_SECRET = "sae_phase1_dev_secret_fixed_123";

export type AccessTokenPayload = {
  userId: string;
  tenantId: string;
  role: "admin" | "editor" | "viewer";
};

export function signAccessToken(payload: AccessTokenPayload): string {
  console.log("JWT SECRET USED FOR SIGN:", JWT_SECRET);

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "15m",
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  console.log("JWT SECRET USED FOR VERIFY:", JWT_SECRET);

  return jwt.verify(token, JWT_SECRET) as AccessTokenPayload;
}