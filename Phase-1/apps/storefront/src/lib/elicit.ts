import { fold, queryHasMemoryCue, type MemoryQuery } from "./memoryQuery";

export interface ElicitChoice {
  label: string;
  clue: string;
}

export interface ElicitTurn {
  assistantText: string;
  question?: string;
  missingCue?: "placeVibe" | "object" | "episode" | "kind";
  stopAsking: boolean;
  choices?: ElicitChoice[];
}

const SPECIFIC = new Set([
  "horse",
  "horses",
  "pony",
  "dog",
  "cat",
  "medicine",
  "pills",
  "receipt",
  "qr",
  "menu",
  "scooter"
]);

function blob(query: MemoryQuery): string {
  return fold(`${query.raw} ${query.placeVibe ?? ""} ${query.event ?? ""} ${query.objects.join(" ")}`);
}

function hasSpecificObject(query: MemoryQuery): boolean {
  return query.objects.some((object) => SPECIFIC.has(fold(object)));
}

function strongScene(query: MemoryQuery): boolean {
  return Boolean(query.placeVibe || query.event || query.placeName);
}

function ask(
  assistantText: string,
  question: string,
  missingCue: ElicitTurn["missingCue"],
  choices: ElicitChoice[]
): ElicitTurn {
  return { assistantText, question, missingCue, stopAsking: false, choices };
}

function done(assistantText: string): ElicitTurn {
  return { assistantText, stopAsking: true };
}

export function elicit(query: MemoryQuery, questionsAsked: number, photoCount = 0): ElicitTurn {
  if (questionsAsked >= 3) {
    return done("I’ll work with what you remember. If this isn’t it, tap More like this or Not this trip.");
  }

  if (queryHasMemoryCue(query) && photoCount >= 6) {
    return done("Grouped by what you remember. Open a photo if it’s the one.");
  }

  const text = blob(query);
  const gig = /\b(gig|concert|lights|venue|stage)\b/.test(text);
  const cafe = /\b(cafe|coffee|restaurant)\b/.test(text);
  const horse = /\b(horse|pony|mare)\b/.test(text);
  const med = /\b(medicine|pills|sick)\b/.test(text);
  const boat = /\b(houseboat|backwater)\b/.test(text);
  const firework = /\b(firework|new year)\b/.test(text);
  const screenshot = query.photoKind === "screenshot" || /\b(screenshot|receipt|qr|menu)\b/.test(text);

  if (gig && !query.people.length && questionsAsked < 1) {
    return ask(
      "A vibe is enough — no venue name needed.",
      "Was it just the lights, or were you with people?",
      "placeVibe",
      [
        { label: "Just the lights", clue: "just the stage lights" },
        { label: "With friends", clue: "with friends at the gig" },
        { label: "Outdoor night", clue: "outdoor night" }
      ]
    );
  }

  if (horse && !query.event) {
    return ask(
      "An animal is enough to start — where it was helps more than a date.",
      "Was the horse on a trip, at the beach, or somewhere else?",
      "episode",
      [
        { label: "On a trip", clue: "on a trip" },
        { label: "On the beach", clue: "on the beach" },
        { label: "At home", clue: "at home" }
      ]
    );
  }

  if (med && !query.event) {
    return ask(
      "The object is the useful bit — not the album name.",
      "Was this when you were sick, or a pack you needed later?",
      "episode",
      [
        { label: "When I was sick", clue: "when I was sick" },
        { label: "A pack at home", clue: "the medicine pack at home" },
        { label: "A screenshot", clue: "a screenshot of the label" }
      ]
    );
  }

  if (screenshot && !query.objects.length) {
    return ask(
      "Screenshots need the thing in them more than a filename.",
      "What was in the screenshot?",
      "object",
      [
        { label: "A receipt", clue: "a receipt" },
        { label: "A QR or menu", clue: "QR of the menu" },
        { label: "A ticket", clue: "a ticket" }
      ]
    );
  }

  if (cafe && !query.event) {
    return ask(
      "A café vibe is enough — was it a trip?",
      "Was this on a trip, or a place near home?",
      "episode",
      [
        { label: "On a trip", clue: "on that trip" },
        { label: "Near home", clue: "near home" },
        { label: "Not the hotel", clue: "not the hotel" }
      ]
    );
  }

  if (boat && !query.placeName) {
    return ask(
      "The boat is the cue — not the village name.",
      "Was it the backwaters, or another holiday?",
      "placeVibe",
      [
        { label: "Backwaters", clue: "houseboat on the backwaters" },
        { label: "Another trip", clue: "a different holiday" }
      ]
    );
  }

  if (firework) {
    return done("Grouped from that night — open a photo if it’s the one.");
  }

  if (!query.placeVibe && !query.placeName && !hasSpecificObject(query) && !screenshot) {
    return ask(
      "A vibe, object, or trip is enough — no date needed.",
      "What did the place feel like?",
      "placeVibe",
      [
        { label: "Small café", clue: "it felt like a small cafe" },
        { label: "Beach", clue: "it was a beach" },
        { label: "Hotel", clue: "it felt like a hotel" },
        { label: "Lights at night", clue: "purple lights at night" }
      ]
    );
  }

  if (!query.event && hasSpecificObject(query)) {
    return ask(
      "What was happening around that thing?",
      "Was it a trip, being sick, or something at home?",
      "episode",
      [
        { label: "A trip", clue: "on a trip" },
        { label: "When I was sick", clue: "when I was sick" },
        { label: "At home", clue: "at home" }
      ]
    );
  }

  if (!query.event && query.placeVibe && !/\b(trip|holiday|concert|wedding|sick|firework)\b/.test(text)) {
    return ask(
      "One more fragment — what was happening around the photo.",
      "Was this a trip, a night out, or home?",
      "episode",
      [
        { label: "A trip", clue: "on a trip" },
        { label: "A night out", clue: "a gig or night out" },
        { label: "At home", clue: "at home" }
      ]
    );
  }

  if (!query.objects.length && !query.photoKind && !strongScene(query)) {
    return ask(
      "An object in the photo helps more than an album name.",
      "Was there something in the photo?",
      "object",
      [
        { label: "Medicine", clue: "it was medicine" },
        { label: "A receipt", clue: "it was a screenshot of a receipt" },
        { label: "An animal", clue: "a horse" }
      ]
    );
  }

  return done(
    queryHasMemoryCue(query)
      ? "Grouped by what you remember. Open a photo if it’s the one."
      : "Add another detail — a place, an object, or what was happening."
  );
}

export function firstQuestionIsDate(question: string): boolean {
  return /\b(date|album|filename)\b/i.test(question) && !/vibe|object|trip/i.test(question);
}
