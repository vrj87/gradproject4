import type { RawReview } from "@photos/discovery-core";
import { PHOTOS_ANDROID_ID, publicReviewUrl } from "@photos/discovery-core";
import { nowIso, type ScrapeResult } from "./http.js";

export async function scrapePlayStore(): Promise<ScrapeResult> {
  try {
    const gplay = (await import("google-play-scraper")).default;
    const rows = (await gplay.reviews({
      appId: PHOTOS_ANDROID_ID,
      lang: "en",
      country: "us",
      sort: gplay.sort.NEWEST,
      num: 80
    })) as { data?: Array<{ id?: string; text?: string; score?: number; url?: string }> };

    const reviews: RawReview[] = (rows.data ?? []).flatMap((row, index) => {
      if (!row.text) return [];
      const reviewId = `playstore-${row.id ?? index}`;
      return [
        {
          id: reviewId,
          text: row.text,
          source: "play_store",
          sourceId: row.id,
          url: publicReviewUrl({ source: "play_store", sourceId: row.id, url: row.url, reviewId }),
          rating: row.score ?? null,
          scrapedAt: nowIso()
        }
      ];
    });

    return { source: "play_store", reviews };
  } catch (error) {
    return {
      source: "play_store",
      reviews: [],
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
