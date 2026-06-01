import crypto from "crypto";

const ENCRYPTION_KEY = process.env.VAULT_ENCRYPTION_KEY || 
  "12345678901234567890123456789012"; // 32 bytes للـ development بس

export function encryptCredential(plaintext: string): {
  encrypted_payload: string;
  iv: string;
} {
  const iv = crypto.randomBytes(12); // 96 bits
  
  const cipher = crypto.createCipheriv(
    "aes-256-gcm",
    Buffer.from(ENCRYPTION_KEY),
    iv
  );

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  const payload = Buffer.concat([encrypted, authTag]);

  return {
    encrypted_payload: payload.toString("base64"),
    iv: iv.toString("base64"),
  };
}

export function decryptCredential(
  encrypted_payload: string,
  iv: string
): string {
  const payloadBuffer = Buffer.from(encrypted_payload, "base64");
  const ivBuffer = Buffer.from(iv, "base64");

  const authTag = payloadBuffer.slice(-16);
  const ciphertext = payloadBuffer.slice(0, -16);

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    Buffer.from(ENCRYPTION_KEY),
    ivBuffer
  );

  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}