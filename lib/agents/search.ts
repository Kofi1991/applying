import { extractJson, runToText } from "./claude";
import type { FoundRole, Profile } from "../types";

/** Agent 1: finds open roles that match the user's preferences, using Claude's web search tool. */
export async function searchRoles(profile: Profile, alreadySeen: string[]): Promise<FoundRole[]> {
  const where = [
    ...profile.locations,
    ...(profile.include_uk_remote ? ["UK fully remote"] : []),
  ].join(", ");

  const brief = [
    `Job titles: ${profile.job_titles.join(", ") || "roles that fit the CV below"}`,
    `Locations: ${where}`,
    `Office attendance: at most ${profile.max_office_days} day(s) a week in the office. Exclude roles needing more. If the advert doesn't say, include it and mark office_days "Not stated".`,
    `Job types: ${profile.job_types.join(" and ")}`,
    `Pay: do not filter on pay. Record it if the advert states it.`,
  ].join("\n");

  const text = await runToText({
    system:
      "You are the Search agent for ZapApply, a job-search service. You find currently open job adverts that match a candidate's brief. " +
      "Prefer the employer's own careers page or ATS (Greenhouse, Lever, Ashby, Workable, Workday, SmartRecruiters) over job-board copies. " +
      "Only return adverts you have actually opened in search results and that look live. Never invent a role or a link.",
    tools: [
      {
        type: "web_search_20260318",
        name: "web_search",
        max_uses: 15,
        user_location: { type: "approximate", country: "GB", timezone: "Europe/London" },
      },
    ],
    messages: [
      {
        role: "user",
        content:
          `Find up to 15 matching open roles.\n\n${brief}\n\n` +
          (profile.cv_text ? `Candidate CV (for context on seniority and skills):\n${profile.cv_text.slice(0, 6000)}\n\n` : "") +
          (alreadySeen.length ? `Skip these links, the candidate has already seen them:\n${alreadySeen.slice(-300).join("\n")}\n\n` : "") +
          `When done, reply with a JSON array inside <roles></roles>. Each item: ` +
          `{"title","company","url","office_days" ("0" for fully remote, "1", "2" or "Not stated"),"job_type" ("Permanent" or "Contract"),"pay" (string or null),"summary" (two sentences on the key requirements)}.`,
      },
    ],
  });

  const roles = extractJson<FoundRole[]>(text, "roles");
  const seen = new Set(alreadySeen);
  return roles.filter((r) => r.url && r.title && r.company && !seen.has(r.url));
}
