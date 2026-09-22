import type { PipelineStats, RankedOpportunity, Theme } from "@photos/discovery-core";

export function renderReport(
  themes: Theme[],
  ranking: RankedOpportunity[],
  stats: PipelineStats
): string {
  const rows = ranking
    .map(
      (row) =>
        `<tr><td>${row.rank}</td><td>${row.label}</td><td>${row.metricNode}</td><td>${row.score}</td><td>${row.genericSearchFlag ? "flagged" : "ok"}</td></tr>`
    )
    .join("");
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>Photos discovery report</title>
<style>body{font-family:Georgia,serif;max-width:800px;margin:2rem auto;color:#202124}table{border-collapse:collapse;width:100%}td,th{border:1px solid #dadce0;padding:.4rem;text-align:left}</style>
</head><body>
<h1>Vague-memory retrieval — discovery report</h1>
<p>raw ${stats.rawCount} → kept ${stats.normalizedCount} → ${stats.validatedThemeCount} themes. readyForPhase2: <b>${stats.readyForPhase2}</b> (${stats.extractionMethod})</p>
<table><tr><th>#</th><th>Opportunity</th><th>Node</th><th>Score</th><th>Generic search</th></tr>${rows}</table>
<p>${themes.length} quote-grounded themes. Gaps: Q${stats.researchQuestionGaps.join(", Q") || "none"}.</p>
</body></html>`;
}
