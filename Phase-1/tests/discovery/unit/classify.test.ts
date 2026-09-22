import { describe, expect, it } from "vitest";
import {
  classifyCollectText,
  evidenceKind,
  isDisplayVoice
} from "../../../apps/storefront/src/lib/discoveryEngine";

describe("discovery classify", () => {
  it("maps a place-vibe clue to the place-vibe opportunity", () => {
    const matches = classifyCollectText(
      "I remember that small cafe from the Goa trip but I forgot the date so search finds nothing."
    );
    expect(matches[0]?.id).toBe("place-vibe-without-name");
  });

  it("labels seed fixtures separately from live posts", () => {
    expect(evidenceKind("fix-s2-01", "reddit")).toBe("seed");
    expect(evidenceKind("play-123", "play_store")).toBe("live");
    expect(evidenceKind("col-1", "collect")).toBe("collect");
  });

  it("hides short junk from the voices list", () => {
    expect(isDisplayVoice("👍")).toBe(false);
    expect(isDisplayVoice("Great search")).toBe(false);
    expect(
      isDisplayVoice("I remember the cafe from that trip but I cannot find the photo because I forgot the date.")
    ).toBe(true);
  });
});
