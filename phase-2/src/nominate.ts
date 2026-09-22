import { SEGMENT_LABELS, MVP_TASKS_BY_SEGMENT, type Nomination, type RankedOpportunity, type SegmentCode, type ThemeLite } from "./types";

export class Phase2Error extends Error {
  constructor(message: string) {
    super(message);
    this.name = "Phase2Error";
  }
}

export function pickWinner(ranking: RankedOpportunity[]): RankedOpportunity {
  const eligible = ranking
    .filter((row) => !row.genericSearchFlag)
    .sort((a, b) => a.rank - b.rank || b.score - a.score);
  if (!eligible.length) {
    throw new Phase2Error("No non-generic opportunity to nominate (A-M03).");
  }
  return eligible[0];
}

export function pickSegment(winner: RankedOpportunity, themes: ThemeLite[]): SegmentCode {
  const theme = themes.find((item) => item.id === winner.themeId);
  if (theme?.segmentHints.length === 1) return theme.segmentHints[0];

  const counts = new Map<SegmentCode, number>();
  const pool = themes.filter(
    (item) => item.metricNode === winner.metricNode && !item.genericSearchLeak
  );
  for (const item of pool.length ? pool : themes) {
    for (const hint of item.segmentHints) {
      counts.set(hint, (counts.get(hint) ?? 0) + item.estimatedFrequency);
    }
  }
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  if (!ranked.length) {
    throw new Phase2Error("Segment nominated with no ranking support (A-M04).");
  }
  return ranked[0][0];
}

export function nominate(
  ranking: RankedOpportunity[],
  themes: ThemeLite[],
  readyForPhase2: boolean
): Nomination {
  if (!ranking.length) {
    throw new Phase2Error("Opportunity matrix cannot be filled without opportunity-ranking.json (A-M01).");
  }

  const winner = pickWinner(ranking);
  const segmentCode = pickSegment(winner, themes);
  const themeIds = themes
    .filter(
      (theme) =>
        theme.metricNode === winner.metricNode &&
        theme.segmentHints.includes(segmentCode) &&
        !theme.genericSearchLeak
    )
    .map((theme) => theme.id);

  const ids = themeIds.length ? themeIds : [winner.themeId];
  const insight =
    themes.find((theme) => theme.id === winner.themeId)?.actionableInsight ??
    "Accept remembered cues instead of demanding a date or album first.";

  const rejectedAlternatives = ranking
    .filter((row) => row.themeId !== winner.themeId)
    .slice(0, 6)
    .map((row) => ({
      id: row.themeId,
      reason: rejectReason(row, winner)
    }));

  const primaryCount = new Set(
    ranking.filter((row) => !row.genericSearchFlag).map((row) => row.metricNode)
  );
  if (primaryCount.size === 0) {
    throw new Phase2Error("All five nodes marked empty — cannot nominate (A-M05).");
  }

  return {
    opportunityId: winner.themeId,
    label: winner.label,
    themeIds: ids,
    metricNode: winner.metricNode,
    segmentCode,
    segmentLabel: SEGMENT_LABELS[segmentCode],
    interviewFocus: `${SEGMENT_LABELS[segmentCode]}s (${segmentCode}) who remember a place vibe, object, or episode but have forgotten the date, album, or exact place. Probe why retrieval fails despite that partial memory — not whether search is slow.`,
    rejectedAlternatives,
    readyForPhase3: readyForPhase2,
    hypothesis: insight,
    mvpTaskIds: MVP_TASKS_BY_SEGMENT[segmentCode],
    controlTaskId: "task-control-date"
  };
}

function rejectReason(row: RankedOpportunity, winner: RankedOpportunity): string {
  if (row.genericSearchFlag) {
    return "Generic search ranking / indexing — excluded by the brief (A-M03).";
  }
  if (row.metricNode !== winner.metricNode) {
    return `Different product outcome (${row.metricNode}). Part 2 nominates exactly one primary node (A-M05).`;
  }
  return `Lower score than ${winner.label} on 0.4 impact + 0.4 feasibility + 0.2 frequency.`;
}
