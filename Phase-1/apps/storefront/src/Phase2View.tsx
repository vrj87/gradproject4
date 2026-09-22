import { useEffect, useMemo, useState } from "react";
import { PhotoImg } from "./PhotoChrome";
import { LIBRARY } from "./data/library";
import { TASKS } from "./data/tasks";
import { RESEARCH_FORM_RESPONSES_URL, RESEARCH_FORM_URL } from "./lib/discoveryEngine";
import { loadPhase2, type Phase2Payload } from "./lib/phase2";

const COVER: Record<string, string> = {
  "place-vibe-without-name": "p-cafe-1",
  "forgotten-date-album": "p-beach-1",
  "object-episode-find": "p-med-1",
  "unevaluable-results": "p-friends-1",
  "refine-dead-end": "p-italy-1",
  "timeline-scroll-workaround": "p-road-1",
  "screenshot-utility": "p-receipt-1",
  "heavy-library": "p-india-1",
  "people-without-name": "p-portrait-1",
  "memories-surface-miss": "p-sunset-1",
  "ask-someone-else": "p-family-1",
  "generic-search-latency": "p-beach-2"
};

export function Phase2View({
  onTryTask,
  onRemember,
  onOpenDiscovery
}: {
  onTryTask: (taskId: string) => void;
  onRemember: () => void;
  onOpenDiscovery: () => void;
}) {
  const [phase2, setPhase2] = useState<Phase2Payload | null>(null);
  const [error, setError] = useState("");
  const [node, setNode] = useState<string | "all">("all");
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    loadPhase2()
      .then((payload) => {
        setPhase2(payload);
        if (!payload) setError("Metric ranking is not on disk yet. Run the ranking command from this project.");
      })
      .catch(() => setError("Could not load the metric matrix."));
  }, []);

  const rows = useMemo(() => {
    if (!phase2) return [];
    return phase2.matrix.ranking.filter((row) => (node === "all" ? true : row.metricNode === node));
  }, [phase2, node]);

  if (error) {
    return (
      <>
        <h1 className="page-title">Metric</h1>
        <p className="page-lede">{error}</p>
      </>
    );
  }

  if (!phase2) {
    return <p className="boot">Loading metric breakdown…</p>;
  }

  const { nomination, matrix } = phase2;
  const nominatedCover = LIBRARY.find((photo) => photo.id === COVER[nomination.opportunityId]) ?? LIBRARY[0];
  const nominatedTask = TASKS.find((task) => nomination.mvpTaskIds.includes(task.id));
  const selected = matrix.ranking.find((row) => row.themeId === (openId ?? nomination.opportunityId));
  const selectedCover = LIBRARY.find((photo) => photo.id === COVER[selected?.themeId ?? ""]) ?? nominatedCover;
  const primary = matrix.nodes.find((item) => item.primary);

  return (
    <>
      <h1 className="page-title">Metric</h1>
      <p className="page-lede">
        Successful retrieval of a photo someone remembers but cannot precisely describe. Broken into the
        behaviors that have to work. Filled from Discovery — not guessed.
      </p>

      <section className="formula-card">
        <span>North-star</span>
        <p>
          Users who find the intended photo on a vague-memory task
          <br />
          ÷ users who start a search with incomplete memory of that photo
        </p>
        <p>Keyword search is the baseline. This is not generic search CTR.</p>
      </section>

      <h2 className="day-title">What must change</h2>
      <div className="metric-funnel">
        {matrix.nodes.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`${item.primary ? "primary-node" : ""} ${node === item.id ? "on" : ""}`}
            onClick={() => setNode(item.id)}
          >
            <b>{item.id}</b>
            <span>{item.userBehavior}</span>
            <em>{item.failureQuestion}</em>
            <small>
              {item.subMetric} · {item.opportunities.length} opportunities
              {item.primary ? " · nominated node" : ""}
            </small>
          </button>
        ))}
      </div>

      {primary && (
        <section className="memory-hero metric-hero" onClick={() => setOpenId(nomination.opportunityId)}>
          <PhotoImg src={nominatedCover.src} alt={nominatedCover.alt} />
          <div>
            <span>Nominated for interviews — not a problem lock</span>
            <h2>{nomination.label}</h2>
            <p>
              {nomination.metricNode} · {nomination.segmentLabel}
              {nomination.readyForPhase3 ? " · ready for research" : " · blocked until Discovery is ready"}
            </p>
            <p>{nomination.hypothesis}</p>
            <p>{nomination.interviewFocus}</p>
            <div className="chips">
              {nominatedTask && (
                <button
                  type="button"
                  className="primary"
                  onClick={(event) => {
                    event.stopPropagation();
                    onTryTask(nominatedTask.id);
                  }}
                >
                  Try this task
                </button>
              )}
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onRemember();
                }}
              >
                Open Remember
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onOpenDiscovery();
                }}
              >
                Back to Discovery
              </button>
              <a
                className="primary"
                href={RESEARCH_FORM_URL}
                target="_blank"
                rel="noreferrer"
                onClick={(event) => event.stopPropagation()}
              >
                Recruit trip rememberers
              </a>
              <a
                className="text-btn"
                href={RESEARCH_FORM_RESPONSES_URL}
                target="_blank"
                rel="noreferrer"
                onClick={(event) => event.stopPropagation()}
              >
                Responses
              </a>
            </div>
          </div>
        </section>
      )}

      <div className="chips">
        <button type="button" className={node === "all" ? "on" : ""} onClick={() => setNode("all")}>
          All nodes
        </button>
        {matrix.nodes.map((item) => (
          <button
            key={item.id}
            type="button"
            className={node === item.id ? "on" : item.primary ? "chip-link on" : ""}
            onClick={() => setNode(item.id)}
          >
            {item.id}
            {item.primary ? " · bet" : ""}
          </button>
        ))}
      </div>

      <div className="albums collections-grid">
        {rows.map((row) => {
          const cover = LIBRARY.find((photo) => photo.id === COVER[row.themeId]) ?? LIBRARY[0];
          const nominated = row.themeId === nomination.opportunityId;
          return (
            <button
              key={row.themeId}
              className={`album collection-card ${nominated ? "nominated" : ""} ${row.genericSearchFlag ? "excluded" : ""}`}
              type="button"
              onClick={() => setOpenId(row.themeId)}
            >
              <PhotoImg src={cover.src} alt={cover.alt} />
              <span>
                <b>
                  #{row.rank} {row.label}
                </b>
                {row.metricNode} · score {row.score}
                {nominated ? " · nominated" : ""}
                {row.genericSearchFlag ? " · not the MVP" : ""}
              </span>
            </button>
          );
        })}
      </div>

      {selected && (
        <aside className="theme-detail">
          <div className="theme-detail-cover">
            <PhotoImg src={selectedCover.src} alt="" />
          </div>
          <div>
            <h2>
              #{selected.rank} {selected.label}
            </h2>
            <p>
              {selected.metricNode} · impact {selected.impactOnRetrieval} · frequency{" "}
              {Math.round(selected.estimatedFrequency * 100)}%
            </p>
            {selected.themeId === nomination.opportunityId ? (
              <p>{nomination.interviewFocus}</p>
            ) : (
              <p>
                {nomination.rejectedAlternatives.find((row) => row.id === selected.themeId)?.reason ??
                  "Compared, not nominated."}
              </p>
            )}
            {selected.genericSearchFlag && <p>Excluded: generic search ranking / indexing. Not the north-star.</p>}
          </div>
        </aside>
      )}

      <h2 className="day-title">Why the other nodes lost</h2>
      <div className="reject-list">
        {nomination.rejectedAlternatives.map((row) => (
          <article key={row.id}>
            <b>{row.id}</b>
            <p>{row.reason}</p>
          </article>
        ))}
      </div>
    </>
  );
}
