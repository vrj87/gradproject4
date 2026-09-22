import { RESEARCH_QUESTIONS } from "./discoveryEngine";

export interface ThemeQuote {
  text: string;
  source: string;
  reviewId: string;
  url?: string;
}

export interface Theme {
  id: string;
  label: string;
  summary: string;
  researchQuestionIds: number[];
  metricNode: string;
  retrievalFailureType?: string;
  rememberedCue: string;
  forgottenCue: string;
  photoKind?: string;
  segmentHints?: string[];
  quotes: ThemeQuote[];
  estimatedFrequency?: number;
  impactOnRetrieval?: string;
  mvpFeasibility?: string;
  actionableInsight?: string;
  genericSearchLeak: boolean;
}

export interface RankRow {
  rank: number;
  themeId?: string;
  label: string;
  metricNode: string;
  score: number;
  estimatedFrequency: number;
  genericSearchFlag: boolean;
  impactOnRetrieval: string;
  mvpFeasibility?: string;
}

export interface Stats {
  rawCount: number;
  normalizedCount: number;
  droppedIrrelevant: number;
  droppedMinWords?: number;
  extractionMethod: string;
  validatedThemeCount: number;
  readyForPhase2: boolean;
  sourceCoverage: Record<string, number>;
  researchQuestionGaps: number[];
  fixtureCount?: number;
  generatedAt: string;
}

export interface Voice {
  id: string;
  text: string;
  source: string;
  url?: string;
  wordCount?: number;
}

export interface CollectItem {
  id: string;
  text: string;
  source: string;
  url?: string;
  scrapedAt: string;
}

export interface DiscoveryPayload {
  themes: Theme[];
  ranking: RankRow[];
  stats: Stats;
  voices: Voice[];
  inbox: CollectItem[];
  questions: typeof RESEARCH_QUESTIONS;
}

function asThemes(value: unknown): Theme[] {
  return Array.isArray(value) ? (value as Theme[]) : [];
}

function asRanking(value: unknown): RankRow[] {
  return Array.isArray(value) ? (value as RankRow[]) : [];
}

function asVoices(value: unknown): Voice[] {
  if (!Array.isArray(value)) return [];
  return value.map((row) => ({
    id: String((row as Voice).id ?? ""),
    text: String((row as Voice).text ?? ""),
    source: String((row as Voice).source ?? "unknown"),
    url: typeof (row as Voice).url === "string" ? (row as Voice).url : undefined,
    wordCount: typeof (row as Voice).wordCount === "number" ? (row as Voice).wordCount : undefined
  }));
}

function asInbox(value: unknown): CollectItem[] {
  return Array.isArray(value) ? (value as CollectItem[]) : [];
}

export async function loadDiscovery(): Promise<DiscoveryPayload> {
  const live = await fetch("/api/discovery")
    .then((res) => (res.ok ? res.json() : null))
    .catch(() => null);
  if (live?.themes) {
    return {
      themes: asThemes(live.themes),
      ranking: asRanking(live.ranking),
      stats: live.stats as Stats,
      voices: asVoices(live.voices),
      inbox: asInbox(live.inbox),
      questions: RESEARCH_QUESTIONS
    };
  }
  const [themes, ranking, stats, voices] = await Promise.all([
    fetch("/discovery/themes.json").then((res) => res.json()),
    fetch("/discovery/opportunity-ranking.json").then((res) => res.json()),
    fetch("/discovery/pipeline-stats.json").then((res) => res.json()),
    fetch("/discovery/normalized-reviews.json").then((res) => res.json())
  ]);
  return {
    themes: asThemes(themes),
    ranking: asRanking(ranking),
    stats: stats as Stats,
    voices: asVoices(voices),
    inbox: [],
    questions: RESEARCH_QUESTIONS
  };
}

export async function submitCollect(input: { text: string; source: string; url?: string }): Promise<{
  item: CollectItem;
  matches: Array<{ id: string; label: string; hits: string[] }>;
}> {
  const res = await fetch("/api/discovery/collect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  const body = (await res.json()) as {
    error?: string;
    item?: CollectItem;
    matches?: Array<{ id: string; label: string; hits: string[] }>;
  };
  if (!res.ok || !body.item) {
    throw new Error(body.error ?? "Could not add that quote.");
  }
  return { item: body.item, matches: body.matches ?? [] };
}
