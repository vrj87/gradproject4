export type Verdict = "proceed" | "fork" | "stop" | "blocked";

export interface MvpReport {
  complete: boolean;
  generatedAt: string;
  locked: boolean;
  verdict: Verdict;
  node: string;
  jobStatement: string;
  librarySize: number;
  surfaces: string[];
  gates: Array<{ id: string; pass: boolean; detail: string }>;
}

export function buildMvp(input: {
  verdict: string;
  locked: boolean;
  node: string;
  jobStatement: string;
  librarySize: number;
  now?: string;
}): MvpReport {
  const verdict = input.verdict as Verdict;
  const gates = [
    {
      id: "phase4-lock",
      pass: input.locked && (verdict === "proceed" || verdict === "fork"),
      detail: input.locked
        ? `Phase 4 ${verdict} · ${input.node}.`
        : `Phase 4 is ${verdict || "missing"} — do not ship the MVP (A-V04 / A-P07).`
    },
    {
      id: "understand-job",
      pass: /place-vibe|vibe language/i.test(input.jobStatement),
      detail: input.jobStatement
    },
    {
      id: "library-size",
      pass: input.librarySize >= 80,
      detail: `Seed library n=${input.librarySize} (need 80–150).`
    },
    {
      id: "forbidden-frame",
      pass: !/users find it difficult to search for old photos/i.test(input.jobStatement),
      detail: "Job is not the forbidden generic-search frame."
    }
  ];
  return {
    complete: gates.every((gate) => gate.pass),
    generatedAt: input.now ?? new Date().toISOString(),
    locked: input.locked,
    verdict,
    node: input.node,
    jobStatement: input.jobStatement,
    librarySize: input.librarySize,
    surfaces: [
      "/?view=mvp&task=task-goa-cafe",
      "/mvp",
      "/playground",
      "/dashboard",
      "/demo/task/task-goa-cafe",
      "/api/health"
    ],
    gates
  };
}
