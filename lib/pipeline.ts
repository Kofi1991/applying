import { createAdminClient } from "./supabase/admin";
import { extractCvText } from "./agents/cv";
import { searchRoles } from "./agents/search";
import { reviewRoles } from "./agents/review";
import { buildShortlistPdf } from "./pdf";
import { sendShortlistEmail } from "./email";
import type { Profile } from "./types";

/** Today's date and hour in UK time, whatever timezone the server runs in. */
export function ukNow(d = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hour12: false, weekday: "short",
    }).formatToParts(d).map((p) => [p.type, p.value])
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    hour: Number(parts.hour) % 24,
    weekend: parts.weekday === "Sat" || parts.weekday === "Sun",
  };
}

/** Profiles whose chosen hour has arrived today and that haven't run yet today. */
export function isDue(p: Profile, now = ukNow()) {
  if (!p.active || !p.cv_path) return false;
  if (p.weekdays_only && now.weekend) return false;
  if (p.last_run_on === now.date) return false;
  return now.hour >= p.run_hour;
}

/** Search → review → save → PDF → email, for one user. */
export async function runForProfile(p: Profile) {
  const db = createAdminClient();
  const now = ukNow();
  const { data: run } = await db.from("runs").insert({ profile_id: p.id }).select("id").single();

  try {
    // Extract the CV text once and keep it.
    if (!p.cv_text && p.cv_path) {
      const { data: file, error } = await db.storage.from("cvs").download(p.cv_path);
      if (error || !file) throw new Error(`Could not read CV: ${error?.message}`);
      p.cv_text = await extractCvText(new Uint8Array(await file.arrayBuffer()));
      await db.from("profiles").update({ cv_text: p.cv_text }).eq("id", p.id);
    }

    const { data: seenRows } = await db.from("roles").select("url").eq("profile_id", p.id);
    const seen = (seenRows ?? []).map((r) => r.url as string);

    const found = await searchRoles(p, seen);
    const kept = await reviewRoles(p.cv_text ?? "", found);

    if (kept.length) {
      await db.from("roles").upsert(
        kept.map((r) => ({ profile_id: p.id, found_on: now.date, ...r })),
        { onConflict: "profile_id,url", ignoreDuplicates: true }
      );
      if (p.email) {
        const pdf = await buildShortlistPdf(p.full_name ?? "you", now.date, kept);
        await sendShortlistEmail({ to: p.email, name: p.full_name?.split(" ")[0] ?? "there", date: now.date, roles: kept, pdf });
      }
    }

    await db.from("profiles").update({ last_run_on: now.date }).eq("id", p.id);
    await db.from("runs").update({ finished_at: new Date().toISOString(), roles_found: found.length, roles_kept: kept.length }).eq("id", run?.id);
    return { found: found.length, kept: kept.length };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await db.from("runs").update({ finished_at: new Date().toISOString(), error: message }).eq("id", run?.id);
    throw e;
  }
}

/** Runs every profile that is due. Called hourly by the scheduler. */
export async function runDueProfiles() {
  const db = createAdminClient();
  const { data, error } = await db.from("profiles").select("*").eq("active", true);
  if (error) throw error;
  const due = (data as Profile[]).filter((p) => isDue(p));
  const results: { id: string; ok: boolean; detail: string }[] = [];
  for (const p of due) {
    try {
      const r = await runForProfile(p);
      results.push({ id: p.id, ok: true, detail: `${r.kept}/${r.found} roles kept` });
    } catch (e) {
      results.push({ id: p.id, ok: false, detail: e instanceof Error ? e.message : String(e) });
    }
  }
  return results;
}
