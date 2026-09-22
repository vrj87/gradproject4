export type MetricNode = "formulate" | "understand" | "retrieve" | "recognize" | "refine";
export type SegmentCode = "S1" | "S2" | "S3" | "S4" | "S5";

export interface RankedOpportunity {
  themeId: string;
  label: string;
  retrievalFailureType: string;
  metricNode: MetricNode;
  impactOnRetrieval: string;
  mvpFeasibility: string;
  estimatedFrequency: number;
  score: number;
  rank: number;
  genericSearchFlag: boolean;
}

export interface ThemeLite {
  id: string;
  label: string;
  summary: string;
  metricNode: MetricNode;
  segmentHints: SegmentCode[];
  estimatedFrequency: number;
  genericSearchLeak: boolean;
  actionableInsight?: string;
  quotes?: Array<{ text: string; reviewId: string; source: string }>;
}

export interface PipelineStatsLite {
  readyForPhase2: boolean;
}

export interface MetricNodeDef {
  id: MetricNode;
  userBehavior: string;
  productOutcome: string;
  failureQuestion: string;
  subMetric: string;
}

export interface MatrixNode {
  id: MetricNode;
  userBehavior: string;
  productOutcome: string;
  failureQuestion: string;
  subMetric: string;
  opportunities: RankedOpportunity[];
  scoreSum: number;
  primary: boolean;
}

export interface FilledMatrix {
  northStar: string;
  generatedAt: string;
  nodes: MatrixNode[];
  ranking: RankedOpportunity[];
  genericSearchExcluded: RankedOpportunity[];
  emptyNodes: MetricNode[];
  readyForPhase3: boolean;
}

export interface Nomination {
  opportunityId: string;
  label: string;
  themeIds: string[];
  metricNode: MetricNode;
  segmentCode: SegmentCode;
  segmentLabel: string;
  interviewFocus: string;
  rejectedAlternatives: Array<{ id: string; reason: string }>;
  readyForPhase3: boolean;
  hypothesis: string;
  mvpTaskIds: string[];
  controlTaskId: string;
}

export const NORTH_STAR =
  "Successful retrieval of a photo the user remembers but cannot precisely describe when they start searching";

export const METRIC_NODES: MetricNodeDef[] = [
  {
    id: "formulate",
    userBehavior: "Turns incomplete memory into a starting clue",
    productOutcome: "Query started from partial memory",
    failureQuestion: "Unable to express what they remember?",
    subMetric: "Formulation rate"
  },
  {
    id: "understand",
    userBehavior: "Clues are interpreted as visual / metadata attributes",
    productOutcome: "System accepts vibe, object, episode, fuzzy time",
    failureQuestion: "Product fails to understand the clues?",
    subMetric: "Clue-understanding rate"
  },
  {
    id: "retrieve",
    userBehavior: "Target exists in the candidate set",
    productOutcome: "Coverage of the remembered photo",
    failureQuestion: "Search never surfaces it?",
    subMetric: "Candidate coverage"
  },
  {
    id: "recognize",
    userBehavior: "User can tell the right photo from near-misses",
    productOutcome: "Evaluable result grouping",
    failureQuestion: "Relevant results hard to evaluate?",
    subMetric: "Recognition rate"
  },
  {
    id: "refine",
    userBehavior: "Next attempt uses what the last miss taught",
    productOutcome: "Successful iteration after a miss",
    failureQuestion: "Struggle to refine an unsuccessful search?",
    subMetric: "Refinement success"
  }
];

export const SEGMENT_LABELS: Record<SegmentCode, string> = {
  S1: "Heavy library",
  S2: "Trip / event rememberer",
  S3: "Object / document finder",
  S4: "People-in-photo finder",
  S5: "Shared / family archivist"
};

export const MVP_TASKS_BY_SEGMENT: Record<SegmentCode, string[]> = {
  S1: ["task-goa-trip"],
  S2: ["task-goa-cafe", "task-goa-trip", "task-concert-lights", "task-houseboat"],
  S3: ["task-medicine", "task-screenshot"],
  S4: ["task-goa-cafe"],
  S5: ["task-goa-cafe"]
};
