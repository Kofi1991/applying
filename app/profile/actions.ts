"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type FormState = { ok?: string; error?: string };

const list = (v: FormDataEntryValue | null) =>
  String(v ?? "").split(",").map((s) => s.trim()).filter(Boolean);
const optInt = z.preprocess((v) => (v === "" || v == null ? null : Number(v)), z.number().int().min(0).nullable());

const ProfileSchema = z.object({
  full_name: z.string().trim().min(1, "Add your name"),
  phone: z.string().trim().optional(),
  linkedin_url: z.string().trim().optional(),
  job_titles: z.array(z.string()).min(1, "Add at least one job title"),
  locations: z.array(z.string()),
  include_uk_remote: z.boolean(),
  max_office_days: z.coerce.number().int().min(0).max(5),
  job_types: z.array(z.enum(["permanent", "contract"])).min(1, "Pick permanent, contract or both"),
  salary_expectation: optInt,
  day_rate_expectation: optInt,
  notice_period: z.string().trim().optional(),
  right_to_work: z.string().trim().optional(),
  run_hour: z.coerce.number().int().min(0).max(23),
  weekdays_only: z.boolean(),
  active: z.boolean(),
});

export async function saveProfile(_: FormState, form: FormData): Promise<FormState> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const parsed = ProfileSchema.safeParse({
    full_name: form.get("full_name"),
    phone: form.get("phone") ?? "",
    linkedin_url: form.get("linkedin_url") ?? "",
    job_titles: list(form.get("job_titles")),
    locations: list(form.get("locations")),
    include_uk_remote: form.get("include_uk_remote") === "on",
    max_office_days: form.get("max_office_days"),
    job_types: form.getAll("job_types"),
    salary_expectation: form.get("salary_expectation"),
    day_rate_expectation: form.get("day_rate_expectation"),
    notice_period: form.get("notice_period") ?? "",
    right_to_work: form.get("right_to_work") ?? "",
    run_hour: form.get("run_hour"),
    weekdays_only: form.get("weekdays_only") === "on",
    active: form.get("active") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const update: Record<string, unknown> = { ...parsed.data, id: user.id, email: user.email, updated_at: new Date().toISOString() };

  const cv = form.get("cv");
  if (cv instanceof File && cv.size > 0) {
    if (cv.type !== "application/pdf") return { error: "Upload your CV as a PDF." };
    if (cv.size > 4 * 1024 * 1024) return { error: "Your CV must be under 4 MB." };
    const path = `${user.id}/cv.pdf`;
    const { error } = await supabase.storage.from("cvs").upload(path, cv, { upsert: true, contentType: "application/pdf" });
    if (error) return { error: `Couldn't upload your CV: ${error.message}` };
    update.cv_path = path;
    update.cv_text = null; // re-read on the next run
  }

  const { error } = await supabase.from("profiles").upsert(update);
  if (error) return { error: `Couldn't save: ${error.message}` };
  revalidatePath("/profile");
  return { ok: "Saved. Your next shortlist will use these settings." };
}

/** Deletes the user's CV, roles, profile and login. */
export async function deleteAccount() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const admin = createAdminClient();
  await admin.storage.from("cvs").remove([`${user.id}/cv.pdf`]);
  await admin.auth.admin.deleteUser(user.id); // profile, roles and runs cascade
  await supabase.auth.signOut();
  redirect("/");
}
