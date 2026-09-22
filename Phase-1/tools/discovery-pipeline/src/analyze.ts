import type {
  ImpactLevel,
  LlmExtractionStats,
  NormalizedReview,
  ReviewChunk,
  Theme,
  ThemeQuote
} from "@photos/discovery-core";
import { extractWithLlm, resolveLlmProviders } from "./llm.js";

export type ExtractionMethod = "groq" | "openai" | "rule-based" | "hybrid";

export interface ExtractionResult {
  themes: Theme[];
  method: ExtractionMethod;
  llmStats: LlmExtractionStats;
}

interface ThemeTemplate {
  id: string;
  label: string;
  summary: string;
  keywords: string[];
  researchQuestionIds: number[];
  retrievalFailureType: Theme["retrievalFailureType"];
  rememberedCue: Theme["rememberedCue"];
  forgottenCue: Theme["forgottenCue"];
  photoKind: Theme["photoKind"];
  metricNode: Theme["metricNode"];
  segmentHints: Theme["segmentHints"];
  impactOnRetrieval: ImpactLevel;
  mvpFeasibility: ImpactLevel;
  actionableInsight: string;
  genericSearchLeak: boolean;
}

const TEMPLATES: ThemeTemplate[] = [
  {
    id: "place-vibe-without-name",
    label: "PlaceVibeWithoutName",
    summary: "People remember a place by vibe or trip, not the town or date, and search cannot take that clue.",
    keywords: ["cafe", "café", "vibe", "beach", "trip", "holiday", "vacation", "goa", "yellow chairs"],
    researchQuestionIds: [2, 3, 5, 7],
    retrievalFailureType: "understand",
    rememberedCue: "place_vibe",
    forgottenCue: "exact_place",
    photoKind: "memory",
    metricNode: "understand",
    segmentHints: ["S2"],
    impactOnRetrieval: "high",
    mvpFeasibility: "high",
    actionableInsight:
      "Accept place-vibe language (small cafe on that trip) instead of demanding a place name or date first.",
    genericSearchLeak: false
  },
  {
    id: "object-episode-find",
    label: "ObjectEpisodeFind",
    summary: "People remember an object plus an episode (medicine when sick, receipt last winter) and have forgotten the date.",
    keywords: ["medicine", "sick", "receipt", "prescription", "ticket", "warranty", "document", "scan"],
    researchQuestionIds: [1, 2, 7],
    retrievalFailureType: "understand",
    rememberedCue: "object",
    forgottenCue: "date",
    photoKind: "document",
    metricNode: "understand",
    segmentHints: ["S3"],
    impactOnRetrieval: "high",
    mvpFeasibility: "high",
    actionableInsight:
      "Map object-plus-episode clues to a date window and object tags rather than requiring the capture day.",
    genericSearchLeak: false
  },
  {
    id: "forgotten-date-album",
    label: "ForgottenDateAlbum",
    summary: "Users know the photo exists but cannot formulate a query because they forgot date, album, and keywords.",
    keywords: ["forgot the date", "forgotten", "album", "filename", "cannot formulate", "words i do not remember"],
    researchQuestionIds: [3, 4],
    retrievalFailureType: "formulate",
    rememberedCue: "event",
    forgottenCue: "date",
    photoKind: "memory",
    metricNode: "formulate",
    segmentHints: ["S1", "S2"],
    impactOnRetrieval: "high",
    mvpFeasibility: "high",
    actionableInsight:
      "Let people start from what they still remember instead of a date, album, or filename field.",
    genericSearchLeak: false
  },
  {
    id: "unevaluable-results",
    label: "UnevaluableResults",
    summary: "A relevant photo may be in the grid, but near-misses make the set impossible to evaluate.",
    keywords: ["overwhelming", "thumbnails", "near miss", "evaluate", "wall of", "grid", "hundreds"],
    researchQuestionIds: [8],
    retrievalFailureType: "recognize",
    rememberedCue: "place_vibe",
    forgottenCue: "keywords",
    photoKind: "memory",
    metricNode: "recognize",
    segmentHints: ["S1", "S2"],
    impactOnRetrieval: "high",
    mvpFeasibility: "high",
    actionableInsight:
      "Group candidates (trip, day, object) with a why-this-group chip so people can recognize the photo.",
    genericSearchLeak: false
  },
  {
    id: "refine-dead-end",
    label: "RefineDeadEnd",
    summary: "After a miss, users cannot teach the product what they meant; they type again or quit.",
    keywords: ["refine", "try again", "give up", "follow up", "not that trip", "more like this", "dead end"],
    researchQuestionIds: [9],
    retrievalFailureType: "refine",
    rememberedCue: "other",
    forgottenCue: "keywords",
    photoKind: "unknown",
    metricNode: "refine",
    segmentHints: ["S1"],
    impactOnRetrieval: "high",
    mvpFeasibility: "high",
    actionableInsight:
      "After a miss, elicit one more remembered cue or accept not-this-trip instead of another blank keyword box.",
    genericSearchLeak: false
  },
  {
    id: "screenshot-utility",
    label: "ScreenshotUtilityMix",
    summary: "Screenshots and documents fail differently from trip memories; search mixes the two jobs.",
    keywords: ["screenshot", "qr", "boarding", "utility", "chats", "scans"],
    researchQuestionIds: [1, 7],
    retrievalFailureType: "retrieve",
    rememberedCue: "screenshot",
    forgottenCue: "date",
    photoKind: "screenshot",
    metricNode: "retrieve",
    segmentHints: ["S3"],
    impactOnRetrieval: "medium",
    mvpFeasibility: "high",
    actionableInsight:
      "Separate screenshot and document retrieval from memory search so content clues can match captions.",
    genericSearchLeak: false
  },
  {
    id: "people-without-name",
    label: "PeopleWithoutName",
    summary: "The face is remembered; the searchable name or tag is not.",
    keywords: ["face", "who is", "cousin", "friend", "unlabeled", "person"],
    researchQuestionIds: [2, 7],
    retrievalFailureType: "understand",
    rememberedCue: "people",
    forgottenCue: "who",
    photoKind: "memory",
    metricNode: "understand",
    segmentHints: ["S4"],
    impactOnRetrieval: "medium",
    mvpFeasibility: "medium",
    actionableInsight:
      "Accept people-in-the-photo descriptions when a name tag was never saved.",
    genericSearchLeak: false
  },
  {
    id: "timeline-scroll-workaround",
    label: "TimelineScrollWorkaround",
    summary: "When search fails, people scroll the timeline for hours instead of refining.",
    keywords: ["scroll the timeline", "scroll", "workaround", "hours"],
    researchQuestionIds: [6],
    retrievalFailureType: "refine",
    rememberedCue: "other",
    forgottenCue: "date",
    photoKind: "memory",
    metricNode: "refine",
    segmentHints: ["S1"],
    impactOnRetrieval: "medium",
    mvpFeasibility: "high",
    actionableInsight:
      "Treat timeline scroll as evidence the search path failed, not as a successful find method.",
    genericSearchLeak: false
  },
  {
    id: "ask-someone-else",
    label: "AskSomeoneElse",
    summary: "Family and shared libraries push people to ask a partner or the other phone.",
    keywords: ["partner", "wife", "friend who", "shared library", "kids", "sister"],
    researchQuestionIds: [6, 10],
    retrievalFailureType: "retrieve",
    rememberedCue: "people",
    forgottenCue: "other",
    photoKind: "memory",
    metricNode: "retrieve",
    segmentHints: ["S5"],
    impactOnRetrieval: "medium",
    mvpFeasibility: "medium",
    actionableInsight:
      "Shared-library find is a different segment; do not treat asking another person as product success.",
    genericSearchLeak: false
  },
  {
    id: "heavy-library",
    label: "HeavyLibraryCannotScroll",
    summary: "Years and thousands of photos make scroll hopeless when memory is incomplete.",
    keywords: ["thousands", "years of", "heavy library", "huge", "ten years"],
    researchQuestionIds: [10],
    retrievalFailureType: "retrieve",
    rememberedCue: "time_fuzzy",
    forgottenCue: "date",
    photoKind: "memory",
    metricNode: "retrieve",
    segmentHints: ["S1"],
    impactOnRetrieval: "high",
    mvpFeasibility: "medium",
    actionableInsight:
      "Heavy-library users need cue search; timeline is not a retrieval method at that scale.",
    genericSearchLeak: false
  },
  {
    id: "memories-surface-miss",
    label: "MemoriesSurfaceMiss",
    summary: "Memories and albums do not retrieve the specific photo the user is looking for.",
    keywords: ["memories", "albums", "highlight", "surface"],
    researchQuestionIds: [5],
    retrievalFailureType: "retrieve",
    rememberedCue: "event",
    forgottenCue: "album",
    photoKind: "memory",
    metricNode: "retrieve",
    segmentHints: ["S2"],
    impactOnRetrieval: "medium",
    mvpFeasibility: "medium",
    actionableInsight:
      "Memories is a recap surface, not a find surface; do not count highlights as vague-memory retrieval.",
    genericSearchLeak: false
  },
  {
    id: "generic-search-latency",
    label: "GenericSearchLatency",
    summary: "Some public complaints are about slow search or indexing, not a remembered-but-unfound photo.",
    keywords: ["search is slow", "indexing", "search quality", "latency", "laggy", "ranking"],
    researchQuestionIds: [5],
    retrievalFailureType: "other",
    rememberedCue: "other",
    forgottenCue: "other",
    photoKind: "unknown",
    metricNode: "retrieve",
    segmentHints: ["S1"],
    impactOnRetrieval: "low",
    mvpFeasibility: "low",
    actionableInsight:
      "Quantify latency separately from vague-memory failure; do not nominate generic search ranking as the MVP.",
    genericSearchLeak: true
  }
];

function snippet(text: string, keyword: string): string {
  const lower = text.toLowerCase();
  const at = lower.indexOf(keyword);
  const start = at >= 0 ? Math.max(0, at - 40) : 0;
  return text.slice(start, start + 220).trim();
}

function quotesFor(template: ThemeTemplate, reviews: NormalizedReview[]): ThemeQuote[] {
  const hits: ThemeQuote[] = [];
  for (const review of reviews) {
    const lower = review.text.toLowerCase();
    const keyword = template.keywords.find((word) => lower.includes(word));
    if (!keyword) continue;
    hits.push({
      text: snippet(review.text, keyword),
      reviewId: review.id,
      source: review.source,
      url: review.url
    });
  }
  return hits.slice(0, 6);
}

export function ruleBasedThemes(reviews: NormalizedReview[]): Theme[] {
  const eligible = reviews.filter((review) => !review.excludedFromFrequency);
  const denom = Math.max(eligible.length, 1);

  return TEMPLATES.map((template) => {
    const quotes = quotesFor(template, reviews);
    const matching = eligible.filter((review) =>
      template.keywords.some((word) => review.text.toLowerCase().includes(word))
    );
    return {
      id: template.id,
      label: template.label,
      summary: template.summary,
      researchQuestionIds: template.researchQuestionIds,
      retrievalFailureType: template.retrievalFailureType,
      rememberedCue: template.rememberedCue,
      forgottenCue: template.forgottenCue,
      photoKind: template.photoKind,
      metricNode: template.metricNode,
      segmentHints: template.segmentHints,
      quotes,
      estimatedFrequency: Number((matching.length / denom).toFixed(3)),
      impactOnRetrieval: template.impactOnRetrieval,
      mvpFeasibility: template.mvpFeasibility,
      confidence: quotes.length >= 4 ? "high" : quotes.length >= 2 ? "medium" : "low",
      actionableInsight: template.actionableInsight,
      genericSearchLeak: template.genericSearchLeak
    };
  });
}

export async function extractThemes(
  reviews: NormalizedReview[],
  chunks: ReviewChunk[]
): Promise<ExtractionResult> {
  const emptyStats: LlmExtractionStats = {
    batchesProcessed: 0,
    batchesFailed: 0,
    rawThemeCount: 0,
    themesMerged: 0,
    quoteRepairs: 0,
    gapFillThemes: 0
  };

  const ruleThemes = ruleBasedThemes(reviews);
  const providers = resolveLlmProviders();
  if (!providers.length) {
    return { themes: ruleThemes, method: "rule-based", llmStats: emptyStats };
  }

  const llm = await extractWithLlm(chunks, reviews, providers[0]);
  if (!llm.themes.length) {
    return {
      themes: ruleThemes,
      method: "hybrid",
      llmStats: { ...emptyStats, batchesProcessed: llm.batchesProcessed, batchesFailed: llm.batchesFailed }
    };
  }

  const byId = new Map(ruleThemes.map((theme) => [theme.id, theme]));
  for (const extra of llm.themes) {
    const existing = byId.get(extra.id);
    if (!existing) {
      byId.set(extra.id, extra);
      continue;
    }
    const seen = new Set(existing.quotes.map((quote) => quote.reviewId));
    existing.quotes = [
      ...existing.quotes,
      ...extra.quotes.filter((quote) => !seen.has(quote.reviewId))
    ].slice(0, 8);
  }

  return {
    themes: [...byId.values()],
    method: providers[0].name,
    llmStats: {
      batchesProcessed: llm.batchesProcessed,
      batchesFailed: llm.batchesFailed,
      rawThemeCount: llm.themes.length,
      themesMerged: llm.themes.length,
      quoteRepairs: llm.quoteRepairs,
      gapFillThemes: 0
    }
  };
}
