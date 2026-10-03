import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabaseClient = await createClient();
  const { error } = await supabaseClient.auth.signOut();

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }

  return NextResponse.redirect(new URL("/", request.url));
}
