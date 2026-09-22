# Edge Cases and Acceptance — Google Photos vague-memory retrieval

Derived from [projectrequirement.md](../projectrequirement.md) and [architecture.md](./architecture.md) v1.0.

**Severity:** P0 = breaks a brief part / wrong KPI / evaluation-bar violation · P1 = wrong insight or segment · P2 = degraded UX / ops noise · P3 = rare / polish

**Constraint:** The job is **successful retrieval of vaguely remembered photos**, not “improve search in general.” Edge-case handling must preserve that.

**Stance:** Retrieval, MemoryQuery, converse, and seed-library cases apply **only if** Phase 4’s decision tree locks Memory Cue Retrieval (or a rewritten Phase 5 for the locked node). Assignment-acceptance IDs (`A-*`) apply in every run.

ID families: `D-` discovery · `K-` metric tree · `R-` research · `P-` problem lock · `S-` segment · `T-` tasks/library · `Q-` retrieve · `E-` elicit · `L-` LLM · `U-` UX · `DB-` data · `API-` security · `M-` dashboard · `V-` deck/deploy. Do not reuse `C-*` (reserved; not used here).

---

## Phase map

| Phase | Assignment | Cases |
|-------|------------|-------|
| 0 Frame | Context | A-F* |
| 1 Discovery | Part 1 | A-D*, D-* |
| 2 Metric + ranking | Part 2 | A-M*, K-* |
| 3 Interviews | Part 3 | A-R*, R-* |
| 4 Problem definition | Part 4 | A-P*, P-* |
| 5 MVP (if locked) | Part 5 | A-V*, S-*, T-*, Q-*, E-*, L-*, U-*, DB-*, API-*, M-* |
| 6 MVP user test | Part 6 | A-T*, X-* |
| 7 Success, risks, deck | Parts 7–8 + deliverables | A-S*, A-K*, V-* |

---

## Phase 0 — Frame (assignment acceptance)

| ID | Edge case | Expected behavior | Severity |
|----|-----------|-------------------|---------|
| A-F01 | Docs name Memory Cue Retrieval as decided in Phase 0–2 | Fail brief spirit — keep **hypothesis** labels only | P0 |
| A-F02 | North-star formula missing or ambiguous | Lock: users who find the intended photo on a vague-memory task ÷ users who start a search with incomplete memory of that photo | P0 |
| A-F03 | Solution framed as “better search / higher search CTR” | Constraint fail — reject; scope is vague-memory retrieval | P0 |
| A-F04 | Product not Google Photos / role not Core Experience | Lock Google Photos, Core Experience PM | P0 |
| A-F05 | Brief examples treated as the locked problem (“Goa café”, “medicine”) | They are **illustrative tasks**, not the Part 4 lock | P1 |

---

## Phase 1 — Discovery engine (Part 1)

### Assignment acceptance

| ID | Edge case | Expected behavior | Severity |
|----|-----------|-------------------|---------|
| A-D01 | Engine only summarizes sentiment | Fail Part 1 — must identify, quantify, and **compare** retrieval problems | P0 |
| A-D02 | Any of Q1–Q10 has zero linked themes and no logged gap | `readyForPhase2: false` | P0 |
| A-D03 | Opportunities listed but not scored against each other | Fail Part 1 compare requirement | P0 |
| A-D04 | Reviewer cannot run a testable workflow | Provide CLI + `data/discovery/` (public showcase may wait) | P0 |
| A-D05 | Interview quotes counted in Phase 1 frequency | Exclude `source: interview` / `primary_research` | P1 |
| A-D06 | Theme is “make Google Photos search better” with no retrieval-failure type | Generic-search leak — reject or rewrite | P0 |
| A-D07 | Only Q1–Q4 covered (brief samples) | Fail — Q5–Q10 are required so ranking is not restated sentiment | P0 |

### Data collection and ingestion

| ID | Edge case | Expected behavior | Severity |
|----|-----------|-------------------|---------|
| D-01 | Empty corpus / zero posts after relevance filter | Clean exit; empty `normalized-reviews.json`; `readyForPhase2: false`; no invented themes | P0 |
| D-02 | Duplicate text across Play Store + Reddit | Dedupe via `textHash`; count once | P1 |
| D-03 | Near-duplicates (typos / emoji) | Keep longest / most recent | P2 |
| D-04 | Posts under 8 words with no retrieval failure named | Filter; record drop in `pipeline-stats` | P2 |
| D-05 | Posts under 8 words that name a retrieval miss (“can’t find old pic”) | Keep | P1 |
| D-06 | Non-English / Hinglish / emoji-only | Keep if analyzable; `language_hint`; low confidence if unsure | P1 |
| D-07 | Reviews about Apple Photos / Amazon Photos / gallery apps | Keep as competitive; tag `competitor`; no Photos-only claims | P1 |
| D-08 | Off-topic (storage full, backup, crash, Pixel-only camera) | Exclude from retrieval themes; file under `ops/storage` or `ops/crash` | P0 |
| D-09 | Source API rate-limited | Fail soft; continue; log partial coverage | P0 |
| D-10 | Broken / missing URL on a quote | Theme fails evidence check until `reviewId` or URL fixed | P1 |
| D-11 | Extremely long thread | Chunk; preserve `reviewId` | P1 |
| D-12 | Prompt-injection text in reviews | Treat as content only | P0 |
| D-13 | YouTube spam / “subscribe” comments | Keyword gate; drop if no retrieval signal | P1 |
| D-14 | Storage/backup threads dominate the scrape | Do not let them outrank retrieval themes; D-08 applies | P0 |
| D-15 | “Search is slow / indexing” with no remembered-photo miss | Not a vague-memory theme | P0 |
| D-16 | Play/App Store pages blocked | Collect UI + documented corpus; log | P1 |
| D-17 | Collect CSV wrong headers | Reject with clear error; no silent partial import | P1 |
| D-18 | Fewer than two live sources and no documented collect corpus | `readyForPhase2: false` until fixed | P0 |

### Theme extraction and validation

| ID | Edge case | Expected behavior | Severity |
|----|-----------|-------------------|---------|
| D-19 | LLM invents a quote | Validation rejects; second pass | P0 |
| D-20 | All quotes from one source | `confidence` capped at `medium` | P1 |
| D-21 | Theme with &lt;2 quotes | Fail `minQuotes` | P1 |
| D-22 | Contradictory themes both evidenced | Both allowed; flag `mixed` | P2 |
| D-23 | Theme maps to no research question | Reject or remap | P1 |
| D-24 | Actionable insight too vague (“improve findability”) | Fail actionability (≥20 chars, specific retrieval angle) | P1 |
| D-25 | Both LLM keys missing | Rule-based matching; label method in stats | P0 |
| D-26 | LLM timeout / 429 | Retry; then rule-based for that batch | P1 |
| D-27 | Fewer than 8 themes pass | `readyForPhase2: false` | P0 |
| D-28 | S3 (object/document) labeled as S2 (trip) | Do not use for Phase 4 lock without interviews | P1 |
| D-29 | Generic-search theme ranked #1 | Flag; never auto-nominate as MVP | P0 |
| D-30 | Screenshot/document conflated with trip memories | Separate themes (`photoKind`) | P1 |
| D-31 | “Search is slow” tagged `metricNode: retrieve` | Remap to ops or reject | P0 |
| D-32 | People-in-photo theme uses only celebrity-search quotes | Cap confidence; not S4 evidence | P1 |
| D-33 | Memories / For You / albums complaints with no find-failure | Separate product-surface theme; do not count as vague-memory unless retrieval is named | P1 |

### Insight quality vs brief

| ID | Edge case | Expected behavior | Severity |
|----|-----------|-------------------|---------|
| D-34 | Insights only about storage, backup, or Pixel camera | Incomplete vs Q1–Q10; widen or retarget keyword gate | P0 |
| D-35 | Sample &lt;50 after filter | Cap confidence `medium`/`low` | P1 |
| D-36 | No themes map to **Formulate** or **Understand** | Log gap; probe in interviews; do not claim “users cannot express memory” | P0 |
| D-37 | No themes map to **Recognize** or **Refine** | Same — do not lock those nodes | P0 |
| D-38 | Ranking score tie | Tie-break `impactOnRetrieval` then feasibility | P2 |
| D-39 | Frequencies sum &gt; 1.0 | Document overlap; do not treat as exclusive | P2 |
| D-40 | Only one `rememberedCue` type across all themes | Widen corpus; likely keyword-gate bias | P1 |

### Phase 1 smoke

| # | Scenario | Expect |
|---|----------|--------|
| 1 | `npm run discovery:refresh` on empty corpus | `readyForPhase2: false`; no invented themes |
| 2 | Open `themes.json` | ≥2 quotes/theme; `researchQuestionIds` present |
| 3 | Open `opportunity-ranking.json` | Comparable scores; not a sentiment list |
| 4 | Theme insight is “improve search quality” | Validation fail |
| 5 | Storage-only review in raw set | Dropped or filed under ops |
| 6 | Bad collect CSV headers | Reject |

---

## Phase 2 — Metric + ranking (Part 2)

### Assignment acceptance

| ID | Edge case | Expected behavior | Severity |
|----|-----------|-------------------|---------|
| A-M01 | Opportunity matrix filled without `opportunity-ranking.json` | Fail Part 2 — ranking must use discovery output | P0 |
| A-M02 | Metric tree missing “what must change” | Require formulate × understand × retrieve × recognize × refine (or evidenced alternative) | P0 |
| A-M03 | Highest opportunity is generic search ranking / indexing | Exclude; constraint | P0 |
| A-M04 | Segment nominated with no ranking support | Revisit Phase 1 or document override | P1 |
| A-M05 | All five nodes marked “primary” | Fail evaluation bar — **one** nominated node | P0 |

### Metric-tree cases

| ID | Edge case | Expected behavior | Severity |
|----|-----------|-------------------|---------|
| K-01 | User formulates a clue, product does not search | Count formulate; no understand / retrieve credit | P1 |
| K-02 | System understands clues, target not in set | Count understand; fail retrieve | P1 |
| K-03 | Target in set, user cannot pick it | Count retrieve; fail recognize | P0 |
| K-04 | User succeeds after a refine | Credit refine **and** success; do not hide the miss | P1 |
| K-05 | Known-item search (date / filename / exact place known) | **Out of north-star denominator** — control only | P0 |
| K-06 | User never starts a search (only scrolls timeline) | Not in north-star denominator unless they attempt a clue; capture as workaround | P1 |
| K-07 | Intervention improves formulate but not retrieve | Valid; report both nodes | P1 |
| K-08 | User finds a *different* photo they accept | Not `task_success` unless they confirm it is the intended one | P0 |
| K-09 | User finds the photo by scrolling the grid, not via clues | Success for the person; **not** mechanism success — tag `workaround_scroll` | P1 |
| P-01 | North-star cohort per-query vs per-user ambiguous | Lock: **per started vague-memory task** (user may contribute multiple) | P0 |
| P-02 | Success on a keyword-known control task | Does not count toward north-star | P0 |
| P-03 | Success on attempt 4 after three abandons | Count one success, three fails — do not overwrite | P1 |

---

## Phase 3 — User research (Part 3)

### Assignment acceptance

| ID | Edge case | Expected behavior | Severity |
|----|-----------|-------------------|---------|
| A-R01 | Primary method is the Google Form | **Allowed for this project** — G1–G9 is Part 3; n ≥ 5 S2 rows lock | P0 |
| A-R02 | n &lt; 5 **in the nominated segment** | Incomplete; **Phase 4 does not lock** | P0 |
| A-R03 | 5 mixed users of whom 2 match the segment | Do not count as 5–6; GP3 anti-pattern | P0 |
| A-R04 | Respondents not in the Phase 2 segment | Do not count toward 5–6 | P0 |
| A-R05 | Interview never reconstructs a concrete retrieval task | Fail Part 3 — cannot answer “why despite partial memory” | P0 |
| A-R06 | Invented quotes labeled as real | P0 — synthetic must be labeled | P0 |
| A-R07 | Interviews never challenge AI themes | Note confirmation-bias risk; probe disconfirming | P1 |
| A-R08 | Form used as the Part 3 study | Required method here; n ≥ 5 S2 | — |

### Research operations

| ID | Edge case | Expected behavior | Severity |
|----|-----------|-------------------|---------|
| R-01 | Recruitment link unavailable | Placeholders; no fake “real” quotes | P0 |
| R-02 | Uses Photos &lt; 12 months | Disqualify | P0 |
| R-03 | Always finds photos by scrolling a small library | Disqualify — not a retrieval-failure respondent | P0 |
| R-04 | Cannot recall any remembered-but-unfound photo | Disqualify | P0 |
| R-05 | Only 3 interviews completed | Document incomplete; do not lock | P0 |
| R-06 | All interviews confirm AI themes | Probe for disconfirming evidence | P1 |
| R-07 | Interviews challenge the Phase 2 metric node | Update matrix; revise frame before MVP | P0 |
| R-08 | Respondent succeeds as soon as they recall a precise keyword | Known-item — **not** in-segment for vague-memory | P0 |
| R-09 | Leading questions (“so search is the problem, right?”) | Discard heavily leading transcripts from matrix | P1 |
| R-10 | Participant is Google / Photos employee or close family on the team | Disqualify | P1 |
| R-11 | New insight in 1 of 6 only | Weak signal; do not drive MVP alone | P2 |
| R-12 | Recording consent denied | Notes only; no verbatim without permission | P0 |
| R-13 | Segment drift (recruited S2, only talks screenshots) | Re-tag; do not force into nomination | P1 |
| R-14 | Workaround is “ask my partner / the other phone” | Capture as S5 signal; valid workaround evidence | P1 |
| R-15 | Workaround is another app (Apple Photos, Files, WhatsApp) | Capture; do not treat as Photos success | P1 |
| R-16 | Magic-wand asks for “just better search” | Probe *which* node; do not accept as problem definition | P1 |
| R-17 | Validation matrix empty | Block deck slides 5–6 | P1 |
| R-18 | Fewer than 3 distinct retrieval tasks documented | Block Phase 6 task reuse | P1 |
| R-19 | Notes contain fellow or respondent real names | Anonymize before any shared artefact | P0 |
| R-20 | Interview skipped remembered vs forgotten cues | Fail A-R05 | P0 |

### Phase 3 smoke

| # | Scenario | Expect |
|---|----------|--------|
| 1 | Screener: finds everything by scrolling 200 photos | Disqualified |
| 2 | Screener: knows the date and finds it | Known-item; not in-segment |
| 3 | Guide vs “remembered / forgotten / query / results / workaround / recognizability” | All mapped |
| 4 | `validation-matrix.md` | Every Phase 1 hypothesis has a status |
| 5 | In-segment n = 2, total n = 6 | Phase 4 **blocked** |

---

## Phase 4 — Problem definition (Part 4)

### Assignment acceptance

| ID | Edge case | Expected behavior | Severity |
|----|-----------|-------------------|---------|
| A-P01 | Any required field missing (segment, scenario, outcome, root cause, workarounds, user value, business value) | Fail Part 4 | P0 |
| A-P02 | Evolution chain skips a step | Fail Part 4 — Metric → Outcomes → Discovery → Research → Problem | P0 |
| A-P03 | Problem framed as “users find it difficult to search for old photos” | Fail Part 4 — brief forbids this | P0 |
| A-P04 | Root cause needs a footnote to be true | Fail mentor clarity test — not locked | P0 |
| A-P05 | Two or three product outcomes presented as co-equal bets | Fail evaluation bar — **exactly one** outcome | P0 |
| A-P06 | Phase 5 contracts written though tree forked / stopped | Rewrite or omit Phase 5 first | P0 |
| A-P07 | Lock written with in-segment n &lt; 5 | Reject `problem-definition.md` | P0 |
| A-P08 | Evolution chain dumps scrape-vs-interview contradictions without a winner | Fail depth bar — say which won and why | P1 |

### Problem / KPI lock

| ID | Edge case | Expected behavior | Severity |
|----|-----------|-------------------|---------|
| P-04 | Demo `task_success` counted as production Photos telemetry | Label **proxy** on dashboard and deck | P1 |
| P-05 | Business value claimed without a retrieval funnel | Show started → formulated → target-in-view → recognized | P1 |
| P-06 | Definition still provisional at ship | Block deploy narrative or mark “hypothesis MVP” | P1 |
| P-07 | Root cause is “the search index is weak” | Reject — generic search | P0 |
| P-08 | P4 definition conflicts with interview synthesis | Synthesis wins; update spec and later `segment.ts` | P0 |
| P-09 | Locked job ≠ Phase 5 hero | Fail **lock equals ship** | P0 |
| P-10 | Decision tree returns `stop` | No MVP; deck argues the stop | P0 |
| P-11 | Scenario is a category (“old photos”) not a task | Reject — name the retrieval task | P0 |
| P-12 | Workarounds listed as a feature backlog | Rewrite as evidence of the root cause | P1 |

---

## Phase 5 — MVP (Part 5) — if Phase 4 locks Memory Cue Retrieval

Replace segment rules after the lock. The rows below assume the **working hypothesis** (cue language → MemoryQuery → grouped candidates). If the locked node is recognize or refine only, keep T/Q/E IDs that still apply and rewrite the rest before coding.

### Assignment acceptance

| ID | Edge case | Expected behavior | Severity |
|----|-----------|-------------------|---------|
| A-V01 | MVP is Figma-only / not publicly testable | Fail Part 5 | P0 |
| A-V02 | Public MVP link broken at submission | Fail deliverable; keep `/api/health` + repo fallback | P0 |
| A-V03 | Another person cannot attempt a retrieval task | Fail Part 5 | P0 |
| A-V04 | Building 5a–5f before Phase 4 `proceed` | Stop | P0 |
| A-V05 | Hero UI is a search box with an LLM behind it | Fail creativity bar — memory-cue interaction required | P0 |
| A-V06 | Locked insight left unbuilt; stand-in ships | Fail lock-equals-ship (GP3 cost-per-wear miss) | P0 |
| A-V07 | Live path is an evidence gallery; product is one tab deeper | Fail A-V03 spirit — `/mvp` **is** the locked job | P0 |
| A-V08 | Copy claims this is the user’s real Google Photos account | Prototype labelling on every screen | P0 |

### Segment eligibility (locked S2 — Phase 4)

Working target: **S2 trip / event rememberer**. Do not implement all five codes as the audience.

| ID | Edge case | Expected behavior | Severity |
|----|-----------|-------------------|---------|
| S-01 | User opted out | Never show retrieval agent | P0 |
| S-02 | Control keyword-known persona | Baseline search only; not the agent hero | P0 |
| S-03 | Shared / family library user when lock is S2 | Control or out of segment — do not mix claims | P1 |
| S-04 | Becomes out-of-segment mid-session | Hide agent on next fetch | P1 |
| S-05 | Empty library | Not eligible; empty state | P0 |

### Seed library and tasks

| ID | Edge case | Expected behavior | Severity |
|----|-----------|-------------------|---------|
| T-01 | Seed library &lt; 80 photos | Too clean — add near-misses before user test | P1 |
| T-02 | No near-misses for a vague task | Keyword search may accidentally win; add distractors | P0 |
| T-03 | `task-control-date` fails a date search | Seed bug — fix titles/dates | P0 |
| T-04 | `task-goa-trip` / “Goa” finds nothing | Goa is in-north-star S2 memory — retrieve must return the trip | P0 |
| T-05 | Phase 3 task cannot be reconstructed | Use the closest representative seed; label it | P1 |
| T-06 | Real interview photos uploaded without consent | Forbidden — reconstruct or use stock | P0 |
| T-07 | Broken `imageUrl` | Placeholder; caption + grouping still work | P2 |
| T-08 | Duplicate `targetPhotoId` across tasks | Allowed if labeled; do not double-count success | P2 |
| T-09 | Video-only target when UI is photo grid | Show poster frame + `kind: video` | P2 |
| T-10 | Screenshot / document with no caption | Fail retrieve honestly; do not invent text | P1 |

### MemoryQuery + retrieve

| ID | Edge case | Expected behavior | Severity |
|----|-----------|-------------------|---------|
| Q-01 | `POST /api/retrieve/search` empty body | `400` | P0 |
| Q-02 | Only a date / album / filename provided | Route to **baseline** search; do not count as vague-memory success | P0 |
| Q-03 | Place-vibe without place name (“small beach café”) | Must be accepted; do not demand GPS or “Calangute” | P0 |
| Q-04 | Fuzzy time (“last year”, “when I was sick”) | Map to a date window; do not require an exact day | P0 |
| Q-05 | Object + episode (“medicine when I was sick”) | Both clauses used; object-only or episode-only is weaker | P1 |
| Q-06 | Target not in library | Say coverage failed; suggest next cue — **no random memories** | P0 |
| Q-07 | 200 flat thumbnails | Forbidden — group (trip / day / object); first screen ≤ ~24 | P0 |
| Q-08 | Group without `whyThisGroup` | Each group has a reason chip | P1 |
| Q-09 | `exclusions: ["not the hotel"]` | Those photos drop from the next set | P0 |
| Q-10 | `similarPhotoId` set | Re-rank toward that photo’s cluster | P1 |
| Q-11 | Mixed photo kinds in one group with no label | Separate or label screenshot vs memory | P1 |
| Q-12 | Double-submit search | Idempotent / cache ~30s | P2 |
| Q-13 | Embedding missing on a photo | Fall back to caption + metadata | P1 |
| Q-14 | Query is Hinglish | Accept; same MemoryQuery fields | P1 |

### Cue elicitation

| ID | Edge case | Expected behavior | Severity |
|----|-----------|-------------------|---------|
| E-01 | First question is date, album, or filename | Fail — ask what people remember (vibe / object / episode) first unless Phase 4 proved otherwise | P0 |
| E-02 | Fourth question asked | Stop; `stopAsking: true` after **3** | P0 |
| E-03 | Two questions in one turn | One question per turn | P1 |
| E-04 | User ignores the question and types a new clue | Accept the clue; patch MemoryQuery; do not nag | P1 |
| E-05 | User says “I don’t remember” | Skip that cue; try the next highest-value forgotten cue | P0 |
| E-06 | Converse with no prior search | Create session; extract first MemoryQuery patch | P1 |
| E-07 | “More like this” on a near-miss | Refine path; emit `refine_used` | P0 |
| E-08 | “Not this trip” | Add exclusion; re-retrieve | P0 |
| E-09 | User pastes prompt-injection in the clue | Treat as memory text only | P0 |
| E-10 | Elicit when lock is recognize-only | Do not force chat; lead with grouping / “is this it?” | P0 |

### LLM and grounding

| ID | Edge case | Expected behavior | Severity |
|----|-----------|-------------------|---------|
| L-01 | `GROQ_API_KEY` empty | OpenAI; then rule-based cue templates | P0 |
| L-02 | Both keys empty | Rule-based MemoryQuery still valid; labelled in `generationMeta` | P0 |
| L-03 | Invented EXIF / “taken on 12 March in Calangute” | Strip unless on the Photo record | P0 |
| L-04 | Claims access to the reviewer’s real Photos library | Strip; prototype disclaimer | P0 |
| L-05 | Photo claim without `photoId` | Reject / regenerate | P0 |
| L-06 | `themes.json` missing | Seed captions only; log | P0 |
| L-07 | Latency &gt;8s | Timeout → rule-based | P1 |
| L-08 | Invalid JSON from LLM | Retry once; then fallback | P0 |
| L-09 | Medical advice on a medicine-photo task | Find the photo; **do not** advise dosage | P0 |
| L-10 | Faces / people named who are not in `people[]` | Do not invent identities | P0 |
| L-11 | RAG pulls generic-search themes | Filter to locked `metricNode` / `rememberedCue` | P1 |
| L-12 | Model asks for date first despite system prompt | Guardrail reject; use template question | P0 |

### Product / UX (problem-aligned)

| ID | Edge case | Expected behavior | Severity |
|----|-----------|-------------------|---------|
| U-01 | User opens `/mvp` with no task | Playground lists Phase-3-shaped tasks | P1 |
| U-02 | Colour-only group encoding | Labels on every group (colour-blind) | P1 |
| U-03 | Mobile viewport | Clue composer + groups usable; not desktop-only | P1 |
| U-04 | User wants to upload their own library | Optional; not required for Part 5 if seed tasks work | P2 |
| U-05 | Multimodal sketch / similar photo | Only if Phase 4 said formulate needs it; else hide | P1 |
| U-06 | Empty state after exclusions remove everything | “Nothing left — undo exclusion or add a cue” | P1 |
| U-07 | Success: user opens the target | `task_success`; do not auto-advance without confirm | P0 |
| U-08 | User opens a near-miss and stops | Not success; allow refine | P0 |
| U-09 | Keyboard-only / screen reader | Controls labelled; not icon-only | P2 |
| U-10 | Chrome looks so official users submit real account passwords | No Google sign-in; explicit prototype banner | P0 |

### Data model

| ID | Edge case | Expected behavior | Severity |
|----|-----------|-------------------|---------|
| DB-01 | SQLite missing | Clear error; `prisma db push` + seed | P0 |
| DB-02 | Seed twice | Idempotent; stable task ids | P1 |
| DB-03 | Corrupt embedding JSON | Skip vector; caption path still works | P1 |
| DB-04 | Concurrent converse writes | No crash | P2 |
| DB-05 | `themes.json` missing at RAG time | L-06 | P0 |
| DB-06 | Serverless SQLite write fails | Commit seed JSON; demo-only DB | P0 |
| DB-07 | Future `takenAt` | Reject or clamp | P1 |
| DB-08 | Session without `taskId` | Allowed for free-play; exclude from north-star funnel | P1 |

### API and security

| ID | Edge case | Expected behavior | Severity |
|----|-----------|-------------------|---------|
| API-01 | Spam converse (LLM cost) | Rate limit in production | P1 |
| API-02 | Oversized JSON body | Reject gracefully | P2 |
| API-03 | Injection via `taskId` / `photoId` | Prisma parameterized queries | P0 |
| API-04 | PII in logs | Avoid full transcripts in prod logs | P1 |
| API-05 | Open CORS on demo APIs | Same-origin default; document policy | P1 |
| API-06 | Secrets committed | `.env.example` only — fail review | P0 |

### Dashboard

| ID | Edge case | Expected behavior | Severity |
|----|-----------|-------------------|---------|
| M-01 | Zero started tasks | 0%; no divide-by-zero | P0 |
| M-02 | Formulated, zero target-in-view | Show retrieve drop-off | P1 |
| M-03 | Funnel includes control keyword tasks in north-star | Exclude — P-02 | P0 |
| M-04 | Funnel includes free-play sessions without a target | Separate or exclude | P1 |
| M-05 | `task_success` from demo clicks labelled as Photos KPI | Label proxy | P0 |
| M-06 | Negative time-to-success | Exclude from median | P1 |
| M-07 | Abandon after N questions not shown | Diagnostic required | P1 |
| M-08 | Discovery files missing | Storefront → “run pipeline” | P1 |

### Phase 5 smoke (after `phase5:setup`)

| # | Scenario | Expect |
|---|----------|--------|
| 1 | GET `/playground` | Seed tasks listed |
| 2 | Open `task-goa-cafe` | Clue composer, **not** a generic search glyph as the only CTA |
| 3 | POST search `{ placeVibe: "small beach cafe" }` | Grouped candidates; target in set or explicit miss |
| 4 | POST search `{ date: "2019-12-01" }` only | Baseline path; not north-star success |
| 5 | Converse first question | Not date/album/filename |
| 6 | Fourth converse turn | `stopAsking` |
| 7 | LLM mock invents EXIF | Reject / strip |
| 8 | Unset `GROQ_API_KEY` | Fallback JSON |
| 9 | Compare / open target | `task_success` |
| 10 | Open near-miss only | No success event |
| 11 | GET `/api/health` | 200 |
| 12 | GET `/api/discovery` | Themes + ranking if Phase 1 artefacts present |
| 13 | Empty exclusions that wipe the set | Recovery copy |
| 14 | Control keyword task via baseline | Success; excluded from vague-memory rate |

---

## Phase 6 — Test the MVP with users (Part 6)

### Assignment acceptance

| ID | Edge case | Expected behavior | Severity |
|----|-----------|-------------------|---------|
| A-T01 | n &lt; 3 return users | Incomplete Part 6 | P0 |
| A-T02 | Testers not from the locked segment | Do not count toward 3 | P0 |
| A-T03 | Test is “click around and tell us if you like it” | Fail — use Phase 3 retrieval tasks | P0 |
| A-T04 | No documented next iteration | Fail Part 6 | P1 |
| A-T05 | Baseline (keyword) never attempted | Cannot claim the MVP beat search | P1 |

### Test operations

| ID | Edge case | Expected behavior | Severity |
|----|-----------|-------------------|---------|
| X-01 | Original Phase 3 photo cannot be used | Closest seed task; label representative | P1 |
| X-02 | User succeeds on baseline already | Record; MVP may still be tested but is not “the unlock” for them | P1 |
| X-03 | User succeeds only after moderator hints | Not unassisted success | P0 |
| X-04 | User thinks the prototype is their real library | Stop; restate prototype; do not collect Google credentials | P0 |
| X-05 | All 3 users fail | Document; change Phase 5 before pretending success on the deck | P0 |
| X-06 | Learnings file empty | Block slide 9 | P1 |

---

## Phase 7 — Success, risks, deck (Parts 7–8 + deliverables)

### Assignment acceptance

| ID | Edge case | Expected behavior | Severity |
|----|-----------|-------------------|---------|
| A-S01 | Metrics listed without definition **or** rationale | Fail Part 7 | P0 |
| A-S02 | Success metrics ignore the north-star | Start from vague-memory retrieval success | P0 |
| A-S03 | Metrics describe a different solution than the one shipped | Fail — framework must match the MVP | P0 |
| A-S04 | No leading or diagnostic metrics | Fail Part 7 completeness | P1 |
| A-S05 | Production Photos telemetry claimed | Proxies only | P0 |
| A-K01 | Risks are generic (“AI might be wrong”) | Fail Part 8 — risks must be **this** solution’s | P0 |
| A-K02 | No mitigation for “this is just better search” | Required | P0 |
| A-K03 | No mitigation for hallucinated dates/places | Required if converse ships | P0 |
| A-K04 | More than one “we did not build the lock” risk | That is a Phase 5 bug, not a residual risk | P0 |

### Deliverable / deck

| ID | Edge case | Expected behavior | Severity |
|----|-----------|-------------------|---------|
| V-01 | Fellow name anywhere on the deck | Submission fail | P0 |
| V-02 | Deck &gt;10 slides (title counts) | Guideline fail | P0 |
| V-03 | Font &lt;14 (Slides/PPT) / &lt;22 Canva / &lt;26 Figma at 1920×1080 | Guideline fail | P0 |
| V-04 | Artefact links private / permission wall | Make public before submit | P0 |
| V-05 | PDF &gt;40 MB | Compress | P1 |
| V-06 | File not named like `NL_GooglePhotos` | Rename | P1 |
| V-07 | Slide titles are generic (“Problem”, “Solution”) | Use message titles | P0 |
| V-08 | Low-contrast text on coloured backgrounds | Fail readability | P1 |
| V-09 | Colour is the only encoder | Labels on every bar / group | P1 |
| V-10 | Discovery demo link broken | CLI + `data/discovery/` documented | P0 |
| V-11 | MVP link broken | `/api/health` + repo fallback | P0 |
| V-12 | Slide 3 missing the required 1-slider workflow | Fail deliverable | P0 |
| V-13 | Methodology dump on slides other than 3 | Fail presentation bar | P1 |
| V-14 | Slide 10 titled as the weakness (“Thin segment”) | Rewrite; fix research or do not lock | P0 |
| V-15 | Slide 8 confesses a stand-in for the locked job | Fail lock-equals-ship | P0 |
| V-16 | Three outcomes on slide 2 | One bet; others are guardrails | P0 |
| V-17 | Submitted after 7 Oct 2026 15:59 IST | Not accepted — even by seconds | P0 |
| V-18 | Late by “a few seconds” / timezone confusion | Treat deadline as **15:59 IST**; submit early | P0 |

---

## Explicit non-goals (not bugs)

- Real Google account OAuth or the user’s production Photos library
- Official Google Photos API, on-device ML in the official app
- Improving generic search ranking / indexing / latency as the core solution
- True production vague-memory telemetry from Google
- Full Photos app clone (sharing, editing, backup, Locked Folder)
- Scraping that violates ToS when blocked (use collect UI)
- Medical, legal, or identity advice from a retrieved document/screenshot
- Multi-language product UI beyond English/Hinglish clue handling
- Implementing Phase 5 retrieval contracts if Phase 4’s tree forks or stops
- Shipping a stand-in feature for an insight that was not built

---

## Related docs

- [projectrequirement.md](../projectrequirement.md) — assignment parts, deliverables, deck rules
- [architecture.md](./architecture.md) — phase-wise build, APIs, schemas, evaluation bar
- `Phase-1/data/discovery/` — themes, ranking, pipeline stats (after Phase 1)
- `docs/problem-definition.md` — lock (after Phase 4)
- `phase-5/lib/segment.ts` — eligibility (Phase 5a, if locked)
- `phase-5/lib/memory-query.ts` / `retrieve.ts` / `llm.ts` — retrieval guardrails (Phase 5b–5c, if locked)

---

*Document version: 1.0 — aligned to projectrequirement.md and architecture.md v1.0.*
