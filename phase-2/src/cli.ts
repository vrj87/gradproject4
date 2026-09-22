import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildPhase2 } from "./build";
import type { PipelineStatsLite, RankedOpportunity, ThemeLite } from "./types";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "../..");
const discovery = path.join(repo, "Phase-1", "data", "discovery");
const outDir = path.join(repo, "phase-2", "data");
const publicDir = path.join(repo, "Phase-1", "apps", "storefront", "public", "phase2");

async function readJson<T>(file: string): Promise<T> {
  const raw = await readFile(file, "utf8");
  return JSON.parse(raw) as T;
}

async function main(): Promise<void> {
  const rankingPath = path.join(discovery, "opportunity-ranking.json");
  const themesPath = path.join(discovery, "themes.json");
  const statsPath = path.join(discovery, "pipeline-stats.json");

  let ranking: RankedOpportunity[];
  try {
    ranking = await readJson<RankedOpportunity[]>(rankingPath);
  } catch {
    throw new Error("A-M01: opportunity-ranking.json missing. Run Phase 1 `npm run 1d` first.");
  }

  const themes = await readJson<ThemeLite[]>(themesPath);
  const stats = await readJson<PipelineStatsLite>(statsPath);
  const { matrix, nomination } = buildPhase2(ranking, themes, stats);

  await mkdir(outDir, { recursive: true });
  await mkdir(publicDir, { recursive: true });
  const matrixJson = JSON.stringify(matrix, null, 2);
  const nominationJson = JSON.stringify(nomination, null, 2);
  await writeFile(path.join(outDir, "filled-matrix.json"), `${matrixJson}\n`);
  await writeFile(path.join(outDir, "nomination.json"), `${nominationJson}\n`);
  await writeFile(path.join(publicDir, "filled-matrix.json"), `${matrixJson}\n`);
  await writeFile(path.join(publicDir, "nomination.json"), `${nominationJson}\n`);

  console.log(
    `Phase 2 nomination: ${nomination.label} · ${nomination.metricNode} · ${nomination.segmentCode} · readyForPhase3=${nomination.readyForPhase3}`
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
