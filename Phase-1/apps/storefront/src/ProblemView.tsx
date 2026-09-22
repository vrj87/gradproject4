import { useEffect, useState } from "react";
import { RESEARCH_FORM_URL } from "./lib/discoveryEngine";
import { loadPhase4, type Phase4Payload } from "./lib/phase4";

export function ProblemView({
  onOpenMvp,
  onOpenMetric,
  onOpenResearch
}: {
  onOpenMvp: () => void;
  onOpenMetric: () => void;
  onOpenResearch: () => void;
}) {
  const [data, setData] = useState<Phase4Payload | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    loadPhase4()
      .then((payload) => {
        setData(payload);
        if (!payload) setError("Run `npm run phase4:lock` from the repo root.");
      })
      .catch(() => setError("Could not load the problem definition."));
  }, []);

  if (error) {
    return (
      <>
        <h1 className="page-title">Problem</h1>
        <p className="page-lede">{error}</p>
      </>
    );
  }
  if (!data) return <p className="boot">Loading problem definition…</p>;

  const { definition, tree } = data;
  const n = tree.interviewCensus.inSegmentCount;

  return (
    <>
      <h1 className="page-title">Problem</h1>
      <p className="page-lede">{definition.rootCause}</p>

      <section className="formula-card">
        <span>{definition.locked ? "Locked" : "Proposed — not locked"}</span>
        <p>{definition.jobStatement}</p>
        <p>
          Verdict `{tree.verdict}` · {tree.lockedNode ?? definition.productOutcome.node}. {n} of 5 trip
          rememberers. Research is the Google Form.
        </p>
      </section>

      <h2 className="day-title">The six fields</h2>
      <div className="question-list">
        <article className="question-card">
          <h2>Target segment</h2>
          <p>
            <b>{definition.targetSegment.label}.</b> {definition.targetSegment.definition}
          </p>
        </article>
        <article className="question-card">
          <h2>Retrieval scenario</h2>
          <p>{definition.retrievalScenario}</p>
        </article>
        <article className="question-card">
          <h2>Product outcome</h2>
          <p>
            <b>{definition.productOutcome.node}</b> — {definition.productOutcome.label}
          </p>
        </article>
        <article className="question-card">
          <h2>Root cause</h2>
          <p>{definition.rootCause}</p>
        </article>
        <article className="question-card">
          <h2>Workarounds</h2>
          <ul>
            {definition.workarounds.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
        <article className="question-card">
          <h2>Why it matters</h2>
          <p>{definition.userValue}</p>
          <p>{definition.businessValue}</p>
        </article>
      </div>

      <h2 className="day-title">How the thinking evolved</h2>
      <div className="workflow-strip problem-chain">
        {definition.evolution.map((row, index) => (
          <article key={row.beat} className="workflow-step">
            <span>{index + 1}</span>
            <h2>{row.beat}</h2>
            <p>{row.whatChanged}</p>
          </article>
        ))}
      </div>

      <h2 className="day-title">Decision tree</h2>
      <div className="reject-list">
        {tree.gates.map((gate) => (
          <article key={gate.id}>
            <b>
              {gate.pass ? "Pass" : "Hold"} · {gate.id}
            </b>
            <p>{gate.detail}</p>
          </article>
        ))}
      </div>
      <p className="hint">{tree.reason ?? tree.wouldProceedIfInterviewsConfirm}</p>

      {definition.evidence.discoveryQuotes.length > 0 && (
        <>
          <h2 className="day-title">Discovery quotes (not interviews)</h2>
          <div className="voice-list">
            {definition.evidence.discoveryQuotes.map((quote) => (
              <article key={quote.reviewId} className="voice-card">
                <p>“{quote.text}”</p>
                <span>
                  {quote.source} · {quote.reviewId}
                </span>
              </article>
            ))}
          </div>
        </>
      )}

      <div className="chips">
        <button type="button" className="primary" onClick={onOpenMvp}>
          Try Remember
        </button>
        <button type="button" onClick={onOpenMetric}>
          Metric breakdown
        </button>
        <button type="button" onClick={onOpenResearch}>
          Research
        </button>
        <a className="text-btn" href={RESEARCH_FORM_URL} target="_blank" rel="noreferrer">
          Research form
        </a>
      </div>
    </>
  );
}
