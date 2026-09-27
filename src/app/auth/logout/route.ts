import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabaseClient = await createClient();
  const { error } = await supabaseClient.auth.signOut();

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }

  return NextResponse.redirect(
    new URL(
      "/login",
      process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
    )
  );
}
