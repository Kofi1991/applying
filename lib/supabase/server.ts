import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Supabase client for server components and server actions, acting as the signed-in user. */
export function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => {
          try {
            toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Called from a server component: the middleware refreshes the session instead.
          }
        },
      },
    }
  );
}
