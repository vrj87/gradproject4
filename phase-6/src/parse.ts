import type { Outcome, TestSession } from "./types";

export function asOutcome(value: string | undefined): Outcome {
  const token = (value ?? "").toLowerCase().replace(/\*+/g, "").trim();
  if (token === "success" || token === "miss" || token === "abandoned") return token;
  return "not-attempted";
}

function field(text: string, name: string): string {
  const match = text.match(new RegExp(`${name}:\\s*(.+)`, "i"));
  return (match?.[1] ?? "").replace(/\*\*/g, "").trim();
}

export function parseNote(id: string, text: string): TestSession {
  const hinted = /hinted:\s*yes/i.test(text) || /unassisted:\s*no/i.test(text);
  const baseline = field(text, "Baseline");
  const mvp = field(text, "MVP");
  return {
    id,
    inSegment: /\bS2\b/.test(text) && !/do not count/i.test(text),
    taskId: field(text, "Task") || "task-goa-cafe",
    representative: /representative:\s*yes/i.test(text) || /X-01/i.test(text),
    baselineAttempted: /baseline:\s*(attempted|success|miss|abandoned)/i.test(text),
    baselineOutcome: asOutcome(baseline),
    mvpAttempted: /mvp:\s*(success|miss|abandoned|attempted)/i.test(text),
    mvpOutcome: asOutcome(mvp),
    unassisted: /unassisted:\s*yes/i.test(text),
    hinted,
    nextIteration: field(text, "Next iteration") || field(text, "Change"),
    timeToTarget: field(text, "Time to target"),
    cuesUsed: field(text, "Cues"),
    questionsHelped: field(text, "Questions helped") || field(text, "Questions"),
    questionsAnnoyed: field(text, "Questions annoyed"),
    source: "note"
  };
}
