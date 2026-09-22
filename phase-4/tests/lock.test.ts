import { describe, expect, it } from "vitest";
import { buildPhase4 } from "../src/build";
import { decide } from "../src/decide";
import type { NominationLite, RankRow } from "../src/types";

const nomination: NominationLite = {
  opportunityId: "place-vibe-without-name",
  label: "PlaceVibeWithoutName",
  metricNode: "understand",
  segmentCode: "S2",
  segmentLabel: "Trip / event rememberer",
  hypothesis: "Accept place-vibe language.",
  rejectedAlternatives: [],
  readyForPhase3: true,
  mvpTaskIds: ["task-goa-cafe"],
  controlTaskId: "task-control-date"
};

const ranking: RankRow[] = [
  {
    themeId: "place-vibe-without-name",
    label: "PlaceVibeWithoutName",
    metricNode: "understand",
    genericSearchFlag: false,
    rank: 1
  }
];

const readyCensus = { noteCount: 6, inSegmentCount: 6, formOnlyCount: 6 };

describe("phase 4 decision tree", () => {
  it("does not lock when in-segment n is below 5 (A-P07)", () => {
    const tree = decide({
      nomination,
      ranking,
      census: { noteCount: 0, inSegmentCount: 0, formOnlyCount: 3 },
      now: "2026-09-22T00:00:00.000Z"
    });
    expect(tree.verdict).toBe("blocked");
    expect(tree.locked).toBe(false);
    expect(tree.reason).toMatch(/memory-cue/);
  });

  it("proceeds when n ≥ 5 and Phase 3 holds understand", () => {
    const tree = decide({
      nomination,
      ranking,
      census: readyCensus,
      phase3: { complete: true, firstBreakNode: "understand", knownItemDominant: false },
      now: "2026-09-22T00:00:00.000Z"
    });
    expect(tree.verdict).toBe("proceed");
    expect(tree.locked).toBe(true);
    expect(tree.lockedNode).toBe("understand");
  });

  it("forks when Phase 3 first-break contradicts the Phase 2 node", () => {
    const tree = decide({
      nomination,
      ranking,
      census: readyCensus,
      phase3: { complete: true, firstBreakNode: "retrieve", knownItemDominant: false }
    });
    expect(tree.verdict).toBe("fork");
    expect(tree.locked).toBe(true);
    expect(tree.lockedNode).toBe("retrieve");
    expect(tree.reason).toMatch(/rewrite Phase 5/);
  });

  it("stops if generic search is the top opportunity", () => {
    const tree = decide({
      nomination,
      ranking: [
        {
          themeId: "generic-search-latency",
          label: "GenericSearchLatency",
          metricNode: "retrieve",
          genericSearchFlag: true,
          rank: 1
        }
      ],
      census: readyCensus
    });
    expect(tree.verdict).toBe("stop");
    expect(tree.locked).toBe(false);
  });

  it("stops if respondents succeed as known-item search", () => {
    const tree = decide({
      nomination,
      ranking,
      census: readyCensus,
      phase3: { complete: true, firstBreakNode: "understand", knownItemDominant: true }
    });
    expect(tree.verdict).toBe("stop");
    expect(tree.locked).toBe(false);
  });

  it("fills all Part 4 fields without the forbidden frame", () => {
    const { definition, tree } = buildPhase4({
      nomination,
      ranking,
      themes: [
        {
          id: "place-vibe-without-name",
          summary: "Place vibe",
          rememberedCue: "place_vibe",
          forgottenCue: "exact_place",
          actionableInsight: "Accept place-vibe language.",
          quotes: [{ text: "small cafe on the trip", reviewId: "fix-s2-01", source: "reddit" }]
        }
      ],
      census: { noteCount: 0, inSegmentCount: 0, formOnlyCount: 0 }
    });
    expect(definition.rootCause.toLowerCase()).not.toContain("users find it difficult to search for old photos");
    expect(definition.productOutcome.node).toBe("understand");
    expect(definition.targetSegment.code).toBe("S2");
    expect(definition.retrievalScenario.toLowerCase()).not.toBe("old photos");
    expect(definition.workarounds.length).toBeGreaterThan(1);
    expect(definition.evolution).toHaveLength(5);
    expect(definition.locked).toBe(false);
    expect(tree.verdict).toBe("blocked");
    expect(definition.evolution.map((row) => row.beat)).toEqual([
      "Business metric",
      "Product outcomes",
      "AI-powered discovery",
      "Observed user behavior",
      "Problem definition"
    ]);
  });

  it("locks exactly one outcome from Phase 3 when n ≥ 5", () => {
    const { definition, contract } = buildPhase4({
      nomination,
      ranking,
      themes: [
        {
          id: "place-vibe-without-name",
          summary: "Place vibe",
          rememberedCue: "place_vibe",
          forgottenCue: "exact_place",
          actionableInsight: "Accept place-vibe language.",
          quotes: [{ text: "small cafe on the trip", reviewId: "fix-s2-01", source: "reddit" }]
        }
      ],
      census: readyCensus,
      phase3: {
        complete: true,
        firstBreakNode: "understand",
        knownItemDominant: false,
        workarounds: ["still unfound, or found by scroll / a person / another app — not by a precise keyword (G9)"],
        tasks: ["task-goa-cafe", "task-goa-trip", "task-concert-lights", "task-houseboat"],
        synthesis: "n=6 S2 via the Google Form."
      }
    });
    expect(definition.locked).toBe(true);
    expect(definition.verdict).toBe("proceed");
    expect(definition.productOutcome.node).toBe("understand");
    expect(contract.mvpTaskIds).toHaveLength(4);
    expect(definition.jobStatement).toMatch(/place-vibe language/);
  });
});
