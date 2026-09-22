export type SourceKind =
  | "app_store"
  | "play_store"
  | "reddit"
  | "youtube"
  | "forum"
  | "collect"
  | "fixture"
  | "interview"
  | "primary_research";

export type RetrievalFailureType =
  | "formulate"
  | "understand"
  | "retrieve"
  | "recognize"
  | "refine"
  | "other";

export type MetricNode = "formulate" | "understand" | "retrieve" | "recognize" | "refine";

export type RememberedCue =
  | "people"
  | "place_vibe"
  | "object"
  | "event"
  | "time_fuzzy"
  | "emotion"
  | "activity"
  | "document"
  | "screenshot"
  | "other";

export type ForgottenCue =
  | "date"
  | "album"
  | "exact_place"
  | "keywords"
  | "who"
  | "filename"
  | "other";

export type PhotoKind = "memory" | "screenshot" | "document" | "video" | "unknown";

export type SegmentHint = "S1" | "S2" | "S3" | "S4" | "S5";

export type ImpactLevel = "high" | "medium" | "low";

export interface RawReview {
  id: string;
  text: string;
  source: SourceKind;
  sourceId?: string;
  url?: string;
  rating?: number | null;
  scrapedAt: string;
  languageHint?: string;
  competitor?: boolean;
}

export interface NormalizedReview extends RawReview {
  textHash: string;
  wordCount: number;
  languageHint: string;
  retrievalRelevant: boolean;
  excludedFromFrequency: boolean;
}

export interface ReviewChunk {
  chunkId: string;
  reviewId: string;
  text: string;
  source: SourceKind;
  url?: string;
}

export interface ThemeQuote {
  text: string;
  reviewId: string;
  source: string;
  url?: string;
}

export interface Theme {
  id: string;
  label: string;
  summary: string;
  researchQuestionIds: number[];
  retrievalFailureType: RetrievalFailureType;
  rememberedCue: RememberedCue;
  forgottenCue: ForgottenCue;
  photoKind: PhotoKind;
  metricNode: MetricNode;
  segmentHints: SegmentHint[];
  quotes: ThemeQuote[];
  estimatedFrequency: number;
  impactOnRetrieval: ImpactLevel;
  mvpFeasibility: ImpactLevel;
  confidence: ImpactLevel;
  actionableInsight: string;
  genericSearchLeak: boolean;
}

export interface ThemeValidationResult {
  themeId: string;
  label: string;
  passed: boolean;
  confidence: ImpactLevel;
  reasons: string[];
}

export interface RankedOpportunity {
  themeId: string;
  label: string;
  retrievalFailureType: RetrievalFailureType;
  metricNode: MetricNode;
  impactOnRetrieval: ImpactLevel;
  mvpFeasibility: ImpactLevel;
  estimatedFrequency: number;
  score: number;
  rank: number;
  genericSearchFlag: boolean;
}

export interface LlmExtractionStats {
  batchesProcessed: number;
  batchesFailed: number;
  rawThemeCount: number;
  themesMerged: number;
  quoteRepairs: number;
  gapFillThemes: number;
}

export interface PipelineStats {
  rawCount: number;
  normalizedCount: number;
  droppedMinWords: number;
  droppedIrrelevant: number;
  droppedDuplicates: number;
  chunkCount: number;
  sourceCoverage: Record<string, number>;
  partialCoverage: string[];
  extractionMethod: "groq" | "openai" | "rule-based" | "hybrid";
  validatedThemeCount: number;
  rejectedThemeCount: number;
  researchQuestionGaps: number[];
  metricNodeGaps: MetricNode[];
  sampleSizeCapped: boolean;
  fixtureCount: number;
  llmStats?: LlmExtractionStats;
  readyForPhase2: boolean;
  generatedAt: string;
}

export const RETRIEVAL_KEYWORDS = [
  "search",
  "find",
  "can't find",
  "cant find",
  "couldn't find",
  "couldnt find",
  "lost photo",
  "old photo",
  "old pictures",
  "old picture",
  "remember",
  "memories",
  "screenshot",
  "receipt",
  "document",
  "scan",
  "album",
  "timeline",
  "scroll",
  "date",
  "location",
  "place",
  "trip",
  "vacation",
  "holiday",
  "people",
  "face",
  "who is",
  "when was",
  "where was",
  "google photos search",
  "retrieve",
  "look for",
  "looking for that photo",
  "looking for that picture"
] as const;

export const RETRIEVAL_FAILURE_SHORT = [
  "can't find",
  "cant find",
  "couldn't find",
  "lost photo",
  "old photo",
  "old pic"
] as const;

export const GENERIC_SEARCH_LEAK = [
  "make search better",
  "improve search quality",
  "better search ranking"
] as const;

export const RESEARCH_QUESTIONS = [
  { id: 1, text: "What kinds of old photos do users struggle to retrieve?" },
  { id: 2, text: "What information do people actually remember about a photo?" },
  { id: 3, text: "What information have they forgotten?" },
  { id: 4, text: "How do users formulate searches when their memory is incomplete?" },
  { id: 5, text: "Where does existing Google Photos search / Memories / albums break?" },
  { id: 6, text: "What workarounds do people use when search fails?" },
  { id: 7, text: "How do people vs place-vibe vs object vs event vs screenshot tasks differ?" },
  { id: 8, text: "What makes a result set evaluable vs overwhelming?" },
  { id: 9, text: "How do users refine after a miss?" },
  { id: 10, text: "Which library / life-context segments struggle most?" }
] as const;
