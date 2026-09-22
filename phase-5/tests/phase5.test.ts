import { describe, expect, it } from "vitest";
import { buildMvp } from "../src/build";

describe("phase 5 setup gates", () => {
  it("does not complete while Phase 4 is blocked", () => {
    const report = buildMvp({
      verdict: "blocked",
      locked: false,
      node: "understand",
      jobStatement: "Accept place-vibe language so trip rememberers can retrieve a photo they still picture but cannot date or name.",
      librarySize: 90
    });
    expect(report.complete).toBe(false);
  });

  it("completes on proceed with the locked understand job and a fat library", () => {
    const report = buildMvp({
      verdict: "proceed",
      locked: true,
      node: "understand",
      jobStatement: "Accept place-vibe language so trip rememberers can retrieve a photo they still picture but cannot date or name.",
      librarySize: 90
    });
    expect(report.complete).toBe(true);
    expect(report.jobStatement.toLowerCase()).not.toContain("users find it difficult to search for old photos");
    expect(report.surfaces).toContain("/mvp");
    expect(report.surfaces).toContain("/demo/task/task-goa-cafe");
  });
});
