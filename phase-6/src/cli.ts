import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildPhase6, deckMarkdown, learningsMarkdown, metricsMarkdown, risksMarkdown, METRICS, RISKS, SLIDES } from "./build";
import { asOutcome, parseNote } from "./parse";
import type { TestSession } from "./types";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "../..");
const notesDir = path.join(repo, "docs", "research", "mvp-test-notes");
const inboxPath = path.join(repo, "Phase-1", "data", "mvp-test", "inbox.json");
const treePath = path.join(repo, "phase-4", "data", "decision-tree.json");
const problemPath = path.join(repo, "phase-4", "data", "problem-definition.json");
const phase5Path = path.join(repo, "phase-5", "data", "mvp.json");
const outDir = path.join(repo, "phase-6", "data");
const publicDir = path.join(repo, "Phase-1", "apps", "storefront", "public", "phase6");

async function loadNotes(): Promise<TestSession[]> {
  let files: string[] = [];
  try {
    files = (await readdir(notesDir)).filter((name) => name.endsWith(".md") && /^t\d+/i.test(name));
  } catch {
    files = [];
  }
  const sessions: TestSession[] = [];
  for (const name of files) {
    const text = await readFile(path.join(notesDir, name), "utf8");
    sessions.push(parseNote(name.replace(/\.md$/i, ""), text));
  }
  return sessions;
}

async function loadInbox(): Promise<TestSession[]> {
  try {
    const rows = JSON.parse(await readFile(inboxPath, "utf8")) as unknown;
    if (!Array.isArray(rows)) return [];
    return rows.map((row) => {
      const item = row as Partial<TestSession> & { id?: string };
      return {
        id: String(item.id ?? "inbox"),
        inSegment: Boolean(item.inSegment),
        taskId: String(item.taskId ?? ""),
        representative: Boolean(item.representative),
        baselineAttempted: Boolean(item.baselineAttempted),
        baselineOutcome: asOutcome(item.baselineOutcome),
        mvpAttempted: Boolean(item.mvpAttempted),
        mvpOutcome: asOutcome(item.mvpOutcome),
        unassisted: Boolean(item.unassisted),
        hinted: Boolean(item.hinted),
        nextIteration: String(item.nextIteration ?? ""),
        timeToTarget: String(item.timeToTarget ?? ""),
        cuesUsed: String(item.cuesUsed ?? ""),
        questionsHelped: String(item.questionsHelped ?? ""),
        questionsAnnoyed: String(item.questionsAnnoyed ?? ""),
        source: "inbox" as const
      };
    });
  } catch {
    return [];
  }
}

async function main(): Promise<void> {
  let phase4Locked = false;
  let phase5Ready = false;
  let jobStatement =
    "Accept place-vibe language so trip rememberers can retrieve a photo they still picture but cannot date or name.";
  try {
    const tree = JSON.parse(await readFile(treePath, "utf8")) as { locked?: boolean };
    phase4Locked = Boolean(tree.locked);
  } catch {
    /* run phase4:lock */
  }
  try {
    const problem = JSON.parse(await readFile(problemPath, "utf8")) as { jobStatement?: string };
    if (problem.jobStatement) jobStatement = problem.jobStatement;
  } catch {
    /* optional */
  }
  try {
    const mvp = JSON.parse(await readFile(phase5Path, "utf8")) as { complete?: boolean };
    phase5Ready = Boolean(mvp.complete);
  } catch {
    /* run phase5:setup */
  }

  const sessions = [...(await loadNotes()), ...(await loadInbox())];
  const report = buildPhase6({ sessions, phase4Locked, phase5Ready, jobStatement });
  const payload = { report, metrics: METRICS, risks: RISKS, deck: { frozen: report.frozen, slides: SLIDES } };

  await mkdir(outDir, { recursive: true });
  await mkdir(publicDir, { recursive: true });
  const json = `${JSON.stringify(payload, null, 2)}\n`;
  await writeFile(path.join(outDir, "phase6.json"), json);
  await writeFile(path.join(publicDir, "phase6.json"), json);
  await writeFile(path.join(repo, "docs", "research", "mvp-learnings.md"), learningsMarkdown(report));
  await writeFile(path.join(repo, "docs", "metrics.md"), metricsMarkdown());
  await writeFile(path.join(repo, "docs", "risks.md"), risksMarkdown());
  await writeFile(path.join(repo, "docs", "deck", "slides.md"), deckMarkdown());
  console.log(
    `Phase 6 ${report.complete ? "complete" : "incomplete"} · counted=${report.census.counted} · frozen=${report.frozen}`
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
