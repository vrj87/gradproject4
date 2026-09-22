import { METRICS, RISKS, SLIDES } from "./framework";
import { countsTowardN, decide } from "./decide";
import type { Phase6Report, TestSession } from "./types";

export function buildPhase6(input: {
  sessions: TestSession[];
  phase4Locked: boolean;
  jobStatement: string;
  phase5Ready?: boolean;
  now?: string;
}): Phase6Report {
  const tree = decide(input.sessions, input.phase4Locked, input.now, input.phase5Ready ?? true);
  const { census } = tree;
  const countedSessions = input.sessions.filter(countsTowardN);
  const changeFromNotes = [...new Set(countedSessions.map((session) => session.nextIteration.trim()).filter(Boolean))];
  const workedFromNotes = countedSessions
    .filter((session) => session.mvpOutcome === "success")
    .map(
      (session) =>
        `${session.id}: keyword ${session.baselineOutcome}, Remember ${session.mvpOutcome} on ${session.taskId}${session.representative ? " (representative, X-01)" : ""}.`
    );
  const learnings = {
    worked:
      census.counted === 0
        ? []
        : workedFromNotes.length
          ? workedFromNotes
          : ["Counted sessions ran the protocol; none succeeded unassisted."],
    changeNext:
      census.counted === 0
        ? [
            "Not from testers yet. Candidate after n ≥ 3: keep clue-token grounding; keep keyword baseline first; do not ask date first."
          ]
        : changeFromNotes.length
          ? changeFromNotes
          : ["Keep grouping by trip; do not let keyword Search be the hero."],
    status:
      census.counted >= 3
        ? census.allFailed
          ? "All counted testers missed. Change Remember before slide 9 claims success (X-05)."
          : `Part 6 has n=${census.counted} counted S2 sessions.`
        : `Part 6 incomplete (A-T01). Counted n=${census.counted}. Do not invent transcripts.`
  };

  return {
    complete: tree.complete,
    frozen: tree.frozen,
    generatedAt: tree.generatedAt,
    census,
    gates: tree.gates,
    jobStatement: input.jobStatement,
    learnings,
    sessions: input.sessions.map((session) => ({
      id: session.id,
      taskId: session.taskId,
      counted: countsTowardN(session),
      representative: session.representative,
      baselineOutcome: session.baselineOutcome,
      mvpOutcome: session.mvpOutcome,
      nextIteration: session.nextIteration
    }))
  };
}

export function learningsMarkdown(report: Phase6Report): string {
  const gates = report.gates.map((gate) => `- ${gate.pass ? "Pass" : "Hold"} · **${gate.id}:** ${gate.detail}`).join("\n");
  const worked = report.learnings.worked.length
    ? report.learnings.worked.map((row) => `- ${row}`).join("\n")
    : "- (none — no counted sessions)";
  const next = report.learnings.changeNext.map((row) => `- ${row}`).join("\n");
  return `# MVP learnings (Part 6)

> **Complete: ${report.complete ? "yes" : "no"}.** Counted n=${report.census.counted} (need ≥ 3 in S2).  
${report.complete ? "> Slide 9 can freeze on these sessions." : "> Do not freeze slide 9 while this file is a hold (X-06 / A-T01)."}

${report.learnings.status}

## What worked

${worked}

## What to change next

${next}

## Gates

${gates}

Job: ${report.jobStatement}

Generated ${report.generatedAt}.
`;
}

export function metricsMarkdown(): string {
  const rows = METRICS.map(
    (metric) => `| ${metric.layer} | ${metric.name} | ${metric.definition} | ${metric.rationale} |`
  ).join("\n");
  return `# Success metrics (Part 7)

Reflect the solution actually built: **Memory Cue Retrieval** (intelligence at understand).  
Numbers from this browser’s prototype events are **proxies**. They are not Google Photos production telemetry (A-S05).  
Study success rates stay blank until Part 6 n ≥ 3.

| Layer | Metric | Definition | Rationale |
|-------|--------|------------|-----------|
${rows}

Guardrails: \`task-control-date\` still works in Search; hallucinated EXIF rate stays at zero on converse turns.
`;
}

export function risksMarkdown(): string {
  const rows = RISKS.map((risk) => `| ${risk.risk} | ${risk.why} | ${risk.mitigation} |`).join("\n");
  return `# Risks (Part 8)

Risks for **this** solution — vibe-language Remember — not generic “AI might be wrong” (A-K01).

| Risk | Why it might happen | Mitigation |
|------|---------------------|------------|
${rows}
`;
}

export function deckMarkdown(): string {
  const slides = SLIDES.map((slide) => `## ${slide.n}. ${slide.title}\n\n${slide.body}\n\n*Evidence:* ${slide.evidence}\n`).join(
    "\n"
  );
  return `# Google Photos — 10-slide narrative

Titles are the message. Slide 3 is the only process slide.  
Deliverable: \`docs/deck/NL_GooglePhotos.pdf\`. No fellow name.

${slides}
`;
}

export { METRICS, RISKS, SLIDES };
