import { describe, expect, it } from "vitest";
import { buildPhase3 } from "../src/build";
import { buildMatrix } from "../src/matrix";
import { hasSixRecoveries, parseNote } from "../src/parse";
import type { NoteRecord, ThemeLite } from "../src/types";

const note = (id: string, seed: string): NoteRecord => ({
  id,
  inSegment: true,
  firstBreakNode: "understand",
  phase6Seed: seed,
  retrievalTask: "trip / place-vibe photo failed find",
  remembered: "place vibe, trip",
  forgotten: "date, album, town",
  queryTyped: "not captured on the form",
  photosReturned: "not captured on the form",
  workaround: "scroll or ask someone (G9)",
  recognizableIf: "take place vibe (G8)"
});

const themes: ThemeLite[] = [
  {
    id: "place-vibe-without-name",
    summary: "vibe",
    metricNode: "understand",
    rememberedCue: "place_vibe",
    forgottenCue: "exact_place",
    segmentHints: ["S2"]
  },
  {
    id: "generic-search-latency",
    summary: "slow",
    metricNode: "retrieve",
    rememberedCue: "any",
    forgottenCue: "none",
    genericSearchLeak: true
  },
  {
    id: "object-episode-find",
    summary: "medicine",
    metricNode: "understand",
    rememberedCue: "object",
    forgottenCue: "date",
    segmentHints: ["S3"]
  }
];

describe("phase 3", () => {
  it("does not complete below n = 5", () => {
    const report = buildPhase3({ notes: [note("r01", "task-goa-cafe")], themes, now: "2026-09-22T00:00:00.000Z" });
    expect(report.complete).toBe(false);
  });

  it("does not complete when only 2 of 6 notes are in-segment", () => {
    const notes = [
      { ...note("r01", "task-goa-cafe"), inSegment: false },
      { ...note("r02", "task-goa-trip"), inSegment: false },
      { ...note("r03", "task-concert-lights"), inSegment: false },
      { ...note("r04", "task-houseboat"), inSegment: false },
      note("r05", "task-goa-cafe"),
      note("r06", "task-goa-trip")
    ];
    const report = buildPhase3({ notes, themes });
    expect(report.complete).toBe(false);
    expect(report.census.inSegmentCount).toBe(2);
  });

  it("completes with ≥5 S2 notes, six recoveries, matrix, and 3 tasks", () => {
    const notes = [
      note("r01", "task-goa-cafe"),
      note("r02", "task-goa-trip"),
      note("r03", "task-concert-lights"),
      note("r04", "task-houseboat"),
      note("r05", "task-goa-cafe"),
      note("r06", "task-goa-trip")
    ];
    const report = buildPhase3({ notes, themes });
    expect(report.complete).toBe(true);
    expect(report.census.inSegmentCount).toBe(6);
    expect(report.census.taskCount).toBeGreaterThanOrEqual(3);
    expect(report.matrix.find((row) => row.themeId === "place-vibe-without-name")?.status).toBe("confirmed");
    expect(report.matrix.find((row) => row.themeId === "generic-search-latency")?.status).toBe("not-supported");
    expect(report.synthesis.toLowerCase()).not.toContain("users find it difficult to search for old photos");
  });

  it("parses architecture recoveries from a form note and does not invent a café quote", () => {
    const parsed = parseNote(
      "r01",
      `# r01
Segment: S2
Retrieval task: trip vibe photo failed find. Representative seed: task-goa-cafe
Remembered: how the place felt
Forgotten: date, town
Query typed: not captured on the form
Photos returned: not captured on the form
Workaround: scroll (G9)
Recognizable if: take place vibe (G8)
First-break node: understand
Phase 6 seed: task-goa-cafe
`
    );
    expect(parsed.inSegment).toBe(true);
    expect(hasSixRecoveries(parsed)).toBe(true);
    expect(parsed.remembered.toLowerCase()).not.toContain("i remember that small cafe");
    expect(buildMatrix(themes).length).toBe(3);
  });
});
