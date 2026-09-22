# Phase 5 — Memory Cue Retrieval

**Job:** Accept place-vibe language so trip rememberers can retrieve a photo they still picture but cannot date or name.

**Locked:** yes (Phase 4 `proceed` after n = 6 S2 Google Form records). This folder does **not** start a second app. The testable MVP is the Photos storefront:

```bash
npm run phase5:setup
npm run phase5:dev
```

| Surface | URL |
|---------|-----|
| MVP (Remember) | http://localhost:3000/mvp |
| Goa café task | http://localhost:3000/demo/task/task-goa-cafe |
| Keyword baseline | http://localhost:3000/?view=search |
| Playground | http://localhost:3000/playground |
| Dashboard | http://localhost:3000/dashboard |
| Health | http://localhost:3000/api/health |
| Problem (Part 4) | http://localhost:3000/?view=problem |

Intelligence sits at **understand** (place-vibe language → grouped candidates). Header Search is the baseline to beat. Not the user’s real Google Photos account.

LLM: Groq → OpenAI → rule-based. Copy `Phase-1/.env.example` to `Phase-1/.env` for a live model; retrieval still works without a key.
