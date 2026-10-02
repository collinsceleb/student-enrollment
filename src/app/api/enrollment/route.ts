import { NextResponse } from "next/server";
import { flattenError, z } from "zod";

import {
  createStudent,
  DepartmentNotFoundError,
  DuplicateRegistrationNumberError,
  FacultyDepartmentMismatchError,
} from "@/features/students/student.service";
import {
  readLimitedJson,
  RequestBodyTooLargeError,
} from "@/lib/server/read-limited-json";
import { verifyTurnstileToken } from "@/lib/server/turnstile";
import { createAdminClient } from "@/lib/supabase/admin";
import { studentSchema } from "@/lib/validation/student.schema";

const MAX_ENROLLMENT_BODY_BYTES = 8 * 1024;
const enrollmentEnvelopeSchema = z.looseObject({
  turnstile_token: z.string().min(1).max(2048),
});

type EnrollmentPreflightResult =
  | { ok: true; studentPayload: Record<string, unknown> }
  | { ok: false; response: Response };

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    { message },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}

async function prepareEnrollmentRequest(
  request: Request
): Promise<EnrollmentPreflightResult> {
  const contentType = request.headers
    .get("content-type")
    ?.split(";", 1)[0]
    .trim()
    .toLowerCase();
  if (contentType !== "application/json") {
    return { ok: false, response: errorResponse("Invalid request.", 415) };
  }

  let body: unknown;
  try {
    body = await readLimitedJson(request, MAX_ENROLLMENT_BODY_BYTES);
  } catch (error) {
    const tooLarge = error instanceof RequestBodyTooLargeError;
    return {
      ok: false,
      response: errorResponse(
        tooLarge ? "Request body is too large." : "Invalid request.",
        tooLarge ? 413 : 400
      ),
    };
  }

  const envelope = enrollmentEnvelopeSchema.safeParse(body);
  if (!envelope.success) {
    return {
      ok: false,
      response: errorResponse("Please complete the verification check.", 403),
    };
  }

  const verification = await verifyTurnstileToken(
    envelope.data.turnstile_token
  );
  if (verification === "rejected") {
    return {
      ok: false,
      response: errorResponse(
        "Verification failed. Please complete the check again.",
        403
      ),
    };
  }
  if (verification === "unavailable") {
    return {
      ok: false,
      response: errorResponse(
        "Verification is temporarily unavailable. Please try again.",
        503
      ),
    };
  }

  const studentPayload = Object.fromEntries(
    Object.entries(envelope.data).filter(([key]) => key !== "turnstile_token")
  );
  return { ok: true, studentPayload };
}

export async function POST(request: Request) {
  const preflight = await prepareEnrollmentRequest(request);
  if (!preflight.ok) return preflight.response;

  const parsed = studentSchema.safeParse(preflight.studentPayload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Validation failed.",
        errors: flattenError(parsed.error).fieldErrors,
      },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    await createStudent(createAdminClient(), parsed.data);

    return NextResponse.json(
      {
        message: "Enrollment submitted successfully.",
      },
      { status: 201, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    if (error instanceof DepartmentNotFoundError) {
      return errorResponse("The selected department does not exist.", 400);
    }
    if (error instanceof FacultyDepartmentMismatchError) {
      return errorResponse(
        "The selected department does not belong to that faculty.",
        400
      );
    }
    if (error instanceof DuplicateRegistrationNumberError) {
      return errorResponse(
        "That registration number has already been enrolled.",
        409
      );
    }

    console.error("Student enrollment request failed:", error);
    return errorResponse(
      "Enrollment could not be submitted. Please try again.",
      500
    );
  }
}
