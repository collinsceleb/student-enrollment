import { NextResponse } from "next/server";
import { flattenError } from "zod";

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
import { createAdminClient } from "@/lib/supabase/admin";
import { studentSchema } from "@/lib/validation/student.schema";

const MAX_ENROLLMENT_BODY_BYTES = 8 * 1024;

export async function POST(request: Request) {
  const contentType = request.headers
    .get("content-type")
    ?.split(";", 1)[0]
    .trim()
    .toLowerCase();
  if (contentType !== "application/json") {
    return NextResponse.json(
      { message: "Content-Type must be application/json." },
      { status: 415, headers: { "Cache-Control": "no-store" } }
    );
  }

  let body: unknown;
  try {
    body = await readLimitedJson(request, MAX_ENROLLMENT_BODY_BYTES);
  } catch (error) {
    const tooLarge = error instanceof RequestBodyTooLargeError;
    return NextResponse.json(
      { message: tooLarge ? "Request body is too large." : "Invalid request." },
      {
        status: tooLarge ? 413 : 400,
        headers: { "Cache-Control": "no-store" },
      }
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
      return NextResponse.json(
        { message: "The selected department does not exist." },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }
    if (error instanceof FacultyDepartmentMismatchError) {
      return NextResponse.json(
        { message: "The selected department does not belong to that faculty." },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }
    if (error instanceof DuplicateRegistrationNumberError) {
      return NextResponse.json(
        { message: "That registration number has already been enrolled." },
        { status: 409, headers: { "Cache-Control": "no-store" } }
      );
    }

    console.error("Student enrollment request failed:", error);
    return NextResponse.json(
      { message: "Enrollment could not be submitted. Please try again." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
