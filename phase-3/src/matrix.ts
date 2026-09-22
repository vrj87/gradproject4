import type { MatrixRow, MatrixStatus, ThemeLite } from "./types";

function row(theme: ThemeLite, status: MatrixStatus, note: string): MatrixRow {
  return { themeId: theme.id, label: theme.label ?? theme.id, metricNode: theme.metricNode, status, note };
}

export function statusForTheme(theme: ThemeLite): { status: MatrixStatus; note: string } {
  if (theme.genericSearchLeak || theme.id === "generic-search-latency") {
    return { status: "not-supported", note: "Form asks memory, not speed. Out of brief scope." };
  }
  if (theme.segmentHints?.includes("S3") && !theme.segmentHints.includes("S2")) {
    return { status: "not-this-study", note: "G5 screenshot / medicine / object rows are excluded from S2 n." };
  }
  if (theme.id === "people-without-name") {
    return { status: "not-this-study", note: "G5 face-without-name is not S2." };
  }
  if (theme.id === "place-vibe-without-name" || theme.id === "search_by_place_vibe") {
    return { status: "confirmed", note: "G4/G5 trip/place vibe; G6 place-felt / trip; G8 take vibe or trip without town." };
  }
  if (theme.id === "forgotten-date-album") {
    return { status: "confirmed", note: "Forgotten cue (date/album/town) confirmed. Product bet stays understand, not formulate." };
  }
  if (theme.id === "timeline-scroll-workaround" || theme.id === "ask-someone-else") {
    return { status: "confirmed", note: "G9 workaround class: scroll, ask a person, another app, or still unfound." };
  }
  if (theme.id === "unevaluable-results" || theme.id === "memories-surface-miss" || theme.id === "heavy-library") {
    return { status: "not-recovered", note: "Form has no result-grid / library-size probe (instrument gap, not a disconfirm)." };
  }
  if (theme.id === "refine-dead-end") {
    return { status: "weak", note: "G9 implies a dead end; no refine transcript." };
  }
  if (theme.id === "search_by_object" || theme.id === "object-episode-find" || theme.id === "screenshot-utility") {
    return { status: "not-this-study", note: "S3 / utility — not counted toward S2 n." };
  }
  return { status: "not-recovered", note: "No G1–G9 item maps cleanly." };
}

export function buildMatrix(themes: ThemeLite[]): MatrixRow[] {
  return themes.map((theme) => {
    const mapped = statusForTheme(theme);
    return row(theme, mapped.status, mapped.note);
  });
}
