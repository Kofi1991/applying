import { PDFDocument, PDFName, PDFString, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { ReviewedRole } from "./types";

const INK = rgb(0.12, 0.23, 0.37);
const GREEN = rgb(0.89, 0.96, 0.91);
const AMBER = rgb(1, 0.965, 0.87);
const GRID = rgb(0.79, 0.82, 0.87);
const LINK = rgb(0.04, 0.34, 0.82);

// Landscape A4, in points.
const W = 842, H = 595, M = 36;
const COLS = [
  { key: "title", label: "Role", w: 150 },
  { key: "company", label: "Company", w: 100 },
  { key: "office_days", label: "Office days", w: 64 },
  { key: "job_type", label: "Type", w: 58 },
  { key: "pay", label: "Pay", w: 80 },
  { key: "fit", label: "Fit", w: 62 },
  { key: "fit_reason", label: "Why it fits", w: 148 },
  { key: "gaps", label: "Gaps", w: 70 },
  { key: "apply", label: "Apply", w: 38 },
] as const;

/** pdf-lib's standard fonts are WinAnsi only, so swap characters they can't draw. */
function clean(s: string) {
  return s.replace(/[–—]/g, "-").replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[^\x20-\x7E£€]/g, "");
}

function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const words = clean(text).split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(next, size) <= width) line = next;
    else { if (line) lines.push(line); line = w; }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

function addLink(doc: PDFDocument, page: PDFPage, url: string, x: number, y: number, w: number, h: number) {
  const annot = doc.context.obj({
    Type: "Annot", Subtype: "Link", Rect: [x, y, x + w, y + h], Border: [0, 0, 0],
    A: { Type: "Action", S: "URI", URI: PDFString.of(url) },
  });
  const ref = doc.context.register(annot);
  const annots = page.node.lookup(PDFName.of("Annots"));
  if (annots) (annots as any).push(ref);
  else page.node.set(PDFName.of("Annots"), doc.context.obj([ref]));
}

/** Builds the daily shortlist: one row per role, very suitable first, clickable Apply links. */
export async function buildShortlistPdf(name: string, date: string, roles: ReviewedRole[]): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const size = 8.5, lh = 11, pad = 5;

  let page = doc.addPage([W, H]);
  let y = H - M;

  page.drawText(clean(`ZapApply shortlist - ${date}`), { x: M, y: y - 18, size: 18, font: bold, color: INK });
  page.drawText(clean(`For ${name}. Roles scoring under 65 are left out. Green = very suitable (85+).`), {
    x: M, y: y - 34, size: 9, font, color: rgb(0.35, 0.35, 0.35),
  });
  y -= 50;

  const header = () => {
    let x = M;
    page.drawRectangle({ x: M, y: y - 18, width: W - 2 * M, height: 18, color: INK });
    for (const c of COLS) {
      page.drawText(c.label, { x: x + pad, y: y - 12.5, size, font: bold, color: rgb(1, 1, 1) });
      x += c.w;
    }
    y -= 18;
  };
  header();

  for (const r of roles) {
    const cells: Record<string, string> = {
      title: r.title, company: r.company, office_days: r.office_days === "0" ? "0 (remote)" : r.office_days,
      job_type: r.job_type, pay: r.pay ?? "Not stated", fit: `${r.fit_score} ${r.fit_label}`,
      fit_reason: r.fit_reason, gaps: r.gaps, apply: "Apply",
    };
    const wrapped = COLS.map((c) => wrap(cells[c.key], c.key === "title" ? bold : font, size, c.w - 2 * pad));
    const rowH = Math.max(...wrapped.map((l) => l.length)) * lh + 2 * pad;

    if (y - rowH < M) { page = doc.addPage([W, H]); y = H - M; header(); }

    page.drawRectangle({
      x: M, y: y - rowH, width: W - 2 * M, height: rowH,
      color: r.fit_score >= 85 ? GREEN : AMBER, borderColor: GRID, borderWidth: 0.5,
    });
    let x = M;
    COLS.forEach((c, i) => {
      wrapped[i].forEach((line, j) => {
        page.drawText(line, {
          x: x + pad, y: y - pad - (j + 1) * lh + 2.5, size,
          font: c.key === "title" || c.key === "apply" ? bold : font,
          color: c.key === "apply" ? LINK : rgb(0.1, 0.1, 0.1),
        });
      });
      if (c.key === "apply") addLink(doc, page, r.url, x, y - rowH, c.w, rowH);
      x += c.w;
    });
    y -= rowH;
  }

  return doc.save();
}
