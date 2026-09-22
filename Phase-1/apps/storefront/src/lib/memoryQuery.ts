import type { LibraryPhoto } from "../data/library";

export interface MemoryQuery {
  people: string[];
  placeVibe?: string;
  placeName?: string;
  objects: string[];
  event?: string;
  timeFuzzy?: string;
  activity?: string;
  photoKind?: "memory" | "screenshot" | "document";
  exclusions: string[];
  expansions: string[];
  similarPhotoId?: string;
  raw: string;
}

export function emptyQuery(): MemoryQuery {
  return { people: [], objects: [], exclusions: [], expansions: [], raw: "" };
}

export function mergeQuery(base: MemoryQuery, patch: Partial<MemoryQuery>): MemoryQuery {
  return {
    ...base,
    ...patch,
    people: patch.people ?? base.people,
    objects: patch.objects ?? base.objects,
    exclusions: [...base.exclusions, ...(patch.exclusions ?? [])],
    expansions: uniqueStrings([...(base.expansions ?? []), ...(patch.expansions ?? [])])
  };
}

function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const key = value.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(value.trim());
  }
  return out;
}

export function fold(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

const STOP = new Set([
  "the",
  "and",
  "for",
  "that",
  "this",
  "with",
  "from",
  "when",
  "was",
  "were",
  "have",
  "had",
  "just",
  "like",
  "into",
  "then",
  "than",
  "your",
  "you",
  "our",
  "we",
  "off",
  "not",
  "on",
  "at",
  "to",
  "of",
  "it",
  "my",
  "in",
  "an",
  "or",
  "as",
  "by",
  "be",
  "is",
  "are",
  "am"
]);

const CONTEXT = new Set([
  ...STOP,
  "trip",
  "holiday",
  "vacation",
  "travel",
  "small",
  "little",
  "tiny",
  "night",
  "last",
  "year",
  "years",
  "photo",
  "photos",
  "picture",
  "pictures",
  "image",
  "remember",
  "memory",
  "something",
  "still",
  "same",
  "another",
  "very",
  "really",
  "there",
  "here",
  "some",
  "more",
  "place",
  "thing",
  "after",
  "before",
  "during",
  "about",
  "been",
  "they",
  "them",
  "what",
  "which",
  "where"
]);

export function clueTokens(text: string): { all: string[]; strong: string[] } {
  const all = fold(text)
    .split(/[^a-z0-9]+/)
    .filter((word) => (word.length > 2 || word === "qr") && !STOP.has(word) && !/^\d+$/.test(word));
  return { all, strong: all.filter((word) => !CONTEXT.has(word)) };
}

function clueHas(clue: string, word: string): boolean {
  const needle = fold(word).replace(/s$/, "");
  if (needle.length < 2) return false;
  return new RegExp(`(?:^|[^a-z0-9])${needle}s?(?:$|[^a-z0-9])`).test(fold(clue));
}

function groundedToClue(value: string, clue: string): boolean {
  const parts = clueTokens(value).strong;
  if (!parts.length) return clueTokens(value).all.some((word) => clueHas(clue, word));
  return parts.some((word) => clueHas(clue, word));
}

export function parseMemoryClue(text: string, previous = emptyQuery()): MemoryQuery {
  const raw = text.trim();
  const lower = fold(raw);
  const next = mergeQuery(emptyQuery(), {
    raw,
    exclusions: previous.exclusions,
    similarPhotoId: previous.similarPhotoId
  });

  if (/\b(cafe|café|coffee|restaurant)\b/.test(lower)) {
    next.placeVibe = "small beach cafe";
  }
  if (/\b(rooftop|string lights|fairy lights)\b/.test(lower)) {
    next.placeVibe = "rooftop string lights";
  }
  if (/\b(concert|gig|venue|purple lights|stage lights)\b/.test(lower)) {
    next.placeVibe = next.placeVibe ?? "dark venue lights";
    next.event = next.event ?? "concert";
  }
  if (/\bbeach|sunset|palolem|calangute\b/.test(lower)) {
    next.placeVibe = next.placeVibe ?? "beach";
  }
  if (/\b(houseboat|backwater)\b/.test(lower)) {
    next.placeVibe = next.placeVibe ?? "backwaters";
    next.event = next.event ?? "trip";
  }
  if (/\bgoa|calangute|palolem\b/.test(lower)) {
    next.placeName = "Goa";
    next.event = next.event ?? "trip";
  }
  if (/\beurope|venice|italy\b/.test(lower)) next.placeName = "Europe";
  if (/\bkerala|alleppey\b/.test(lower)) {
    next.placeName = "Kerala";
    next.event = next.event ?? "trip";
  }
  if (/\bjaipur|pink city\b/.test(lower)) {
    next.placeName = "Jaipur";
    next.event = next.event ?? "trip";
  }

  next.objects = clueTokens(raw).strong;

  if (/\bsick|ill\b/.test(lower)) next.event = "when I was sick";
  if (/\bwedding\b/.test(lower)) next.event = "wedding dinner";
  if (/\b(firework|new year|nye)\b/.test(lower)) next.event = next.event ?? "fireworks";
  if (/\b(diwali|diya|lamps)\b/.test(lower)) next.event = next.event ?? "diwali";
  if (/\btrip|holiday|vacation\b/.test(lower)) next.event = next.event ?? "trip";

  if (/\b(scooter|bike ride)\b/.test(lower)) next.activity = "scooter";
  if (/\blast year|winter|years ago\b/.test(lower)) next.timeFuzzy = "last year";
  if (/\bmonsoon|poured|rained\b/.test(lower)) next.timeFuzzy = next.timeFuzzy ?? "monsoon";
  if (/\bscreenshot|scan|document|qr\b/.test(lower)) next.photoKind = next.photoKind ?? "screenshot";
  if (/\bfriend|cousin|face|people|kids\b/.test(lower)) {
    if (!next.people.includes("someone I remember")) next.people.push("someone I remember");
  }

  if (/\bnot (the )?(hotel|beach|europe|2022|2023|venue)\b/.test(lower)) {
    const match = lower.match(/not (?:the )?(\w+)/);
    if (match?.[1]) next.exclusions.push(match[1]);
  }

  return groundQueryToClue(raw, next);
}

export function groundQueryToClue(clue: string, query: MemoryQuery): MemoryQuery {
  const { strong } = clueTokens(clue);
  const next: MemoryQuery = {
    ...query,
    objects: uniqueStrings(strong),
    expansions: [...(query.expansions ?? [])]
  };
  if (next.placeVibe && !groundedToClue(next.placeVibe, clue)) next.placeVibe = undefined;
  if (next.placeName && !clueHas(clue, next.placeName)) next.placeName = undefined;
  if (next.activity && !clueHas(clue, next.activity)) next.activity = undefined;
  next.expansions = next.expansions.filter((item) => {
    const parts = clueTokens(item).all;
    return parts.some((part) => strong.some((word) => part === word || part.startsWith(word) || word.startsWith(part)));
  });
  return next;
}

export function queryFromSimilar(photo: LibraryPhoto, previous = emptyQuery()): MemoryQuery {
  const next = mergeQuery(previous, {
    similarPhotoId: photo.id,
    photoKind: photo.kind === "memory" ? previous.photoKind : photo.kind,
    raw: previous.raw || `more like: ${photo.caption}`
  });
  const blob = [photo.caption, photo.album, photo.locationLabel, ...(photo.cues ?? [])].join(" ").toLowerCase();
  if (photo.locationLabel) next.placeVibe = next.placeVibe ?? photo.locationLabel;
  if (/\bgoa\b/.test(blob)) next.placeName = next.placeName ?? "Goa";
  if (/\beurope|venice|italy\b/.test(blob)) next.placeName = next.placeName ?? "Europe";
  if (/\bkerala|backwater|houseboat\b/.test(blob)) next.placeName = next.placeName ?? "Kerala";
  if (/\btrip|holiday|vacation\b/.test(blob)) next.event = next.event ?? "trip";
  if (/\bsick\b/.test(blob)) next.event = next.event ?? "when I was sick";
  if (/\bwedding\b/.test(blob)) next.event = next.event ?? "wedding dinner";
  if (/\bconcert|gig\b/.test(blob)) next.event = next.event ?? "concert";
  if (/\bfirework\b/.test(blob)) next.event = next.event ?? "fireworks";
  if (/\bdiwali\b/.test(blob)) next.event = next.event ?? "diwali";
  next.objects = uniqueStrings([...(next.objects ?? []), ...clueTokens(blob).strong]);
  for (const person of photo.people ?? []) {
    if (!next.people.includes(person)) next.people.push(person);
  }
  if (/\b(cafe|café)\b/.test(blob)) next.placeVibe = next.placeVibe ?? "small beach cafe";
  return next;
}

export function queryHasMemoryCue(query: MemoryQuery): boolean {
  return Boolean(
    query.placeVibe ||
      query.placeName ||
      query.objects.length ||
      query.event ||
      query.people.length ||
      query.photoKind ||
      query.timeFuzzy ||
      query.similarPhotoId
  );
}

export function understoodCues(query: MemoryQuery): Array<{ id: string; label: string; exclusion?: string }> {
  const items: Array<{ id: string; label: string; exclusion?: string }> = [];
  if (query.placeVibe) items.push({ id: "vibe", label: humanCue(query.placeVibe) });
  if (query.placeName) items.push({ id: "place", label: query.placeName });
  if (query.event) items.push({ id: "event", label: humanCue(query.event) });
  for (const object of query.objects) items.push({ id: `obj-${object}`, label: humanCue(object) });
  if (query.photoKind === "screenshot") items.push({ id: "kind", label: "Screenshot" });
  if (query.similarPhotoId) items.push({ id: "similar", label: "Like the photo you picked" });
  for (const exclusion of query.exclusions) {
    items.push({ id: `not-${exclusion}`, label: `Not ${exclusion}`, exclusion });
  }
  return items;
}

function humanCue(value: string): string {
  const text = value.replace(/\s+/g, " ").trim();
  if (text === "small beach cafe") return "Small café vibe";
  if (text === "dark venue lights") return "Lights at a gig";
  if (text === "rooftop string lights") return "Rooftop lights";
  if (text === "when I was sick") return "When I was sick";
  if (text === "wedding dinner") return "A wedding";
  if (text === "trip") return "A trip";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function isDateAlbumOnly(text: string): boolean {
  const lower = text.trim().toLowerCase();
  return /^(20\d{2}-\d{2}-\d{2}|december|album|filename)$/i.test(lower);
}
