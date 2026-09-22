import { readFile } from "node:fs/promises";
import type { RawReview } from "@photos/discovery-core";
import { collectInboxPath, fixturesDir } from "@photos/discovery-core";
import path from "node:path";

const NOW = "2026-09-20T08:00:00.000Z";

function fix(id: string, source: RawReview["source"], text: string, url?: string): RawReview {
  return {
    id: `fix-${id}`,
    text,
    source,
    url,
    rating: source === "play_store" || source === "app_store" ? 2 : null,
    scrapedAt: NOW
  };
}

/** Curated public-style retrieval complaints so Q1–Q10 stay coverable when scrapers fail soft. */
export const SEED_FIXTURES: RawReview[] = [
  fix("s2-01", "reddit", "I remember that small cafe we went to on the Goa trip but I cannot find the photo. Search wants a date or the place name and I forgot both.", "https://www.reddit.com/r/googlephotos/comments/goa-cafe"),
  fix("s2-02", "play_store", "Looking for that photo of the tiny beach cafe from our vacation. I remember the vibe not the location or when it was taken. Google Photos search is useless for this."),
  fix("s2-03", "app_store", "I can picture the little cafe during our holiday trip but search does not understand place vibe. I only remember it was somewhere we walked after the beach."),
  fix("s2-04", "forum", "Trying to find old pictures from a trip. I remember a small cafe and yellow chairs, not the city name or the album."),
  fix("s2-05", "youtube", "Comment: I still cannot find the cafe photo from our Goa trip. I remember the place vibe and forgot the date so search returns nothing useful."),
  fix("s2-06", "reddit", "Wedding dinner photos are in there. I remember the outdoor lights and the food not the venue name. Search for the trip does not surface them."),

  fix("s3-01", "play_store", "I took a picture of the medicine I took when I was sick last year and now I cannot find it. I remember the bottle not the date or album."),
  fix("s3-02", "reddit", "Need to find a screenshot of a receipt from last year. I remember the shop and that I was sick, not the filename or when I screenshotted it.", "https://www.reddit.com/r/googlephotos/comments/receipt"),
  fix("s3-03", "app_store", "Looking for that photo of the medicine box when I was sick. Search does not understand object plus episode. I forgot the exact date."),
  fix("s3-04", "forum", "I scan documents into Photos. Finding a warranty or ID later is hard because I remember the object not the album name."),
  fix("s3-05", "reddit", "Lost a screenshot of a train ticket. I remember the destination and that it was last winter, not the date I saved it."),
  fix("s3-06", "play_store", "Cannot find the picture of my prescription. I remember being sick last year and taking a photo of the medicine label."),

  fix("date-01", "app_store", "I know the old photo exists but I forgot the date and the album. Search keeps asking for words I do not remember."),
  fix("date-02", "reddit", "When I try to find old pictures I never remember the date. I type vague words and Photos wants a day or an album title."),
  fix("date-03", "play_store", "Search is fine if I know the date. I usually forget the date and then I cannot formulate a useful query for old photos."),
  fix("date-04", "forum", "I remember the trip and the people but I have forgotten the keywords Photos expects. The album name is gone from my memory."),
  fix("date-05", "youtube", "People in the comments say they cannot search old photos because they forgot the date and the exact words."),
  fix("date-06", "reddit", "I start typing and realize I do not remember the filename, the date, or the album. That is how my searches for old pictures begin."),

  fix("rec-01", "play_store", "Search dumped hundreds of thumbnails. Maybe the photo was in there but I could not evaluate the result set. Too many similar beach pictures."),
  fix("rec-02", "reddit", "The results were overwhelming. I think the old photo was somewhere in the grid but I could not recognize it among near misses.", "https://www.reddit.com/r/googlephotos/comments/grid"),
  fix("rec-03", "app_store", "Relevant results are hard to evaluate. I get a wall of similar vacation photos and I cannot tell which one is the cafe I remember."),
  fix("rec-04", "forum", "Google Photos search returned a huge grid. I scrolled and still could not pick the picture I remembered. Near misses look the same."),
  fix("rec-05", "youtube", "Comment: search finds too many old pictures at once. I cannot evaluate which thumbnail is the one I actually remember."),
  fix("rec-06", "reddit", "Results are not grouped. A pile of trip photos makes it impossible to recognize the one small cafe shot."),

  fix("ref-01", "reddit", "After a miss I do not know how to refine. I type something else and get the same useless set. Then I give up."),
  fix("ref-02", "play_store", "I struggle to refine an unsuccessful search. Photos does not ask what else I remember. I just try another keyword and fail again."),
  fix("ref-03", "app_store", "When search fails I have no way to say not that trip or more like this. Refining old photo search is a dead end."),
  fix("ref-04", "forum", "I tried again after the first search missed. Nothing I typed taught the app what I meant. I stopped looking."),
  fix("ref-05", "reddit", "There is no refine step. After I cannot find the old photo I just scroll the timeline or quit."),
  fix("ref-06", "youtube", "Comment: I cannot refine Google Photos search when the first query misses. It never asks a follow up about what I remember."),

  fix("ss-01", "play_store", "Screenshots and memories are mixed. I am looking for a screenshot of a QR code and search shows holiday photos instead."),
  fix("ss-02", "reddit", "Finding a screenshot is a different job from finding a trip memory. I remember the content of the screenshot not the date.", "https://www.reddit.com/r/googlephotos/comments/screenshot"),
  fix("ss-03", "app_store", "I struggle to retrieve old screenshots. Search treats them like regular photos. I remember the document text not an album."),
  fix("ss-04", "forum", "Old pictures of documents and scans get lost. I remember I scanned a bill, not which album Photos put it in."),
  fix("ss-05", "reddit", "Screenshot of a boarding pass is in Google Photos somewhere. Search for trip shows memories not the utility screenshot."),
  fix("ss-06", "play_store", "I take screenshots of chats and later cannot find them. I remember the conversation not when I captured it."),

  fix("ppl-01", "reddit", "I remember the person in the photo but I forgot their name in search. Face is in my head, the search token is not."),
  fix("ppl-02", "app_store", "Looking for old pictures of a friend. I know the face. Photos search wants a name I do not remember tagging."),
  fix("ppl-03", "play_store", "Who is in that photo? I remember the person from the holiday but I cannot search by the feeling of the face."),
  fix("ppl-04", "forum", "People search only works if I already named them. I remember who it was and still cannot find the old photo."),
  fix("ppl-05", "reddit", "I am trying to find photos of my cousin from a trip. I remember her face and the event, not the exact name I used in search."),
  fix("ppl-06", "youtube", "Comment: unlabeled faces mean I cannot find old pictures of people I clearly remember."),

  fix("wr-01", "reddit", "When search fails I just scroll the timeline for hours looking for that old photo. That is my only workaround."),
  fix("wr-02", "play_store", "I gave up on search and scrolled months of the timeline to find old pictures I remembered."),
  fix("wr-03", "app_store", "Workaround is always the same: forget search, scroll the timeline, hope I see the photo."),
  fix("wr-04", "forum", "After I cannot find the photo I open the timeline and scroll. Search is not how I retrieve old pictures anymore."),
  fix("wr-05", "reddit", "I look for that photo by scrolling because search never understands what I remember."),
  fix("wr-06", "youtube", "Comment: everyone here just scrolls the timeline when they cannot find an old photo."),

  fix("ask-01", "reddit", "I asked my partner to look on their phone. The old photo is in a shared library and I could not find it myself."),
  fix("ask-02", "forum", "When I cannot find photos of the kids I text my wife. The family archive is split across two Google Photos accounts."),
  fix("ask-03", "play_store", "I had to ask a friend who was on the trip because I could not retrieve the old pictures from my own library."),
  fix("ask-04", "app_store", "Shared library makes find worse. I remember the photo and still have to ask someone else to search."),
  fix("ask-05", "reddit", "Photos of the kids live on my partner's phone. I remember the moment and still cannot find them in my Google Photos."),
  fix("ask-06", "youtube", "Comment: I ping my sister to send the old photo because search on my library failed."),

  fix("s1-01", "play_store", "I have thousands of photos over years. I cannot scroll back. Finding an old photo I remember is impossible in a heavy library."),
  fix("s1-02", "reddit", "Years of photos. Thousands. I know the picture exists and I still cannot find it because the library is too big to scroll."),
  fix("s1-03", "app_store", "Heavy library users like me cannot use the timeline. I need another way to retrieve old pictures I only half remember."),
  fix("s1-04", "forum", "After ten years of Google Photos I have thousands of old pictures. Search and scroll both fail when memory is incomplete."),
  fix("s1-05", "reddit", "Cannot scroll back through years of photos. The segment that struggles most is people with huge libraries."),
  fix("s1-06", "play_store", "My library is huge. I remember a photo from years ago and I cannot get back to it without a date."),

  fix("mem-01", "reddit", "Memories showed a random highlight but not the old photo I was actually looking for. Albums did not help either."),
  fix("mem-02", "app_store", "Google Photos Memories and albums break when I am trying to retrieve a specific old picture I remember."),
  fix("mem-03", "play_store", "Search, Memories, and albums all missed the photo. I remember the event and still cannot find it on any surface."),
  fix("mem-04", "forum", "I thought Memories would surface the trip cafe. It showed other old pictures and not the one I remember."),
  fix("mem-05", "reddit", "Albums are useless if I forgot which album. Memories is not search. I still cannot find the photo."),
  fix("mem-06", "youtube", "Comment: Memories is cute but it does not help me retrieve an old photo I am actively looking for."),

  fix("ops-01", "play_store", "Search is slow and indexing takes forever. The app is laggy. This is not about finding a remembered photo, just performance."),
  fix("ops-02", "app_store", "Google Photos search is slow on a large library. Ranking feels random. I want faster search quality in general."),
  fix("ops-03", "reddit", "Search is slow / indexing complaints. I can find photos when I know the keyword. I just want better search ranking speed."),
  fix("ops-04", "forum", "The app is slow and search latency is bad. Improve search quality. Not a memory problem, just generic search."),

  fix("drop-01", "play_store", "Storage full again and backup failed. Pixel camera is fine."),
  fix("drop-02", "app_store", "App crashed twice today. Locked folder is confusing."),
  fix("short-01", "play_store", "Great app!", null)
];

export async function loadSeedFixtures(): Promise<RawReview[]> {
  const file = path.join(fixturesDir(), "seed-reviews.json");
  try {
    const extra = JSON.parse(await readFile(file, "utf8")) as RawReview[];
    return [...SEED_FIXTURES, ...extra];
  } catch {
    return [...SEED_FIXTURES];
  }
}

export async function loadCollectInbox(): Promise<RawReview[]> {
  try {
    const rows = JSON.parse(await readFile(collectInboxPath(), "utf8")) as RawReview[];
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

export function mergeCorpusWithStats(
  live: RawReview[],
  fixtures: RawReview[]
): { reviews: RawReview[]; fixtureAdded: number } {
  const seen = new Set(live.map((row) => row.id));
  const extra = fixtures.filter((row) => !seen.has(row.id));
  return { reviews: [...live, ...extra], fixtureAdded: extra.length };
}

export async function supplementRawCorpus(
  raw: RawReview[]
): Promise<{ reviews: RawReview[] }> {
  const fixtures = await loadSeedFixtures();
  const collect = await loadCollectInbox();
  const { reviews } = mergeCorpusWithStats(raw, [...fixtures, ...collect]);
  return { reviews };
}
