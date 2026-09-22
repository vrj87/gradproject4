import { useEffect, useMemo, useState } from "react";
import { dashboardStats } from "./lib/events";
import { loadPhase6, type Phase6Payload } from "./lib/phase6";

function pct(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function SuccessView({ onOpenTest, onOpenDashboard }: { onOpenTest: () => void; onOpenDashboard: () => void }) {
  const [data, setData] = useState<Phase6Payload | null>(null);
  const stats = useMemo(() => dashboardStats(), []);

  useEffect(() => {
    loadPhase6().then(setData).catch(() => setData(null));
  }, []);

  const proxy: Record<string, string> = {
    "north-star": pct(stats.successRate),
    formulate: String(stats.formulated),
    retrieve: String(stats.targetInView),
    recognize: String(stats.opened),
    refine: String(stats.refined)
  };

  return (
    <>
      <h1 className="page-title">Success</h1>
      <p className="page-lede">
        Metrics for Remember — the path we actually shipped. Numbers from this browser are prototypes, not
        Google Photos production telemetry.
      </p>
      <section className="formula-card">
        <span>{data?.report.complete ? "Study rates unlocked" : "Study rates wait on return tests"}</span>
        <p>
          This browser: {stats.success} recognized / {stats.started} started ({pct(stats.successRate)}). Divide-by-zero
          safe. Control date task is a Search guardrail, not in this rate.
        </p>
      </section>
      <div className="question-list">
        {(data?.metrics ?? []).map((metric) => (
          <article key={metric.id} className="question-card">
            <h2>
              {metric.layer}: {metric.name}
            </h2>
            <p>
              <b>Definition.</b> {metric.definition}
            </p>
            <p>
              <b>Rationale.</b> {metric.rationale}
            </p>
            <p className="hint">
              Source: {metric.source}
              {proxy[metric.id] ? ` · this browser: ${proxy[metric.id]}` : ""}
            </p>
          </article>
        ))}
      </div>
      <div className="chips">
        <button type="button" className="primary" onClick={onOpenDashboard}>
          Funnel
        </button>
        <button type="button" onClick={onOpenTest}>
          Run a test session
        </button>
      </div>
    </>
  );
}

export function RisksView({ onOpenMvp }: { onOpenMvp: () => void }) {
  const [data, setData] = useState<Phase6Payload | null>(null);
  useEffect(() => {
    loadPhase6().then(setData).catch(() => setData(null));
  }, []);

  return (
    <>
      <h1 className="page-title">Risks</h1>
      <p className="page-lede">
        Why Remember can fail — vibe language, not a generic model warning. Three risks, each with a next step.
      </p>
      <div className="question-list">
        {(data?.risks ?? []).map((risk) => (
          <article key={risk.id} className="question-card">
            <h2>{risk.risk}</h2>
            <p>
              <b>Why.</b> {risk.why}
            </p>
            <p>
              <b>Mitigation.</b> {risk.mitigation}
            </p>
          </article>
        ))}
      </div>
      <div className="chips">
        <button type="button" className="primary" onClick={onOpenMvp}>
          Try Remember
        </button>
      </div>
    </>
  );
}

