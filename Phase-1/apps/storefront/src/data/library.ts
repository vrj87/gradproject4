import { MORE } from "./libraryMore";
import { photoHasToken, withLabels } from "./labels";

export type PhotoKind = "memory" | "screenshot" | "document";

export interface LibraryPhoto {
  id: string;
  src: string;
  alt: string;
  dateLabel: string;
  takenAt: string;
  album: string;
  kind: PhotoKind;
  caption: string;
  cues: string[];
  people?: string[];
  locationLabel?: string;
  tags?: string[];
}

const u = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=720&q=80&fm=jpg`;

const CORE: LibraryPhoto[] = [
  {
    id: "p-cafe-1",
    src: u("photo-1554118811-1e0d58224f24"),
    alt: "Small cafe interior with warm lights",
    dateLabel: "Sat, 14 Dec 2024",
    takenAt: "2024-12-14",
    album: "Goa trip",
    kind: "memory",
    caption: "Tiny beach cafe, yellow chairs, after the swim",
    cues: ["cafe", "café", "goa", "trip", "yellow", "beach"],
    people: ["friend"],
    locationLabel: "small beach cafe"
  },
  {
    id: "p-cafe-2",
    src: u("photo-1495474472287-4d71bcdd2085"),
    alt: "Coffee counter in a small cafe",
    dateLabel: "Sat, 14 Dec 2024",
    takenAt: "2024-12-14",
    album: "Goa trip",
    kind: "memory",
    caption: "The small cafe we ducked into on the Goa trip",
    cues: ["cafe", "café", "coffee", "goa", "trip"]
  },
  {
    id: "p-cafe-3",
    src: u("photo-1414235077428-338989a2e8c0"),
    alt: "Restaurant plates on a wooden table",
    dateLabel: "Sat, 14 Dec 2024",
    takenAt: "2024-12-14",
    album: "Goa trip",
    kind: "memory",
    caption: "Lunch at that small place after the beach",
    cues: ["cafe", "food", "goa", "trip"]
  },
  {
    id: "p-beach-1",
    src: u("photo-1512343879784-a960bf40e7f2"),
    alt: "India beach with palms",
    dateLabel: "Fri, 13 Dec 2024",
    takenAt: "2024-12-13",
    album: "Goa trip",
    kind: "memory",
    caption: "Palolem stretch — not the cafe",
    cues: ["beach", "goa", "trip", "holiday"]
  },
  {
    id: "p-beach-2",
    src: u("photo-1507525428034-b723cf961d3e"),
    alt: "Turquoise beach",
    dateLabel: "Fri, 13 Dec 2024",
    takenAt: "2024-12-13",
    album: "Goa trip",
    kind: "memory",
    caption: "Another beach day on the same trip",
    cues: ["beach", "goa", "trip", "vacation"]
  },
  {
    id: "p-beach-3",
    src: u("photo-1476514525535-07fb3b4ae5f1"),
    alt: "Boat on a lake during travel",
    dateLabel: "Thu, 12 Dec 2024",
    takenAt: "2024-12-12",
    album: "Goa trip",
    kind: "memory",
    caption: "Travel day — near misses when you search cafe",
    cues: ["trip", "holiday", "vacation"]
  },
  {
    id: "p-india-1",
    src: u("photo-1548013146-72479768bada"),
    alt: "Palace courtyard in India",
    dateLabel: "Thu, 12 Dec 2024",
    takenAt: "2024-12-12",
    album: "Goa trip",
    kind: "memory",
    caption: "A stop on the way — not the cafe",
    cues: ["trip", "india", "holiday"]
  },
  {
    id: "p-friends-1",
    src: u("photo-1529156069898-49953e39b3ac"),
    alt: "Friends laughing together",
    dateLabel: "Thu, 12 Dec 2024",
    takenAt: "2024-12-12",
    album: "Goa trip",
    kind: "memory",
    caption: "People from the trip — face remembered, name not tagged",
    cues: ["people", "friends", "trip", "face"]
  },
  {
    id: "p-wedding-1",
    src: u("photo-1519741497674-611481863552"),
    alt: "Outdoor wedding lights",
    dateLabel: "Sun, 3 Nov 2024",
    takenAt: "2024-11-03",
    album: "Wedding dinner",
    kind: "memory",
    caption: "Outdoor lights and dinner — venue name forgotten",
    cues: ["wedding", "lights", "dinner", "event"]
  },
  {
    id: "p-family-1",
    src: u("photo-1511895426328-dc8714191300"),
    alt: "Family at a table",
    dateLabel: "Sun, 3 Nov 2024",
    takenAt: "2024-11-03",
    album: "Wedding dinner",
    kind: "memory",
    caption: "Family photos that live on someone else's phone too",
    cues: ["people", "family", "kids"]
  },
  {
    id: "p-med-1",
    src: u("photo-1584308666744-24d5c474f2ae"),
    alt: "Medicine pills in a blister pack",
    dateLabel: "Last year · Mar 2025",
    takenAt: "2025-03-18",
    album: "Camera",
    kind: "document",
    caption: "Picture of the medicine I took when I was sick",
    cues: ["medicine", "sick", "pills", "prescription"]
  },
  {
    id: "p-med-2",
    src: u("photo-1587854692152-cbe660dbde88"),
    alt: "Medicine bottles on a shelf",
    dateLabel: "Last year · Mar 2025",
    takenAt: "2025-03-18",
    album: "Camera",
    kind: "document",
    caption: "The bottle from when I was sick last year",
    cues: ["medicine", "sick", "bottle"]
  },
  {
    id: "p-receipt-1",
    src: u("photo-1554224155-6726b3ff858f"),
    alt: "Paper receipt on a desk",
    dateLabel: "Last year · Jan 2025",
    takenAt: "2025-01-09",
    album: "Screenshots",
    kind: "screenshot",
    caption: "Screenshot of a receipt — I remember the shop, not the date",
    cues: ["receipt", "screenshot", "document"]
  },
  {
    id: "p-doc-1",
    src: u("photo-1563013544-824ae1b704d3"),
    alt: "Printed document and card",
    dateLabel: "Last year · Jan 2025",
    takenAt: "2025-01-09",
    album: "Screenshots",
    kind: "document",
    caption: "Scan of a bill I need to find later",
    cues: ["document", "scan", "bill"]
  },
  {
    id: "p-food-1",
    src: u("photo-1540189549336-e6e99c3679fe"),
    alt: "Colorful plate of food",
    dateLabel: "Sat, 14 Dec 2024",
    takenAt: "2024-12-14",
    album: "Goa trip",
    kind: "memory",
    caption: "Food from the same cafe street",
    cues: ["food", "cafe", "goa"]
  },
  {
    id: "p-italy-1",
    src: u("photo-1523906834658-6e24ef2386f9"),
    alt: "Canal boats on a trip",
    dateLabel: "Jun 2023",
    takenAt: "2023-06-11",
    album: "Europe",
    kind: "memory",
    caption: "A different trip — near miss if you only remember water",
    cues: ["trip", "holiday", "vacation"]
  },
  {
    id: "p-italy-2",
    src: u("photo-1516483638261-f4dbaf036963"),
    alt: "Coastal town on a holiday",
    dateLabel: "Jun 2023",
    takenAt: "2023-06-11",
    album: "Europe",
    kind: "memory",
    caption: "Holiday town — not Goa",
    cues: ["holiday", "vacation", "trip"]
  },
  {
    id: "p-portrait-1",
    src: u("photo-1507003211169-0a1dd7228f2d"),
    alt: "Portrait of a person",
    dateLabel: "Jun 2023",
    takenAt: "2023-06-12",
    album: "Europe",
    kind: "memory",
    caption: "Someone I remember by face, not by search name",
    cues: ["people", "face", "who"]
  },
  {
    id: "p-road-1",
    src: u("photo-1469854523086-cc02fe5d8800"),
    alt: "Road trip through hills",
    dateLabel: "Jun 2023",
    takenAt: "2023-06-10",
    album: "Europe",
    kind: "memory",
    caption: "Years of photos — scrolling this far is the workaround",
    cues: ["trip", "years"]
  },
  {
    id: "p-dessert-1",
    src: u("photo-1488477181946-6428a0291777"),
    alt: "Dessert in a cafe",
    dateLabel: "Sat, 14 Dec 2024",
    takenAt: "2024-12-14",
    album: "Goa trip",
    kind: "memory",
    caption: "Dessert at the small cafe",
    cues: ["cafe", "dessert", "goa"]
  },
  {
    id: "p-sunset-1",
    src: u("photo-1475924156734-496f6cac6ec1"),
    alt: "Sunset over the water",
    dateLabel: "Fri, 13 Dec 2024",
    takenAt: "2024-12-13",
    album: "Goa trip",
    kind: "memory",
    caption: "Sunset after the beach — same trip as the cafe",
    cues: ["sunset", "beach", "goa", "trip"],
    locationLabel: "Goa coast"
  },
  {
    id: "p-market-1",
    src: u("photo-1555396273-367ea4eb4db5"),
    alt: "Busy street market stalls",
    dateLabel: "Thu, 12 Dec 2024",
    takenAt: "2024-12-12",
    album: "Goa trip",
    kind: "memory",
    caption: "Market we walked through looking for that cafe",
    cues: ["market", "street", "goa", "trip", "food"]
  },
  {
    id: "p-scooter-1",
    src: u("photo-1558980664-769d59546b3d"),
    alt: "Scooter on a coastal road",
    dateLabel: "Thu, 12 Dec 2024",
    takenAt: "2024-12-12",
    album: "Goa trip",
    kind: "memory",
    caption: "The scooter days on the trip",
    cues: ["scooter", "goa", "trip", "holiday"]
  },
  {
    id: "p-concert-1",
    src: u("photo-1470229722913-7c0e2dbbafd3"),
    alt: "Concert crowd and stage lights",
    dateLabel: "Sat, 21 Sep 2024",
    takenAt: "2024-09-21",
    album: "Nights out",
    kind: "memory",
    caption: "That gig — I remember the lights, not the venue name",
    cues: ["concert", "lights", "music", "event", "night"],
    people: ["friend"],
    locationLabel: "dark venue"
  },
  {
    id: "p-concert-2",
    src: u("photo-1429962714451-bb934ecdc4ec"),
    alt: "Hands in the air at a concert",
    dateLabel: "Sat, 21 Sep 2024",
    takenAt: "2024-09-21",
    album: "Nights out",
    kind: "memory",
    caption: "Hands up — same night, still no venue search token",
    cues: ["concert", "crowd", "music", "event"]
  },
  {
    id: "p-dog-1",
    src: u("photo-1548199973-03cce0bbc87b"),
    alt: "Two dogs running on grass",
    dateLabel: "Sun, 4 Aug 2024",
    takenAt: "2024-08-04",
    album: "Pets",
    kind: "memory",
    caption: "The dogs in the park",
    cues: ["dog", "dogs", "pets", "park", "animals"],
    people: ["family"]
  },
  {
    id: "p-cat-1",
    src: u("photo-1514888286974-6c03e2ca1dba"),
    alt: "Orange cat looking up",
    dateLabel: "Sun, 4 Aug 2024",
    takenAt: "2024-08-04",
    album: "Pets",
    kind: "memory",
    caption: "The cat at home",
    cues: ["cat", "pets", "animals", "home"]
  },
  {
    id: "p-kids-1",
    src: u("photo-1503454537195-1dcabb73ffb9"),
    alt: "Child playing outdoors",
    dateLabel: "Sun, 3 Nov 2024",
    takenAt: "2024-11-03",
    album: "Wedding dinner",
    kind: "memory",
    caption: "Kids at the dinner — on this phone and someone else's",
    cues: ["kids", "people", "family", "children"],
    people: ["kids"]
  },
  {
    id: "p-home-1",
    src: u("photo-1484154218962-a197022b5858"),
    alt: "Kitchen counter at home",
    dateLabel: "Mon, 2 Jun 2025",
    takenAt: "2025-06-02",
    album: "Home",
    kind: "memory",
    caption: "The kitchen the week I was sick — not the medicine shot",
    cues: ["home", "kitchen", "house"]
  },
  {
    id: "p-ticket-1",
    src: u("photo-1556742049-0cfed4f6a45d"),
    alt: "Boarding pass and cards on a table",
    dateLabel: "Last year · Jan 2025",
    takenAt: "2025-01-09",
    album: "Screenshots",
    kind: "screenshot",
    caption: "Screenshot of the boarding pass — I remember the airline, not the album",
    cues: ["ticket", "screenshot", "boarding", "travel", "document"]
  },
  {
    id: "p-hills-1",
    src: u("photo-1501785888041-af3ef285b470"),
    alt: "Mountain lake on a trip",
    dateLabel: "Jun 2023",
    takenAt: "2023-06-10",
    album: "Europe",
    kind: "memory",
    caption: "Lake day on the Europe trip — water, not Goa",
    cues: ["lake", "mountains", "trip", "holiday", "europe"],
    locationLabel: "alpine lake"
  },
  {
    id: "p-pasta-1",
    src: u("photo-1551183053-bf91a1d81141"),
    alt: "Pasta on a restaurant table",
    dateLabel: "Jun 2023",
    takenAt: "2023-06-11",
    album: "Europe",
    kind: "memory",
    caption: "Dinner in a small place — another cafe-shaped miss",
    cues: ["food", "pasta", "dinner", "cafe", "europe", "trip"]
  },
  {
    id: "p-face-2",
    src: u("photo-1494790108377-be9c29b29330"),
    alt: "Portrait of a woman smiling",
    dateLabel: "Jun 2023",
    takenAt: "2023-06-12",
    album: "Europe",
    kind: "memory",
    caption: "A face I would recognise, a name I would not type",
    cues: ["people", "face", "who", "portrait"],
    people: ["friend"]
  },
  {
    id: "p-forest-1",
    src: u("photo-1441974231531-c6227db76b6e"),
    alt: "Sunlight through a forest",
    dateLabel: "Sat, 11 May 2024",
    takenAt: "2024-05-11",
    album: "Home",
    kind: "memory",
    caption: "Walk near home last spring",
    cues: ["forest", "trees", "walk", "home"]
  },
  {
    id: "p-label-1",
    src: u("photo-1471864190281-a93a3070b6de"),
    alt: "Medicine bottles close up",
    dateLabel: "Last year · Mar 2025",
    takenAt: "2025-03-18",
    album: "Camera",
    kind: "document",
    caption: "Another angle of the shelf from when I was sick",
    cues: ["medicine", "sick", "bottle", "label"]
  }
];

export const LIBRARY: LibraryPhoto[] = [...CORE, ...MORE].map(withLabels);

export function groupByDate(photos: LibraryPhoto[]): Array<{ dateLabel: string; photos: LibraryPhoto[] }> {
  const order: string[] = [];
  const map = new Map<string, LibraryPhoto[]>();
  for (const photo of photos) {
    if (!map.has(photo.dateLabel)) {
      map.set(photo.dateLabel, []);
      order.push(photo.dateLabel);
    }
    map.get(photo.dateLabel)!.push(photo);
  }
  return order.map((dateLabel) => ({ dateLabel, photos: map.get(dateLabel)! }));
}

export function searchLibrary(query: string): LibraryPhoto[] {
  const trimmed = query.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return LIBRARY.filter((photo) => photo.takenAt === trimmed);
  }
  const stop = new Set([
    "the",
    "and",
    "for",
    "that",
    "this",
    "with",
    "from",
    "photo",
    "photos",
    "picture",
    "image",
    "into",
    "then",
    "than",
    "your",
    "you",
    "our",
    "we"
  ]);
  const words = query
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 2 && !stop.has(word));
  if (!words.length) return [];
  return LIBRARY.map((photo) => ({
    photo,
    hits: words.filter((word) => photoHasToken(photo, word)).length
  }))
    .filter((row) => row.hits > 0)
    .sort((a, b) => b.hits - a.hits || b.photo.takenAt.localeCompare(a.photo.takenAt))
    .map((row) => row.photo);
}

export function albumsInLibrary(): Array<{ name: string; cover: LibraryPhoto; count: number }> {
  const names: string[] = [];
  for (const photo of LIBRARY) {
    if (!names.includes(photo.album)) names.push(photo.album);
  }
  return names.map((name) => {
    const photos = LIBRARY.filter((photo) => photo.album === name);
    return { name, cover: photos[0], count: photos.length };
  });
}

export function peopleInLibrary(): Array<{ name: string; cover: LibraryPhoto; count: number }> {
  const map = new Map<string, LibraryPhoto[]>();
  for (const photo of LIBRARY) {
    for (const person of photo.people ?? []) {
      if (!map.has(person)) map.set(person, []);
      map.get(person)!.push(photo);
    }
  }
  return [...map.entries()].map(([name, photos]) => ({ name, cover: photos[0], count: photos.length }));
}

export function photosInAlbum(name: string): LibraryPhoto[] {
  return LIBRARY.filter((photo) => photo.album === name);
}

export function placesInLibrary(): Array<{ name: string; cover: LibraryPhoto; count: number }> {
  const map = new Map<string, LibraryPhoto[]>();
  for (const photo of LIBRARY) {
    if (!photo.locationLabel) continue;
    if (!map.has(photo.locationLabel)) map.set(photo.locationLabel, []);
    map.get(photo.locationLabel)!.push(photo);
  }
  return [...map.entries()].map(([name, photos]) => ({ name, cover: photos[0], count: photos.length }));
}

export function fullSrc(src: string): string {
  return src.replace("w=720", "w=1400");
}

const FAV_KEY = "photos-favorites";

export function loadFavorites(): string[] {
  try {
    return JSON.parse(localStorage.getItem(FAV_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

export function saveFavorites(ids: string[]): void {
  localStorage.setItem(FAV_KEY, JSON.stringify(ids));
}

export const DEMO_QUERIES = [
  { label: "That small café on the Goa trip", query: "small cafe goa trip" },
  { label: "That Goa trip", query: "Goa" },
  { label: "The medicine when I was sick", query: "medicine sick last year" },
  { label: "Purple lights at the gig", query: "the gig with the purple lights" },
  { label: "Houseboat on the backwaters", query: "houseboat on the backwaters" },
  { label: "Fireworks that night", query: "fireworks that night" },
  { label: "Horse", query: "horse" }
];
