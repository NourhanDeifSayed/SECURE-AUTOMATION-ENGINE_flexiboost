import * as crypto from "crypto";

const OAUTH_ENCRYPTION_KEY = crypto
  .createHash("sha256")
  .update("phase2-oauth-dev-key-change-later")
  .digest();

export function encryptToken(token: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", OAUTH_ENCRYPTION_KEY, iv);

  const encrypted = Buffer.concat([
    cipher.update(token, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return {
    encrypted: Buffer.concat([encrypted, authTag]).toString("base64"),
    iv: iv.toString("base64"),
  };
}

export function decryptToken(encryptedPayload: string, ivBase64: string) {
  const payload = Buffer.from(encryptedPayload, "base64");
  const iv = Buffer.from(ivBase64, "base64");

  const encrypted = payload.subarray(0, payload.length - 16);
  const authTag = payload.subarray(payload.length - 16);

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    OAUTH_ENCRYPTION_KEY,
    iv
  );

  decipher.setAuthTag(authTag);

  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]).toString("utf8");
}

export function simulateOAuthRefresh(provider: string, oldRefreshToken: string) {
  const now = Date.now();

  return {
    access_token: `${provider}_access_${now}`,
    refresh_token: `${provider}_refresh_${now}`,
    expires_in: 3600,
    old_refresh_token_used: oldRefreshToken,
  };
}