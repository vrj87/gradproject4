# Phase 1 — AI-Powered Discovery Engine

Google Photos vague-memory retrieval. Reviewer-testable pipeline: scrape → normalize → quote-grounded themes → ranked opportunities.

```bash
cd Phase-1
npm install
npm run 1d
npm run dev
npm test
```

**Groq:** `Phase-1/.env` holds `GROQ_API_KEY` (gitignored). Restart `npm run dev` after changing it. Remember clues call `POST /api/retrieve/converse`. `/api/health` shows `"llm":"groq"` when the key loaded; otherwise the app stays rule-based.

Open **http://localhost:3000** — Photos is home. Remember is the hypothesis MVP. Search is the keyword baseline.

| Surface | URL |
|---------|-----|
| Photos | http://localhost:3000/?view=photos |
| Remember (MVP) | http://localhost:3000/mvp |
| Goa café task | http://localhost:3000/demo/task/task-goa-cafe |
| Baseline Search | http://localhost:3000/?view=search |
| Playground | http://localhost:3000/playground |
| Dashboard | http://localhost:3000/dashboard |
| Problem (Part 4) | http://localhost:3000/?view=problem |
| MVP test (Part 6) | http://localhost:3000/test |
| Success metrics | http://localhost:3000/?view=success |
| Risks | http://localhost:3000/?view=risks |
| 10-slide PDF | `docs/deck/NL_GooglePhotos.pdf` |
| Collections (Phase 2) | http://localhost:3000/?view=metric |

Phase 2: from repo root `npm run phase2:rank`. Storefront reads `GET /api/phase2`.

All Phase 5 feature flags are on as a **hypothesis until Phase 4**. Remember is Memory Cue Retrieval. Search is the baseline. Seed library is 80+ photos with near-misses so keyword cafe/trip cannot isolate the vague task.

APIs: `/api/health` · `/api/features` · `/api/phase2` · `/api/phase4` · `/api/phase6` · `/api/mvp-test` · `/api/library` · `/api/tasks` · `/api/retrieve/search` · `/api/retrieve/converse` · `/api/retrieve/sessions` · `/api/discovery` · `/api/problem-definition`

| Script | What it does |
|--------|----------------|
| `npm run 1a` | Normalize + chunk existing raw reviews |
| `npm run 1b` | Live scrape (App Store RSS, Play Store, Reddit) + fixtures |
| `npm run 1c` | Extract, validate, rank |
| `npm run 1d` / `discovery:refresh` | Full 1b → 1a → 1c + HTML report |
| `npm run dev` | Storefront on :3000 |

If scrapers rate-limit, the curated fixture corpus still covers Q1–Q10. Missing LLM keys → rule-based extraction (labelled in `pipeline-stats.json`).
