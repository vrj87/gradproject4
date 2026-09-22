import { describe, expect, it } from "vitest";
import {
  isRetrievalRelevant,
  normalizeCorpus,
  passesMinWordRule,
  textHash
} from "@photos/discovery-core";

describe("normalize", () => {
  it("hashes normalized text consistently", () => {
    expect(textHash("  Hello   World ")).toBe(textHash("hello world"));
  });

  it("keeps short posts only when they name a retrieval failure", () => {
    expect(
      passesMinWordRule({
        id: "a",
        text: "Great app!",
        source: "app_store",
        scrapedAt: "2026-01-01T00:00:00.000Z"
      })
    ).toBe(false);
    expect(
      passesMinWordRule({
        id: "b",
        text: "can't find old photo",
        source: "app_store",
        scrapedAt: "2026-01-01T00:00:00.000Z"
      })
    ).toBe(true);
  });

  it("keeps retrieval complaints and drops storage-only rants", () => {
    expect(isRetrievalRelevant("storage full again and backup failed")).toBe(false);
    expect(isRetrievalRelevant("I cannot find that old photo from the trip")).toBe(true);
    expect(isRetrievalRelevant("looking for that photo of the medicine")).toBe(true);
  });

  it("drops weak single-keyword Play Store junk", () => {
    expect(isRetrievalRelevant("Nice date feature")).toBe(false);
    expect(isRetrievalRelevant("I love the people tab")).toBe(false);
    expect(isRetrievalRelevant("👍")).toBe(false);
    expect(isRetrievalRelevant("Great search")).toBe(false);
  });

  it("dedupes by hash and keeps the longest variant", () => {
    const result = normalizeCorpus([
      {
        id: "1",
        text: "I cannot find that old photo from the cafe trip.",
        source: "reddit",
        scrapedAt: "2026-01-01T00:00:00.000Z"
      },
      {
        id: "2",
        text: "  I CANNOT find that old photo from the cafe trip.  ",
        source: "app_store",
        scrapedAt: "2026-01-01T00:00:00.000Z"
      }
    ]);
    expect(result.kept).toHaveLength(1);
    expect(result.droppedDuplicates).toBe(1);
  });

  it("marks interview quotes as excluded from frequency", () => {
    const result = normalizeCorpus([
      {
        id: "int-1",
        text: "I remember the cafe vibe but I forgot the date so I cannot find that old photo.",
        source: "interview",
        scrapedAt: "2026-01-01T00:00:00.000Z"
      }
    ]);
    expect(result.kept[0].excludedFromFrequency).toBe(true);
  });
});
