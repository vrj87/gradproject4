/**
 * Fills the existing Phase 3 Google Form in the live editor.
 */
import { writeFileSync } from "node:fs";
import { chromium } from "playwright";

const EDIT = "https://docs.google.com/forms/d/1636u10BwRKW9jzXeK8dEOico908m4DZNuvKRGWLtPY0/edit";
const TITLE = "Google Photos — vague-memory retrieval (Phase 3)";
const DESCRIPTION =
  "THIS FORM IS NOT THE INTERVIEW. Part 3 is a 30–40 minute conversation.\n\n" +
  "Respondents: complete section A so we can book you.\n" +
  "Moderators: complete section B during or right after the live call.\n\n" +
  "North-star: find a photo you remember but cannot precisely describe — not generic search quality.\n" +
  "Do not write real names. Use r01, r02. No Google / Photos employees.";

const items = [
  { kind: "radio", title: "Who is filling this form?", options: ["Respondent — I am applying for a 30–40 min interview", "Moderator — notes from a live interview"] },
  { kind: "section", title: "A · Recruitment screener", help: "Stop after this section if you are applying. The study is the live call." },
  { kind: "radio", title: "I understand this form only screens me. The study is a 30–40 minute conversation, not this questionnaire.", options: ["Yes — I want to be considered for a live interview"] },
  { kind: "radio", title: "I am not a Google or Google Photos employee, and I am not close family of someone on that team.", options: ["True", "False — I should not take part"] },
  { kind: "radio", title: "How long has Google Photos been your primary photo library?", options: ["Less than 12 months", "12–24 months", "2–5 years", "More than 5 years"] },
  { kind: "radio", title: "Roughly how many items (photos, videos, screenshots) are in that library?", options: ["Under 500 — I can usually scroll to what I want", "500–2,000", "2,000–10,000", "More than 10,000"] },
  { kind: "radio", title: "When you need an old photo, what do you usually do first?", options: ["Type in Search", "Scroll the Photos timeline", "Open an album", "Open Memories", "Ask someone else or check another phone", "Look in another app (WhatsApp, Files, Apple Photos, gallery)"] },
  { kind: "radio", title: "Can you think of at least one photo you knew was in Google Photos but could not find the first time you looked?", options: ["Yes — I can talk about that photo on a call", "No — I always find what I look for"] },
  { kind: "radio", title: "Which best describes that photo? (pick the closest)", options: ["S2 — a trip, holiday, wedding, concert, or “that place”", "S3 — an object, medicine, receipt, screenshot, or document", "S4 — a person whose face I remember", "S5 — family / kids / a photo that also lives on someone else’s phone", "S1 — it is buried in years of mixed photos"] },
  { kind: "radio", title: "When you started looking, did you already remember the exact date, album name, or filename?", options: ["No — I remembered a vibe, object, person, or episode, not those details", "Yes — I knew the date, album, or filename"] },
  { kind: "paragraph", title: "In one or two sentences, what photo was it? Do not worry if you forgot the date." },
  { kind: "short", title: "Email so we can book the interview (not published; not used as a quote)" },
  { kind: "paragraph", title: "When are you free for a 30–40 min video call this week or next?", optional: true },
  { kind: "section", title: "B · Live interview notes (moderator)", help: "No real names. Reconstruct one failed find and stay on it. Challenge the AI themes. Do not prompt “better search.”" },
  { kind: "short", title: "Respondent code (r01, r02…) — no real name" },
  { kind: "date", title: "Interview date" },
  { kind: "radio", title: "Recording consent", options: ["Notes only — no recording", "Recorded with consent", "Consent denied — notes without verbatim quotes"] },
  { kind: "radio", title: "Segment after the story (retag if the screener was wrong)", options: ["S1 heavy library", "S2 trip / event", "S3 object / document", "S4 people", "S5 family / shared", "Out of segment — do not count"] },
  { kind: "radio", title: "Does this session count toward in-segment n ≥ 5?", options: ["Yes — in nominated / working segment and vague-memory", "No — known-item, wrong segment, or disqualified"] },
  { kind: "paragraph", title: "Q1 — What photo were they trying to find? What kind of old visual was it (memory, screenshot, document, video)?" },
  { kind: "paragraph", title: "Roughly when in their life was this — the episode, not the calendar date if they do not have one?" },
  { kind: "check", title: "Q2 — What did they remember? (tick all that were actually used)", options: ["Place vibe (small café, that beach hotel…)", "Object (medicine, receipt, ticket…)", "Person / face", "Episode (trip, sick, wedding…)", "Emotion", "Fuzzy time (last year, winter…)", "Exact date / album / filename"] },
  { kind: "paragraph", title: "Remembered — verbatim" },
  { kind: "check", title: "Q3 — What had they forgotten?", options: ["Date", "Album name", "Exact place / town / venue", "Person’s searchable name", "Keywords that search wanted", "Filename", "They had not forgotten much — known-item"] },
  { kind: "paragraph", title: "Forgotten — verbatim" },
  { kind: "paragraph", title: "Q4 — What did they type? Paste the query. If they did not search, why not?" },
  { kind: "check", title: "Q5 — Where did they look?", options: ["Search", "Memories", "Albums", "Timeline only", "Partner’s phone / shared library"] },
  { kind: "radio", title: "What came back?", options: ["Nothing useful", "The wrong trip or year", "Too many near-misses to evaluate", "Something close — they still could not tell if it was the one", "The intended photo was there and they missed it", "They never searched"] },
  { kind: "paragraph", title: "Q8 — Could they evaluate the result set? What would have made the photo recognizable?" },
  { kind: "check", title: "Q6 — What did they do instead?", options: ["Scrolled the timeline", "Opened albums until they found it", "Asked a person", "Checked another phone", "Used WhatsApp / Files / Apple Photos / another app", "Gave up", "Found it later some other way"] },
  { kind: "paragraph", title: "Q9 — After the first miss, what did they try next? Did the second try teach them anything?" },
  { kind: "paragraph", title: "If Photos could accept one thing they already remember, what should it take? (Do not write “better search.”)" },
  { kind: "radio", title: "Q7 — This task was closest to…", options: ["People", "Place-vibe", "Object", "Event / episode", "Screenshot / document"] },
  { kind: "radio", title: "First-break metric node (exactly one)", options: ["Formulate — they could not start a clue", "Understand — Photos misread the clue", "Retrieve — the photo was not in the set", "Recognize — it may have been there; they could not pick it", "Refine — the next try did not learn"] },
  { kind: "radio", title: "Place-vibe is a used cue that Search rejects", options: ["Confirmed", "Challenged", "Not supported", "New — see notes"] },
  { kind: "radio", title: "Object + episode is a used cue that Search rejects", options: ["Confirmed", "Challenged", "Not supported", "New — see notes"] },
  { kind: "radio", title: "Forgotten date / album is the token Search demanded", options: ["Confirmed", "Challenged", "Not supported", "New — see notes"] },
  { kind: "radio", title: "Results came back but were not evaluable", options: ["Confirmed", "Challenged", "Not supported", "New — see notes"] },
  { kind: "radio", title: "Refine was a dead end", options: ["Confirmed", "Challenged", "Not supported", "New — see notes"] },
  { kind: "radio", title: "The real complaint was generic search quality (slow / ranking) — kill MVP if this wins", options: ["Confirmed", "Challenged", "Not supported", "New — see notes"] },
  { kind: "radio", title: "This was known-item success mistaken for vague-memory", options: ["Confirmed", "Challenged", "Not supported", "New — see notes"] },
  { kind: "paragraph", title: "What challenged the AI themes? Write it even if it ruins the working hypothesis." },
  { kind: "paragraph", title: "2–3 verbatim quotes (only if consent allows)" },
  { kind: "short", title: "Phase 6 task title (another person could attempt this without this spec)" },
  { kind: "paragraph", title: "Anything else", optional: true }
];

async function visible(locator) {
  const n = await locator.count();
  for (let i = n - 1; i >= 0; i--) {
    if (await locator.nth(i).isVisible()) return locator.nth(i);
  }
  throw new Error(`No visible match for ${locator}`);
}

async function typeInto(locator, text) {
  const target = await visible(locator);
  await target.click();
  await target.press("Control+A");
  await target.press("Backspace");
  await target.pressSequentially(text, { delay: 8 });
}

async function setType(page, label) {
  await (await visible(page.locator('[aria-label="Question types"]'))).click();
  await page.waitForTimeout(250);
  await page.keyboard.type(label);
  await page.waitForTimeout(200);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(350);
  await page.keyboard.press("Escape");
}

async function fillOptions(page, options) {
  for (let i = 0; i < options.length; i++) {
    if (i === 0) {
      await typeInto(page.locator('input[aria-label="option value"]'), options[i]);
    } else {
      await (await visible(page.locator('input[aria-label="Add option"]'))).click();
      await page.waitForTimeout(200);
      await typeInto(page.locator('input[aria-label="option value"]'), options[i]);
    }
  }
}

async function requireOn(page) {
  await page.keyboard.press("Escape");
  await page.waitForTimeout(200);
  const box = await visible(page.locator('[aria-label="Required"]'));
  if ((await box.getAttribute("aria-checked")) !== "true") {
    await box.click({ force: true });
  }
}

async function clickToolbar(page, label) {
  const buttons = page.locator(`[aria-label="${label}"]`);
  const n = await buttons.count();
  for (let i = 0; i < n; i++) {
    if (await buttons.nth(i).isVisible()) {
      await buttons.nth(i).click();
      await page.waitForTimeout(600);
      return;
    }
  }
  throw new Error(`No visible toolbar button: ${label}`);
}

async function addQuestion(page, item, index) {
  if (item.kind === "section") return;

  if (index > 0) {
    await clickToolbar(page, "Add question");
  }

  await typeInto(page.locator('[aria-label="Question"]'), item.title);

  if (item.kind === "paragraph") await setType(page, "Paragraph");
  else if (item.kind === "short") await setType(page, "Short answer");
  else if (item.kind === "date") await setType(page, "Date");
  else if (item.kind === "check") {
    await setType(page, "Checkboxes");
    await fillOptions(page, item.options);
  } else if (item.kind === "radio") {
    await fillOptions(page, item.options);
  }

  if (!item.optional) await requireOn(page);
}

async function main() {
  const profile = new URL("./chrome-profile", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
  const context = await chromium.launchPersistentContext(profile, {
    channel: "chrome",
    headless: false,
    viewport: { width: 1400, height: 900 }
  });
  const page = context.pages()[0] || (await context.newPage());
  await page.goto(EDIT, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  const questionsTab = page.getByRole("tab", { name: /^Questions$/i });
  if (await questionsTab.count()) await questionsTab.click();

  const formTitle = page.locator('[aria-label="Form title"]').first();
  if (!(await formTitle.innerText()).includes("vague-memory")) {
    await typeInto(page.locator('[aria-label="Form title"]'), TITLE);
    await typeInto(page.locator('[aria-label="Form description"]'), DESCRIPTION);
  }

  await page.mouse.wheel(0, 3000);
  await page.waitForTimeout(800);
  const existing = (await page.locator('[aria-label="Question"]').allInnerTexts())
    .map((text) => text.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  console.log("already on form:", existing.length, existing.map((text) => text.slice(0, 40)));

  for (let i = 0; i < items.length; i++) {
    if (items[i].kind === "section") continue;
    if (i === 0 && existing.length >= 5) {
      console.log("skip 1: screener already started");
      continue;
    }
    if (existing.some((text) => text.includes(items[i].title.slice(0, 36)))) {
      console.log(`skip ${i + 1}: already present`);
      continue;
    }
    console.log(`${i + 1}/${items.length} ${items[i].kind}: ${items[i].title.slice(0, 70)}`);
    await addQuestion(page, items[i], existing.length + i);
    await page.waitForTimeout(250);
    existing.push(items[i].title);
  }

  const responderUri =
    (await page.locator('input[aria-label="Link for sharing. Press Ctrl+C to copy"]').inputValue().catch(() => "")) ||
    "";
  const publish = page.locator('[aria-label="Publish"]').first();
  if (await publish.count()) {
    await publish.click();
    await page.waitForTimeout(800);
    const confirm = page.getByRole("button", { name: /^Publish$/ }).last();
    if (await confirm.count()) await confirm.click();
    await page.waitForTimeout(1000);
  }

  const out = { editUrl: EDIT, responderUri, title: TITLE };
  writeFileSync(new URL("./form-urls.json", import.meta.url), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await context.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
