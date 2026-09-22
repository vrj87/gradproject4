import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildPhase3, matrixMarkdown, synthesisMarkdown } from "./build";
import { parseNote } from "./parse";
import type { ThemeLite } from "./types";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "../..");
const notesDir = path.join(repo, "docs", "research", "interview-notes");
const themesPath = path.join(repo, "Phase-1", "data", "discovery", "themes.json");
const outDir = path.join(repo, "phase-3", "data");
const publicDir = path.join(repo, "Phase-1", "apps", "storefront", "public", "phase3");

async function loadNotes() {
  let files: string[] = [];
  try {
    files = (await readdir(notesDir)).filter((name) => name.endsWith(".md") && /^r\d+/i.test(name));
  } catch {
    files = [];
  }
  const notes = [];
  for (const name of files) {
    const text = await readFile(path.join(notesDir, name), "utf8");
    notes.push(parseNote(name.replace(/\.md$/i, ""), text));
  }
  return notes;
}

async function main(): Promise<void> {
  const themes = JSON.parse(await readFile(themesPath, "utf8")) as ThemeLite[];
  const report = buildPhase3({ notes: await loadNotes(), themes });
  await mkdir(outDir, { recursive: true });
  await mkdir(publicDir, { recursive: true });
  const json = `${JSON.stringify(report, null, 2)}\n`;
  await writeFile(path.join(outDir, "phase3.json"), json);
  await writeFile(path.join(publicDir, "phase3.json"), json);
  await writeFile(path.join(repo, "docs", "research", "validation-matrix.md"), matrixMarkdown(report));
  await writeFile(path.join(repo, "docs", "research", "synthesis.md"), synthesisMarkdown(report));
  await writeFile(
    path.join(repo, "docs", "research", "form-census.json"),
    `${JSON.stringify(
      {
        method: "google-form",
        part3: report.complete ? "complete" : "incomplete",
        formUrl: "https://forms.gle/wvQ3pQVQLhxMDFTm9",
        responsesUrl:
          "https://docs.google.com/forms/d/1BWAi4vwNFF5cncIu98H352AY4RcZd7s4aBkTBgI_wXA/edit#responses",
        submitted: report.census.noteCount,
        inSegmentCount: report.census.inSegmentCount,
        knownItemExcluded: true,
        attestedAt: "2026-09-22",
        note: "Part 3 study method is this form (G1–G9). Counted rows are S2 trip/place-vibe, not screenshot/medicine/known-item. Unique ticks stay in Google; repo notes do not invent verbatim sentences."
      },
      null,
      2
    )}\n`
  );
  console.log(
    `Phase 3 ${report.complete ? "complete" : "incomplete"} · n=${report.census.inSegmentCount} · tasks=${report.census.taskCount} · matrix=${report.matrix.length}`
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
