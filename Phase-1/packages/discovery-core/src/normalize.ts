import type { NormalizedReview, RawReview } from "./types.js";
import { RETRIEVAL_FAILURE_SHORT, RETRIEVAL_KEYWORDS } from "./types.js";
import { textHash } from "./hash.js";

const DEVANAGARI = /[\u0900-\u097F]/;
const HINGLISH =
  /\b(yaar|bhai|accha|acha|theek|sahi|nahi|nahin|kitna|bahut|zyada|wala|wali)\b/i;

const OPS_ONLY =
  /\b(storage full|out of storage?|backup (failed|off)|app (crashed|is slow)|pixel (camera|night sight)|locked folder)\b/i;

const RETRIEVAL_INTENT =
  /\b(can'?t find|cannot find|couldn'?t find|lost (the )?photo|old (photo|picture|pic)s?|looking for that (photo|picture)|remember(ed)? (that|the) (photo|picture|trip)|search(ing)? (my )?photos)\b/i;

const WEAK_ALONE = new Set([
  "search",
  "find",
  "date",
  "people",
  "place",
  "album",
  "timeline",
  "scroll",
  "location",
  "trip",
  "vacation",
  "holiday",
  "face",
  "remember",
  "memories",
  "screenshot",
  "receipt",
  "document",
  "scan"
]);

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function languageHint(text: string): string {
  if (DEVANAGARI.test(text)) return "hi";
  if (HINGLISH.test(text)) return "hinglish";
  return "en";
}

function keywordInText(text: string, keyword: string): boolean {
  const lower = text.toLowerCase();
  if (keyword.length <= 5 && !keyword.includes(" ")) {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`\\b${escaped}\\b`, "i").test(lower);
  }
  return lower.includes(keyword);
}

export function namesRetrievalFailure(text: string): boolean {
  const lower = text.toLowerCase();
  return RETRIEVAL_FAILURE_SHORT.some((phrase) => lower.includes(phrase));
}

export function isRetrievalRelevant(text: string): boolean {
  const lower = text.toLowerCase();
  if (RETRIEVAL_INTENT.test(lower) || namesRetrievalFailure(lower)) return true;
  if (OPS_ONLY.test(lower)) return false;
  const hits = RETRIEVAL_KEYWORDS.filter((keyword) => keywordInText(lower, keyword));
  const strong = hits.filter((keyword) => keyword.includes(" ") || !WEAK_ALONE.has(keyword));
  if (strong.length > 0 && wordCount(text) >= 8) return true;
  return hits.length >= 2 && wordCount(text) >= 12;
}

export function isFrequencyExcluded(source: string): boolean {
  return source === "interview" || source === "primary_research";
}

export function passesMinWordRule(review: RawReview): boolean {
  const words = wordCount(review.text);
  if (words >= 8) return true;
  return namesRetrievalFailure(review.text);
}

export function normalizeReview(review: RawReview): NormalizedReview {
  const trimmed = review.text.replace(/\s+/g, " ").trim();
  return {
    ...review,
    text: trimmed,
    textHash: textHash(trimmed),
    wordCount: wordCount(trimmed),
    languageHint: review.languageHint ?? languageHint(trimmed),
    retrievalRelevant: isRetrievalRelevant(trimmed),
    excludedFromFrequency: isFrequencyExcluded(review.source)
  };
}

export interface NormalizeResult {
  kept: NormalizedReview[];
  droppedMinWords: number;
  droppedIrrelevant: number;
  droppedDuplicates: number;
}

export function normalizeCorpus(reviews: RawReview[]): NormalizeResult {
  let droppedMinWords = 0;
  let droppedIrrelevant = 0;
  const byHash = new Map<string, NormalizedReview>();

  for (const raw of reviews) {
    if (!passesMinWordRule(raw)) {
      droppedMinWords += 1;
      continue;
    }
    const normalized = normalizeReview(raw);
    if (!normalized.retrievalRelevant) {
      droppedIrrelevant += 1;
      continue;
    }
    const existing = byHash.get(normalized.textHash);
    if (!existing) {
      byHash.set(normalized.textHash, normalized);
      continue;
    }
    if (normalized.text.length > existing.text.length) {
      byHash.set(normalized.textHash, normalized);
    }
  }

  const kept = [...byHash.values()];
  const droppedDuplicates = Math.max(
    0,
    reviews.length - droppedMinWords - droppedIrrelevant - kept.length
  );

  return { kept, droppedMinWords, droppedIrrelevant, droppedDuplicates };
}
