# Problem definition (Part 4)

> **Locked: yes.** Verdict: `proceed`.  
> Do not paste a lock onto a slide while in-segment n < 5 (A-P07).

**One-sentence root cause:** People remember how a place felt on a trip and have forgotten the date, album, and town name, so Search cannot take the clue they still have even though the photo is in the library.

Forbidden frame: “Users find it difficult to search for old photos.”

## Required fields

| Field | Statement |
|-------|-----------|
| Target user segment | **S2 Trip / event rememberer.** People whose primary Google Photos library is large enough that scrolling is not the find method, who remember a trip or event by vibe (café, lights, boat) and have forgotten the date, album, or town name. |
| Retrieval scenario | The café I cannot date — a trip photo the person can still picture (small café, yellow chairs, after the beach) when the capture day and place name are gone. |
| Product outcome | **understand** — Clue-understanding rate — the product accepts vibe, object, episode, and fuzzy time |
| Root cause | People remember how a place felt on a trip and have forgotten the date, album, and town name, so Search cannot take the clue they still have even though the photo is in the library. |
| Existing workarounds | still unfound, or found by scroll / a person / another app — not by a precise keyword (G9) |
| User value | Get the intended memory back from the fragments that survived — without reconstructing metadata the person no longer has. |
| Business value | A library people cannot re-enter becomes a write-only backup. Successful vague-memory retrieval is why they keep capturing, keep backup on, and keep Photos as the default camera roll. |

## Evolution chain

- **Business metric:** Locked the north-star as successful vague-memory retrieval per started task — not search CTR.
- **Product outcomes:** Split the journey into formulate, understand, retrieve, recognize, refine. Exactly one node can be the bet.
- **AI-powered discovery:** Public corpus kept 72 retrieval posts and scored 14 themes. Place-vibe without a name ranked first; generic search latency was flagged and excluded.
- **Observed user behavior:** n=6 S2 via the Google Form. People remember place vibe / trip and have forgotten date, album, and town. Photos should take the fragment they still have (G8). Stories end unfound or via scroll / a person / another app — not a precise keyword (G9). First-break node: understand. Phase 6 seeds: task-goa-cafe, task-goa-trip, task-concert-lights, task-houseboat. Query typed and result-grid were not on the form (instrument gaps, labeled not-recovered on those themes).
- **Problem definition:** Accept place-vibe language so trip rememberers can retrieve a photo they still picture but cannot date or name.

## Evidence (discovery quotes labeled public; form ticks in Google)

Theme `place-vibe-without-name`.

- “I remember that small cafe we went to on the Goa trip but I cannot find the photo. Search wants a date or the place name and I forgot both.” (reddit · fix-s2-01)
- “ooking for that photo of the tiny beach cafe from our vacation. I remember the vibe not the location or when it was taken. Google Photos search is useless for this.” (play_store · fix-s2-02)
- “I can picture the little cafe during our holiday trip but search does not understand place vibe. I only remember it was somewhere we walked after the beach.” (app_store · fix-s2-03)

Form census (Part 3): notes=6, in-segment=6, form-only=6.

Phase 3 synthesis: n=6 S2 via the Google Form. People remember place vibe / trip and have forgotten date, album, and town. Photos should take the fragment they still have (G8). Stories end unfound or via scroll / a person / another app — not a precise keyword (G9). First-break node: understand. Phase 6 seeds: task-goa-cafe, task-goa-trip, task-concert-lights, task-houseboat. Query typed and result-grid were not on the form (instrument gaps, labeled not-recovered on those themes).

## Job for Phase 5

Accept place-vibe language so trip rememberers can retrieve a photo they still picture but cannot date or name.

Memory Cue Retrieval on Remember — intelligence at understand (place-vibe language → grouped candidates).

Generated 2026-09-22T09:52:07.532Z.
