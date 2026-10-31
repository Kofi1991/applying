"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useState } from "react";
import { deleteAccount, saveProfile, type FormState } from "./actions";
import type { Profile } from "@/lib/types";

function Save() {
  const { pending } = useFormStatus();
  return <button className="btn" disabled={pending}>{pending ? "Saving…" : "Save profile"}</button>;
}

export default function ProfileForm({ profile: p }: { profile: Profile | null }) {
  const [state, action] = useFormState<FormState, FormData>(saveProfile, {});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const hours = Array.from({ length: 24 }, (_, h) => h);

  return (
    <>
      <form action={action} className="card" style={{ display: "grid", gap: 24 }}>
        <section>
          <h2 style={{ marginTop: 0 }}>About you</h2>
          <div className="fields">
            <div><label htmlFor="full_name">Full name</label><input id="full_name" name="full_name" defaultValue={p?.full_name ?? ""} required /></div>
            <div><label htmlFor="phone">Phone</label><input id="phone" name="phone" defaultValue={p?.phone ?? ""} /></div>
            <div><label htmlFor="linkedin_url">LinkedIn</label><input id="linkedin_url" name="linkedin_url" defaultValue={p?.linkedin_url ?? ""} /></div>
            <div>
              <label htmlFor="cv">CV (PDF)</label>
              <input id="cv" name="cv" type="file" accept="application/pdf" />
              <p className="hint">{p?.cv_path ? "A CV is on file. Upload a new one to replace it." : "Required before your first shortlist."}</p>
            </div>
          </div>
        </section>

        <section>
          <h2 style={{ marginTop: 0 }}>What you're looking for</h2>
          <div className="fields">
            <div>
              <label htmlFor="job_titles">Job titles</label>
              <input id="job_titles" name="job_titles" defaultValue={p?.job_titles?.join(", ") ?? ""} placeholder="AI QA Engineer, SDET" />
              <p className="hint">Separate with commas.</p>
            </div>
            <div>
              <label htmlFor="locations">Locations</label>
              <input id="locations" name="locations" defaultValue={p?.locations?.join(", ") ?? "London"} />
              <div className="checks" style={{ marginTop: 8 }}>
                <label><input type="checkbox" name="include_uk_remote" defaultChecked={p?.include_uk_remote ?? true} /> Include UK remote</label>
              </div>
            </div>
            <div>
              <label htmlFor="max_office_days">Most office days a week</label>
              <select id="max_office_days" name="max_office_days" defaultValue={String(p?.max_office_days ?? 2)}>
                {[0, 1, 2, 3, 4, 5].map((d) => <option key={d} value={d}>{d === 0 ? "0 (remote only)" : d}</option>)}
              </select>
            </div>
            <div>
              <label>Job type</label>
              <div className="checks">
                <label><input type="checkbox" name="job_types" value="permanent" defaultChecked={p ? p.job_types.includes("permanent") : true} /> Permanent</label>
                <label><input type="checkbox" name="job_types" value="contract" defaultChecked={p ? p.job_types.includes("contract") : true} /> Contract</label>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 style={{ marginTop: 0 }}>Your answers for applications</h2>
          <div className="fields">
            <div><label htmlFor="salary_expectation">Salary expectation (£/year)</label><input id="salary_expectation" name="salary_expectation" inputMode="numeric" defaultValue={p?.salary_expectation ?? ""} /></div>
            <div><label htmlFor="day_rate_expectation">Day rate expectation (£/day)</label><input id="day_rate_expectation" name="day_rate_expectation" inputMode="numeric" defaultValue={p?.day_rate_expectation ?? ""} /></div>
            <div><label htmlFor="notice_period">Notice period</label><input id="notice_period" name="notice_period" defaultValue={p?.notice_period ?? ""} placeholder="1 week" /></div>
            <div><label htmlFor="right_to_work">Right to work in the UK</label><input id="right_to_work" name="right_to_work" defaultValue={p?.right_to_work ?? ""} placeholder="Yes, no sponsorship needed" /></div>
          </div>
          <p className="hint">These don't filter your search. They're the answers used when you apply.</p>
        </section>

        <section>
          <h2 style={{ marginTop: 0 }}>When to search</h2>
          <div className="fields">
            <div>
              <label htmlFor="run_hour">Send my shortlist at (UK time)</label>
              <select id="run_hour" name="run_hour" defaultValue={String(p?.run_hour ?? 8)}>
                {hours.map((h) => <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>)}
              </select>
            </div>
            <div className="checks" style={{ alignSelf: "end" }}>
              <label><input type="checkbox" name="weekdays_only" defaultChecked={p?.weekdays_only ?? true} /> Weekdays only</label>
              <label><input type="checkbox" name="active" defaultChecked={p?.active ?? true} /> Searching is on</label>
            </div>
          </div>
        </section>

        {state.error && <p className="msg err">{state.error}</p>}
        {state.ok && <p className="msg ok">{state.ok}</p>}
        <div><Save /></div>
      </form>

      <div className="card" style={{ marginTop: 24 }}>
        <h2 style={{ marginTop: 0 }}>Delete your account</h2>
        <p className="hint" style={{ fontSize: 15 }}>This removes your CV, your profile and every role we've found for you. It can't be undone.</p>
        {confirmDelete ? (
          <form action={deleteAccount} style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button className="btn" style={{ background: "var(--warn)" }}>Yes, delete everything</button>
            <button type="button" className="btn ghost" onClick={() => setConfirmDelete(false)}>Cancel</button>
          </form>
        ) : (
          <button className="btn ghost" onClick={() => setConfirmDelete(true)}>Delete account</button>
        )}
      </div>
    </>
  );
}
