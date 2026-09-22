import { describe, expect, it } from "vitest";
import { LIBRARY, searchLibrary } from "../../../apps/storefront/src/data/library";
import { TASKS } from "../../../apps/storefront/src/data/tasks";
import { elicit, firstQuestionIsDate } from "../../../apps/storefront/src/lib/elicit";
import { applyGroqPatch } from "../../../apps/storefront/src/lib/groqConverse";
import { emptyQuery, parseMemoryClue } from "../../../apps/storefront/src/lib/memoryQuery";
import { retrieve } from "../../../apps/storefront/src/lib/retrieve";
import { isControlTask, isHeroTask, LOCKED_SEGMENT } from "../../../apps/storefront/src/lib/segment";

describe("phase 5 mvp (5f)", () => {
  it("seeds 80+ photos and Phase 3 S2 tasks", () => {
    expect(LIBRARY.length).toBeGreaterThanOrEqual(80);
    expect(LIBRARY.length).toBeLessThanOrEqual(150);
    for (const id of LOCKED_SEGMENT.mvpTaskIds) {
      expect(TASKS.some((task) => task.id === id && task.segmentCode === "S2")).toBe(true);
    }
  });

  it("returns the Goa café and medicine targets in the grouped set", () => {
    const cafe = retrieve(parseMemoryClue("small cafe on that trip"), "p-cafe-1");
    expect(cafe.targetInView).toBe(true);
    expect(cafe.groups[0].whyThisGroup.length).toBeGreaterThan(8);
    expect(cafe.photoIds.length).toBeLessThanOrEqual(24);

    const med = retrieve(parseMemoryClue("medicine when I was sick last year"), "p-med-1");
    expect(med.targetInView).toBe(true);
  });

  it("solves the control date by keyword and not as the Remember hero", () => {
    const hits = searchLibrary("2024-12-14");
    expect(hits.some((photo) => photo.id === "p-cafe-1")).toBe(true);
    expect(isControlTask("task-control-date")).toBe(true);
    expect(isHeroTask("task-control-date")).toBe(false);
  });

  it("elicits at most three questions and never asks date first", () => {
    const first = elicit(emptyQuery(), 0);
    expect(firstQuestionIsDate(first.question ?? "")).toBe(false);
    expect(elicit(emptyQuery(), 3).stopAsking).toBe(true);
  });

  it("strips invented EXIF from a model turn", () => {
    const query = parseMemoryClue("small cafe on that trip");
    const result = applyGroqPatch(
      query,
      { assistantText: "This was taken on 12 March in Calangute.", stopAsking: true },
      0
    );
    expect(result.turn.assistantText).not.toMatch(/taken on|calangute/i);
  });
});
