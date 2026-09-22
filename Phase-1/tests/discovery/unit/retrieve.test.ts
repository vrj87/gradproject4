import { describe, expect, it } from "vitest";
import { LIBRARY, searchLibrary } from "../../../apps/storefront/src/data/library";
import { firstQuestionIsDate, elicit } from "../../../apps/storefront/src/lib/elicit";
import { applyGroqPatch, extractJsonObject } from "../../../apps/storefront/src/lib/groqConverse";
import { emptyQuery, isDateAlbumOnly, parseMemoryClue, queryFromSimilar } from "../../../apps/storefront/src/lib/memoryQuery";
import { retrieve, exclusionForPhoto } from "../../../apps/storefront/src/lib/retrieve";

describe("memory retrieve", () => {
  it("labels every photo with searchable tags", () => {
    for (const photo of LIBRARY) {
      expect((photo.tags ?? []).length).toBeGreaterThanOrEqual(4);
      expect((photo.cues ?? []).length).toBeGreaterThanOrEqual(4);
    }
    expect(searchLibrary("horse").length).toBeGreaterThan(0);
    expect(searchLibrary("beach").length).toBeGreaterThan(0);
    expect(searchLibrary("concert").length).toBeGreaterThan(0);
    expect(searchLibrary("medicine").length).toBeGreaterThan(0);
    expect(LIBRARY.length).toBeGreaterThanOrEqual(80);
    const cafeHits = searchLibrary("cafe");
    expect(cafeHits.some((photo) => photo.album === "Goa trip")).toBe(true);
    expect(cafeHits.some((photo) => photo.album === "Europe")).toBe(true);
  });

  it("keeps keyword search as a mixed pile while Remember groups the trip", () => {
    const words = searchLibrary("small cafe on that trip");
    const albums = new Set(words.map((photo) => photo.album));
    expect(words.length).toBeGreaterThan(8);
    expect(albums.size).toBeGreaterThan(1);
    expect(albums.has("Goa trip")).toBe(true);
    expect(albums.has("Europe")).toBe(true);
    const memory = retrieve(parseMemoryClue("small cafe on that trip"), "p-cafe-1");
    expect(memory.groups[0].id).toBe("Goa trip");
    expect(memory.targetInView).toBe(true);
  });

  it("does not return cafe photos when the clue is a car on a trip", () => {
    const query = parseMemoryClue("small car on that trip", {
      ...emptyQuery(),
      placeVibe: "small beach cafe",
      raw: "small cafe on that trip"
    });
    expect(query.placeVibe).toBeUndefined();
    expect(query.objects).toEqual(["car"]);
    const patched = applyGroqPatch(query, {
      memoryQueryPatch: { placeVibe: "small beach cafe", expansions: ["cafe", "taxi"] },
      stopAsking: true
    }, 0);
    expect(patched.query.placeVibe).toBeUndefined();
    expect(patched.query.expansions).not.toContain("cafe");
    expect(patched.query.objects).toContain("car");
    const result = retrieve(patched.query);
    expect(result.photoIds.some((id) => id.startsWith("p-cafe"))).toBe(false);
    expect(result.photoIds.some((id) => id.startsWith("p-auto") || id.startsWith("p-scoot"))).toBe(true);
    const other = parseMemoryClue("small umbrella on that trip");
    expect(other.objects).toEqual(["umbrella"]);
    expect(retrieve(other).photoIds.every((id) => !id.startsWith("p-cafe"))).toBe(true);
  });

  it("puts the Goa cafe in grouped results for a vibe clue", () => {
    const query = parseMemoryClue("small cafe on that trip");
    const result = retrieve(query, "p-cafe-1");
    expect(result.coverageFailed).toBe(false);
    expect(result.targetInView).toBe(true);
    expect(result.groups[0].id).toBe("Goa trip");
    expect(result.groups[0].whyThisGroup.length).toBeGreaterThan(8);
  });

  it("puts the medicine photo in view for object + episode", () => {
    const query = parseMemoryClue("medicine when I was sick last year");
    const result = retrieve(query, "p-med-1");
    expect(result.targetInView).toBe(true);
  });

  it("does not ask for date first", () => {
    const turn = elicit(emptyQuery(), 0);
    expect(turn.question).toBeTruthy();
    expect(firstQuestionIsDate(turn.question ?? "")).toBe(false);
  });

  it("stops after three questions", () => {
    expect(elicit(emptyQuery(), 3).stopAsking).toBe(true);
  });

  it("finds the rest of the Goa trip from a similar cafe photo", () => {
    const seed = LIBRARY.find((photo) => photo.id === "p-cafe-1");
    expect(seed).toBeTruthy();
    const query = queryFromSimilar(seed!);
    const result = retrieve(query, "p-cafe-2");
    expect(query.similarPhotoId).toBe("p-cafe-1");
    expect(result.coverageFailed).toBe(false);
    expect(result.targetInView).toBe(true);
    expect(result.groups[0].whyThisGroup).toMatch(/More like the photo you picked/i);
    expect(result.photoIds).toContain("p-cafe-1");
    expect(result.photoIds).toContain("p-cafe-2");
  });

  it("treats café as cafe and still groups the trip photos", () => {
    const query = parseMemoryClue("that little café from the holiday");
    const result = retrieve(query, "p-cafe-1");
    expect(query.placeVibe).toBe("small beach cafe");
    expect(result.coverageFailed).toBe(false);
    expect(result.photoIds.length).toBeGreaterThan(0);
  });

  it("finds photos from a loose sentence, not only exact keywords", () => {
    const query = parseMemoryClue("the coffee place we ducked into");
    const result = retrieve(query);
    expect(result.coverageFailed).toBe(false);
    expect(result.photoIds).toContain("p-cafe-2");
  });

  it("retrieves from Search MVP category clues", () => {
    expect(retrieve(parseMemoryClue("the pets at home")).coverageFailed).toBe(false);
    expect(retrieve(parseMemoryClue("people I remember")).coverageFailed).toBe(false);
    expect(retrieve(parseMemoryClue("screenshot of a receipt")).targetInView).toBe(false);
    expect(retrieve(parseMemoryClue("screenshot of a receipt"), "p-receipt-1").targetInView).toBe(true);
  });

  it("counts a Goa trip clue as north-star memory, not a known-item control", () => {
    expect(isDateAlbumOnly("Goa")).toBe(false);
    const query = parseMemoryClue("Goa");
    expect(query.placeName).toBe("Goa");
    expect(query.event).toBe("trip");
    const result = retrieve(query, "p-beach-1");
    expect(result.coverageFailed).toBe(false);
    expect(result.targetInView).toBe(true);
  });

  it("strips a Groq turn that invents a capture date", () => {
    const query = parseMemoryClue("small cafe on that trip");
    const result = applyGroqPatch(
      query,
      { assistantText: "This was taken on 12 March in Calangute.", stopAsking: true },
      0
    );
    expect(result.turn.assistantText).not.toMatch(/taken on|calangute/i);
  });

  it("rejects a Groq turn that asks for date first", () => {
    const query = parseMemoryClue("small cafe on that trip");
    const result = applyGroqPatch(query, { question: "What date was it taken?", stopAsking: false }, 0);
    expect(firstQuestionIsDate(result.turn.question ?? "")).toBe(false);
    expect(result.turn.question ?? "").not.toMatch(/date/i);
  });

  it("asks gig follow-ups about lights and people, not medicine", () => {
    const turn = elicit(parseMemoryClue("the gig with the purple lights"), 0);
    const labels = (turn.choices ?? []).map((choice) => choice.label).join(" ");
    expect(turn.question ?? "").not.toMatch(/medicine|receipt/i);
    expect(labels).not.toMatch(/medicine|receipt/i);
    expect(labels).toMatch(/lights|friends|outdoor/i);
  });

  it("does not interrogate a complete café-trip clue", () => {
    const query = parseMemoryClue("small cafe on that trip");
    expect(elicit(query, 0).stopAsking).toBe(true);
    expect(elicit(query, 0, 8).stopAsking).toBe(true);
  });

  it("excludes another trip from a near-miss café", () => {
    const query = parseMemoryClue("small cafe on that trip");
    const europe = LIBRARY.find((photo) => photo.album === "Europe" && (photo.tags ?? []).includes("cafe"));
    expect(europe).toBeTruthy();
    const { token, label } = exclusionForPhoto(europe!, query);
    expect(token).toBe("europe");
    expect(label).toMatch(/trip/i);
    const refined = retrieve({ ...query, exclusions: [...query.exclusions, token] }, "p-cafe-1");
    expect(refined.targetInView).toBe(true);
    expect(refined.photoIds.every((id) => LIBRARY.find((photo) => photo.id === id)?.album !== "Europe")).toBe(true);
  });

  it("retrieves concert lights, houseboat, fireworks, and a QR menu from memory cues", () => {
    const gig = retrieve(parseMemoryClue("the gig with the purple lights"), "p-gig-1");
    expect(gig.targetInView).toBe(true);
    expect(gig.groups[0].id).toBe("Nights out");

    const boat = retrieve(parseMemoryClue("houseboat on the backwaters"), "p-ker-1");
    expect(boat.targetInView).toBe(true);

    const fireworks = retrieve(parseMemoryClue("fireworks that night"), "p-fw-1");
    expect(fireworks.targetInView).toBe(true);

    const menu = retrieve(parseMemoryClue("QR of the menu"), "p-qr-1");
    expect(menu.targetInView).toBe(true);
  });

  it("parses Groq JSON even when wrapped in extra text", () => {
    const patch = extractJsonObject('Sure.\n{"memoryQueryPatch":{"expansions":["coffee shop","cafe"]},"stopAsking":true}\n');
    expect(patch.memoryQueryPatch?.expansions).toContain("cafe");
    expect(patch.stopAsking).toBe(true);
  });

  it("boosts retrieval with model expansions without opening the object gate", () => {
    const query = parseMemoryClue("small cafe on that trip");
    query.expansions = ["coffee", "yellow chairs"];
    const result = retrieve(query, "p-cafe-1");
    expect(result.targetInView).toBe(true);
    expect(result.groups[0].id).toBe("Goa trip");
  });

  it("finds horses by the keyword horse in Search and Remember", () => {
    const hits = searchLibrary("horse");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.some((photo) => photo.id === "p-horse-1")).toBe(true);
    expect(hits.every((photo) => photoHasHorse(photo))).toBe(true);
    expect(hits.some((photo) => ["p-friends-1", "p-portrait-1", "p-face-2", "p-goa-friends-2"].includes(photo.id))).toBe(
      false
    );
    expect(searchLibrary("horses").length).toBeGreaterThan(0);
    const remembered = retrieve(parseMemoryClue("the horse on that trip"), "p-horse-beach-1");
    expect(remembered.targetInView).toBe(true);
    expect(remembered.photoIds.every((id) => id.startsWith("p-horse"))).toBe(true);
    expect(remembered.photoIds).not.toContain("p-friends-1");
    expect(remembered.photoIds).not.toContain("p-portrait-1");
    expect(remembered.photoIds).not.toContain("p-face-2");
  });
});

function photoHasHorse(photo: { id: string; tags?: string[] }): boolean {
  return (photo.tags ?? []).some((tag) => tag === "horse" || tag === "horses" || tag === "pony");
}
