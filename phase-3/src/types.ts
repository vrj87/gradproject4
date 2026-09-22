export type MatrixStatus = "confirmed" | "challenged" | "not-supported" | "not-this-study" | "not-recovered" | "weak" | "excluded";

export interface ThemeLite {
  id: string;
  label?: string;
  summary: string;
  metricNode: string;
  rememberedCue: string;
  forgottenCue: string;
  segmentHints?: string[];
  genericSearchLeak?: boolean;
}

export interface NoteRecord {
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
}

export interface MatrixRow {
  themeId: string;
  label: string;
  metricNode: string;
  status: MatrixStatus;
  note: string;
}

export interface Phase3Report {
  complete: boolean;
  generatedAt: string;
  census: { noteCount: number; inSegmentCount: number; taskCount: number };
  gates: Array<{ id: string; pass: boolean; detail: string }>;
  notes: NoteRecord[];
  matrix: MatrixRow[];
  tasks: string[];
  synthesis: string;
  firstBreakNode: string;
}
