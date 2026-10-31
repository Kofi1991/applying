import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type Row = {
  id: string; url: string; title: string; company: string; office_days: string | null; job_type: string | null;
  pay: string | null; fit_score: number | null; fit_label: string | null; fit_reason: string | null; gaps: string | null; found_on: string;
};

export default async function Shortlist() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [{ data: roles }, { data: profile }] = await Promise.all([
    supabase.from("roles").select("*").order("found_on", { ascending: false }).order("fit_score", { ascending: false }).limit(100),
    supabase.from("profiles").select("cv_path, run_hour").eq("id", user!.id).maybeSingle(),
  ]);

  const rows = (roles ?? []) as Row[];
  const byDay = rows.reduce<Record<string, Row[]>>((acc, r) => ((acc[r.found_on] ??= []).push(r), acc), {});

  return (
    <>
      <h1 style={{ fontSize: 32 }}>Your shortlist</h1>
      {!profile?.cv_path ? (
        <div className="card"><p style={{ margin: 0 }}>Add your CV and preferences on your <Link href="/profile">profile</Link> to get your first shortlist.</p></div>
      ) : !rows.length ? (
        <div className="card">
          <p style={{ margin: 0 }}>
            No roles yet. Your first shortlist arrives at {String(profile.run_hour).padStart(2, "0")}:00 UK time on the next search day,
            and you'll get it by email too.
          </p>
        </div>
      ) : (
        Object.entries(byDay).map(([day, list]) => (
          <section key={day}>
            <h2>{new Date(day).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</h2>
            <div className="roles">
              {list.map((r) => (
                <article key={r.id} className="card role">
                  <div>
                    <h3>{r.title}</h3>
                    <div className="meta">
                      {r.company} · {r.office_days === "0" ? "Remote" : `${r.office_days} office day(s)`} · {r.job_type}{r.pay ? ` · ${r.pay}` : ""}
                    </div>
                    <p>{r.fit_reason}</p>
                    {r.gaps && r.gaps !== "None major" && <p className="hint">Gaps: {r.gaps}</p>}
                  </div>
                  <div style={{ display: "grid", gap: 8, justifyItems: "end" }}>
                    <span className={`pill ${(r.fit_score ?? 0) >= 85 ? "good" : "warn"}`}>{r.fit_score} · {r.fit_label}</span>
                    <a className="btn" href={r.url} target="_blank" rel="noopener noreferrer">Apply</a>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))
      )}
    </>
  );
}
