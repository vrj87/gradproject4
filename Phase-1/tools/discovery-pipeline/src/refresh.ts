import { writeFile } from "node:fs/promises";
import path from "node:path";
import {
  chunkReviews,
  discoveryDir,
  normalizeCorpus,
  type PipelineStats,
  type RawReview
} from "@photos/discovery-core";
import { extractThemes } from "./analyze.js";
import { loadCollectInbox, loadSeedFixtures, mergeCorpusWithStats, supplementRawCorpus } from "./fixtures.js";
import { ARTEFACT_FILES, ensureDirs, readArtefact, writeJson } from "./io.js";
import { rankOpportunities } from "./rank.js";
import { renderReport } from "./report.js";
import { scrapeAll } from "./scrape/index.js";
import { isSampleSizeCapped, metricNodeGaps, researchQuestionGaps, validateThemes } from "./validate.js";

export async function runScrape(): Promise<RawReview[]> {
  await ensureDirs();
  const { reviews: live, results } = await scrapeAll();
  for (const result of results) {
    const extra = result.error ? ` (soft-fail: ${result.error})` : "";
    console.log(`  ${result.source}: ${result.reviews.length} reviews${extra}`);
  }
  const fixtures = await loadSeedFixtures();
  const collect = await loadCollectInbox();
  const { reviews, fixtureAdded } = mergeCorpusWithStats(live, [...fixtures, ...collect]);
  if (fixtureAdded > 0) {
    console.log(`  fixtures/collect: +${fixtureAdded} curated reviews for Q1–Q10 coverage`);
  }
  await writeJson(ARTEFACT_FILES.raw, reviews);
  return reviews;
}

export async function runNormalize(): Promise<void> {
  await ensureDirs();
  const rawFile = await readArtefact<RawReview[]>(ARTEFACT_FILES.raw);
  const { reviews: raw } = await supplementRawCorpus(rawFile);
  const normalized = normalizeCorpus(raw);
  await writeJson(ARTEFACT_FILES.normalized, normalized.kept);
  const chunks = chunkReviews(normalized.kept);
  await writeJson(ARTEFACT_FILES.chunks, chunks);
  console.log(`1a normalize: ${raw.length} raw → ${normalized.kept.length} kept, ${chunks.length} chunks`);
}

function buildStats(
  raw: RawReview[],
  normalized: ReturnType<typeof normalizeCorpus>,
  chunkCount: number,
  validatedCount: number,
  rejectedCount: number,
  gaps: number[],
  nodeGaps: ReturnType<typeof metricNodeGaps>,
  method: PipelineStats["extractionMethod"],
  llmStats: PipelineStats["llmStats"]
): PipelineStats {
  const sourceCoverage: Record<string, number> = {};
  for (const review of raw) {
    sourceCoverage[review.source] = (sourceCoverage[review.source] ?? 0) + 1;
  }
  const liveSources = ["app_store", "play_store", "reddit"].filter((name) => (sourceCoverage[name] ?? 0) > 0);
  return {
    rawCount: raw.length,
    normalizedCount: normalized.kept.length,
    droppedMinWords: normalized.droppedMinWords,
    droppedIrrelevant: normalized.droppedIrrelevant,
    droppedDuplicates: normalized.droppedDuplicates,
    chunkCount,
    sourceCoverage,
    partialCoverage: ["app_store", "play_store", "reddit"].filter((name) => !liveSources.includes(name)),
    extractionMethod: method,
    validatedThemeCount: validatedCount,
    rejectedThemeCount: rejectedCount,
    researchQuestionGaps: gaps,
    metricNodeGaps: nodeGaps,
    sampleSizeCapped: isSampleSizeCapped(normalized.kept),
    fixtureCount: raw.filter((review) => review.id.startsWith("fix-")).length,
    llmStats,
    readyForPhase2: validatedCount >= 8 && gaps.length === 0 && nodeGaps.length === 0,
    generatedAt: new Date().toISOString()
  };
}

export async function runExtract(): Promise<void> {
  await ensureDirs();
  const rawFile = await readArtefact<RawReview[]>(ARTEFACT_FILES.raw);
  const { reviews: raw } = await supplementRawCorpus(rawFile);
  const normalized = normalizeCorpus(raw);
  const chunks = chunkReviews(normalized.kept);
  const extracted = await extractThemes(normalized.kept, chunks);
  const { validated, results } = validateThemes(extracted.themes, normalized.kept);
  await writeJson(ARTEFACT_FILES.themes, validated);
  await writeJson(ARTEFACT_FILES.validation, results);
  const ranking = rankOpportunities(validated);
  await writeJson(ARTEFACT_FILES.ranking, ranking);
  const stats = buildStats(
    raw,
    normalized,
    chunks.length,
    validated.length,
    results.filter((row) => !row.passed).length,
    researchQuestionGaps(validated),
    metricNodeGaps(validated),
    extracted.method,
    extracted.llmStats
  );
  await writeJson(ARTEFACT_FILES.stats, stats);
  console.log(`1c extract (${extracted.method}): ${validated.length} themes, readyForPhase2=${stats.readyForPhase2}`);
}

export async function runRefresh(): Promise<PipelineStats> {
  await ensureDirs();
  console.log("1b scrape + merge");
  const raw = await runScrape();
  console.log("1a normalize");
  const normalized = normalizeCorpus(raw);
  await writeJson(ARTEFACT_FILES.normalized, normalized.kept);
  const chunks = chunkReviews(normalized.kept);
  await writeJson(ARTEFACT_FILES.chunks, chunks);
  console.log("1c extract + validate + rank");
  const extracted = await extractThemes(normalized.kept, chunks);
  const { validated, results } = validateThemes(extracted.themes, normalized.kept);
  await writeJson(ARTEFACT_FILES.themes, validated);
  await writeJson(ARTEFACT_FILES.validation, results);
  const ranking = rankOpportunities(validated);
  await writeJson(ARTEFACT_FILES.ranking, ranking);
  const stats = buildStats(
    raw,
    normalized,
    chunks.length,
    validated.length,
    results.filter((row) => !row.passed).length,
    researchQuestionGaps(validated),
    metricNodeGaps(validated),
    extracted.method,
    extracted.llmStats
  );
  await writeJson(ARTEFACT_FILES.stats, stats);
  await writeFile(path.join(discoveryDir(), ARTEFACT_FILES.report), renderReport(validated, ranking, stats), "utf8");
  console.log(`readyForPhase2: ${stats.readyForPhase2}`);
  console.log(`extraction: ${stats.extractionMethod} · themes ${stats.validatedThemeCount}`);
  console.log(`artefacts: ${discoveryDir()}`);
  return stats;
}
