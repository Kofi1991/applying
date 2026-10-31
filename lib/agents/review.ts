import { extractJson, runToText } from "./claude";
import type { FoundRole, ReviewedRole } from "../types";

type Score = { url: string; fit_score: number; fit_reason: string; gaps: string };

/**
 * Agent 2: scores each role against the CV in a separate call from the Search agent,
 * so the search doesn't grade its own work. Keeps scores of 65 and above.
 */
export async function reviewRoles(cvText: string, roles: FoundRole[]): Promise<ReviewedRole[]> {
  if (!roles.length) return [];

  const text = await runToText({
    system:
      "You are the Reviewer for ZapApply. You compare job adverts with a candidate's CV like an experienced recruiter: " +
      "score real overlap in skills, tools, domain and seniority. Be honest about gaps. Never lower a score because of pay.",
    maxTokens: 6000,
    messages: [
      {
        role: "user",
        content:
          `CV:\n${cvText.slice(0, 12000)}\n\nRoles:\n${JSON.stringify(roles, null, 2)}\n\n` +
          `For every role, give a fit score from 0 to 100, a one-line reason, and the main gaps ("None major" if none). ` +
          `Reply with a JSON array inside <scores></scores>, each item {"url","fit_score","fit_reason","gaps"}.`,
      },
    ],
  });

  const scores = new Map(extractJson<Score[]>(text, "scores").map((s) => [s.url, s]));
  return roles
    .map((r) => {
      const s = scores.get(r.url);
      if (!s) return null;
      const fit_score = Math.round(s.fit_score);
      return {
        ...r,
        fit_score,
        fit_label: fit_score >= 85 ? "Very suitable" : "Good match",
        fit_reason: s.fit_reason,
        gaps: s.gaps,
      } as ReviewedRole;
    })
    .filter((r): r is ReviewedRole => !!r && r.fit_score >= 65)
    .sort((a, b) => b.fit_score - a.fit_score);
}
