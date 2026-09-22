import { FormEvent, useEffect, useRef, useState } from "react";
import { TASKS } from "./data/tasks";
import { LIBRARY, searchLibrary, type LibraryPhoto } from "./data/library";
import { converseClue } from "./lib/converse";
import { PhotoImg, TRY_CAFE_CLUE, TryThisCard } from "./PhotoChrome";
import { Icon } from "./Icon";
import { elicit, type ElicitChoice, type ElicitTurn } from "./lib/elicit";
import { track } from "./lib/events";
import { FEATURES } from "./lib/features";
import {
  emptyQuery,
  groundQueryToClue,
  parseMemoryClue,
  queryFromSimilar,
  understoodCues,
  type MemoryQuery
} from "./lib/memoryQuery";
import { listenInBrowser, recordMemoryClip, transcribeClip, type MicState } from "./lib/speech";
import { exclusionForPhoto, retrieve, type ResultGroup } from "./lib/retrieve";

const EXAMPLES = [
  { label: "Small café", clue: "small cafe on that trip" },
  { label: "Medicine", clue: "medicine when I was sick" },
  { label: "Receipt", clue: "screenshot of a receipt" },
  { label: "Purple lights", clue: "the gig with the purple lights" },
  { label: "Houseboat", clue: "houseboat on the backwaters" },
  { label: "Fireworks", clue: "fireworks that night" },
  { label: "Horse", clue: "horse" }
] as const;

const FRAGMENTS = [
  { id: "vibe", label: "A vibe", clue: "it felt like a small cafe", icon: "mood" },
  { id: "thing", label: "A thing", clue: "there was an object in it", icon: "category" },
  { id: "episode", label: "What happened", clue: "on a trip", icon: "luggage" },
  { id: "like", label: "Like this", clue: "", icon: "image_search" }
] as const;

const SIMILAR_STRIP = ["p-cafe-1", "p-beach-1", "p-gig-1", "p-med-1", "p-horse-1", "p-ker-1", "p-fw-1", "p-receipt-1"];

export interface RememberActions {
  moreLike: (photo: LibraryPhoto) => void;
  notThis: (photo: LibraryPhoto) => void;
  confirm: (photo: LibraryPhoto) => void;
  excludeLabel: (photo: LibraryPhoto) => string;
}

export function FindView({
  taskId,
  initialClue,
  similarPhotoId,
  similarNonce,
  autoNonce,
  banner,
  onOpen,
  onNeedSimilar,
  onTryKeywords,
  onClear,
  onActions
}: {
  taskId?: string;
  initialClue?: string;
  similarPhotoId?: string;
  similarNonce?: number;
  autoNonce?: number;
  banner?: string;
  onOpen: (photo: LibraryPhoto, from?: LibraryPhoto[]) => void;
  onNeedSimilar?: () => void;
  onTryKeywords?: (query: string) => void;
  onClear?: () => void;
  onActions?: (actions: RememberActions) => void;
}) {
  const task = TASKS.find((item) => item.id === taskId);
  const [clue, setClue] = useState(task?.starterClue || initialClue || "");
  const [query, setQuery] = useState<MemoryQuery>(emptyQuery());
  const [asked, setAsked] = useState(0);
  const [result, setResult] = useState<ReturnType<typeof retrieve> | null>(null);
  const [note, setNote] = useState("");
  const [question, setQuestion] = useState<string | undefined>();
  const [choices, setChoices] = useState<ElicitChoice[]>([]);
  const [mic, setMic] = useState<MicState>("idle");
  const [busy, setBusy] = useState(false);
  const [foundId, setFoundId] = useState<string>();
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!task) return;
    track("task_started", { taskId: task.id });
    setClue(task.starterClue);
    setAsked(0);
    run(parseMemoryClue(task.starterClue));
  }, [task?.id]);

  useEffect(() => {
    if (task || !initialClue) return;
    setClue(initialClue);
  }, [initialClue, task]);

  useEffect(() => {
    if (task || !autoNonce) return;
    const source = (initialClue || clue).trim();
    if (!source) return;
    setClue(source);
    track("clue_submitted", { taskId });
    void converseClue(source, 0, undefined, taskId).then((spoken) => run(spoken.query, false, spoken.turn));
  }, [autoNonce]);

  useEffect(() => {
    if (!similarPhotoId) return;
    const seed = LIBRARY.find((item) => item.id === similarPhotoId);
    if (!seed) return;
    const next = queryFromSimilar(seed, clue ? parseMemoryClue(clue) : emptyQuery());
    if (!clue) setClue(`more like: ${seed.caption}`);
    run(next, true);
  }, [similarPhotoId, similarNonce]);

  function showResults() {
    window.requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function run(next: MemoryQuery, refine = false, turn?: ElicitTurn, message?: string) {
    const retrieved = retrieve(next, task?.targetPhotoId);
    setQuery(next);
    setResult(retrieved);
    track("search_run", { taskId: task?.id });
    if (retrieved.targetInView) track("target_shown", { taskId: task?.id, photoId: task?.targetPhotoId });
    if (refine) track("refine_used", { taskId: task?.id });
    if (message) {
      setNote(message);
    } else if (retrieved.coverageFailed) {
      setNote("Nothing matched that memory yet. Add another fragment — a vibe, an object, or a trip.");
    } else if (next.similarPhotoId) {
      const seed = LIBRARY.find((item) => item.id === next.similarPhotoId);
      setNote(seed ? `Finding photos like this one — same trip, people, or vibe.` : "");
    } else {
      setNote(`Reconstructed from what you remember · ${retrieved.photoIds.length} photos`);
    }
    if (FEATURES.cueElicitation) {
      const used = elicit(next, asked, retrieved.photoIds.length);
      const show = turn?.choices?.length ? turn : used;
      setQuestion(show.stopAsking ? undefined : show.question);
      setChoices(show.stopAsking ? [] : show.choices ?? []);
      if (!show.stopAsking) setAsked((value) => value + 1);
    }
    showResults();
  }

  async function findFromMemory(nextClue?: string) {
    const typed = (nextClue ?? clue).trim();
    const source = typed || EXAMPLES[0].clue;
    if (source !== clue) setClue(source);
    setBusy(true);
    track("clue_submitted", { taskId: task?.id });
    try {
      const spoken = await converseClue(source, asked, query.raw ? query : undefined, task?.id);
      run(groundQueryToClue(source, spoken.query), false, spoken.turn);
      if (!typed) setNote("Say a fragment, or pick one below.");
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void findFromMemory();
  }

  async function answerCue(text: string) {
    const combined = `${clue} ${text}`.trim();
    track("cue_answered", { taskId: task?.id });
    setClue(combined);
    setBusy(true);
    try {
      const spoken = await converseClue(combined, asked, query, task?.id);
      run(groundQueryToClue(combined, spoken.query), false, spoken.turn);
    } finally {
      setBusy(false);
    }
  }

  async function startVoice() {
    if (mic !== "idle") return;
    setMic("listening");
    try {
      const clip = await recordMemoryClip(7000);
      if (clip) {
        setMic("transcribing");
        const heard = await transcribeClip(clip);
        if (heard) {
          setClue(heard);
          setMic("idle");
          await findFromMemory(heard);
          return;
        }
      }
      const fallback = await listenInBrowser();
      if (fallback) {
        setClue(fallback);
        setMic("idle");
        await findFromMemory(fallback);
        return;
      }
      setNote("Couldn’t hear that. Type a fragment instead.");
    } catch {
      setNote("Microphone isn’t available. Type what you still remember.");
    } finally {
      setMic("idle");
    }
  }

  function openPhoto(photo: LibraryPhoto) {
    track("photo_opened", { taskId: task?.id, photoId: photo.id });
    const from = result?.groups.flatMap((group) => group.photos) ?? LIBRARY;
    onOpen(photo, from);
  }

  function confirm(photo: LibraryPhoto) {
    setFoundId(photo.id);
    if (task && photo.id === task.targetPhotoId) {
      track("task_success", { taskId: task.id, photoId: photo.id });
      setNote("That’s the one — the photo you remembered.");
    } else if (task) {
      setNote("Close — try More like this, or say it was a different trip.");
    } else {
      track("task_success", { photoId: photo.id });
      setNote("That’s the one — saved as the photo you meant.");
    }
  }

  function moreLike(photo: LibraryPhoto) {
    run(
      queryFromSimilar(photo, query),
      true,
      undefined,
      "More like this — grouping the same trip, people, or vibe."
    );
  }

  function notThis(photo: LibraryPhoto) {
    const { token, label } = exclusionForPhoto(photo, query);
    if (query.exclusions.includes(token)) {
      setNote(`${label} is already left out.`);
      return;
    }
    run(
      { ...query, exclusions: [...query.exclusions, token] },
      true,
      undefined,
      `Left out ${label.replace(/^Not /i, "").toLowerCase()}. Showing the rest of what you remember.`
    );
  }

  const actionsRef = useRef<RememberActions | null>(null);
  actionsRef.current = {
    moreLike,
    notThis,
    confirm,
    excludeLabel: (photo) => exclusionForPhoto(photo, query).label
  };

  useEffect(() => {
    onActions?.({
      moreLike: (photo) => actionsRef.current?.moreLike(photo),
      notThis: (photo) => actionsRef.current?.notThis(photo),
      confirm: (photo) => actionsRef.current?.confirm(photo),
      excludeLabel: (photo) => actionsRef.current?.excludeLabel(photo) ?? "Not this trip"
    });
  }, [onActions]);

  function dropExclusion(token: string) {
    run({ ...query, exclusions: query.exclusions.filter((item) => item !== token) }, true);
  }

  const keywordHits = clue.trim() ? searchLibrary(clue) : [];
  const keywordAlbums = new Set(keywordHits.map((photo) => photo.album)).size;
  const cues = understoodCues(query);
  const similarPhotos = SIMILAR_STRIP.map((id) => LIBRARY.find((photo) => photo.id === id)).filter(
    (photo): photo is LibraryPhoto => Boolean(photo)
  );
  const micLabel = mic === "listening" ? "Listening…" : mic === "transcribing" ? "Hearing that…" : "Speak a memory";

  return (
    <div className="find remember-stage">
      <section className="memory-stage">
        <div className="remember-head">
          <span className="feature-badge">New</span>
          <h1 className="page-title">Remember</h1>
        </div>
        <p className="page-lede memory-lede">
          This is Remember — Memory Cue Retrieval for the locked job. Speak or type a fragment. Photos groups what
          it understood. Not a keyword search. Prototype library — not your Google Photos account.
        </p>
        {task && (
          <aside className="callout">
            Retrieval task: {task.prompt} You still remember {task.remembered}. You forgot {task.forgotten}.
          </aside>
        )}
        {!result && (
          <TryThisCard
            onSearch={() => onTryKeywords?.(TRY_CAFE_CLUE)}
            onRemember={() => {
              setClue(TRY_CAFE_CLUE);
              void findFromMemory(TRY_CAFE_CLUE);
            }}
          />
        )}
        <form className="memory-composer" onSubmit={onSubmit}>
          <label htmlFor="clue">What do you still remember?</label>
          <div className="composer-row">
            <textarea
              id="clue"
              rows={3}
              value={clue}
              onChange={(event) => setClue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                  event.preventDefault();
                  void findFromMemory();
                }
              }}
              placeholder="the small café on that trip · purple lights · medicine when I was sick"
            />
            <button
              type="button"
              className={`mic-btn ${mic !== "idle" ? "live" : ""}`}
              onClick={() => void startVoice()}
              aria-label={micLabel}
              disabled={mic === "transcribing"}
            >
              <Icon name={mic === "transcribing" ? "hearing" : "mic"} />
              <span>{micLabel}</span>
            </button>
          </div>
          <div className="fragment-grid">
            {FRAGMENTS.map((fragment) => (
              <button
                key={fragment.id}
                type="button"
                className="fragment"
                onClick={() => {
                  if (fragment.id === "like") {
                    onNeedSimilar?.();
                    return;
                  }
                  setClue((current) => (current ? `${current} ${fragment.clue}` : fragment.clue));
                }}
              >
                <Icon name={fragment.icon} size={20} />
                {fragment.label}
              </button>
            ))}
          </div>
          <div className="memory-examples">
            {EXAMPLES.map((example) => (
              <button
                key={example.clue}
                type="button"
                className={clue === example.clue ? "on" : ""}
                onClick={() => {
                  setClue(example.clue);
                  void findFromMemory(example.clue);
                }}
              >
                {example.label}
              </button>
            ))}
          </div>
          <div className="clue-actions">
            <button type="button" className="primary" onClick={() => void findFromMemory()} disabled={busy}>
              <Icon name="auto_awesome" size={18} />
              {busy ? "Reconstructing…" : "Remember"}
            </button>
            {onClear && (
              <button type="button" className="text-btn" onClick={onClear} aria-label="Clear memory cues">
                Clear
              </button>
            )}
            {onTryKeywords && (
              <button type="button" className="text-btn" onClick={() => onTryKeywords(clue)}>
                <Icon name="search" size={18} />
                Search
              </button>
            )}
          </div>
          {FEATURES.similarPhoto && (
            <div className="similar-strip">
              <p>Or start from a photo that’s close</p>
              <div className="similar-row">
                {similarPhotos.map((photo) => (
                  <button
                    key={photo.id}
                    type="button"
                    className="similar-thumb"
                    title={photo.caption}
                    onClick={() => {
                      if (!clue) setClue(`more like: ${photo.caption}`);
                      moreLike(photo);
                    }}
                  >
                    <PhotoImg src={photo.src} alt="" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </form>
      </section>

      {cues.length > 0 && (
        <div className="understood">
          <b>Using</b>
          {cues.map((cue) =>
            cue.exclusion ? (
              <button key={cue.id} type="button" className="understood-not" onClick={() => dropExclusion(cue.exclusion!)}>
                {cue.label} ×
              </button>
            ) : (
              <span key={cue.id}>{cue.label}</span>
            )
          )}
          {onClear && (
            <button type="button" className="text-btn" onClick={onClear}>
              Clear
            </button>
          )}
        </div>
      )}

      {FEATURES.cueElicitation && question && (
        <aside className="elicit">
          <p>{question}</p>
          <div className="chips">
            {choices.map((choice) => (
              <button key={choice.label} type="button" onClick={() => void answerCue(choice.clue)}>
                {choice.label}
              </button>
            ))}
          </div>
        </aside>
      )}

      {(banner || note) && <aside className="callout">{banner || note}</aside>}

      {result && !result.coverageFailed && keywordHits.length > 0 && (
        <aside className="callout contrast-callout">
          Keywords found {keywordHits.length} photos
          {keywordAlbums > 1 ? ` across ${keywordAlbums} albums` : ""}. Remember grouped the trip or thing you
          still recall.
          {onTryKeywords && (
            <button type="button" className="text-btn" onClick={() => onTryKeywords(clue)}>
              See word matches
            </button>
          )}
        </aside>
      )}

      <div className="find-results" ref={resultsRef}>
        {result?.coverageFailed && (
          <p className="empty-state">
            No photos matched that memory. Add another fragment, pick a nearby photo, or try a keyword you can see.
          </p>
        )}
        {result && !result.coverageFailed && (
          <GroupedResults groups={result.groups} foundId={foundId} onOpen={openPhoto} />
        )}
      </div>
    </div>
  );
}

function GroupedResults({
  groups,
  foundId,
  onOpen
}: {
  groups: ResultGroup[];
  foundId?: string;
  onOpen: (photo: LibraryPhoto) => void;
}) {
  return (
    <div className="groups">
      {groups.map((group) => (
        <section key={group.id} className={group.role === "near-miss" ? "group-near" : "group-match"}>
          <h2>
            {group.role === "near-miss" && <span className="group-kicker">Similar, probably not</span>}
            {group.role === "match" && groups.length > 1 && <span className="group-kicker">Closest match</span>}
            <span className="why">{group.whyThisGroup}</span>
          </h2>
          <div className={`mosaic ${group.role === "match" ? "mosaic-lead" : "mosaic-near"}`}>
            {group.photos.map((photo) => (
              <div key={photo.id} className={`tile-wrap ${foundId === photo.id ? "found" : ""}`}>
                <button className="tile" type="button" title={photo.caption} onClick={() => onOpen(photo)}>
                  <PhotoImg src={photo.src} alt={photo.alt} />
                </button>
              </div>
            ))}
          </div>
        </section>
      ))}
      <p className="hint refine-hint">Open a photo to try more like this, leave this trip out, or mark that’s the one.</p>
    </div>
  );
}
