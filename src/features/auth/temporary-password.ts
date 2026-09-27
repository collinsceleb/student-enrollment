import "server-only";

import { randomBytes, randomUUID } from "node:crypto";

export function generateTemporaryPassword(): string {
  return randomBytes(32).toString("base64url");
}

export function generateTemporaryPasswordResetId(): string {
  return randomUUID();
}

export function getTemporaryPasswordIssuedAt(now = Date.now()): string {
  return new Date((Math.floor(now / 1000) + 1) * 1000).toISOString();
}
