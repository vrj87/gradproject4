import { chromium } from "playwright";

const profile = new URL("./chrome-profile", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const context = await chromium.launchPersistentContext(profile, {
  channel: "chrome",
  headless: false,
  viewport: { width: 1400, height: 900 }
});
const page = context.pages()[0] || (await context.newPage());
await page.goto("https://docs.google.com/forms/u/0/", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(4000);
const opened = await page.evaluate(() => {
  const hits = [...document.querySelectorAll("a, div, span")].filter((el) =>
    /Untitled form|vague-memory|Google Photos/i.test(el.textContent || "")
  );
  return hits.slice(0, 8).map((el) => ({ tag: el.tagName, text: (el.textContent || "").trim().slice(0, 80), href: el.href || "" }));
});
console.log("hits", JSON.stringify(opened, null, 2));
console.log("url", page.url());

if (!/\/forms\/d\//.test(page.url())) {
  const untitled = page.getByText("Untitled form").first();
  if (await untitled.count()) await untitled.click();
  else await page.goto("https://docs.google.com/forms/u/0/create?usp=forms_home&ths=true", { waitUntil: "domcontentloaded" });
  await page.waitForURL(/\/forms\/d\/[^/]+\/edit/, { timeout: 60000 });
}

await page.waitForTimeout(2500);
await page.screenshot({ path: "form-editor.png", fullPage: false });
const dump = await page.evaluate(() => {
  const labels = [...document.querySelectorAll("[aria-label]")].map((el) => ({
    tag: el.tagName,
    role: el.getAttribute("role"),
    label: el.getAttribute("aria-label"),
    placeholder: el.getAttribute("placeholder")
  }));
  const editables = [...document.querySelectorAll('[contenteditable="true"], textarea, input')].map((el) => ({
    tag: el.tagName,
    label: el.getAttribute("aria-label"),
    placeholder: el.getAttribute("placeholder"),
    role: el.getAttribute("role"),
    text: (el.innerText || el.value || "").slice(0, 60)
  }));
  return { url: location.href, labels: labels.slice(0, 120), editables: editables.slice(0, 40) };
});
console.log(JSON.stringify(dump, null, 2));
await context.close();
