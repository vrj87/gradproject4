import { describe, expect, it } from "vitest";
import { buildPhase6 } from "../src/build";
import { countsTowardN, decide } from "../src/decide";
import { METRICS, RISKS, SLIDES } from "../src/framework";
import { parseNote } from "../src/parse";
import type { TestSession } from "../src/types";

const empty: TestSession[] = [];

const valid = (id: string): TestSession => ({
  id,
  inSegment: true,
  taskId: "task-goa-cafe",
  representative: true,
  baselineAttempted: true,
  baselineOutcome: "miss",
  mvpAttempted: true,
  mvpOutcome: "success",
  unassisted: true,
  hinted: false,
  nextIteration: "Keep grouping by trip.",
  source: "note"
});

describe("phase 6 census", () => {
  it("parses architecture recoveries from a representative note", () => {
    const session = parseNote(
      "t01",
      `# t01
Segment: S2
Task: task-goa-cafe
Representative: yes
Unassisted: yes
Hinted: no
Baseline: miss
MVP: success
Cues: place vibe, trip
Questions helped: none — clue already complete
Questions annoyed: none asked
Time to target: not timed — instrumented seed run (X-01)
Next iteration: Keep trip grouping.
`
    );
    expect(session.inSegment).toBe(true);
    expect(session.baselineOutcome).toBe("miss");
    expect(session.mvpOutcome).toBe("success");
    expect(session.cuesUsed).toMatch(/place vibe/i);
    expect(session.questionsHelped).toMatch(/none/i);
    expect(session.timeToTarget).toMatch(/not timed/i);
  });

  it("does not complete Part 6 when n < 3 (A-T01)", () => {
    const tree = decide(empty, false);
    expect(tree.complete).toBe(false);
    expect(tree.census.counted).toBe(0);
    expect(tree.gates.find((gate) => gate.id === "n-return-users")?.pass).toBe(false);
  });

  it("does not count hinted success or non-S2 (A-T02, X-03)", () => {
    expect(
      countsTowardN({
        ...valid("t-hint"),
        hinted: true,
        unassisted: false
      })
    ).toBe(false);
    expect(countsTowardN({ ...valid("t-s3"), inSegment: false })).toBe(false);
    expect(countsTowardN({ ...valid("t-base"), baselineAttempted: false })).toBe(false);
  });

  it("still refuses freeze if Phase 4 is unlocked", () => {
    const tree = decide([valid("t01"), valid("t02"), valid("t03")], false);
    expect(tree.census.counted).toBe(3);
    expect(tree.complete).toBe(false);
    expect(tree.gates.find((gate) => gate.id === "phase4-lock")?.pass).toBe(false);
  });

  it("ships Part 7/8 artefacts without generic AI risk or a forbidden search frame", () => {
    const report = buildPhase6({
      sessions: empty,
      phase4Locked: false,
      jobStatement: "Accept place-vibe language."
    });
    expect(report.complete).toBe(false);
    expect(METRICS.some((metric) => metric.id === "north-star")).toBe(true);
    expect(METRICS.every((metric) => metric.definition && metric.rationale)).toBe(true);
    expect(RISKS).toHaveLength(3);
    expect(RISKS.some((risk) => /better search|just search/i.test(risk.risk + risk.why))).toBe(true);
    expect(RISKS.every((risk) => !/^AI might be wrong$/i.test(risk.risk))).toBe(true);
    expect(SLIDES).toHaveLength(10);
    expect(SLIDES.every((slide) => !/^(Problem|Solution|Risks)$/i.test(slide.title))).toBe(true);
    expect(JSON.stringify(SLIDES)).not.toMatch(/\bPhase\s+\d|\bPart\s+\d|\bS[1-5]\b|MemoryQuery|whyThisGroup/i);
    expect(report.learnings.status).toMatch(/incomplete/i);
  });

  it("refuses freeze if Phase 5 is not shipped", () => {
    const tree = decide([valid("t01"), valid("t02"), valid("t03")], true, undefined, false);
    expect(tree.complete).toBe(false);
    expect(tree.gates.find((gate) => gate.id === "phase5-mvp")?.pass).toBe(false);
  });

  it("completes with three S2 protocol sessions and does not invent a café quote", () => {
    const report = buildPhase6({
      sessions: [valid("t01"), valid("t02"), valid("t03")],
      phase4Locked: true,
      phase5Ready: true,
      jobStatement: "Accept place-vibe language so trip rememberers can retrieve a photo they still picture but cannot date or name."
    });
    expect(report.complete).toBe(true);
    expect(report.census.counted).toBe(3);
    expect(report.gates.find((gate) => gate.id === "phase5-mvp")?.pass).toBe(true);
    expect(report.sessions.filter((row) => row.counted)).toHaveLength(3);
    expect(JSON.stringify(report.learnings).toLowerCase()).not.toContain("i remember that small cafe");
  });
});
