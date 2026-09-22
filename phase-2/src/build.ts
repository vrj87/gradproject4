import { mapMatrix } from "./map-matrix";
import { nominate, Phase2Error } from "./nominate";
import type { FilledMatrix, Nomination, PipelineStatsLite, RankedOpportunity, ThemeLite } from "./types";

export function buildPhase2(
  ranking: RankedOpportunity[],
  themes: ThemeLite[],
  stats: PipelineStatsLite
): { matrix: FilledMatrix; nomination: Nomination } {
  if (!ranking.length) {
    throw new Phase2Error("Opportunity matrix cannot be filled without opportunity-ranking.json (A-M01).");
  }
  const nomination = nominate(ranking, themes, stats.readyForPhase2);
  const matrix = mapMatrix(ranking, nomination.metricNode, nomination.readyForPhase3);
  const primaryNodes = matrix.nodes.filter((node) => node.primary);
  if (primaryNodes.length !== 1) {
    throw new Phase2Error("Exactly one primary metric node is required (A-M05).");
  }
  return { matrix, nomination };
}
