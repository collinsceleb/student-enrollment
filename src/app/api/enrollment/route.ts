import { NextResponse } from "next/server";
import { flattenError } from "zod";

import {
  createStudent,
  verifyFacultyDepartmentMatch,
} from "@/features/students/student.service";
import { createClient } from "@/lib/supabase/server";
import { studentSchema } from "@/lib/validation/student.schema";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const parsed = studentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Validation failed.",
          errors: flattenError(parsed.error).fieldErrors,
        },
        { status: 400 }
      );
    }

    const supabaseClient = await createClient();
    const verifyMatch = await verifyFacultyDepartmentMatch(
      supabaseClient,
      parsed.data.faculty_id,
      parsed.data.department_id
    );

    if (!verifyMatch.valid) {
      return NextResponse.json(
        {
          message:
            verifyMatch.error ??
            "The selected department does not belong to the selected faculty.",
        },
        { status: 400 }
      );
    }

    const savedStudent = await createStudent(supabaseClient, parsed.data);

    return NextResponse.json(
      {
        message: "Enrollment submitted successfully.",
        studentId: savedStudent.id,
      },
      { status: 201 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";

    return NextResponse.json({ message }, { status: 500 });
  }
}
