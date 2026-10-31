import Anthropic from "@anthropic-ai/sdk";

export const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";

let client: Anthropic | null = null;
export function claude() {
  if (!client) client = new Anthropic(); // reads ANTHROPIC_API_KEY
  return client;
}

/**
 * Runs one request and keeps going while the API pauses a long server-tool turn
 * (stop_reason "pause_turn"), then returns all the text Claude wrote.
 */
export async function runToText(params: {
  system: string;
  messages: Anthropic.MessageParam[];
  tools?: unknown[];
  maxTokens?: number;
}): Promise<string> {
  const messages = [...params.messages];
  let text = "";
  for (let i = 0; i < 4; i++) {
    const res = await claude().messages.create({
      model: MODEL,
      max_tokens: params.maxTokens ?? 8000,
      system: params.system,
      messages,
      // Server tools such as web search are newer than some SDK type definitions.
      tools: params.tools as Anthropic.Tool[] | undefined,
    });
    for (const block of res.content) if (block.type === "text") text += block.text;
    if ((res.stop_reason as string) !== "pause_turn") break;
    messages.push({ role: "assistant", content: res.content as Anthropic.ContentBlockParam[] });
  }
  return text;
}

/** Pulls the JSON inside <tag>…</tag> out of Claude's reply. */
export function extractJson<T>(text: string, tag: string): T {
  const match = text.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  if (!match) throw new Error(`Claude's reply had no <${tag}> block`);
  return JSON.parse(match[1].trim()) as T;
}
