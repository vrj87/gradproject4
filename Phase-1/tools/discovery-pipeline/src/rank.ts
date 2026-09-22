import type { RankedOpportunity, Theme } from "@photos/discovery-core";

const IMPACT: Record<string, number> = { high: 1, medium: 0.6, low: 0.3 };

export function rankOpportunities(themes: Theme[]): RankedOpportunity[] {
  const scored = themes.map((theme) => {
    const score =
      0.4 * (IMPACT[theme.impactOnRetrieval] ?? 0) +
      0.4 * (IMPACT[theme.mvpFeasibility] ?? 0) +
      0.2 * theme.estimatedFrequency;
    return {
      themeId: theme.id,
      label: theme.label,
      retrievalFailureType: theme.retrievalFailureType,
      metricNode: theme.metricNode,
      impactOnRetrieval: theme.impactOnRetrieval,
      mvpFeasibility: theme.mvpFeasibility,
      estimatedFrequency: theme.estimatedFrequency,
      score: Number(score.toFixed(3)),
      rank: 0,
      genericSearchFlag: theme.genericSearchLeak
    };
  });

  scored.sort((a, b) => {
    if (a.genericSearchFlag !== b.genericSearchFlag) return a.genericSearchFlag ? 1 : -1;
    if (b.score !== a.score) return b.score - a.score;
    return (IMPACT[b.impactOnRetrieval] ?? 0) - (IMPACT[a.impactOnRetrieval] ?? 0);
  });

  return scored.map((row, index) => ({ ...row, rank: index + 1 }));
}
