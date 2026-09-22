import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildPhase4, mvpReadme, problemMarkdown } from "./build";
import type { InterviewCensus, NominationLite, Phase3Lite, RankRow, ThemeLite } from "./types";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "../..");
const discovery = path.join(repo, "Phase-1", "data", "discovery");
const notesDir = path.join(repo, "docs", "research", "interview-notes");
const outDir = path.join(repo, "phase-4", "data");
const publicDir = path.join(repo, "Phase-1", "apps", "storefront", "public", "phase4");
const prosePath = path.join(repo, "docs", "problem-definition.md");
const phase3Path = path.join(repo, "phase-3", "data", "phase3.json");
const mvpReadmePath = path.join(repo, "phase-5", "README.md");

async function readJson<T>(file: string): Promise<T> {
  return JSON.parse(await readFile(file, "utf8")) as T;
}

interface Phase3File {
  complete?: boolean;
  firstBreakNode?: string;
  synthesis?: string;
  census?: { noteCount?: number; inSegmentCount?: number; taskCount?: number };
  notes?: Array<{ inSegment?: boolean; workaround?: string; phase6Seed?: string }>;
  tasks?: string[];
}

async function loadPhase3(): Promise<{ census: InterviewCensus; phase3: Phase3Lite } | null> {
  try {
    const file = await readJson<Phase3File>(phase3Path);
    const notes = (file.notes ?? []).filter((note) => note.inSegment);
    const workarounds = [...new Set(notes.map((note) => (note.workaround ?? "").trim()).filter(Boolean))];
    const tasks = (file.tasks ?? []).filter((id) => id.startsWith("task-"));
    return {
      census: {
        noteCount: file.census?.noteCount ?? notes.length,
        inSegmentCount: file.census?.inSegmentCount ?? notes.length,
        formOnlyCount: file.census?.inSegmentCount ?? notes.length
      },
      phase3: {
        complete: Boolean(file.complete),
        firstBreakNode: file.firstBreakNode ?? "understand",
        knownItemDominant: false,
        workarounds,
        tasks,
        synthesis: file.synthesis ?? ""
      }
    };
  } catch {
    return null;
  }
}

async function censusFromNotes(): Promise<InterviewCensus> {
  let files: string[] = [];
  try {
    files = (await readdir(notesDir)).filter((name) => name.endsWith(".md") && name.startsWith("r"));
  } catch {
    files = [];
  }
  let inSegmentCount = 0;
  for (const name of files) {
    const text = await readFile(path.join(notesDir, name), "utf8");
    if (/\bS2\b/.test(text) && !/do not count/i.test(text)) inSegmentCount += 1;
  }
  try {
    const form = JSON.parse(await readFile(path.join(repo, "docs", "research", "form-census.json"), "utf8")) as {
      inSegmentCount?: number;
    };
    if ((form.inSegmentCount ?? 0) > inSegmentCount) inSegmentCount = form.inSegmentCount ?? inSegmentCount;
  } catch {
    /* form census optional */
  }
  return { noteCount: files.length, inSegmentCount, formOnlyCount: inSegmentCount };
}

async function main(): Promise<void> {
  const nomination = await readJson<NominationLite>(path.join(repo, "phase-2", "data", "nomination.json"));
  const ranking = await readJson<RankRow[]>(path.join(discovery, "opportunity-ranking.json"));
  const themes = await readJson<ThemeLite[]>(path.join(discovery, "themes.json"));
  const stats = await readJson<{ rawCount?: number; normalizedCount?: number; validatedThemeCount?: number }>(
    path.join(discovery, "pipeline-stats.json")
  );
  const fromPhase3 = await loadPhase3();
  const census = fromPhase3?.census ?? (await censusFromNotes());
  const phase3 = fromPhase3?.phase3;

  const { definition, tree, contract } = buildPhase4({
    nomination,
    ranking,
    themes,
    census,
    phase3,
    stats
  });

  await mkdir(outDir, { recursive: true });
  await mkdir(publicDir, { recursive: true });
  const files = {
    "problem-definition.json": definition,
    "decision-tree.json": tree,
    "segment-contract.json": contract
  };
  for (const [name, body] of Object.entries(files)) {
    const json = `${JSON.stringify(body, null, 2)}\n`;
    await writeFile(path.join(outDir, name), json);
    await writeFile(path.join(publicDir, name), json);
  }
  await writeFile(prosePath, problemMarkdown(definition));
  await mkdir(path.dirname(mvpReadmePath), { recursive: true });
  await writeFile(mvpReadmePath, mvpReadme(definition));
  console.log(
    `Phase 4 ${tree.verdict} · locked=${tree.locked} · ${definition.targetSegment.code} · ${definition.productOutcome.node} · n=${tree.interviewCensus.inSegmentCount}`
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
