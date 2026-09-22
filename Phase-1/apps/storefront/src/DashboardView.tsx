import { useMemo, useState } from "react";
import { clearEvents, dashboardStats, loadEvents } from "./lib/events";

export function DashboardView({
  onOpenMvp,
  onOpenSuccess
}: {
  onOpenMvp: () => void;
  onOpenSuccess?: () => void;
}) {
  const [tick, setTick] = useState(0);
  const stats = useMemo(() => dashboardStats(), [tick]);
  const recent = useMemo(() => loadEvents().slice(-12).reverse(), [tick]);

  return (
    <>
      <h1 className="page-title">Dashboard</h1>
      <p className="page-lede">
        Prototype funnel for this library — not Google Photos production telemetry. Refresh after you attempt a
        playground task.
      </p>
      <div className="stat-row">
        <Stat label="Tasks started" value={String(stats.started)} />
        <Stat label="Clues submitted" value={String(stats.formulated)} />
        <Stat label="Target in view" value={String(stats.targetInView)} />
        <Stat label="That’s the one" value={String(stats.success)} />
      </div>
      <div className="metric-funnel dashboard-funnel">
        <FunnelStep id="started" label="Started" value={stats.started} />
        <FunnelStep id="formulated" label="Formulated" value={stats.formulated} />
        <FunnelStep id="shown" label="Target shown" value={stats.targetInView} />
        <FunnelStep id="opened" label="Photo opened" value={stats.opened} />
        <FunnelStep id="success" label="Recognized" value={stats.success} />
      </div>
      <p className="hint">
        Refine used {stats.refined} times. Success rate {Math.round(stats.successRate * 100)}% of started tasks
        (divide-by-zero safe).
      </p>
      <div className="chips">
        <button type="button" className="primary" onClick={onOpenMvp}>
          Attempt a task
        </button>
        {onOpenSuccess && (
          <button type="button" onClick={onOpenSuccess}>
            Success metrics
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            setTick((value) => value + 1);
          }}
        >
          Refresh
        </button>
        <button
          type="button"
          onClick={() => {
            clearEvents();
            setTick((value) => value + 1);
          }}
        >
          Clear local events
        </button>
      </div>
      {recent.length > 0 && (
        <>
          <h2 className="day-title">Recent events</h2>
          <div className="reject-list">
            {recent.map((event, index) => (
              <article key={`${event.at}-${index}`}>
                <b>{event.name}</b>
                <p>
                  {event.taskId ?? "no task"} · {new Date(event.at).toLocaleTimeString()}
                </p>
              </article>
            ))}
          </div>
        </>
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

function FunnelStep({ id, label, value }: { id: string; label: string; value: number }) {
  return (
    <button type="button" className={value > 0 ? "on" : ""}>
      <b>{id}</b>
      <span>{label}</span>
      <small>{value}</small>
    </button>
  );
}
