import { NextResponse } from "next/server";
import { flattenError } from "zod";

import { getCurrentAdminProfile } from "@/features/auth/auth.service";
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
import { consumeRateLimit, getRequestIdentity } from "@/lib/server/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { studentSchema } from "@/lib/validation/student.schema";

const MAX_ENROLLMENT_BODY_BYTES = 8 * 1024;

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    { message },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}

async function checkEnrollmentLimit(
  request: Request
): Promise<Response | null> {
  try {
    const decision = await consumeRateLimit(
      "enrollment",
      getRequestIdentity(request)
    );
    if (decision.allowed) return null;

    return NextResponse.json(
      { message: "Too many enrollment attempts. Please try again later." },
      {
        status: 429,
        headers: {
          "Cache-Control": "no-store",
          "Retry-After": String(decision.retryAfterSeconds),
        },
      }
    );
  } catch {
    return errorResponse(
      "Enrollment is temporarily unavailable. Please try again.",
      503
    );
  }
}

export async function POST(request: Request) {
  const rateLimitResponse = await checkEnrollmentLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return errorResponse(
      "Authentication required to access student enrollment.",
      401
    );
  }

  const profile = await getCurrentAdminProfile(supabase);
  if (!profile.data?.role) {
    return errorResponse(
      "You are not authorized to perform student enrollments.",
      403
    );
  }

  if (!profile.data.has_changed_password || !profile.data.session_is_current) {
    return errorResponse(
      "Session expired or temporary password change required.",
      401
    );
  }

  const contentType = request.headers
    .get("content-type")
    ?.split(";", 1)[0]
    .trim()
    .toLowerCase();
  if (contentType !== "application/json") {
    return errorResponse("Invalid request.", 415);
  }

  let body: unknown;
  try {
    body = await readLimitedJson(request, MAX_ENROLLMENT_BODY_BYTES);
  } catch (error) {
    const tooLarge = error instanceof RequestBodyTooLargeError;
    return errorResponse(
      tooLarge ? "Request body is too large." : "Invalid request.",
      tooLarge ? 413 : 400
    );
  }

  const parsed = studentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Validation failed.",
        errors: flattenError(parsed.error).fieldErrors,
      },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  if (profile.data.role === "FACULTY_ADMIN") {
    if (
      !profile.data.faculty_id ||
      parsed.data.faculty_id !== profile.data.faculty_id
    ) {
      return errorResponse(
        "You are only permitted to enroll students into your assigned faculty.",
        403
      );
    }
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
