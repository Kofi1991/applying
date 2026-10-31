import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZapApply",
  description: "Your daily job shortlist, matched to your CV.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="en-GB">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Unbounded:wght@600;700&family=IBM+Plex+Sans:wght@400;500;600&display=swap" />
      </head>
      <body>
        <header className="nav">
          <Link href="/" className="logo">Zap<span>Apply</span></Link>
          <nav>
            {user ? (
              <>
                <Link href="/shortlist">Shortlist</Link>
                <Link href="/profile">Profile</Link>
                <form action="/auth/signout" method="post"><button className="btn ghost" style={{ padding: "4px 12px" }}>Sign out</button></form>
              </>
            ) : (
              <Link href="/login">Sign in</Link>
            )}
          </nav>
        </header>
        <main className="wrap">{children}</main>
      </body>
    </html>
  );
}
