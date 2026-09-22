export const PHOTOS_IOS_ID = "962194608";
export const PHOTOS_ANDROID_ID = "com.google.android.apps.photos";
export const APP_STORE_SLUG = "google-photos";

export function storeListingUrl(source: string, country = "us"): string {
  if (source === "play_store") {
    return `https://play.google.com/store/apps/details?id=${PHOTOS_ANDROID_ID}&hl=en`;
  }
  if (source === "app_store") {
    return `https://apps.apple.com/${country}/app/${APP_STORE_SLUG}/id${PHOTOS_IOS_ID}`;
  }
  if (source === "reddit") {
    return "https://www.reddit.com/r/googlephotos/";
  }
  return "";
}

export function publicReviewUrl(input: {
  source: string;
  sourceId?: string;
  url?: string;
  reviewId?: string;
}): string {
  if (input.url?.startsWith("http") && !input.url.includes("/rss/")) {
    return input.url;
  }
  if (input.source === "play_store") {
    return storeListingUrl("play_store");
  }
  if (input.source === "app_store") {
    const country = input.reviewId?.match(/^appstore-([a-z]{2})-/)?.[1] ?? "us";
    return `${storeListingUrl("app_store", country)}?see-all=reviews`;
  }
  if (input.source === "reddit") {
    if (input.url?.startsWith("/")) return `https://www.reddit.com${input.url}`;
    return storeListingUrl("reddit");
  }
  return storeListingUrl(input.source);
}
