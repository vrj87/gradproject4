import type { NoteRecord } from "./types";

function field(text: string, name: string): string {
  const match = text.match(new RegExp(`${name}:\\s*(.+)`, "i"));
  return (match?.[1] ?? "").replace(/\*\*/g, "").trim();
}

export function parseNote(id: string, text: string): NoteRecord {
  const seed = field(text, "Phase 6 seed") || field(text, "Representative seed") || "task-goa-cafe";
  return {
    id,
    inSegment: /\bS2\b/.test(text) && !/do not count/i.test(text),
    firstBreakNode: (field(text, "First-break node") || "understand").toLowerCase(),
    phase6Seed: seed.replace(/\(.*\)/, "").trim(),
    retrievalTask: field(text, "Retrieval task") || "trip / place-vibe photo they failed to find (G3–G5)",
    remembered: field(text, "Remembered"),
    forgotten: field(text, "Forgotten"),
    queryTyped: field(text, "Query typed") || "not captured on the form",
    photosReturned: field(text, "Photos returned") || "not captured on the form",
    workaround: field(text, "Workaround") || field(text, "Ended"),
    recognizableIf: field(text, "Recognizable if") || field(text, "Product should take")
  };
}

export function hasSixRecoveries(note: NoteRecord): boolean {
  return Boolean(
    note.retrievalTask &&
      note.remembered &&
      note.forgotten &&
      note.queryTyped &&
      note.photosReturned &&
      note.workaround &&
      note.recognizableIf
  );
}
