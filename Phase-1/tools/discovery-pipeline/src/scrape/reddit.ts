import type { RawReview } from "@photos/discovery-core";
import { fetchJson, nowIso, type ScrapeResult } from "./http.js";

const SUBREDDITS = ["googlephotos", "google", "android", "iphone"];
const QUERIES = ["can't find photo", "old pictures", "google photos search", "screenshot"];

interface RedditListing {
  data?: {
    children?: Array<{
      data?: {
        id?: string;
        body?: string;
        selftext?: string;
        title?: string;
        permalink?: string;
      };
    }>;
  };
}

function pushReview(
  reviews: RawReview[],
  item: { id?: string; body?: string; selftext?: string; title?: string; permalink?: string },
  subreddit: string
) {
  const text = [item.title, item.body ?? item.selftext].filter(Boolean).join(". ");
  if (!text.trim()) return;
  reviews.push({
    id: `reddit-${subreddit}-${item.id ?? reviews.length}`,
    text,
    source: "reddit",
    sourceId: item.id,
    url: item.permalink
      ? item.permalink.startsWith("http")
        ? item.permalink
        : `https://www.reddit.com${item.permalink}`
      : undefined,
    rating: null,
    scrapedAt: nowIso()
  });
}

export async function scrapeReddit(): Promise<ScrapeResult> {
  const reviews: RawReview[] = [];
  const errors: string[] = [];

  for (const subreddit of SUBREDDITS) {
    for (const query of QUERIES) {
      const url = `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(query)}&restrict_sr=1&sort=new&limit=15`;
      try {
        const payload = await fetchJson<RedditListing>(url);
        for (const child of payload.data?.children ?? []) {
          if (child.data) pushReview(reviews, child.data, subreddit);
        }
      } catch (error) {
        errors.push(`${subreddit}/${query}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  return {
    source: "reddit",
    reviews,
    error: errors.length ? errors.join("; ") : undefined
  };
}
