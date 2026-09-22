import { isMetricNode, type DecisionTree, type Gate, type InterviewCensus, type MetricNode, type NominationLite, type Phase3Lite, type RankRow, type Verdict } from "./types";

const JOB: Record<MetricNode, string> = {
  formulate: "Let trip rememberers start from the fragment they still have, without demanding a date or town name first.",
  understand:
    "Accept place-vibe language so trip rememberers can retrieve a photo they still picture but cannot date or name.",
  retrieve: "Surface the remembered photo in the candidate set from the fragments they still have.",
  recognize: "Group near-misses so they can pick the photo they still picture from a result set they can evaluate.",
  refine: "Teach the next attempt from the miss so they do not start the search over."
};

const PROCEED: Record<MetricNode, string> = {
  formulate: "proceed: conversational / memory-cue MVP",
  understand: "proceed: conversational / memory-cue MVP",
  retrieve: "proceed: embedding / caption / metadata matching MVP",
  recognize: "proceed: grouping / comparison / “is this it?” MVP",
  refine: "proceed: iterative clue-elicitation MVP"
};

export function jobForNode(node: MetricNode): string {
  return JOB[node];
}

export function decide(input: {
  nomination: NominationLite;
  ranking: RankRow[];
  census: InterviewCensus;
  phase3?: Partial<Phase3Lite>;
  now?: string;
}): DecisionTree {
  const generatedAt = input.now ?? new Date().toISOString();
  const winner = input.ranking.slice().sort((a, b) => a.rank - b.rank)[0];
  const phase2Node = input.nomination.metricNode;
  const phase3Node = isMetricNode(input.phase3?.firstBreakNode) ? input.phase3.firstBreakNode : undefined;
  const nOk = input.census.inSegmentCount >= 5;
  const contradicts = Boolean(nOk && phase3Node && phase3Node !== phase2Node);
  const lockedNode: MetricNode = contradicts && phase3Node ? phase3Node : phase2Node;
  const knownItem = Boolean(input.phase3?.knownItemDominant);

  const gates: Gate[] = [
    {
      id: "n-in-segment",
      pass: nOk,
      detail: `in-segment n=${input.census.inSegmentCount} (need ≥ 5). Form study rows=${input.census.formOnlyCount}. Notes=${input.census.noteCount}.`
    },
    {
      id: "phase3-node",
      pass: !contradicts,
      detail: contradicts
        ? `Phase 3 first-break=${phase3Node} contradicts Phase 2 ${phase2Node} → fork and relock the outcome.`
        : `Phase 3 first-break=${phase3Node ?? "n/a"} matches Phase 2 ${phase2Node}.`
    },
    {
      id: "generic-search",
      pass: !winner?.genericSearchFlag,
      detail: winner?.genericSearchFlag
        ? `${winner.label} is generic search ranking / indexing.`
        : `${winner?.label ?? "top row"} is not generic search.`
    },
    {
      id: "known-item",
      pass: !knownItem,
      detail: knownItem
        ? "Respondents succeed once they can name a precise keyword — known-item, not vague memory."
        : nOk
          ? "G9 drops known-item rows. Counted S2 are incomplete-memory trip/place-vibe."
          : "No in-segment form corpus yet to prove people succeed once they recall a precise keyword."
    }
  ];

  let verdict: Verdict;
  let reason: string;

  if (!gates.find((gate) => gate.id === "generic-search")?.pass) {
    verdict = "stop";
    reason = "stop: out of brief scope (“not to improve search in general”)";
  } else if (knownItem) {
    verdict = "stop";
    reason = "stop: this is known-item search, not vague memory";
  } else if (!nOk) {
    verdict = "blocked";
    reason = PROCEED[lockedNode] ?? "stop; do not ship an ungrounded agent";
  } else if (contradicts) {
    verdict = "fork";
    reason = `fork: relock outcome to ${lockedNode}; rewrite Phase 5`;
  } else if (lockedNode === "formulate" || lockedNode === "understand") {
    verdict = "proceed";
    reason = PROCEED[lockedNode];
  } else if (lockedNode === "retrieve" || lockedNode === "recognize" || lockedNode === "refine") {
    verdict = "proceed";
    reason = PROCEED[lockedNode];
  } else {
    verdict = "stop";
    reason = "stop; do not ship an ungrounded agent";
  }

  return {
    verdict,
    locked: verdict === "proceed" || verdict === "fork",
    generatedAt,
    interviewCensus: input.census,
    gates,
    lockedNode,
    reason,
    wouldProceedIfInterviewsConfirm: reason,
    jobStatement: jobForNode(lockedNode)
  };
}
