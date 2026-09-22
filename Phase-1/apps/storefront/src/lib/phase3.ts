export interface Phase3Payload {
  complete: boolean;
  generatedAt: string;
  census: { noteCount: number; inSegmentCount: number; taskCount: number };
  gates: Array<{ id: string; pass: boolean; detail: string }>;
  notes: Array<{
    id: string;
    inSegment: boolean;
    firstBreakNode: string;
    phase6Seed: string;
    retrievalTask: string;
    remembered: string;
    forgotten: string;
    queryTyped: string;
    photosReturned: string;
    workaround: string;
    recognizableIf: string;
  }>;
  matrix: Array<{ themeId: string; label: string; metricNode: string; status: string; note: string }>;
  tasks: string[];
  synthesis: string;
  firstBreakNode: string;
}

export async function loadPhase3(): Promise<Phase3Payload | null> {
  const live = await fetch("/api/phase3")
    .then((res) => (res.ok ? res.json() : null))
    .catch(() => null);
  if (live?.census) return live as Phase3Payload;
  try {
    const file = await fetch("/phase3/phase3.json").then((res) => (res.ok ? res.json() : null));
    if (file?.census) return file as Phase3Payload;
  } catch {
    /* run npm run phase3:synthesize */
  }
  return null;
}
