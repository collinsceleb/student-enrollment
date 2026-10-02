import "server-only";

import { z } from "zod";

const siteverifyUrl =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const siteverifyResponseSchema = z.object({
  success: z.boolean(),
  hostname: z.string().optional(),
  action: z.string().optional(),
});

export type TurnstileVerification = "verified" | "rejected" | "unavailable";

interface TurnstileVerificationOptions {
  readonly secretKey?: string;
  readonly expectedHostname?: string;
  readonly fetcher?: typeof fetch;
}

export async function verifyTurnstileToken(
  token: string,
  options: TurnstileVerificationOptions = {}
): Promise<TurnstileVerification> {
  const secretKey = options.secretKey ?? process.env.TURNSTILE_SECRET_KEY;
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const fetcher = options.fetcher ?? fetch;

  if (!secretKey) return "unavailable";
  if (token.length === 0 || token.length > 2048) return "rejected";

  let expectedHostname = options.expectedHostname;
  if (!expectedHostname) {
    if (!configuredSiteUrl) return "unavailable";
    try {
      expectedHostname = new URL(configuredSiteUrl).hostname;
    } catch {
      return "unavailable";
    }
  }

  try {
    const response = await fetcher(siteverifyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: secretKey, response: token }),
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    if (!response.ok) return "unavailable";

    const result = siteverifyResponseSchema.safeParse(await response.json());
    if (!result.success) return "unavailable";
    if (!result.data.success) return "rejected";
    if (
      result.data.hostname !== expectedHostname ||
      result.data.action !== "enrollment"
    ) {
      return "rejected";
    }

    return "verified";
  } catch {
    return "unavailable";
  }
}
