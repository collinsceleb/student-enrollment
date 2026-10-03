import { NextResponse } from "next/server";
import { z } from "zod";

import { consumeRateLimit, getRequestIdentity } from "@/lib/server/rate-limit";
import {
  readLimitedJson,
  RequestBodyTooLargeError,
} from "@/lib/server/read-limited-json";
import { verifyTurnstileToken } from "@/lib/server/turnstile";
import { createClient } from "@/lib/supabase/server";

const MAX_LOGIN_BODY_BYTES = 8 * 1024;
const loginSchema = z
  .object({
    email: z.string().trim().toLowerCase().pipe(z.email()),
    password: z.string().min(1).max(256),
    turnstile_token: z.string().min(1).max(2048),
    website: z.string().max(256),
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
    return errorResponse("Please complete the verification check.", 400);
  }
  if (parsed.data.website) {
    return errorResponse("Invalid sign-in request.", 400);
  }

  const verification = await verifyTurnstileToken(parsed.data.turnstile_token, {
    expectedHostname: new URL(request.url).hostname,
    expectedAction: "login",
  });
  if (verification === "rejected") {
    return errorResponse(
      "Verification failed. Please complete the check again.",
      403
    );
  }
  if (verification === "unavailable") {
    return errorResponse("Verification is temporarily unavailable.", 503);
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
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) return errorResponse("Invalid email or password.", 401);

  return NextResponse.json(
    { message: "Signed in successfully." },
    { headers: { "Cache-Control": "no-store" } }
  );
}
