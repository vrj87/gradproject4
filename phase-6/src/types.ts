export type Outcome = "success" | "miss" | "abandoned" | "not-attempted";

export interface TestSession {
  id: string;
  inSegment: boolean;
  taskId: string;
  representative: boolean;
  baselineAttempted: boolean;
  baselineOutcome: Outcome;
  mvpAttempted: boolean;
  mvpOutcome: Outcome;
  unassisted: boolean;
  hinted: boolean;
  nextIteration: string;
  timeToTarget?: string;
  cuesUsed?: string;
  questionsHelped?: string;
  questionsAnnoyed?: string;
  source: "note" | "inbox";
}

export interface Gate {
  id: string;
  pass: boolean;
  detail: string;
}

export interface Census {
  noteCount: number;
  inboxCount: number;
  counted: number;
  inSegmentCounted: number;
  unassistedSuccess: number;
  allFailed: boolean;
}

export interface Phase6Report {
  complete: boolean;
  frozen: boolean;
  generatedAt: string;
  census: Census;
  gates: Gate[];
  jobStatement: string;
  learnings: {
    worked: string[];
    changeNext: string[];
    status: string;
  };
  sessions: Array<{
    id: string;
    taskId: string;
    counted: boolean;
    representative: boolean;
    baselineOutcome: Outcome;
    mvpOutcome: Outcome;
    nextIteration: string;
  }>;
}
