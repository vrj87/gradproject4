import { chromium } from "playwright";

const EDIT = "https://docs.google.com/forms/d/1636u10BwRKW9jzXeK8dEOico908m4DZNuvKRGWLtPY0/edit";
const HOME = "https://docs.google.com/forms/u/0/";
const profile = new URL("./chrome-profile", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const context = await chromium.launchPersistentContext(profile, {
  channel: "chrome",
  headless: false,
  viewport: { width: 1400, height: 900 }
});
const page = context.pages()[0] || (await context.newPage());
await page.goto(EDIT, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2000);

async function clickVisible(name) {
  const loc = page.getByRole("button", { name });
  const n = await loc.count();
  for (let i = 0; i < n; i++) {
    if (await loc.nth(i).isVisible()) {
      await loc.nth(i).click({ force: true });
      return true;
    }
  }
  const text = page.getByText(name, { exact: true });
  if (await text.first().isVisible().catch(() => false)) {
    await text.first().click({ force: true });
    return true;
  }
  return false;
}

for (const name of ["Move to bin", "Move to trash", "Delete", "Remove", "OK", "Confirm"]) {
  if (await clickVisible(name)) {
    console.log("clicked", name);
    await page.waitForTimeout(800);
  }
}

const more = page.locator('[aria-label="More"]');
for (let i = 0; i < (await more.count()); i++) {
  if (await more.nth(i).isVisible()) {
    await more.nth(i).click({ force: true });
    await page.waitForTimeout(400);
    break;
  }
}
await clickVisible("Move to bin");
await page.waitForTimeout(400);
await clickVisible("Move to bin");
await page.waitForTimeout(1500);

await page.goto(HOME, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2500);
const body = await page.locator("body").innerText();
const stillThere = /vague-memory|Google Photos —/i.test(body);
console.log(JSON.stringify({ stillThere, snippet: body.slice(0, 400).replace(/\s+/g, " ") }));
await context.close();
