import { elicit, firstQuestionIsDate, type ElicitTurn } from "./elicit";
import { groqChatModels, GROQ_CHAT_TIMEOUT_MS } from "./groqModels";
import { groundQueryToClue, mergeQuery, type MemoryQuery } from "./memoryQuery";

const KINDS = new Set(["memory", "screenshot", "document"]);
const CUES = new Set(["placeVibe", "object", "episode", "kind"]);

export function groqEnabled(): boolean {
  return Boolean(process.env.GROQ_API_KEY);
}

export function llmLabel(): "groq" | "openai" | "rule-based" {
  if (process.env.GROQ_API_KEY) return "groq";
  if (process.env.OPENAI_API_KEY) return "openai";
  return "rule-based";
}

export interface GroqPatch {
  memoryQueryPatch?: {
    placeVibe?: string;
    placeName?: string;
    objects?: string[];
    event?: string;
    timeFuzzy?: string;
    activity?: string;
    photoKind?: string;
    expansions?: string[];
  };
  assistantText?: string;
  question?: string;
  missingCue?: string;
  stopAsking?: boolean;
}

function asStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

export function extractJsonObject(text: string): GroqPatch {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return {};
  try {
    return JSON.parse(text.slice(start, end + 1)) as GroqPatch;
  } catch {
    return {};
  }
}

export function containsHallucinatedExif(text: string): boolean {
  return /\b(taken on|captured on|gps|exif|\d{1,2}\s+(january|february|march|april|june|july|august|september|october|november|december)|calangute|15\.\d+\s*n)\b/i.test(
    text
  );
}

export function applyGroqPatch(query: MemoryQuery, patch: GroqPatch, questionsAsked: number): { query: MemoryQuery; turn: ElicitTurn } {
  const body = patch.memoryQueryPatch ?? {};
  const photoKind = typeof body.photoKind === "string" && KINDS.has(body.photoKind) ? (body.photoKind as MemoryQuery["photoKind"]) : undefined;
  const next = mergeQuery(query, {
    placeVibe: typeof body.placeVibe === "string" ? body.placeVibe : query.placeVibe,
    placeName: typeof body.placeName === "string" ? body.placeName : query.placeName,
    objects: [...query.objects, ...(asStringArray(body.objects) ?? [])],
    event: typeof body.event === "string" ? body.event : query.event,
    timeFuzzy: typeof body.timeFuzzy === "string" ? body.timeFuzzy : query.timeFuzzy,
    activity: typeof body.activity === "string" ? body.activity : query.activity,
    photoKind: photoKind ?? query.photoKind,
    expansions: asStringArray(body.expansions)
  });
  const fallback = elicit(next, questionsAsked);
  const question = typeof patch.question === "string" ? patch.question : undefined;
  if (question && firstQuestionIsDate(question)) {
    return { query: next, turn: fallback };
  }
  const missing = typeof patch.missingCue === "string" && CUES.has(patch.missingCue) ? (patch.missingCue as ElicitTurn["missingCue"]) : fallback.missingCue;
  const nextQuestion = question ?? fallback.question;
  let assistantText = typeof patch.assistantText === "string" ? patch.assistantText : fallback.assistantText;
  if (containsHallucinatedExif(assistantText)) assistantText = fallback.assistantText;
  return {
    query: groundQueryToClue(query.raw, next),
    turn: {
      assistantText,
      question: nextQuestion,
      missingCue: missing,
      stopAsking: Boolean(patch.stopAsking) || questionsAsked >= 3 || !nextQuestion || fallback.stopAsking,
      choices: fallback.choices
    }
  };
}

const SYSTEM = `You reconstruct a photo from incomplete human memory for Google Photos Remember.
Return JSON only:
{memoryQueryPatch:{placeVibe,placeName,objects,event,timeFuzzy,activity,photoKind,expansions},assistantText,question,missingCue,stopAsking}
Rules:
- missingCue must be placeVibe|object|episode|kind
- expansions: 3-8 short synonyms of words present in the clue — never dates, filenames, or new topics
- Never add a place, object, or vibe the user did not say
- objects must be words (or close synonyms) from the clue only
- Ask at most one missing cue, never date/album/filename first
- Never invent EXIF, capture dates, GPS, or town names the user did not say
- Never claim access to a real Google Photos account
- Prefer place-vibe, object, and episode language from the clue
- If the clue is already enough, stopAsking true and leave question empty`;

async function completeOnce(
  key: string,
  model: string,
  clue: string,
  query: MemoryQuery,
  questionsAsked: number
): Promise<string | null> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json"
    },
    signal: AbortSignal.timeout(GROQ_CHAT_TIMEOUT_MS),
    body: JSON.stringify({
      model,
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: JSON.stringify({ clue, memoryQuery: query, questionsAsked }) }
      ]
    })
  });
  if (!res.ok) return null;
  const payload = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return payload.choices?.[0]?.message?.content ?? null;
}

export async function converseWithOpenAI(
  clue: string,
  query: MemoryQuery,
  questionsAsked: number
): Promise<{ query: MemoryQuery; turn: ElicitTurn; model: string } | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json"
      },
      signal: AbortSignal.timeout(GROQ_CHAT_TIMEOUT_MS),
      body: JSON.stringify({
        model,
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: JSON.stringify({ clue, memoryQuery: query, questionsAsked }) }
        ]
      })
    });
    if (!res.ok) return null;
    const payload = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) return null;
    return { ...applyGroqPatch(query, extractJsonObject(content), questionsAsked), model };
  } catch {
    return null;
  }
}

export async function converseWithLlm(
  clue: string,
  query: MemoryQuery,
  questionsAsked: number
): Promise<{ query: MemoryQuery; turn: ElicitTurn; model: string; provider: "groq" | "openai" } | null> {
  const groq = await converseWithGroq(clue, query, questionsAsked);
  if (groq) return { ...groq, provider: "groq" };
  const openai = await converseWithOpenAI(clue, query, questionsAsked);
  if (openai) return { ...openai, provider: "openai" };
  return null;
}

export async function converseWithGroq(
  clue: string,
  query: MemoryQuery,
  questionsAsked: number
): Promise<{ query: MemoryQuery; turn: ElicitTurn; model: string } | null> {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  for (const model of groqChatModels()) {
    try {
      const content = await completeOnce(key, model, clue, query, questionsAsked);
      if (!content) continue;
      const parsed = extractJsonObject(content);
      const applied = applyGroqPatch(query, parsed, questionsAsked);
      return { ...applied, model };
    } catch {
      continue;
    }
  }
  return null;
}
