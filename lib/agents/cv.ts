import { runToText } from "./claude";

/** Turns an uploaded CV (PDF) into plain text once, so later runs can reuse it cheaply. */
export async function extractCvText(pdf: Uint8Array): Promise<string> {
  const text = await runToText({
    system: "You convert CVs into clean plain text. Keep every fact. Do not summarise or add anything.",
    maxTokens: 6000,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: { type: "base64", media_type: "application/pdf", data: Buffer.from(pdf).toString("base64") },
          },
          { type: "text", text: "Return the full text of this CV as plain text, keeping its section headings." },
        ],
      },
    ],
  });
  return text.trim();
}
