import type { LibraryPhoto } from "./library";

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
  "still",
  "same",
  "another",
  "not",
  "into",
  "onto",
  "over",
  "under",
  "after",
  "before",
  "photo",
  "photos",
  "picture",
  "image",
  "wanted",
  "find",
  "gone",
  "name",
  "date",
  "album",
  "filename",
  "search",
  "word",
  "token"
]);

const ALBUM_TAGS: Record<string, string[]> = {
  "Goa trip": ["goa", "india", "trip", "holiday", "travel", "vacation", "beach"],
  Europe: ["europe", "trip", "holiday", "travel", "vacation", "city"],
  "Jaipur trip": ["jaipur", "india", "trip", "holiday", "travel", "palace", "fort"],
  "Kerala trip": ["kerala", "india", "trip", "holiday", "travel", "water", "boat"],
  "Wedding dinner": ["wedding", "dinner", "event", "people", "family", "celebration"],
  "Nights out": ["night", "concert", "gig", "lights", "music", "event", "venue"],
  "Rooftop nights": ["rooftop", "night", "lights", "event", "city"],
  "New Year": ["newyear", "fireworks", "night", "event", "celebration"],
  Festival: ["festival", "diwali", "lamps", "lights", "event"],
  Pets: ["pets", "animals", "animal"],
  Home: ["home", "house", "indoor"],
  Camera: ["camera", "utility", "document"],
  Screenshots: ["screenshot", "document", "scan", "utility"]
};

const SYNONYMS: Record<string, string[]> = {
  cafe: ["café", "coffee", "coffeeshop", "restaurant"],
  café: ["cafe", "coffee"],
  coffee: ["cafe", "café"],
  restaurant: ["cafe", "dinner", "food"],
  horse: ["horses", "pony", "mare", "animal", "animals"],
  horses: ["horse", "pony", "animal"],
  pony: ["horse", "horses"],
  dog: ["dogs", "puppy", "pet", "pets", "animal", "animals"],
  dogs: ["dog", "puppy", "pet"],
  cat: ["cats", "kitten", "pet", "pets", "animal"],
  beach: ["coast", "sand", "sea", "ocean", "shore"],
  concert: ["gig", "music", "venue", "stage", "lights"],
  gig: ["concert", "music", "venue"],
  fireworks: ["firework", "newyear", "night", "sky"],
  houseboat: ["boat", "backwaters", "kerala"],
  backwaters: ["houseboat", "boat", "kerala", "water"],
  rickshaw: ["auto", "tuk", "taxi", "car"],
  auto: ["rickshaw", "car", "taxi"],
  car: ["auto", "taxi", "cab", "vehicle", "scooter", "rickshaw"],
  taxi: ["car", "auto", "cab"],
  medicine: ["pills", "pharmacy", "sick", "prescription"],
  pills: ["medicine", "pharmacy"],
  receipt: ["bill", "invoice", "screenshot"],
  screenshot: ["screen", "capture", "document"],
  menu: ["qr", "food", "cafe"],
  qr: ["menu", "code", "screenshot"],
  wedding: ["marriage", "ceremony", "event"],
  rooftop: ["terrace", "roof", "night", "lights"],
  scooter: ["bike", "motorcycle", "ride"],
  rain: ["monsoon", "wet"],
  monsoon: ["rain"],
  people: ["person", "face", "friends"],
  face: ["people", "person", "portrait"],
  food: ["meal", "dinner", "lunch"],
  boat: ["water", "houseboat"],
  night: ["evening", "dark", "lights"]
};

const ANIMALS = new Set(["horse", "horses", "pony", "mare", "dog", "dogs", "puppy", "cat", "cats", "kitten"]);
const PEOPLE_TAGS = new Set(["people", "person", "portrait", "friends", "friend", "face", "kids"]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 2 && !STOP.has(word) && !/^\d+$/.test(word));
}

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

export function photoTags(photo: LibraryPhoto): string[] {
  if (photo.tags?.length) return photo.tags;
  const source = [
    photo.album,
    photo.kind,
    photo.locationLabel ?? "",
    photo.alt,
    photo.caption,
    ...(photo.people ?? []),
    ...(photo.cues ?? [])
  ].join(" ");
  const words = tokenize(source);
  const animalPhoto = words.some((word) => ANIMALS.has(word));
  const expanded = words.flatMap((word) => {
    if (animalPhoto && (word === "face" || word === "people")) return [word];
    return [word, ...(SYNONYMS[word] ?? [])];
  });
  const tags = unique([...words, ...expanded, ...(ALBUM_TAGS[photo.album] ?? [])]);
  if (animalPhoto) return tags.filter((tag) => !PEOPLE_TAGS.has(tag));
  return tags;
}

export function photoHasToken(photo: LibraryPhoto, word: string): boolean {
  const needle = word.toLowerCase().replace(/s$/, "");
  const tags = photo.tags ?? photo.cues ?? [];
  if (tags.some((tag) => tag.toLowerCase() === needle || tag.toLowerCase() === `${needle}s`)) return true;
  const bag = new Set(tags.flatMap((tag) => tokenize(tag)));
  return bag.has(needle) || bag.has(`${needle}s`);
}

export function photoLabel(photo: LibraryPhoto): string {
  const tags = photoTags(photo).slice(0, 4);
  return tags.length ? `${photo.alt} · ${tags.join(", ")}` : photo.alt;
}

export function withLabels(photo: LibraryPhoto): LibraryPhoto {
  const tags = photoTags({ ...photo, tags: undefined });
  return {
    ...photo,
    tags,
    cues: unique([...(photo.cues ?? []), ...tags])
  };
}

