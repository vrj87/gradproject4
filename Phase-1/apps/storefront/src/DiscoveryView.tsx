import { FormEvent, useEffect, useMemo, useState } from "react";
import { Icon } from "./Icon";
import {
  RESEARCH_FORM_RESPONSES_URL,
  RESEARCH_FORM_TITLE,
  RESEARCH_FORM_URL,
  RESEARCH_QUESTIONS,
  WORKFLOW_STEPS,
  classifyCollectText,
  collectSourceLabel,
  evidenceKind,
  isDisplayVoice
} from "./lib/discoveryEngine";
import { loadDiscovery, submitCollect, type DiscoveryPayload, type Theme } from "./lib/loadDiscovery";

type Tab = "workflow" | "voices" | "questions" | "compare" | "collect";

const TABS: Array<{ id: Tab; label: string }> = [
  { id: "workflow", label: "Workflow" },
  { id: "voices", label: "Voices" },
  { id: "questions", label: "Questions" },
  { id: "compare", label: "Compare" },
  { id: "collect", label: "Collect" }
];

function tabFromUrl(): Tab {
  const value = new URLSearchParams(window.location.search).get("tab");
  return TABS.some((tab) => tab.id === value) ? (value as Tab) : "workflow";
}

function pretty(value: string): string {
  return value.replaceAll("_", " ");
}

export function DiscoveryView({
  onOpenMetric,
  onRemember
}: {
  onOpenMetric: () => void;
  onRemember: (clue?: string) => void;
}) {
  const [data, setData] = useState<DiscoveryPayload | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>(tabFromUrl);
  const [voiceFilter, setVoiceFilter] = useState<"all" | "live" | "seed" | "collect">("all");
  const [openTheme, setOpenTheme] = useState<string | null>(null);
  const [collectText, setCollectText] = useState("");
  const [collectSource, setCollectSource] = useState("collect");
  const [collectUrl, setCollectUrl] = useState("");
  const [collectNote, setCollectNote] = useState("");
  const [collectBusy, setCollectBusy] = useState(false);

  useEffect(() => {
    loadDiscovery()
      .then(setData)
      .catch(() => setError("Run npm run discovery:refresh, then reload."));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set("view", "discovery");
    params.set("tab", tab);
    window.history.replaceState({}, "", `?${params.toString()}`);
  }, [tab]);

  const voices = useMemo(() => {
    if (!data) return [];
    const inbox = data.inbox.map((row) => ({ id: row.id, text: row.text, source: row.source, url: row.url }));
    return [...inbox, ...data.voices.filter((voice) => isDisplayVoice(voice.text))].filter((voice) => {
      if (voiceFilter === "all") return true;
      return evidenceKind(voice.id, voice.source) === voiceFilter;
    });
  }, [data, voiceFilter]);

  const liveCount = data?.voices.filter((voice) => evidenceKind(voice.id, voice.source) === "live").length ?? 0;
  const seedCount = data?.voices.filter((voice) => evidenceKind(voice.id, voice.source) === "seed").length ?? 0;
  const previewMatches = classifyCollectText(collectText);

  if (error) {
    return (
      <>
        <h1 className="page-title">Discovery</h1>
        <p className="page-lede">{error}</p>
      </>
    );
  }

  if (!data) {
    return <p className="boot">Loading discovery artefacts…</p>;
  }

  const { stats, themes, ranking } = data;
  const selected = themes.find((theme) => theme.id === (openTheme ?? ranking[0]?.themeId ?? themes[0]?.id));

  return (
    <>
      <h1 className="page-title">Discovery</h1>
      <p className="page-lede">
        Public photo-retrieval talk, compared — not sentiment. Ready for the metric breakdown
        {stats.readyForPhase2 ? "." : " after the pipeline fills Q1–Q10."}
      </p>

      <aside className="try-this">
        <span className="feature-badge">Research</span>
        <div>
          <b>{RESEARCH_FORM_TITLE}</b>
          <p>Screener for the live interview. One photo they knew was there and still missed. Not the study.</p>
        </div>
        <div className="try-this-actions">
          <a className="primary" href={RESEARCH_FORM_URL} target="_blank" rel="noreferrer">
            Open the form
          </a>
          <a className="text-btn" href={RESEARCH_FORM_RESPONSES_URL} target="_blank" rel="noreferrer">
            Responses
          </a>
        </div>
      </aside>

      <div className="stat-row">
        <Stat label="Public posts kept" value={String(stats.normalizedCount)} />
        <Stat label="Validated themes" value={String(stats.validatedThemeCount)} />
        <Stat label="Live vs seed" value={`${liveCount} / ${seedCount}`} />
        <Stat label="Extractor" value={stats.extractionMethod} />
      </div>

      <div className="chips research-tabs">
        {TABS.map((item) => (
          <button key={item.id} type="button" className={tab === item.id ? "on" : ""} onClick={() => setTab(item.id)}>
            {item.label}
          </button>
        ))}
      </div>

      {tab === "workflow" && (
        <WorkflowTab
          stats={stats}
          onOpenCompare={() => setTab("compare")}
          onOpenMetric={onOpenMetric}
        />
      )}
      {tab === "voices" && (
        <VoicesTab
          voices={voices}
          filter={voiceFilter}
          onFilter={setVoiceFilter}
          liveCount={liveCount}
          seedCount={seedCount}
          collectCount={data.inbox.length}
        />
      )}
      {tab === "questions" && <QuestionsTab themes={themes} />}
      {tab === "compare" && (
        <CompareTab
          themes={themes}
          ranking={ranking}
          selected={selected}
          onSelect={setOpenTheme}
          onRemember={onRemember}
          onOpenMetric={onOpenMetric}
        />
      )}
      {tab === "collect" && (
        <CollectTab
          text={collectText}
          source={collectSource}
          url={collectUrl}
          note={collectNote}
          busy={collectBusy}
          matches={previewMatches}
          inbox={data.inbox}
          onText={setCollectText}
          onSource={setCollectSource}
          onUrl={setCollectUrl}
          onSubmit={async (event: FormEvent) => {
            event.preventDefault();
            setCollectBusy(true);
            setCollectNote("");
            try {
              const result = await submitCollect({
                text: collectText,
                source: collectSource,
                url: collectUrl || undefined
              });
              setData((current) =>
                current ? { ...current, inbox: [result.item, ...current.inbox] } : current
              );
              setCollectText("");
              setCollectUrl("");
              setCollectNote(
                result.matches[0]
                  ? `Mapped to ${result.matches[0].label}. Frequency updates on the next pipeline refresh.`
                  : "Saved to the collect inbox. Frequency updates on the next pipeline refresh."
              );
            } catch (err) {
              setCollectNote(err instanceof Error ? err.message : "Could not add that quote.");
            } finally {
              setCollectBusy(false);
            }
          }}
        />
      )}
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-card">
      <b>{value}</b>
      <span>{label}</span>
    </div>
  );
}

function WorkflowTab({
  stats,
  onOpenCompare,
  onOpenMetric
}: {
  stats: DiscoveryPayload["stats"];
  onOpenCompare: () => void;
  onOpenMetric: () => void;
}) {
  return (
    <>
      <section className="workflow-strip" aria-label="Discovery workflow">
        {WORKFLOW_STEPS.map((step, index) => (
          <article key={step.id} className="workflow-step">
            <span>{index + 1}</span>
            <h2>{step.title}</h2>
            <p>{step.body}</p>
          </article>
        ))}
      </section>

      <h2 className="day-title">Sources in this run</h2>
      <div className="stat-row compact">
        {Object.entries(stats.sourceCoverage).map(([source, count]) => (
          <Stat key={source} label={pretty(source)} value={String(count)} />
        ))}
      </div>
      <p className="hint">
        Seed fixtures fill Q1–Q10 when a live scrape is thin. Compare uses scored themes, not star ratings.
        Dropped {stats.droppedIrrelevant} off-topic posts
        {typeof stats.droppedMinWords === "number" ? ` and ${stats.droppedMinWords} too-short rows` : ""}.
      </p>
      <div className="chips">
        <button type="button" className="primary" onClick={onOpenCompare}>
          Compare opportunities
        </button>
        <button type="button" onClick={onOpenMetric}>
          Open metric breakdown
        </button>
      </div>
    </>
  );
}

function VoicesTab({
  voices,
  filter,
  onFilter,
  liveCount,
  seedCount,
  collectCount
}: {
  voices: Array<{ id: string; text: string; source: string; url?: string }>;
  filter: "all" | "live" | "seed" | "collect";
  onFilter: (value: "all" | "live" | "seed" | "collect") => void;
  liveCount: number;
  seedCount: number;
  collectCount: number;
}) {
  return (
    <>
      <div className="chips">
        <button type="button" className={filter === "all" ? "on" : ""} onClick={() => onFilter("all")}>
          All
        </button>
        <button type="button" className={filter === "live" ? "on" : ""} onClick={() => onFilter("live")}>
          Live · {liveCount}
        </button>
        <button type="button" className={filter === "seed" ? "on" : ""} onClick={() => onFilter("seed")}>
          Seed · {seedCount}
        </button>
        <button type="button" className={filter === "collect" ? "on" : ""} onClick={() => onFilter("collect")}>
          Collect · {collectCount}
        </button>
      </div>
      <div className="voice-list">
        {voices.slice(0, 40).map((voice) => {
          const kind = evidenceKind(voice.id, voice.source);
          return (
            <article key={voice.id} className="voice-card">
              <p>{voice.text}</p>
              <span>
                {collectSourceLabel(voice.source)} · {kind}
                {voice.url ? (
                  <>
                    {" · "}
                    <a href={voice.url} target="_blank" rel="noreferrer">
                      source
                    </a>
                  </>
                ) : null}
              </span>
            </article>
          );
        })}
        {voices.length === 0 && <p className="empty-state">No voices in this filter.</p>}
      </div>
    </>
  );
}

function QuestionsTab({ themes }: { themes: Theme[] }) {
  return (
    <>
      <p className="page-lede">
        Brief samples are Q1–Q4. Q5–Q10 are required so ranking is not restated sentiment.
      </p>
      <div className="question-list">
        {RESEARCH_QUESTIONS.map((question) => {
          const linked = themes.filter((theme) => theme.researchQuestionIds.includes(question.id));
          return (
            <article key={question.id} className="question-card">
              <h2>
                Q{question.id}. {question.text}
              </h2>
              {linked.length ? (
                <ul>
                  {linked.map((theme) => (
                    <li key={theme.id}>
                      <b>{theme.label}</b>
                      <span>
                        {theme.metricNode} · remembers {pretty(theme.rememberedCue)} · forgot{" "}
                        {pretty(theme.forgottenCue)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No linked theme yet — logged as a gap for interviews.</p>
              )}
            </article>
          );
        })}
      </div>
    </>
  );
}

function CompareTab({
  themes,
  ranking,
  selected,
  onSelect,
  onRemember,
  onOpenMetric
}: {
  themes: Theme[];
  ranking: DiscoveryPayload["ranking"];
  selected?: Theme;
  onSelect: (id: string) => void;
  onRemember: (clue?: string) => void;
  onOpenMetric: () => void;
}) {
  const sample = selected?.quotes[0]?.text;
  return (
    <>
      <p className="page-lede">
        Higher score is a stronger retrieval opportunity, not a happier review. Generic search quality is
        scored so it can be excluded.
      </p>
      <div className="compare-table">
        <div className="compare-head">
          <span>#</span>
          <span>Opportunity</span>
          <span>Node</span>
          <span>Impact</span>
          <span>Feas.</span>
          <span>Freq.</span>
          <span>Score</span>
        </div>
        {ranking.map((row) => (
          <button
            key={row.themeId ?? row.label}
            type="button"
            className={`compare-row ${selected?.id === row.themeId ? "on" : ""} ${row.genericSearchFlag ? "excluded" : ""}`}
            onClick={() => onSelect(row.themeId ?? row.label)}
          >
            <span>{row.rank}</span>
            <span>{row.label}</span>
            <span>{row.metricNode}</span>
            <span>{row.impactOnRetrieval}</span>
            <span>{row.mvpFeasibility ?? themes.find((theme) => theme.id === row.themeId)?.mvpFeasibility ?? "—"}</span>
            <span>{Math.round(row.estimatedFrequency * 100)}%</span>
            <span>{row.score.toFixed(3)}</span>
          </button>
        ))}
      </div>
      {selected && (
        <aside className="theme-detail">
          <h2>{selected.label}</h2>
          <p>{selected.summary}</p>
          <p>
            Remembers {pretty(selected.rememberedCue)} · forgot {pretty(selected.forgottenCue)}
            {selected.photoKind ? ` · ${pretty(selected.photoKind)}` : ""}
            {selected.segmentHints?.length ? ` · ${selected.segmentHints.join(", ")}` : ""}
          </p>
          <ul>
            {selected.quotes.slice(0, 3).map((quote) => (
              <li key={`${quote.reviewId}-${quote.text.slice(0, 24)}`}>
                “{quote.text}”
                <span>
                  {" "}
                  · {collectSourceLabel(quote.source)} · {evidenceKind(quote.reviewId, quote.source)}
                </span>
              </li>
            ))}
          </ul>
          <div className="chips">
            {sample && (
              <button type="button" className="primary" onClick={() => onRemember(sample)}>
                Try this cue in Remember
              </button>
            )}
            <button type="button" onClick={onOpenMetric}>
              See where this sits on the metric
            </button>
          </div>
        </aside>
      )}
    </>
  );
}

function CollectTab({
  text,
  source,
  url,
  note,
  busy,
  matches,
  inbox,
  onText,
  onSource,
  onUrl,
  onSubmit
}: {
  text: string;
  source: string;
  url: string;
  note: string;
  busy: boolean;
  matches: Array<{ id: string; label: string; hits: string[] }>;
  inbox: DiscoveryPayload["inbox"];
  onText: (value: string) => void;
  onSource: (value: string) => void;
  onUrl: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <>
      <p className="page-lede">
        Paste a public retrieval complaint when a scraper is blocked. This is not an interview and does not
        replace the study.
      </p>
      <form className="collect-form" onSubmit={onSubmit}>
        <label>
          Public quote
          <textarea
            value={text}
            onChange={(event) => onText(event.target.value)}
            rows={5}
            placeholder="I remember that small café from the trip but search wants a date I forgot…"
            required
          />
        </label>
        <div className="collect-meta">
          <label>
            Source
            <select value={source} onChange={(event) => onSource(event.target.value)}>
              <option value="collect">Other public</option>
              <option value="reddit">Reddit</option>
              <option value="play_store">Play Store</option>
              <option value="app_store">App Store</option>
              <option value="youtube">YouTube</option>
              <option value="forum">Forum</option>
            </select>
          </label>
          <label>
            URL (optional)
            <input value={url} onChange={(event) => onUrl(event.target.value)} placeholder="https://" />
          </label>
        </div>
        {matches.length > 0 && (
          <p className="hint">
            <Icon name="auto_awesome" size={18} />
            Would map to {matches[0].label}
            {matches[1] ? ` (also ${matches[1].label})` : ""}.
          </p>
        )}
        <button type="submit" className="primary" disabled={busy || text.trim().length < 12}>
          {busy ? "Saving…" : "Add to inbox"}
        </button>
        {note && <p className="hint">{note}</p>}
      </form>
      {inbox.length > 0 && (
        <>
          <h2 className="day-title">Inbox this session</h2>
          <div className="voice-list">
            {inbox.map((row) => (
              <article key={row.id} className="voice-card">
                <p>{row.text}</p>
                <span>{collectSourceLabel(row.source)} · collect</span>
              </article>
            ))}
          </div>
        </>
      )}
    </>
  );
}
