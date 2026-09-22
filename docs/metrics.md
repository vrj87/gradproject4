# Success metrics (Part 7)

Reflect the solution actually built: **Memory Cue Retrieval** (intelligence at understand).  
Numbers from this browser’s prototype events are **proxies**. They are not Google Photos production telemetry (A-S05).  
Study success rates stay blank until Part 6 n ≥ 3.

| Layer | Metric | Definition | Rationale |
|-------|--------|------------|-----------|
| North-star (proxy) | Vague-memory retrieval success | task_success ÷ task_started on non-control playground / test tasks. | The brief’s business metric is successful retrieval of a photo the person remembers but cannot precisely describe — not search CTR. |
| Leading — formulate | Clue submitted as memory language | Tasks with ≥1 clue_submitted, without requiring a date or album first. | If people cannot offer the fragment they still have, understand never runs. |
| Leading — understand | MemoryQuery holds the locked cue type | Converse / parse result contains placeVibe, object, episode, or fuzzy time from the typed words. | Phase 2 nominated understand: the product must accept vibe language, not demand a town name. |
| Leading — retrieve | Target in the first grouped set | Seed-task sessions where target_shown fires on the first Remember run. | Coverage on the representative library — instrumented, not Photos production. |
| Leading — recognize | Target opened from a group | photo_opened on the target after grouped results, not timeline scroll. | A hit in the set that nobody can pick is still a failed retrieval. |
| Leading — refine | Success after refine | task_success on sessions that also have refine_used. | More like this / Not this trip is the iteration path when the first group is close. |
| Diagnostic | Questions before success; abandon after N turns | cue_answered count before task_success; task_abandoned after three elicit turns or leave. | Finds whether elicitation helps or annoys — Part 6 probe. |
| Guardrail | Control date task still succeeds | Keyword Search on task-control-date opens the dated photo. | Memory Cue Retrieval must not break known-item find. |
| Guardrail | Hallucinated EXIF rate | Share of converse turns whose assistantText claims a capture date, GPS, or town not in the clue or Photo record. | Fluent lies about when/where destroy trust in a memory product. |

Guardrails: `task-control-date` still works in Search; hallucinated EXIF rate stays at zero on converse turns.
