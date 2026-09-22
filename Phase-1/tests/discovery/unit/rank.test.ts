import { describe, expect, it } from "vitest";
import type { Theme } from "@photos/discovery-core";
import { rankOpportunities } from "../../../tools/discovery-pipeline/src/rank.ts";

function theme(partial: Partial<Theme> & Pick<Theme, "id" | "label">): Theme {
  return {
    summary: "x",
    researchQuestionIds: [1],
    retrievalFailureType: "understand",
    rememberedCue: "place_vibe",
    forgottenCue: "date",
    photoKind: "memory",
    metricNode: "understand",
    segmentHints: ["S2"],
    quotes: [],
    estimatedFrequency: 0.2,
    impactOnRetrieval: "high",
    mvpFeasibility: "high",
    confidence: "medium",
    actionableInsight: "Accept place-vibe language instead of a date first.",
    genericSearchLeak: false,
    ...partial
  };
}

describe("rank", () => {
  it("flags generic-search below retrieval themes", () => {
    const ranked = rankOpportunities([
      theme({ id: "generic-search-latency", label: "Generic", genericSearchLeak: true, impactOnRetrieval: "low", mvpFeasibility: "low" }),
      theme({ id: "place-vibe-without-name", label: "Vibe" })
    ]);
    expect(ranked[0].label).toBe("Vibe");
    expect(ranked[1].genericSearchFlag).toBe(true);
  });
});
