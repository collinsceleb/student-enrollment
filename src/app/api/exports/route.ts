import { getCurrentAdminProfile } from "@/features/auth/auth.service";
import { ExportPipelineError } from "@/features/exports/export-fields";
import {
  exportMimeTypes,
  generateExportFile,
} from "@/features/exports/export-generator";
import { buildExportDataset } from "@/features/exports/export-pipeline";
import {
  readLimitedJson,
  RequestBodyTooLargeError,
} from "@/lib/server/read-limited-json";
import { consumeRateLimit } from "@/lib/server/rate-limit";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_EXPORT_BODY_BYTES = 16 * 1024;

function getFilename(dataset: Awaited<ReturnType<typeof buildExportDataset>>) {
  let scope: string;
  switch (dataset.scope.kind) {
    case "department":
      scope = "department";
      break;
    case "faculty":
      scope = "faculty";
      break;
    case "all":
      scope = "all-students";
      break;
  }
  const day = dataset.metadata.createdAt.slice(0, 10);
  return `student-enrollment-${scope}-${day}.${dataset.format}`;
}

export async function POST(request: Request) {
  const supabaseClient = await createClient();
  const {
    data: { user },
  } = await supabaseClient.auth.getUser();
  if (!user) {
    return Response.json({ error: "unauthenticated" }, { status: 401 });
  }

  const profile = await getCurrentAdminProfile(supabaseClient);
  if (!profile.data?.role) {
    return Response.json({ error: "unauthorized" }, { status: 403 });
  }
  if (!profile.data.has_changed_password || !profile.data.session_is_current) {
    return Response.json(
      { error: "reauthentication-required" },
      { status: 401 }
    );
  }

  let exportLimit;
  try {
    exportLimit = await consumeRateLimit("export", user.id);
  } catch {
    return Response.json(
      { error: "rate-limit-unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
  if (!exportLimit.allowed) {
    return Response.json(
      { error: "rate-limited" },
      {
        status: 429,
        headers: {
          "Cache-Control": "no-store",
          "Retry-After": String(exportLimit.retryAfterSeconds),
        },
      }
    );
  }

  const contentType = request.headers
    .get("content-type")
    ?.split(";", 1)[0]
    .trim()
    .toLowerCase();
  if (contentType !== "application/json") {
    return Response.json(
      { error: "unsupported-content-type" },
      { status: 415, headers: { "Cache-Control": "no-store" } }
    );
  }

  let requestBody: unknown;
  try {
    requestBody = await readLimitedJson(request, MAX_EXPORT_BODY_BYTES);
  } catch (error) {
    const tooLarge = error instanceof RequestBodyTooLargeError;
    return Response.json(
      { error: tooLarge ? "request-too-large" : "invalid-request" },
      {
        status: tooLarge ? 413 : 400,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }

  try {
    const dataset = await buildExportDataset(
      supabaseClient,
      profile.data,
      requestBody
    );
    const file = await generateExportFile(dataset);
    const filename = getFilename(dataset);
    const responseBuffer = new ArrayBuffer(file.byteLength);
    new Uint8Array(responseBuffer).set(file);

    return new Response(responseBuffer, {
      status: 200,
      headers: {
        "Content-Type": exportMimeTypes[dataset.format],
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(file.byteLength),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof ExportPipelineError) {
      return Response.json(
        { error: error.message },
        { status: error.status, headers: { "Cache-Control": "no-store" } }
      );
    }
    return Response.json(
      { error: "Export generation failed. Please try again." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
