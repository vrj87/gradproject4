/**
 * Publishes the Phase 3 instrument as a Google Form on the logged-in account.
 * Reads clasp credentials locally. Never prints tokens.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

function loadAccessToken() {
  const raw = readFileSync(path.join(homedir(), ".clasprc.json"), "utf8");
  const parsed = JSON.parse(raw);
  const token =
    parsed?.tokens?.default?.access_token ||
    parsed?.token?.access_token ||
    parsed?.tokens?.access_token ||
    parsed?.access_token;
  if (!token) throw new Error("No clasp access token. Run: npx @google/clasp@3.3.0 login --extra-scopes https://www.googleapis.com/auth/forms.body --extra-scopes https://www.googleapis.com/auth/drive.file");
  return token;
}

async function forms(token, method, urlPath, body) {
  const res = await fetch(`https://forms.googleapis.com/v1/${urlPath}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${urlPath}: ${text.slice(0, 400)}`);
  return text ? JSON.parse(text) : {};
}

function textItem(title, description) {
  return { title, description, textItem: {} };
}

function pageBreak(title, description) {
  return { title, description, pageBreakItem: {} };
}

function question(title, description, required, spec) {
  return {
    title,
    description,
    questionItem: { question: { required, ...spec } }
  };
}

function radio(title, options, required = true, description = "") {
  return question(title, description, required, {
    choiceQuestion: { type: "RADIO", options: options.map((value) => ({ value })) }
  });
}

function check(title, options, required = true, description = "") {
  return question(title, description, required, {
    choiceQuestion: { type: "CHECKBOX", options: options.map((value) => ({ value })) }
  });
}

function shortText(title, required = true, description = "") {
  return question(title, description, required, { textQuestion: { paragraph: false } });
}

function longText(title, required = true, description = "") {
  return question(title, description, required, { textQuestion: { paragraph: true } });
}

function dateQ(title) {
  return question(title, "", true, { dateQuestion: { includeTime: false } });
}

const items = [
  textItem(
    "How to use this form",
    "THIS FORM IS NOT THE INTERVIEW. Part 3 is a 30–40 minute conversation. Respondents complete section A so we can book you. Moderators complete section B during or right after the live call. Do not write real names — use r01, r02. North-star: find a photo you remember but cannot precisely describe. Not generic search quality."
  ),
  radio("Who is filling this form?", [
    "Respondent — I am applying for a 30–40 min interview",
    "Moderator — notes from a live interview"
  ]),
  pageBreak("A · Recruitment screener", "Stop after this section if you are applying. The study is the live call."),
  textItem(
    "Eligibility",
    "We need people who use Google Photos as their main library and once failed to find a photo they still remember. If you always find photos by scrolling a small camera roll, this study is not a fit."
  ),
  radio(
    "I understand this form only screens me. The study is a 30–40 minute conversation, not this questionnaire.",
    ["Yes — I want to be considered for a live interview"]
  ),
  radio("I am not a Google or Google Photos employee, and I am not close family of someone on that team.", [
    "True",
    "False — I should not take part"
  ]),
  radio("How long has Google Photos been your primary photo library?", [
    "Less than 12 months",
    "12–24 months",
    "2–5 years",
    "More than 5 years"
  ]),
  radio("Roughly how many items (photos, videos, screenshots) are in that library?", [
    "Under 500 — I can usually scroll to what I want",
    "500–2,000",
    "2,000–10,000",
    "More than 10,000"
  ]),
  radio("When you need an old photo, what do you usually do first?", [
    "Type in Search",
    "Scroll the Photos timeline",
    "Open an album",
    "Open Memories",
    "Ask someone else or check another phone",
    "Look in another app (WhatsApp, Files, Apple Photos, gallery)"
  ]),
  radio(
    "Can you think of at least one photo you knew was in Google Photos but could not find the first time you looked?",
    ["Yes — I can talk about that photo on a call", "No — I always find what I look for"]
  ),
  radio("Which best describes that photo? (pick the closest)", [
    "S2 — a trip, holiday, wedding, concert, or “that place”",
    "S3 — an object, medicine, receipt, screenshot, or document",
    "S4 — a person whose face I remember",
    "S5 — family / kids / a photo that also lives on someone else’s phone",
    "S1 — it is buried in years of mixed photos"
  ]),
  radio(
    "When you started looking, did you already remember the exact date, album name, or filename?",
    [
      "No — I remembered a vibe, object, person, or episode, not those details",
      "Yes — I knew the date, album, or filename"
    ],
    true,
    "If yes, that is a known-item find — useful as a control, not the core study."
  ),
  longText("In one or two sentences, what photo was it? Do not worry if you forgot the date."),
  shortText("Email so we can book the interview (not published; not used as a quote)"),
  longText("When are you free for a 30–40 min video call this week or next?", false),
  pageBreak("Screener received", "Respondents: submit here. Moderators continue to interview notes."),
  pageBreak(
    "B · Live interview notes (moderator)",
    "No real names (R-19). Reconstruct one failed find and stay on it (A-R05). Challenge the AI themes (A-R07)."
  ),
  textItem("Moderator setup", "Stay on one photo. Do not prompt “better search.”"),
  shortText("Respondent code (r01, r02…) — no real name"),
  dateQ("Interview date"),
  radio("Recording consent", [
    "Notes only — no recording",
    "Recorded with consent",
    "Consent denied — notes without verbatim quotes"
  ]),
  radio("Segment after the story (retag if the screener was wrong)", [
    "S1 heavy library",
    "S2 trip / event",
    "S3 object / document",
    "S4 people",
    "S5 family / shared",
    "Out of segment — do not count"
  ]),
  radio("Does this session count toward in-segment n ≥ 5?", [
    "Yes — in nominated / working segment and vague-memory",
    "No — known-item, wrong segment, or disqualified"
  ]),
  textItem("1 · The retrieval task", "Stay on this photo. Brief café / medicine lines are examples, not the lock."),
  longText(
    "Q1 — What photo were they trying to find? What kind of old visual was it (memory, screenshot, document, video)?"
  ),
  longText("Roughly when in their life was this — the episode, not the calendar date if they do not have one?"),
  textItem("2–3 · Remembered vs forgotten", "Missing this reconstruction fails A-R05 / R-20."),
  check("Q2 — What did they remember? (tick all that were actually used)", [
    "Place vibe (small café, that beach hotel…)",
    "Object (medicine, receipt, ticket…)",
    "Person / face",
    "Episode (trip, sick, wedding…)",
    "Emotion",
    "Fuzzy time (last year, winter…)",
    "Exact date / album / filename"
  ]),
  longText("Remembered — verbatim"),
  check("Q3 — What had they forgotten?", [
    "Date",
    "Album name",
    "Exact place / town / venue",
    "Person’s searchable name",
    "Keywords that search wanted",
    "Filename",
    "They had not forgotten much — known-item"
  ]),
  longText("Forgotten — verbatim"),
  textItem("4 · Formulate", "The query they typed, or why they never opened Search."),
  longText("Q4 — What did they type? Paste the query. If they did not search, why not?"),
  textItem("5 · What Photos did", "Search, Memories, and albums are different surfaces. Name which one they used."),
  check("Q5 — Where did they look?", [
    "Search",
    "Memories",
    "Albums",
    "Timeline only",
    "Partner’s phone / shared library"
  ]),
  radio("What came back?", [
    "Nothing useful",
    "The wrong trip or year",
    "Too many near-misses to evaluate",
    "Something close — they still could not tell if it was the one",
    "The intended photo was there and they missed it",
    "They never searched"
  ]),
  longText("Q8 — Could they evaluate the result set? What would have made the photo recognizable?"),
  textItem("6 · Workaround", ""),
  check("Q6 — What did they do instead?", [
    "Scrolled the timeline",
    "Opened albums until they found it",
    "Asked a person",
    "Checked another phone",
    "Used WhatsApp / Files / Apple Photos / another app",
    "Gave up",
    "Found it later some other way"
  ]),
  textItem("7–8 · Recognize and refine", ""),
  longText("Q9 — After the first miss, what did they try next? Did the second try teach them anything?"),
  longText(
    "If Photos could accept one thing they already remember, what should it take? (Do not write “better search.”)"
  ),
  textItem("Q7 · Q10 · Compare the task", ""),
  radio("Q7 — This task was closest to…", ["People", "Place-vibe", "Object", "Event / episode", "Screenshot / document"]),
  radio("First-break metric node (exactly one)", [
    "Formulate — they could not start a clue",
    "Understand — Photos misread the clue",
    "Retrieve — the photo was not in the set",
    "Recognize — it may have been there; they could not pick it",
    "Refine — the next try did not learn"
  ]),
  textItem("Challenge the discovery themes", "Mark each: confirmed / challenged / not supported / new. Do not only confirm."),
  ...[
    "Place-vibe is a used cue that Search rejects",
    "Object + episode is a used cue that Search rejects",
    "Forgotten date / album is the token Search demanded",
    "Results came back but were not evaluable",
    "Refine was a dead end",
    "The real complaint was generic search quality (slow / ranking) — kill MVP if this wins",
    "This was known-item success mistaken for vague-memory"
  ].map((title) => radio(title, ["Confirmed", "Challenged", "Not supported", "New — see notes"])),
  longText("What challenged the AI themes? Write it even if it ruins the working hypothesis."),
  longText("2–3 verbatim quotes (only if consent allows)"),
  shortText("Phase 6 task title (another person could attempt this without this spec)"),
  longText("Anything else", false)
];

const created = await forms(loadAccessToken(), "POST", "forms", {
  info: {
    title: "Google Photos — vague-memory retrieval (Phase 3 screener + interview notes)",
    documentTitle: "Photos Phase 3 interview instrument"
  }
});

const formId = created.formId;
const requests = items.map((item, index) => ({
  createItem: { item, location: { index } }
}));

for (let i = 0; i < requests.length; i += 10) {
  await forms(loadAccessToken(), "POST", `forms/${formId}:batchUpdate`, {
    requests: requests.slice(i, i + 10)
  });
}

const latest = await forms(loadAccessToken(), "GET", `forms/${formId}?fields=formId,responderUri,linkedSheetId,info`);
const out = {
  formId,
  responderUri: latest.responderUri || `https://docs.google.com/forms/d/${formId}/viewform`,
  editUrl: `https://docs.google.com/forms/d/${formId}/edit`
};
writeFileSync(new URL("./form-urls.json", import.meta.url), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
