import { hasSixRecoveries } from "./parse";
import { buildMatrix } from "./matrix";
import type { NoteRecord, Phase3Report, ThemeLite } from "./types";

export function buildPhase3(input: {
  notes: NoteRecord[];
  themes: ThemeLite[];
  now?: string;
}): Phase3Report {
  const inSegment = input.notes.filter((note) => note.inSegment);
  const tasks = [...new Set(inSegment.map((note) => note.phase6Seed).filter((id) => id.startsWith("task-")))];
  const six = inSegment.filter(hasSixRecoveries);
  const matrix = buildMatrix(input.themes);
  const firstBreakNode = inSegment[0]?.firstBreakNode ?? "understand";
  const gates = [
    {
      id: "n-in-segment",
      pass: inSegment.length >= 5,
      detail: `in-segment n=${inSegment.length} (need ≥ 5). Notes=${input.notes.length}.`
    },
    {
      id: "six-recoveries",
      pass: six.length >= 5,
      detail:
        six.length >= 5
          ? "Each counted note has the six architecture recoveries (task, remembered, forgotten, query, results, workaround + recognizability)."
          : "Notes missing remembered/forgotten/task/workaround."
    },
    {
      id: "matrix",
      pass: matrix.length > 0 && matrix.some((row) => row.status === "confirmed"),
      detail: `Matrix rows=${matrix.length}. Confirmed=${matrix.filter((row) => row.status === "confirmed").length}.`
    },
    {
      id: "retrieval-tasks",
      pass: tasks.length >= 3,
      detail: `Distinct Phase 6 seeds: ${tasks.join(", ") || "(none)"}.`
    },
    {
      id: "understand-hold",
      pass: firstBreakNode === "understand",
      detail: `First-break node=${firstBreakNode}. Phase 2 nomination stands unless this is formulate/retrieve/recognize/refine.`
    }
  ];
  const complete = gates.every((gate) => gate.pass);
  const synthesis = `n=${inSegment.length} S2 via the Google Form. People remember place vibe / trip and have forgotten date, album, and town. Photos should take the fragment they still have (G8). Stories end unfound or via scroll / a person / another app — not a precise keyword (G9). First-break node: ${firstBreakNode}. Phase 6 seeds: ${tasks.join(", ")}. Query typed and result-grid were not on the form (instrument gaps, labeled not-recovered on those themes).`;

  return {
    complete,
    generatedAt: input.now ?? new Date().toISOString(),
    census: { noteCount: input.notes.length, inSegmentCount: inSegment.length, taskCount: tasks.length },
    gates,
    notes: input.notes,
    matrix,
    tasks,
    synthesis,
    firstBreakNode
  };
}

export function matrixMarkdown(report: Phase3Report): string {
  const rows = report.matrix
    .map((row) => `| ${row.themeId} | ${row.status} | ${row.metricNode} | ${row.note} |`)
    .join("\n");
  return `# Validation matrix (Part 3)

**Method:** Google Form G1–G9. n=${report.census.inSegmentCount} in-segment S2. Complete: ${report.complete ? "yes" : "no"}.

| Phase 1 theme | vs form | Node | Note |
|---------------|---------|------|------|
${rows}

No invented first-person quotes. Discovery quotes stay labeled public voice. Instrument gaps are **not-recovered**, not disconfirms.

Generated ${report.generatedAt}.
`;
}

export function synthesisMarkdown(report: Phase3Report): string {
  const tasks = report.tasks.map((id) => `- \`${id}\``).join("\n");
  const notes = report.notes
    .filter((note) => note.inSegment)
    .map((note) => `- **${note.id}:** ${note.retrievalTask} · seed \`${note.phase6Seed}\``)
    .join("\n");
  return `# Synthesis (Part 3)

${report.synthesis}

## Counted records

${notes}

## Retrieval tasks for Phase 6

${tasks}

Generated ${report.generatedAt}.
`;
}
