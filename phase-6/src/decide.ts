import type { Census, Gate, TestSession } from "./types";

export function countsTowardN(session: TestSession): boolean {
  if (!session.inSegment) return false;
  if (!session.baselineAttempted) return false;
  if (!session.mvpAttempted) return false;
  if (!session.nextIteration.trim()) return false;
  if (session.hinted && session.mvpOutcome === "success") return false;
  return true;
}

export function censusFrom(sessions: TestSession[]): Census {
  const notes = sessions.filter((item) => item.source === "note");
  const inbox = sessions.filter((item) => item.source === "inbox");
  const countedSessions = sessions.filter(countsTowardN);
  const unassistedSuccess = countedSessions.filter(
    (item) => item.mvpOutcome === "success" && item.unassisted && !item.hinted
  ).length;
  const attempted = countedSessions.filter((item) => item.mvpAttempted);
  return {
    noteCount: notes.length,
    inboxCount: inbox.length,
    counted: countedSessions.length,
    inSegmentCounted: countedSessions.filter((item) => item.inSegment).length,
    unassistedSuccess,
    allFailed: attempted.length >= 3 && attempted.every((item) => item.mvpOutcome !== "success")
  };
}

export function decide(
  sessions: TestSession[],
  phase4Locked: boolean,
  now?: string,
  phase5Ready = true
): {
  complete: boolean;
  frozen: boolean;
  generatedAt: string;
  census: Census;
  gates: Gate[];
} {
  const census = censusFrom(sessions);
  const counted = sessions.filter(countsTowardN);
  const gates: Gate[] = [
    {
      id: "n-return-users",
      pass: census.counted >= 3,
      detail: `counted n=${census.counted} (need ≥ 3). Notes=${census.noteCount}, inbox=${census.inboxCount}.`
    },
    {
      id: "in-segment",
      pass: census.counted >= 3 && counted.every((item) => item.inSegment),
      detail: census.counted === 0 ? "No counted S2 return sessions yet (A-T02)." : "Counted sessions are S2."
    },
    {
      id: "retrieval-task",
      pass: counted.length > 0 && counted.every((item) => item.taskId.startsWith("task-")),
      detail:
        counted.length === 0
          ? "Need Phase 3 tasks or labeled representative seed tasks (A-T03)."
          : "Sessions used retrieval tasks, not preference tests."
    },
    {
      id: "baseline",
      pass: counted.length > 0 && counted.every((item) => item.baselineAttempted),
      detail: counted.length === 0 ? "Keyword baseline not yet run (A-T05)." : "Baseline attempted before Remember."
    },
    {
      id: "next-iteration",
      pass: counted.length > 0 && counted.every((item) => item.nextIteration.trim().length > 0),
      detail: counted.length === 0 ? "No next-iteration change on file (A-T04)." : "Each counted session names one change."
    },
    {
      id: "phase4-lock",
      pass: phase4Locked,
      detail: phase4Locked
        ? "Problem definition locked."
        : "Phase 4 still blocked (in-segment n < 5). Part 6 cannot close the study."
    },
    {
      id: "phase5-mvp",
      pass: phase5Ready,
      detail: phase5Ready
        ? "Phase 5 MVP is on the storefront."
        : "Phase 5 setup is incomplete — testers need a public or local Remember URL."
    }
  ];
  const complete = gates.every((gate) => gate.pass);
  return {
    complete,
    frozen: complete,
    generatedAt: now ?? new Date().toISOString(),
    census,
    gates
  };
}
