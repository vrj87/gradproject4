import {
  METRIC_NODES,
  type FilledMatrix,
  type MetricNode,
  type RankedOpportunity,
  type ThemeLite
} from "./types";

export function mapMatrix(
  ranking: RankedOpportunity[],
  primaryNode: MetricNode | null,
  readyForPhase3: boolean
): FilledMatrix {
  const nodes = METRIC_NODES.map((def) => {
    const opportunities = ranking.filter((row) => row.metricNode === def.id && !row.genericSearchFlag);
    return {
      ...def,
      opportunities,
      scoreSum: Number(opportunities.reduce((sum, row) => sum + row.score, 0).toFixed(3)),
      primary: primaryNode === def.id
    };
  });

  return {
    northStar:
      "Successful retrieval of a photo the user remembers but cannot precisely describe when they start searching",
    generatedAt: new Date().toISOString(),
    nodes,
    ranking,
    genericSearchExcluded: ranking.filter((row) => row.genericSearchFlag),
    emptyNodes: nodes.filter((node) => node.opportunities.length === 0).map((node) => node.id),
    readyForPhase3
  };
}

export function themeById(themes: ThemeLite[], id: string): ThemeLite | undefined {
  return themes.find((theme) => theme.id === id);
}
