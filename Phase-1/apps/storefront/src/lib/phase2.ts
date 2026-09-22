export interface Nomination {
  opportunityId: string;
  label: string;
  themeIds: string[];
  metricNode: string;
  segmentCode: string;
  segmentLabel: string;
  interviewFocus: string;
  rejectedAlternatives: Array<{ id: string; reason: string }>;
  readyForPhase3: boolean;
  hypothesis: string;
  mvpTaskIds: string[];
  controlTaskId: string;
}

export interface MatrixNode {
  id: string;
  userBehavior: string;
  productOutcome: string;
  failureQuestion: string;
  subMetric: string;
  opportunities: Array<{
    themeId: string;
    label: string;
    score: number;
    rank: number;
    estimatedFrequency: number;
    impactOnRetrieval: string;
    genericSearchFlag: boolean;
  }>;
  scoreSum: number;
  primary: boolean;
}

export interface FilledMatrix {
  northStar: string;
  generatedAt: string;
  nodes: MatrixNode[];
  ranking: Array<{
    themeId: string;
    label: string;
    metricNode: string;
    score: number;
    rank: number;
    genericSearchFlag: boolean;
    estimatedFrequency: number;
    impactOnRetrieval: string;
  }>;
  genericSearchExcluded: Array<{ themeId: string; label: string }>;
  emptyNodes: string[];
  readyForPhase3: boolean;
}

export interface Phase2Payload {
  matrix: FilledMatrix;
  nomination: Nomination;
}

export async function loadPhase2(): Promise<Phase2Payload | null> {
  const live = await fetch("/api/phase2")
    .then((res) => (res.ok ? res.json() : null))
    .catch(() => null);
  if (live?.nomination && live?.matrix) return live as Phase2Payload;
  try {
    const [matrix, nomination] = await Promise.all([
      fetch("/phase2/filled-matrix.json").then((res) => (res.ok ? res.json() : null)),
      fetch("/phase2/nomination.json").then((res) => (res.ok ? res.json() : null))
    ]);
    if (matrix && nomination) return { matrix, nomination };
  } catch {
    /* run npm run phase2:rank */
  }
  return null;
}
