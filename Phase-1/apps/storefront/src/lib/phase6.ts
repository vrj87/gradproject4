export type Outcome = "success" | "miss" | "abandoned" | "not-attempted";

export interface Gate {
  id: string;
  pass: boolean;
  detail: string;
}

export interface Phase6Payload {
  report: {
    complete: boolean;
    frozen: boolean;
    generatedAt: string;
    census: {
      noteCount: number;
      inboxCount: number;
      counted: number;
      inSegmentCounted: number;
      unassistedSuccess: number;
      allFailed: boolean;
    };
    gates: Gate[];
    jobStatement: string;
    learnings: { worked: string[]; changeNext: string[]; status: string };
    sessions?: Array<{
      id: string;
      taskId: string;
      counted: boolean;
      representative: boolean;
      baselineOutcome: string;
      mvpOutcome: string;
      nextIteration: string;
    }>;
  };
  metrics: Array<{
    id: string;
    layer: string;
    name: string;
    definition: string;
    rationale: string;
    source: string;
  }>;
  risks: Array<{ id: string; risk: string; why: string; mitigation: string }>;
  deck: { frozen: boolean; slides: Array<{ n: number; title: string; body: string; evidence: string }> };
}

export async function loadPhase6(): Promise<Phase6Payload | null> {
  const live = await fetch("/api/phase6")
    .then((res) => (res.ok ? res.json() : null))
    .catch(() => null);
  if (live?.report) return live as Phase6Payload;
  try {
    const file = await fetch("/phase6/phase6.json").then((res) => (res.ok ? res.json() : null));
    if (file?.report) return file as Phase6Payload;
  } catch {
    /* run npm run phase6:synthesize */
  }
  return null;
}

export async function saveTestSession(body: Record<string, unknown>): Promise<{ ok: boolean; counted: boolean; error?: string }> {
  const res = await fetch("/api/mvp-test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const payload = (await res.json()) as { ok?: boolean; counted?: boolean; error?: string };
  if (!res.ok) return { ok: false, counted: false, error: payload.error ?? "Could not save the session." };
  return { ok: true, counted: Boolean(payload.counted) };
}
