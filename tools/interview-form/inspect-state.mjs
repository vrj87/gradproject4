import { chromium } from "playwright";

const EDIT = "https://docs.google.com/forms/d/1636u10BwRKW9jzXeK8dEOico908m4DZNuvKRGWLtPY0/edit";
const profile = new URL("./chrome-profile", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const context = await chromium.launchPersistentContext(profile, { channel: "chrome", headless: false, viewport: { width: 1400, height: 900 } });
const page = context.pages()[0] || (await context.newPage());
await page.goto(EDIT, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2500);
const tab = page.getByRole("tab", { name: /^Questions$/i });
if (await tab.count()) await tab.click();
await page.waitForTimeout(500);
const questions = await page.locator('[aria-label="Question"]').allInnerTexts();
const titles = await page.locator('[aria-label="Form title"], [aria-label="Section heading"], [aria-label="Title"]').allInnerTexts();
console.log(JSON.stringify({ url: page.url(), questions, titles }, null, 2));
await context.close();
