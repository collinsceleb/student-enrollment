import { NextResponse } from "next/server";

import { ensureFirstSuperAdmin } from "@/features/auth/super-admin-bootstrap";

export async function POST() {
  try {
    const result = await ensureFirstSuperAdmin();
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Bootstrap failed.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
