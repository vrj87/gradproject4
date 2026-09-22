# Risks (Part 8)

Risks for **this** solution — vibe-language Remember — not generic “AI might be wrong” (A-K01).

| Risk | Why it might happen | Mitigation |
|------|---------------------|------------|
| Mentors read Remember as ‘better search’ | The chrome is Google Photos. A search glyph plus an LLM is the creativity-bar fail (A-V05, A-K02). | Composer asks for a fragment, not ‘Search your photos’. Keyword Search stays the baseline. Grouped whyThisGroup is the first screen, not a flat ranked list. |
| The model invents a date or a Goa town | Place-vibe language is adjacent to place names. Groq can fluent-fill Calangute or ‘12 March’ (A-K03). | Ground MemoryQuery in typed tokens; strip assistantText that matches date/GPS patterns; never ask date first; unit-test the guardrail. |
| Testers succeed because they learned the café task, not because vibe retrieval works | Seed café/trip/gig runs are labeled representative (X-01). Repeating only Goa café inflates success; use the respondent’s Phase 3 task when the original photo can be used. | Part 6 requires return users’ own tasks when notes exist; label seed runs representative; do not freeze slide 9 on builder-only demos. |
