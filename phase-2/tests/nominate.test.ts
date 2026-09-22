import { describe, expect, it } from "vitest";
import { buildPhase2 } from "../src/build";
import { Phase2Error } from "../src/nominate";
import type { RankedOpportunity, ThemeLite } from "../src/types";

const vibe: RankedOpportunity = {
  themeId: "place-vibe-without-name",
  label: "PlaceVibeWithoutName",
  retrievalFailureType: "understand",
  metricNode: "understand",
  impactOnRetrieval: "high",
  mvpFeasibility: "high",
  estimatedFrequency: 0.25,
  score: 0.85,
  rank: 1,
  genericSearchFlag: false
};

const generic: RankedOpportunity = {
  themeId: "generic-search-latency",
  label: "GenericSearchLatency",
  retrievalFailureType: "other",
  metricNode: "retrieve",
  impactOnRetrieval: "low",
  mvpFeasibility: "low",
  estimatedFrequency: 0.04,
  score: 0.99,
  rank: 12,
  genericSearchFlag: true
};

const formulate: RankedOpportunity = {
  themeId: "forgotten-date-album",
  label: "ForgottenDateAlbum",
  retrievalFailureType: "formulate",
  metricNode: "formulate",
  impactOnRetrieval: "high",
  mvpFeasibility: "high",
  estimatedFrequency: 0.2,
  score: 0.84,
  rank: 2,
  genericSearchFlag: false
};

const themes: ThemeLite[] = [
  {
    id: "place-vibe-without-name",
    label: "PlaceVibeWithoutName",
    summary: "vibe",
    metricNode: "understand",
    segmentHints: ["S2"],
    estimatedFrequency: 0.25,
    genericSearchLeak: false,
    actionableInsight: "Accept place-vibe language."
  },
  {
    id: "forgotten-date-album",
    label: "ForgottenDateAlbum",
    summary: "date",
    metricNode: "formulate",
    segmentHints: ["S1", "S2"],
    estimatedFrequency: 0.2,
    genericSearchLeak: false
  }
];

describe("phase 2 nomination", () => {
  it("refuses to fill a matrix without ranking (A-M01)", () => {
    expect(() => buildPhase2([], themes, { readyForPhase2: true })).toThrow(Phase2Error);
  });

  it("never nominates a generic-search theme even if the score is higher (A-M03)", () => {
    const { nomination, matrix } = buildPhase2([generic, vibe, formulate], themes, { readyForPhase2: true });
    expect(nomination.opportunityId).toBe("place-vibe-without-name");
    expect(nomination.metricNode).toBe("understand");
    expect(nomination.segmentCode).toBe("S2");
    expect(matrix.nodes.filter((node) => node.primary)).toHaveLength(1);
    expect(nomination.rejectedAlternatives.some((row) => row.id === "generic-search-latency")).toBe(true);
  });

  it("sets readyForPhase3 only when Phase 1 is ready", () => {
    const blocked = buildPhase2([vibe], themes, { readyForPhase2: false });
    expect(blocked.nomination.readyForPhase3).toBe(false);
    const ready = buildPhase2([vibe], themes, { readyForPhase2: true });
    expect(ready.nomination.readyForPhase3).toBe(true);
  });
});
