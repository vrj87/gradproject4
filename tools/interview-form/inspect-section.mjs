import { chromium } from "playwright";

const EDIT = "https://docs.google.com/forms/d/1636u10BwRKW9jzXeK8dEOico908m4DZNuvKRGWLtPY0/edit";
const profile = new URL("./chrome-profile", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const context = await chromium.launchPersistentContext(profile, { channel: "chrome", headless: false, viewport: { width: 1400, height: 900 } });
const page = context.pages()[0] || (await context.newPage());
await page.goto(EDIT, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2000);
await page.locator('[aria-label="Add section"]').first().click();
await page.waitForTimeout(1500);
await page.screenshot({ path: "section.png" });
const dump = await page.evaluate(() =>
  [...document.querySelectorAll("[aria-label]")].map((el) => el.getAttribute("aria-label")).filter((label) => /section|title|heading|description/i.test(label || ""))
);
console.log(JSON.stringify(dump, null, 2));
await context.close();
