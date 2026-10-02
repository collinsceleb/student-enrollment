import { NextResponse } from "next/server";
import { z } from "zod";

import { consumeRateLimit, getRequestIdentity } from "@/lib/server/rate-limit";
import {
  readLimitedJson,
  RequestBodyTooLargeError,
} from "@/lib/server/read-limited-json";
import { createClient } from "@/lib/supabase/server";

const MAX_LOGIN_BODY_BYTES = 8 * 1024;
const loginSchema = z
  .object({
    email: z.string().trim().toLowerCase().pipe(z.email()),
    password: z.string().min(1).max(256),
  })
  .strict();

function errorResponse(
  message: string,
  status: number,
  retryAfterSeconds?: number
) {
  const headers = new Headers({ "Cache-Control": "no-store" });
  if (retryAfterSeconds !== undefined) {
    headers.set("Retry-After", String(retryAfterSeconds));
  }
  return NextResponse.json({ message }, { status, headers });
}

export async function POST(request: Request) {
  const identity = getRequestIdentity(request);
  let ipLimit;
  try {
    ipLimit = await consumeRateLimit("login-ip", identity);
  } catch {
    return errorResponse("Sign in is temporarily unavailable.", 503);
  }
  if (!ipLimit.allowed) {
    return errorResponse(
      "Too many sign-in attempts. Please try again later.",
      429,
      ipLimit.retryAfterSeconds
    );
  }

  const contentType = request.headers
    .get("content-type")
    ?.split(";", 1)[0]
    .trim()
    .toLowerCase();
  if (contentType !== "application/json") {
    return errorResponse("Invalid sign-in request.", 415);
  }

  let body: unknown;
  try {
    body = await readLimitedJson(request, MAX_LOGIN_BODY_BYTES);
  } catch (error) {
    return errorResponse(
      error instanceof RequestBodyTooLargeError
        ? "Sign-in request is too large."
        : "Invalid sign-in request.",
      error instanceof RequestBodyTooLargeError ? 413 : 400
    );
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("Invalid email or password.", 400);
  }

  let emailLimit;
  try {
    emailLimit = await consumeRateLimit("login-email", parsed.data.email);
  } catch {
    return errorResponse("Sign in is temporarily unavailable.", 503);
  }
  if (!emailLimit.allowed) {
    return errorResponse(
      "Too many sign-in attempts. Please try again later.",
      429,
      emailLimit.retryAfterSeconds
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return errorResponse("Invalid email or password.", 401);

  return NextResponse.json(
    { message: "Signed in successfully." },
    { headers: { "Cache-Control": "no-store" } }
  );
}
