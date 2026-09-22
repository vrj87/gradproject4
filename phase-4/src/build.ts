import { decide, jobForNode } from "./decide";
import { assertSegmentContract } from "./segment.contract";
import type {
  InterviewCensus,
  MetricNode,
  NominationLite,
  Phase3Lite,
  ProblemDefinition,
  RankRow,
  SegmentContract,
  ThemeLite
} from "./types";

const OUTCOME_LABEL: Record<MetricNode, string> = {
  formulate: "Query started from partial memory — the person can begin without a date or town name",
  understand: "Clue-understanding rate — the product accepts vibe, object, episode, and fuzzy time",
  retrieve: "Coverage of the remembered photo in the candidate set",
  recognize: "Evaluable result grouping — they can tell the photo from near-misses",
  refine: "Successful iteration after a miss — the first miss teaches the next attempt"
};

const MVP_DIRECTION: Record<MetricNode, string> = {
  formulate: "Memory Cue Retrieval on Remember — intelligence at formulate (start from the fragment, never date-first).",
  understand: "Memory Cue Retrieval on Remember — intelligence at understand (place-vibe language → grouped candidates).",
  retrieve: "Matching MVP — intelligence at retrieve (captions / embeddings / metadata against the fragment).",
  recognize: "Comparison MVP — intelligence at recognize (near-miss groups and “is this it?”).",
  refine: "Elicitation MVP — intelligence at refine (the miss teaches the next clue)."
};

const DEFAULT_WORKAROUNDS = [
  "Scroll the timeline for hours",
  "Ask a partner or someone who was on the trip",
  "Open another phone or app",
  "Give up and leave the photo unfound"
];

function rootCauseFor(node: MetricNode): string {
  if (node === "understand" || node === "formulate") {
    return "People remember how a place felt on a trip and have forgotten the date, album, and town name, so Search cannot take the clue they still have even though the photo is in the library.";
  }
  if (node === "retrieve") {
    return "People remember how a place felt on a trip and have forgotten the date, album, and town name, so the candidate set never includes the photo they still picture.";
  }
  if (node === "recognize") {
    return "People remember how a place felt on a trip and have forgotten the date, album, and town name, so the photo may be in the grid but they cannot tell it from near-misses.";
  }
  return "People remember how a place felt on a trip and have forgotten the date, album, and town name, so the first miss teaches nothing and they start over.";
}

export function buildPhase4(input: {
  nomination: NominationLite;
  ranking: RankRow[];
  themes: ThemeLite[];
  census: InterviewCensus;
  phase3?: Partial<Phase3Lite>;
  stats?: { rawCount?: number; normalizedCount?: number; validatedThemeCount?: number };
  now?: string;
}): { definition: ProblemDefinition; tree: ReturnType<typeof decide>; contract: SegmentContract } {
  const tree = decide(input);
  const theme =
    input.themes.find((item) => item.id === input.nomination.opportunityId) ?? input.themes[0];
  const quotes = (theme?.quotes ?? []).slice(0, 3);
  const node = tree.lockedNode;
  const workarounds =
    input.phase3?.workarounds && input.phase3.workarounds.length > 0
      ? input.phase3.workarounds
      : DEFAULT_WORKAROUNDS;
  const tasks =
    input.phase3?.tasks && input.phase3.tasks.length >= 3 ? input.phase3.tasks : input.nomination.mvpTaskIds;

  const definition: ProblemDefinition = {
    locked: tree.locked,
    verdict: tree.verdict,
    generatedAt: tree.generatedAt,
    northStar:
      "Increase the share of users who successfully retrieve a photo they remember but cannot precisely describe when they start searching",
    targetSegment: {
      code: input.nomination.segmentCode,
      label: input.nomination.segmentLabel,
      definition:
        "People whose primary Google Photos library is large enough that scrolling is not the find method, who remember a trip or event by vibe (café, lights, boat) and have forgotten the date, album, or town name."
    },
    retrievalScenario:
      "The café I cannot date — a trip photo the person can still picture (small café, yellow chairs, after the beach) when the capture day and place name are gone.",
    productOutcome: {
      node,
      label: OUTCOME_LABEL[node]
    },
    rootCause: rootCauseFor(node),
    workarounds,
    userValue:
      "Get the intended memory back from the fragments that survived — without reconstructing metadata the person no longer has.",
    businessValue:
      "A library people cannot re-enter becomes a write-only backup. Successful vague-memory retrieval is why they keep capturing, keep backup on, and keep Photos as the default camera roll.",
    evolution: [
      {
        beat: "Business metric",
        whatChanged:
          "Locked the north-star as successful vague-memory retrieval per started task — not search CTR."
      },
      {
        beat: "Product outcomes",
        whatChanged:
          "Split the journey into formulate, understand, retrieve, recognize, refine. Exactly one node can be the bet."
      },
      {
        beat: "AI-powered discovery",
        whatChanged: `Public corpus kept ${input.stats?.normalizedCount ?? "—"} retrieval posts and scored ${input.stats?.validatedThemeCount ?? "—"} themes. Place-vibe without a name ranked first; generic search latency was flagged and excluded.`
      },
      {
        beat: "Observed user behavior",
        whatChanged: input.phase3?.synthesis
          ? input.phase3.synthesis
          : tree.interviewCensus.inSegmentCount >= 5
            ? `Phase 3 Google Form (n=${tree.interviewCensus.inSegmentCount} S2) confirmed people remember place vibe / trip and have forgotten date and town. Understand remains the break.`
            : `Phase 3 is not complete (in-segment n=${tree.interviewCensus.inSegmentCount}).`
      },
      {
        beat: "Problem definition",
        whatChanged: tree.locked
          ? tree.jobStatement
          : "Proposed from discovery. Not locked (A-P07) until n ≥ 5 in-segment S2 form records."
      }
    ],
    evidence: {
      discoveryThemeId: input.nomination.opportunityId,
      discoveryQuotes: quotes,
      interviews: tree.interviewCensus,
      phase3Synthesis: input.phase3?.synthesis ?? ""
    },
    jobStatement: jobForNode(node),
    mvpDirection: tree.locked
      ? MVP_DIRECTION[node]
      : "Hypothesis MVP on Remember, labeled not-locked, so a stranger can attempt the café task while the form census reaches n ≥ 5.",
    forbiddenFrame: "Users find it difficult to search for old photos."
  };

  const contract: SegmentContract = {
    code: input.nomination.segmentCode,
    label: input.nomination.segmentLabel,
    locked: tree.locked,
    eligibility: [
      "Google Photos is the primary library for ≥ 12 months",
      "Library large enough that scrolling is not the default find method",
      "Can recall at least one photo they knew existed but failed to find on the first search",
      "Failed find started from incomplete memory (place vibe / trip), not date / album / filename"
    ],
    disqualify: [
      "Google / Photos employee or close family of the team",
      "Known-item search (they had the exact word and search worked)",
      "Screenshot / medicine / unlabeled-face stories counted toward S2 n"
    ],
    mvpTaskIds: tasks,
    controlTaskId: input.nomination.controlTaskId
  };

  return { definition, tree, contract: assertSegmentContract(contract) };
}

export function problemMarkdown(definition: ProblemDefinition): string {
  const quotes = definition.evidence.discoveryQuotes
    .map((quote) => `- “${quote.text}” (${quote.source} · ${quote.reviewId})`)
    .join("\n");
  const evolution = definition.evolution.map((row) => `- **${row.beat}:** ${row.whatChanged}`).join("\n");
  return `# Problem definition (Part 4)

> **Locked: ${definition.locked ? "yes" : "no"}.** Verdict: \`${definition.verdict}\`.  
> Do not paste a lock onto a slide while in-segment n < 5 (A-P07).

**One-sentence root cause:** ${definition.rootCause}

Forbidden frame: “${definition.forbiddenFrame}”

## Required fields

| Field | Statement |
|-------|-----------|
| Target user segment | **${definition.targetSegment.code} ${definition.targetSegment.label}.** ${definition.targetSegment.definition} |
| Retrieval scenario | ${definition.retrievalScenario} |
| Product outcome | **${definition.productOutcome.node}** — ${definition.productOutcome.label} |
| Root cause | ${definition.rootCause} |
| Existing workarounds | ${definition.workarounds.join("; ")} |
| User value | ${definition.userValue} |
| Business value | ${definition.businessValue} |

## Evolution chain

${evolution}

## Evidence (discovery quotes labeled public; form ticks in Google)

Theme \`${definition.evidence.discoveryThemeId}\`.

${quotes || "- (no quotes on disk)"}

Form census (Part 3): notes=${definition.evidence.interviews.noteCount}, in-segment=${definition.evidence.interviews.inSegmentCount}, form-only=${definition.evidence.interviews.formOnlyCount}.

${definition.evidence.phase3Synthesis ? `Phase 3 synthesis: ${definition.evidence.phase3Synthesis}\n` : ""}
## Job for Phase 5

${definition.jobStatement}

${definition.mvpDirection}

Generated ${definition.generatedAt}.
`;
}

export function mvpReadme(definition: ProblemDefinition): string {
  const n = definition.evidence.interviews.inSegmentCount;
  return `# Phase 5 — Memory Cue Retrieval

**Job:** ${definition.jobStatement}

**Locked:** ${definition.locked ? `yes (Phase 4 \`${definition.verdict}\` after n = ${n} S2 Google Form records)` : `no (Phase 4 \`${definition.verdict}\`)`}. This folder does **not** start a second app. The testable MVP is the Photos storefront:

| Surface | URL |
|---------|-----|
| MVP (Remember) | http://localhost:3000/mvp |
| Goa café task | http://localhost:3000/demo/task/task-goa-cafe |
| Keyword baseline | http://localhost:3000/?view=search |
| Playground | http://localhost:3000/playground |
| Dashboard | http://localhost:3000/dashboard |
| Research (Part 3) | http://localhost:3000/?view=research |
| Problem (Part 4) | http://localhost:3000/?view=problem |
| MVP test (Part 6) | http://localhost:3000/test |
| Success metrics | http://localhost:3000/?view=success |
| Risks | http://localhost:3000/?view=risks |
| 10-slide PDF | docs/deck/NL_GooglePhotos.pdf |

Intelligence sits at **${definition.productOutcome.node}**. ${definition.mvpDirection} Header Search is the baseline to beat. Not the user’s real Google Photos account.

Part 6–8 live on the same storefront. Do not freeze slide 9 or export \`NL_GooglePhotos\` until counted return testers ≥ 3 and Phase 4 locks.
`;
}
