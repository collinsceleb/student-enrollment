import { getCurrentAdminProfile } from "@/features/auth/auth.service";
import { ExportPipelineError } from "@/features/exports/export-fields";
import {
  exportMimeTypes,
  generateExportFile,
} from "@/features/exports/export-generator";
import { buildExportDataset } from "@/features/exports/export-pipeline";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "unauthenticated" }, { status: 401 });
  }

  const profile = await getCurrentAdminProfile(supabase);
  if (!profile.data?.role) {
    return Response.json({ error: "unauthorized" }, { status: 403 });
  }
  if (!profile.data.has_changed_password || !profile.data.session_is_current) {
    return Response.json(
      { error: "reauthentication-required" },
      { status: 401 }
    );
  }

  let requestBody: unknown;
  try {
    requestBody = await request.json();
  } catch {
    return Response.json({ error: "invalid-request" }, { status: 400 });
  }

  try {
    const dataset = await buildExportDataset(
      supabase,
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
