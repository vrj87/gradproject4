export const RESEARCH_FORM_URL = "https://forms.gle/wvQ3pQVQLhxMDFTm9";
export const RESEARCH_FORM_RESPONSES_URL =
  "https://docs.google.com/forms/d/1BWAi4vwNFF5cncIu98H352AY4RcZd7s4aBkTBgI_wXA/edit#responses";
export const RESEARCH_FORM_TITLE = "Google Photos — Photo you could not find";

export const RESEARCH_QUESTIONS = [
  { id: 1, text: "What kinds of old photos do users struggle to retrieve?" },
  { id: 2, text: "What information do people actually remember about a photo?" },
  { id: 3, text: "What information have they forgotten?" },
  { id: 4, text: "How do users formulate searches when their memory is incomplete?" },
  { id: 5, text: "Where does existing Google Photos search / Memories / albums break?" },
  { id: 6, text: "What workarounds do people use when search fails?" },
  { id: 7, text: "How do people vs place-vibe vs object vs event vs screenshot tasks differ?" },
  { id: 8, text: "What makes a result set evaluable vs overwhelming?" },
  { id: 9, text: "How do users refine after a miss?" },
  { id: 10, text: "Which library / life-context segments struggle most?" }
] as const;

export const WORKFLOW_STEPS = [
  {
    id: "collect",
    title: "Collect",
    body: "Ingest Play Store, App Store, Reddit, YouTube, forums, and a collect inbox when a scraper is blocked."
  },
  {
    id: "keep",
    title: "Keep",
    body: "Drop short posts, storage-only rants, and SHA-256 duplicates. Keep retrieval language only."
  },
  {
    id: "group",
    title: "Group",
    body: "Extract themes with grounded quotes, remembered vs forgotten cues, photo kind, and a metric node."
  },
  {
    id: "score",
    title: "Score",
    body: "Compare opportunities: 0.4 × impact on retrieval + 0.4 × MVP feasibility + 0.2 × frequency."
  },
  {
    id: "gate",
    title: "Gate",
    body: "Flag generic-search rows. Nominate one place in the journey for interviews. Do not lock the problem until the study is in."
  }
] as const;

export const THEME_KEYWORDS: Array<{ id: string; label: string; keywords: string[] }> = [
  { id: "place-vibe-without-name", label: "Place vibe without a name", keywords: ["cafe", "café", "vibe", "beach", "trip", "holiday", "vacation", "goa"] },
  { id: "object-episode-find", label: "Object plus episode", keywords: ["medicine", "sick", "receipt", "prescription", "ticket", "warranty"] },
  { id: "forgotten-date-album", label: "Forgotten date or album", keywords: ["forgot the date", "forgotten", "album", "filename"] },
  { id: "unevaluable-results", label: "Results hard to evaluate", keywords: ["overwhelming", "grid", "thumbnails", "near miss", "recognize"] },
  { id: "refine-dead-end", label: "Refine dead-end", keywords: ["refine", "tried again", "give up", "gave up"] },
  { id: "timeline-scroll-workaround", label: "Timeline scroll workaround", keywords: ["scroll", "timeline", "workaround"] },
  { id: "screenshot-utility", label: "Screenshot vs memory mix", keywords: ["screenshot", "qr", "scan", "document"] },
  { id: "people-without-name", label: "People without a name", keywords: ["face", "who is", "unlabeled", "cousin", "friend"] },
  { id: "heavy-library", label: "Heavy library", keywords: ["thousands", "years of", "huge library"] },
  { id: "generic-search-latency", label: "Generic search latency", keywords: ["search is slow", "indexing", "latency", "laggy"] }
];

export type EvidenceKind = "live" | "seed" | "collect";

export function evidenceKind(id: string, source: string): EvidenceKind {
  if (source === "collect") return "collect";
  if (id.startsWith("fix-") || source === "fixture") return "seed";
  return "live";
}

export function classifyCollectText(text: string): Array<{ id: string; label: string; hits: string[] }> {
  const lower = text.toLowerCase();
  return THEME_KEYWORDS.map((theme) => ({
    ...theme,
    hits: theme.keywords.filter((word) => lower.includes(word))
  }))
    .filter((theme) => theme.hits.length > 0)
    .sort((a, b) => b.hits.length - a.hits.length);
}

export function collectSourceLabel(source: string): string {
  return source.replaceAll("_", " ");
}

export function isDisplayVoice(text: string): boolean {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length < 8) return false;
  if (/^(nice|great|good|love|best app|👍)/i.test(text.trim()) && words.length < 14) return false;
  return true;
}
