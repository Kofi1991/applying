import { Resend } from "resend";
import type { ReviewedRole } from "./types";

function esc(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
}

/** Emails the user their shortlist with the PDF attached. Very suitable roles go in the subject line. */
export async function sendShortlistEmail(opts: {
  to: string; name: string; date: string; roles: ReviewedRole[]; pdf: Uint8Array;
}) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const top = opts.roles.filter((r) => r.fit_score >= 85);
  const subject = top.length
    ? `ZapApply: ${top.length} very suitable role${top.length > 1 ? "s" : ""} today, including ${top[0].title} at ${top[0].company}`
    : `ZapApply: ${opts.roles.length} new role${opts.roles.length === 1 ? "" : "s"} for you`;

  const rows = opts.roles
    .map((r) =>
      `<tr><td style="padding:6px 8px"><b>${esc(r.title)}</b><br>${esc(r.company)}</td>` +
      `<td style="padding:6px 8px">${esc(r.office_days)}</td>` +
      `<td style="padding:6px 8px">${r.fit_score} ${esc(r.fit_label)}</td>` +
      `<td style="padding:6px 8px"><a href="${esc(r.url)}">Apply</a></td></tr>`)
    .join("");

  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: opts.to,
    subject,
    html:
      `<p>Hi ${esc(opts.name)},</p><p>Here are today's roles, best matches first. The full shortlist is attached as a PDF.</p>` +
      `<table style="border-collapse:collapse;font-family:sans-serif;font-size:14px">` +
      `<tr style="text-align:left"><th style="padding:6px 8px">Role</th><th style="padding:6px 8px">Office days</th><th style="padding:6px 8px">Fit</th><th></th></tr>${rows}</table>` +
      (site ? `<p><a href="${esc(site)}/shortlist">Open your shortlist in ZapApply</a></p>` : ""),
    attachments: [{ filename: `ZapApply-Shortlist-${opts.date}.pdf`, content: Buffer.from(opts.pdf) }],
  });
  if (error) throw new Error(`Email failed: ${error.message}`);
}
