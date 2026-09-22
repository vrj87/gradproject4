import type { NormalizedReview, ReviewChunk, Theme, ThemeQuote } from "@photos/discovery-core";
import { repairQuote } from "@photos/discovery-core";

export interface LlmProviderConfig {
  name: "groq" | "openai";
  url: string;
  key: string;
  model: string;
}

export function resolveLlmProviders(): LlmProviderConfig[] {
  const providers: LlmProviderConfig[] = [];
  if (process.env.GROQ_API_KEY) {
    providers.push({
      name: "groq",
      url: "https://api.groq.com/openai/v1/chat/completions",
      key: process.env.GROQ_API_KEY,
      model: process.env.GROQ_MODEL ?? "openai/gpt-oss-120b"
    });
  }
  if (process.env.OPENAI_API_KEY) {
    providers.push({
      name: "openai",
      url: "https://api.openai.com/v1/chat/completions",
      key: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini"
    });
  }
  return providers;
}

interface LlmThemeDraft {
  id?: string;
  quotes?: Array<{ text?: string; reviewId?: string }>;
}

export async function extractWithLlm(
  chunks: ReviewChunk[],
  reviews: NormalizedReview[],
  provider: LlmProviderConfig
): Promise<{ themes: Theme[]; batchesProcessed: number; batchesFailed: number; quoteRepairs: number }> {
  const byId = new Map(reviews.map((review) => [review.id, review]));
  const batch = chunks.slice(0, 12).map((chunk) => ({ reviewId: chunk.reviewId, text: chunk.text.slice(0, 400) }));
  let batchesProcessed = 0;
  let batchesFailed = 0;
  let quoteRepairs = 0;
  const themes: Theme[] = [];

  try {
    const res = await fetch(provider.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${provider.key}`,
        "Content-Type": "application/json"
      },
      signal: AbortSignal.timeout(8000),
      body: JSON.stringify({
        model: provider.model,
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Extract Google Photos retrieval themes from reviews. Return JSON {themes:[{id, quotes:[{text,reviewId}]}]}. Quote text must be a substring of the review. Never invent quotes. Do not propose generic search ranking as the insight."
          },
          { role: "user", content: JSON.stringify(batch) }
        ]
      })
    });
    batchesProcessed += 1;
    if (!res.ok) {
      batchesFailed += 1;
      const detail = await res.text();
      console.warn(`llm ${provider.name} HTTP ${res.status}: ${detail.slice(0, 180)}`);
      return { themes, batchesProcessed, batchesFailed, quoteRepairs };
    }
    const payload = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const parsed = JSON.parse(payload.choices?.[0]?.message?.content ?? "{}") as { themes?: LlmThemeDraft[] };
    for (const draft of parsed.themes ?? []) {
      if (!draft.id || !draft.quotes?.length) continue;
      const quotes: ThemeQuote[] = [];
      for (const quote of draft.quotes) {
        if (!quote.text || !quote.reviewId) continue;
        const review = byId.get(quote.reviewId);
        if (!review) continue;
        const repaired = repairQuote({ text: quote.text, reviewId: quote.reviewId, source: review.source }, review);
        if (!repaired) continue;
        quoteRepairs += 1;
        quotes.push(repaired);
      }
      if (quotes.length < 2) continue;
      themes.push({
        id: draft.id,
        label: draft.id,
        summary: "LLM-extracted retrieval theme",
        researchQuestionIds: [2],
        retrievalFailureType: "understand",
        rememberedCue: "other",
        forgottenCue: "other",
        photoKind: "unknown",
        metricNode: "understand",
        segmentHints: [],
        quotes,
        estimatedFrequency: 0.05,
        impactOnRetrieval: "medium",
        mvpFeasibility: "medium",
        confidence: "medium",
        actionableInsight: "Use only grounded quotes to compare retrieval failure modes.",
        genericSearchLeak: false
      });
    }
  } catch {
    batchesFailed += 1;
  }

  return { themes, batchesProcessed, batchesFailed, quoteRepairs };
}
