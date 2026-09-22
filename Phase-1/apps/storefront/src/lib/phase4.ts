export interface ProblemDefinition {
  locked: boolean;
  verdict: string;
  generatedAt: string;
  northStar: string;
  targetSegment: { code: string; label: string; definition: string };
  retrievalScenario: string;
  productOutcome: { node: string; label: string };
  rootCause: string;
  workarounds: string[];
  userValue: string;
  businessValue: string;
  evolution: Array<{ beat: string; whatChanged: string }>;
  evidence: {
    discoveryThemeId: string;
    discoveryQuotes: Array<{ text: string; reviewId: string; source: string }>;
    interviews: { noteCount: number; inSegmentCount: number; formOnlyCount: number };
    phase3Synthesis?: string;
  };
  jobStatement: string;
  mvpDirection: string;
  forbiddenFrame?: string;
}

export interface DecisionTree {
  verdict: string;
  locked: boolean;
  lockedNode?: string;
  gates: Array<{ id: string; pass: boolean; detail: string }>;
  reason?: string;
  wouldProceedIfInterviewsConfirm: string;
  jobStatement: string;
  interviewCensus: { noteCount: number; inSegmentCount: number; formOnlyCount: number };
}

export interface Phase4Payload {
  definition: ProblemDefinition;
  tree: DecisionTree;
}

export async function loadPhase4(): Promise<Phase4Payload | null> {
  const live = await fetch("/api/phase4")
    .then((res) => (res.ok ? res.json() : null))
    .catch(() => null);
  if (live?.definition && live?.tree) return live as Phase4Payload;
  try {
    const [definition, tree] = await Promise.all([
      fetch("/phase4/problem-definition.json").then((res) => (res.ok ? res.json() : null)),
      fetch("/phase4/decision-tree.json").then((res) => (res.ok ? res.json() : null))
    ]);
    if (definition && tree) return { definition, tree };
  } catch {
    /* run npm run phase4:lock */
  }
  return null;
}
