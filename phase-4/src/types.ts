export type MetricNode = "formulate" | "understand" | "retrieve" | "recognize" | "refine";
export type SegmentCode = "S1" | "S2" | "S3" | "S4" | "S5";
export type Verdict = "proceed" | "fork" | "stop" | "blocked";

export const METRIC_NODES: MetricNode[] = ["formulate", "understand", "retrieve", "recognize", "refine"];

export function isMetricNode(value: string | undefined): value is MetricNode {
  return Boolean(value && (METRIC_NODES as string[]).includes(value));
}

export interface NominationLite {
  opportunityId: string;
  label: string;
  metricNode: MetricNode;
  segmentCode: SegmentCode;
  segmentLabel: string;
  hypothesis: string;
  rejectedAlternatives: Array<{ id: string; reason: string }>;
  readyForPhase3: boolean;
  mvpTaskIds: string[];
  controlTaskId: string;
}

export interface RankRow {
  themeId: string;
  label: string;
  metricNode: MetricNode;
  genericSearchFlag: boolean;
  rank: number;
}

export interface ThemeLite {
  id: string;
  summary: string;
  rememberedCue: string;
  forgottenCue: string;
  actionableInsight: string;
  quotes: Array<{ text: string; reviewId: string; source: string }>;
}

export interface InterviewCensus {
  noteCount: number;
  inSegmentCount: number;
  formOnlyCount: number;
}

export interface Phase3Lite {
  complete: boolean;
  firstBreakNode: string;
  knownItemDominant: boolean;
  workarounds: string[];
  tasks: string[];
  synthesis: string;
}

export interface Gate {
  id: string;
  pass: boolean;
  detail: string;
}

export interface DecisionTree {
  verdict: Verdict;
  locked: boolean;
  generatedAt: string;
  interviewCensus: InterviewCensus;
  gates: Gate[];
  lockedNode: MetricNode;
  reason: string;
  wouldProceedIfInterviewsConfirm: string;
  jobStatement: string;
}

export interface ProblemDefinition {
  locked: boolean;
  verdict: Verdict;
  generatedAt: string;
  northStar: string;
  targetSegment: {
    code: SegmentCode;
    label: string;
    definition: string;
  };
  retrievalScenario: string;
  productOutcome: {
    node: MetricNode;
    label: string;
  };
  rootCause: string;
  workarounds: string[];
  userValue: string;
  businessValue: string;
  evolution: Array<{ beat: string; whatChanged: string }>;
  evidence: {
    discoveryThemeId: string;
    discoveryQuotes: Array<{ text: string; reviewId: string; source: string }>;
    interviews: InterviewCensus;
    phase3Synthesis: string;
  };
  jobStatement: string;
  mvpDirection: string;
  forbiddenFrame: string;
}

export interface SegmentContract {
  code: SegmentCode;
  label: string;
  locked: boolean;
  eligibility: string[];
  disqualify: string[];
  mvpTaskIds: string[];
  controlTaskId: string;
}
