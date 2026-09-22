import { photoHasToken } from "../data/labels";
import { LIBRARY, type LibraryPhoto } from "../data/library";
import { clueTokens, fold, type MemoryQuery } from "./memoryQuery";

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
  "something",
  "photo",
  "photos",
  "picture",
  "pictures",
  "image",
  "remember",
  "memory",
  "last",
  "year",
  "years",
  "into",
  "then",
  "than",
  "your",
  "you",
  "our",
  "we",
  "off",
  "not"
]);

function tokens(raw: string): string[] {
  return fold(raw)
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 2 && !STOP.has(word));
}

export interface ResultGroup {
  id: string;
  whyThisGroup: string;
  photos: LibraryPhoto[];
  role: "match" | "near-miss";
}

export interface RetrieveResult {
  groups: ResultGroup[];
  photoIds: string[];
  coverageFailed: boolean;
  targetInView: boolean;
}

function hay(photo: LibraryPhoto): string {
  return fold(
    [photo.caption, photo.album, photo.alt, photo.locationLabel, ...(photo.cues ?? []), ...(photo.people ?? []), ...(photo.tags ?? [])].join(
      " "
    )
  );
}

function hasWord(text: string, word: string): boolean {
  const needle = fold(word).replace(/s$/, "");
  if (needle.length < 2) return false;
  return new RegExp(`(?:^|[^a-z0-9])${needle}s?(?:$|[^a-z0-9])`).test(text);
}

function overlap(queryTokens: string[], text: string): number {
  return queryTokens.filter((word) => hasWord(text, word)).length;
}

function objectHit(photo: LibraryPhoto, text: string, object: string): boolean {
  return photoHasToken(photo, object) || hasWord(text, object);
}

function scorePhoto(photo: LibraryPhoto, query: MemoryQuery): number {
  const text = hay(photo);
  let score = 0;
  const vibeTokens = query.placeVibe ? tokens(query.placeVibe) : [];
  const vibeHits = overlap(vibeTokens, text);
  const cafeVibe = vibeTokens.includes("cafe") || fold(query.placeVibe ?? "").includes("cafe");
  const tripEvent = fold(query.event ?? "").includes("trip");
  const otherTrip = photo.album === "Europe" || photo.album === "Jaipur trip" || photo.album === "Kerala trip";
  const required = query.objects.length ? query.objects : clueTokens(query.raw).strong;
  if (required.length && !required.some((object) => objectHit(photo, text, object))) return 0;

  if (vibeHits) score += vibeHits * 3;
  if (query.placeName && hasWord(text, query.placeName)) score += 4;
  for (const object of query.objects) {
    if (objectHit(photo, text, object)) score += 5;
  }
  if (query.event) {
    const event = fold(query.event);
    if (event.includes("sick") && hasWord(text, "sick")) score += 4;
    if (event.includes("wedding") && hasWord(text, "wedding")) score += 4;
    if (event.includes("concert") && (hasWord(text, "concert") || hasWord(text, "gig") || hasWord(text, "lights"))) score += 4;
    if (event.includes("firework") && hasWord(text, "firework")) score += 5;
    if (event.includes("diwali") && (hasWord(text, "diwali") || hasWord(text, "diya") || hasWord(text, "lamp"))) score += 5;
    if (tripEvent && (hasWord(text, "trip") || hasWord(text, "holiday") || hasWord(text, "goa") || hasWord(text, "kerala"))) score += 2;
  }
  if (query.activity === "scooter" && hasWord(text, "scooter")) score += 4;
  if (cafeVibe && tripEvent) {
    if (photo.album === "Goa trip" && (hasWord(text, "cafe") || hasWord(text, "beach"))) score += 6;
    if (otherTrip && hasWord(text, "cafe")) score -= 3;
  }
  if (fold(query.placeVibe ?? "").includes("rooftop") && hasWord(text, "rooftop")) score += 6;
  if (fold(query.placeVibe ?? "").includes("backwater") && (hasWord(text, "backwater") || hasWord(text, "houseboat") || hasWord(text, "kerala"))) score += 6;
  if (fold(query.placeVibe ?? "").includes("venue") && photo.album === "Nights out") score += 4;
  if (query.photoKind === "screenshot" && (photo.kind === "screenshot" || photo.kind === "document")) score += 4;
  if (query.timeFuzzy === "last year" && photo.takenAt.startsWith("2025")) score += 2;
  if (query.timeFuzzy === "monsoon" && (hasWord(text, "rain") || hasWord(text, "monsoon"))) score += 3;
  if (query.people.length && (photo.people?.length || hasWord(text, "face") || hasWord(text, "people"))) score += 2;
  if (query.similarPhotoId) {
    const seed = LIBRARY.find((item) => item.id === query.similarPhotoId);
    if (seed) {
      if (photo.id === seed.id) score += 2;
      const cueOverlap = (photo.cues ?? []).filter((cue) => (seed.cues ?? []).includes(cue)).length;
      score += cueOverlap * 2;
      if (seed.album === photo.album) score += 5;
      if (seed.kind === photo.kind) score += 2;
      if (seed.locationLabel && seed.locationLabel === photo.locationLabel) score += 3;
      if (seed.people?.some((person) => photo.people?.includes(person))) score += 3;
    }
  }

  for (const word of tokens(query.raw)) {
    if (hasWord(text, word)) score += 2;
  }
  for (const extra of query.expansions ?? []) {
    if (objectHit(photo, text, extra) || hasWord(text, extra)) score += 3;
  }

  for (const exclusion of query.exclusions) {
    if (hasWord(text, exclusion)) return -1;
  }
  return score;
}

function whyThisGroup(album: string, query: MemoryQuery, seedAlbum?: string): string {
  if (seedAlbum && album === seedAlbum) return `More like the photo you picked — ${album}`;
  if (query.placeVibe && album === "Goa trip") {
    return "Small cafés and trip days that match that vibe";
  }
  if (album === "Goa trip") return "Goa trip — cafés and days out";
  if (album === "Screenshots") return "Screenshots and documents";
  if (album === "Camera") return "Utility photos — medicine and labels";
  if (album === "Pets") return "Animals — horses, dogs, cats";
  if (album === "Nights out") return "Nights out — lights and gigs";
  if (album === "Rooftop nights") return "Rooftop and string lights";
  if (album === "New Year") return "Fireworks that night";
  if (album === "Festival") return "Festival glow";
  if (album === "Europe") return "Another trip with similar cafés";
  if (album === "Jaipur trip" || album === "Kerala trip") return album;
  return album;
}

function contrastWhy(album: string, leadAlbum: string): string {
  if (album === leadAlbum) return album;
  if (album === "Europe" || album === "Jaipur trip" || album === "Kerala trip") {
    return `${album} — similar vibe, probably a different trip`;
  }
  if (album === "Screenshots") return "Screenshots — probably not the memory";
  if (album === "Camera") return "Utility shots — maybe not the trip";
  if (album === "Pets") return "Animals — close if you meant a pet, not the trip";
  return `${album} — close, maybe not the one`;
}

export function exclusionForPhoto(
  photo: LibraryPhoto,
  query: MemoryQuery
): { token: string; label: string } {
  if (photo.album === "Screenshots" || photo.kind === "screenshot" || photo.kind === "document") {
    return { token: "screenshot", label: "Not screenshots" };
  }
  if (photo.album === "Europe") return { token: "europe", label: "Not this trip" };
  if (photo.album === "Jaipur trip") return { token: "jaipur", label: "Not this trip" };
  if (photo.album === "Kerala trip") return { token: "kerala", label: "Not this trip" };
  if (photo.album === "Goa trip" && !query.placeVibe) return { token: "beach", label: "Not this trip" };
  if (photo.people?.length && !query.people.length) {
    return { token: fold(photo.people[0]), label: "Not these people" };
  }
  if (photo.album === "Pets") {
    const animal = (photo.tags ?? []).find((tag) => ["horse", "dog", "cat"].includes(tag));
    return { token: animal ?? "pets", label: "Not this" };
  }
  if (photo.locationLabel) {
    const token = fold(photo.locationLabel)
      .split(/[^a-z0-9]+/)
      .find((word) => word.length > 3);
    return { token: token ?? fold(photo.album).split(" ")[0] ?? "place", label: "Not this place" };
  }
  return { token: fold(photo.album).split(" ")[0] ?? "trip", label: "Not this trip" };
}

export function retrieve(query: MemoryQuery, targetPhotoId?: string): RetrieveResult {
  const seed = query.similarPhotoId ? LIBRARY.find((item) => item.id === query.similarPhotoId) : undefined;
  const ranked = LIBRARY.map((photo) => ({ photo, score: scorePhoto(photo, query) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 24);

  const byAlbum = new Map<string, LibraryPhoto[]>();
  const albumScore = new Map<string, number>();
  for (const row of ranked) {
    const key = row.photo.album;
    if (!byAlbum.has(key)) byAlbum.set(key, []);
    byAlbum.get(key)!.push(row.photo);
    albumScore.set(key, Math.max(albumScore.get(key) ?? 0, row.score));
  }

  const rankedGroups = [...byAlbum.entries()]
    .sort((a, b) => (albumScore.get(b[0]) ?? 0) - (albumScore.get(a[0]) ?? 0))
    .map(([album, photos]) => ({
      id: album,
      whyThisGroup: whyThisGroup(album, query, seed?.album),
      photos,
      role: "match" as const
    }));

  const leadId = rankedGroups[0]?.id;
  const groups: ResultGroup[] = rankedGroups.slice(0, 3).map((group, index) => ({
    ...group,
    role: index === 0 ? "match" : "near-miss",
    whyThisGroup: index === 0 || !leadId ? group.whyThisGroup : contrastWhy(group.id, leadId),
    photos: group.photos.slice(0, index === 0 ? 8 : 4)
  }));

  const photoIds = ranked.map((row) => row.photo.id);
  const targetInView = Boolean(targetPhotoId && photoIds.includes(targetPhotoId));

  return {
    groups,
    photoIds,
    coverageFailed: ranked.length === 0,
    targetInView
  };
}
