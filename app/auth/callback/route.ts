import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** The magic-link email lands here; we swap the code for a session and send new users to set up their profile. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL("/profile", url.origin));
  }
  return NextResponse.redirect(new URL("/login", url.origin));
}
