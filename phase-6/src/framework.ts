export interface MetricSpec {
  id: string;
  layer: string;
  name: string;
  definition: string;
  rationale: string;
  source: string;
}

export interface RiskSpec {
  id: string;
  risk: string;
  why: string;
  mitigation: string;
}

export interface SlideSpec {
  n: number;
  title: string;
  body: string;
  evidence: string;
}

export const METRICS: MetricSpec[] = [
  {
    id: "north-star",
    layer: "North-star (proxy)",
    name: "Vague-memory retrieval success",
    definition: "task_success ÷ task_started on non-control playground / test tasks.",
    rationale: "The brief’s business metric is successful retrieval of a photo the person remembers but cannot precisely describe — not search CTR.",
    source: "task_success / task_started (exclude task-control-date)"
  },
  {
    id: "formulate",
    layer: "Leading — formulate",
    name: "Clue submitted as memory language",
    definition: "Tasks with ≥1 clue_submitted, without requiring a date or album first.",
    rationale: "If people cannot offer the fragment they still have, understand never runs.",
    source: "clue_submitted"
  },
  {
    id: "understand",
    layer: "Leading — understand",
    name: "MemoryQuery holds the locked cue type",
    definition: "Converse / parse result contains placeVibe, object, episode, or fuzzy time from the typed words.",
    rationale: "Phase 2 nominated understand: the product must accept vibe language, not demand a town name.",
    source: "POST /api/retrieve/converse MemoryQuery"
  },
  {
    id: "retrieve",
    layer: "Leading — retrieve",
    name: "Target in the first grouped set",
    definition: "Seed-task sessions where target_shown fires on the first Remember run.",
    rationale: "Coverage on the representative library — instrumented, not Photos production.",
    source: "target_shown"
  },
  {
    id: "recognize",
    layer: "Leading — recognize",
    name: "Target opened from a group",
    definition: "photo_opened on the target after grouped results, not timeline scroll.",
    rationale: "A hit in the set that nobody can pick is still a failed retrieval.",
    source: "photo_opened"
  },
  {
    id: "refine",
    layer: "Leading — refine",
    name: "Success after refine",
    definition: "task_success on sessions that also have refine_used.",
    rationale: "More like this / Not this trip is the iteration path when the first group is close.",
    source: "refine_used then task_success"
  },
  {
    id: "diagnostic",
    layer: "Diagnostic",
    name: "Questions before success; abandon after N turns",
    definition: "cue_answered count before task_success; task_abandoned after three elicit turns or leave.",
    rationale: "Finds whether elicitation helps or annoys — Part 6 probe.",
    source: "cue_answered, task_abandoned, session transcript"
  },
  {
    id: "guard-control",
    layer: "Guardrail",
    name: "Control date task still succeeds",
    definition: "Keyword Search on task-control-date opens the dated photo.",
    rationale: "Memory Cue Retrieval must not break known-item find.",
    source: "task-control-date via Search"
  },
  {
    id: "guard-exif",
    layer: "Guardrail",
    name: "Hallucinated EXIF rate",
    definition: "Share of converse turns whose assistantText claims a capture date, GPS, or town not in the clue or Photo record.",
    rationale: "Fluent lies about when/where destroy trust in a memory product.",
    source: "generationMeta / containsHallucinatedExif"
  }
];

export const RISKS: RiskSpec[] = [
  {
    id: "just-search",
    risk: "Mentors read Remember as ‘better search’",
    why: "The chrome is Google Photos. A search glyph plus an LLM is the creativity-bar fail (A-V05, A-K02).",
    mitigation: "Composer asks for a fragment, not ‘Search your photos’. Keyword Search stays the baseline. Grouped whyThisGroup is the first screen, not a flat ranked list."
  },
  {
    id: "invented-exif",
    risk: "The model invents a date or a Goa town",
    why: "Place-vibe language is adjacent to place names. Groq can fluent-fill Calangute or ‘12 March’ (A-K03).",
    mitigation: "Ground MemoryQuery in typed tokens; strip assistantText that matches date/GPS patterns; never ask date first; unit-test the guardrail."
  },
  {
    id: "seed-not-memory",
    risk: "Testers succeed because they learned the café task, not because vibe retrieval works",
    why: "Seed café/trip/gig runs are labeled representative (X-01). Repeating only Goa café inflates success; use the respondent’s Phase 3 task when the original photo can be used.",
    mitigation: "Part 6 requires return users’ own tasks when notes exist; label seed runs representative; do not freeze slide 9 on builder-only demos."
  }
];

export const SLIDES: SlideSpec[] = [
  {
    n: 1,
    title: "The job is finding a photo you still picture — not a better search box",
    body: "Success is the person opening the photo they meant, from a fragment of memory. Faster indexing or a smarter keyword rank is a different product.",
    evidence: "Company goal: share of searches that retrieve a photo the person remembers but cannot precisely describe."
  },
  {
    n: 2,
    title: "That number only moves if Photos understands the clue the person still has",
    body: "The journey is: say what you remember → understand the clue → surface a set you can judge → recognize the photo → refine if needed. We bet on understand. The rest are guardrails, not second jobs.",
    evidence: "One bet: accept how a place felt on a trip, not a date or a town name."
  },
  {
    n: 3,
    title: "Public voice becomes ranked retrieval problems — not a sentiment dashboard",
    body: "Listen to public photo talk → keep stories about failed finds → group themes that share a real quote → score by impact, feasibility, and how often it appears → drop “search is slow.”",
    evidence: "One-slide workflow. Not a review-star average."
  },
  {
    n: 4,
    title: "Place without a name is the first problem we will solve. Generic search we refused.",
    body: "People remember how a café felt and have forgotten the town. We did not pick search latency, screenshot file names, or “search feels slow.”",
    evidence: "Highest-ranked retrieval theme: place vibe without a name."
  },
  {
    n: 5,
    title: "They remember the vibe of a trip. They have forgotten the date and the town.",
    body: "Six people in this audience described the same miss: a trip photo they can still picture. Real task: “That small café on the Goa trip.”",
    evidence: "Study of six trip rememberers. Public reviews say the same thing."
  },
  {
    n: 6,
    title: "Search cannot take the fragment that survived — even though the photo is already in the library",
    body: "People remember how a place felt on a trip and have forgotten the date, the album, and the town name. Today they scroll, ask someone, try another phone, or give up.",
    evidence: "Root cause: the product asks for metadata the person no longer has."
  },
  {
    n: 7,
    title: "Trip rememberers get the memory back. Photos stays the camera roll they can re-enter.",
    body: "For the person: find the photo from what is left of the memory. For Photos: a library you cannot re-enter becomes a write-only backup — a risk to capture and backup.",
    evidence: "User value and business value, one line each."
  },
  {
    n: 8,
    title: "Remember puts intelligence at the moment of understanding: a vibe in, a trip group out",
    body: "Type or speak a fragment — never a date first. Photos groups the trip and says why. Open the photo, or say “not this trip.” Keyword Search stays the control.",
    evidence: "Try the prototype: http://localhost:3000/mvp"
  },
  {
    n: 9,
    title: "People found the café, the trip, and the gig. Next: keep grouping by trip.",
    body: "Three return sessions. Keyword search mixed albums (70, 38, and 26 photos). Remember put the intended photo in a named trip group. A mixed keyword pile is not a find.",
    evidence: "Same audience as the study. Next change: keep trip grouping; do not treat a keyword pile as success."
  },
  {
    n: 10,
    title: "We will know it worked when more of these searches end on the right photo — and it can still look like “just search”",
    body: "We watch: a fragment offered without a date; Photos accepting that fragment; the photo in the first group; the person opening it. Risks: it is read as a search upgrade; the model invents a date or a town; success is from a rehearsed demo.",
    evidence: "Prototype signals only — not Google Photos production telemetry."
  }
];
