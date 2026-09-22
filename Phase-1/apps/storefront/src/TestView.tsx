import { FormEvent, useEffect, useState } from "react";
import { TASKS } from "./data/tasks";
import { track } from "./lib/events";
import { loadPhase6, saveTestSession, type Phase6Payload } from "./lib/phase6";
import { LOCKED_SEGMENT } from "./lib/segment";

export function TestView({
  taskId,
  onBaseline,
  onRemember
}: {
  taskId?: string;
  onBaseline: (taskId: string) => void;
  onRemember: (taskId: string) => void;
}) {
  const hero = TASKS.filter((task) => LOCKED_SEGMENT.mvpTaskIds.includes(task.id));
  const extra = TASKS.filter((task) => task.segmentCode === "S2" && !task.control && !LOCKED_SEGMENT.mvpTaskIds.includes(task.id));
  const options = [...hero, ...extra];
  const [data, setData] = useState<Phase6Payload | null>(null);
  const [task, setTask] = useState(
    taskId && options.some((item) => item.id === taskId) ? taskId : LOCKED_SEGMENT.mvpTaskIds[0]
  );
  const [inSegment, setInSegment] = useState(true);
  const [baselineAttempted, setBaselineAttempted] = useState(false);
  const [baselineOutcome, setBaselineOutcome] = useState("miss");
  const [mvpAttempted, setMvpAttempted] = useState(false);
  const [mvpOutcome, setMvpOutcome] = useState("miss");
  const [unassisted, setUnassisted] = useState(true);
  const [hinted, setHinted] = useState(false);
  const [nextIteration, setNextIteration] = useState("");
  const [cues, setCues] = useState("");
  const [questionsHelped, setQuestionsHelped] = useState("");
  const [questionsAnnoyed, setQuestionsAnnoyed] = useState("");
  const [timeToTarget, setTimeToTarget] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    loadPhase6()
      .then(setData)
      .catch(() => setData(null));
  }, [status]);

  const census = data?.report.census;
  const selected = TASKS.find((item) => item.id === task);
  const counted = (data?.report.sessions ?? []).filter((row) => row.counted);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const result = await saveTestSession({
      inSegment,
      taskId: task,
      representative: true,
      baselineAttempted,
      baselineOutcome,
      mvpAttempted,
      mvpOutcome,
      unassisted,
      hinted,
      nextIteration,
      cuesUsed: cues,
      questionsHelped,
      questionsAnnoyed,
      timeToTarget
    });
    setStatus(
      result.ok
        ? result.counted
          ? "Session saved and counted toward n."
          : "Session saved but not counted — confirm they are a trip rememberer, ran Search then Remember, and named one change."
        : result.error ?? "Could not save."
    );
    if (result.ok) setNextIteration("");
  }

  return (
    <>
      <h1 className="page-title">Test</h1>
      <p className="page-lede">
        Return to a trip rememberer. Keyword Search first, then Remember. Prototype library — not their Google
        Photos. Counted {census?.counted ?? 0} of 3.
      </p>

      <section className="formula-card">
        <span>{data?.report.complete ? "Return tests complete" : "Return tests incomplete"}</span>
        <p>{data?.report.learnings.status ?? "Run `npm run phase6:synthesize` after you save a session."}</p>
      </section>

      <h2 className="day-title">Run the protocol</h2>
      <ol className="protocol-steps">
        <li>Confirm they still match: trip vibe, date or town gone. Not a screenshot, medicine pack, or known date.</li>
        <li>
          Baseline:{" "}
          <button
            type="button"
            onClick={() => {
              setBaselineAttempted(true);
              track("task_started", { taskId: task, surface: "test" });
              onBaseline(task);
            }}
          >
            Open keyword Search
          </button>
        </li>
        <li>
          Remember:{" "}
          <button
            type="button"
            className="primary"
            onClick={() => {
              setMvpAttempted(true);
              track("task_started", { taskId: task, surface: "test" });
              onRemember(task);
            }}
          >
            Open Remember
          </button>
        </li>
        <li>No hints unless they are stuck — then it is not unassisted success. Write one next-iteration change.</li>
      </ol>
      <p className="hint">
        Task: {selected?.prompt} You remember {selected?.remembered}. Forgot {selected?.forgotten}. Closest seed
        if the original photo cannot be used.
      </p>

      <form className="collect-form" onSubmit={onSubmit}>
        <label>
          Seed task
          <select value={task} onChange={(event) => setTask(event.target.value)}>
            {options.map((item) => (
              <option key={item.id} value={item.id}>
                {item.prompt}
              </option>
            ))}
          </select>
        </label>
        <div className="collect-meta">
          <label>
            Baseline
            <select value={baselineOutcome} onChange={(event) => setBaselineOutcome(event.target.value)}>
              <option value="success">Success</option>
              <option value="miss">Miss</option>
              <option value="abandoned">Abandoned</option>
            </select>
          </label>
          <label>
            Remember
            <select value={mvpOutcome} onChange={(event) => setMvpOutcome(event.target.value)}>
              <option value="success">Success</option>
              <option value="miss">Miss</option>
              <option value="abandoned">Abandoned</option>
            </select>
          </label>
        </div>
        <label>
          <input type="checkbox" checked={inSegment} onChange={(event) => setInSegment(event.target.checked)} /> Trip
          rememberer
        </label>
        <label>
          <input
            type="checkbox"
            checked={baselineAttempted}
            onChange={(event) => setBaselineAttempted(event.target.checked)}
          />{" "}
          Keyword baseline attempted
        </label>
        <label>
          <input type="checkbox" checked={mvpAttempted} onChange={(event) => setMvpAttempted(event.target.checked)} />{" "}
          Remember attempted
        </label>
        <label>
          <input type="checkbox" checked={unassisted} onChange={(event) => setUnassisted(event.target.checked)} />{" "}
          Unassisted
        </label>
        <label>
          <input
            type="checkbox"
            checked={hinted}
            onChange={(event) => {
              setHinted(event.target.checked);
              if (event.target.checked) setUnassisted(false);
            }}
          />{" "}
          I hinted (does not count as success)
        </label>
        <label>
          Cues they used
          <textarea value={cues} onChange={(event) => setCues(event.target.value)} rows={2} />
        </label>
        <label>
          Question that helped / annoyed
          <textarea
            value={questionsHelped}
            onChange={(event) => setQuestionsHelped(event.target.value)}
            rows={2}
            placeholder="Helped"
          />
        </label>
        <label>
          <textarea
            value={questionsAnnoyed}
            onChange={(event) => setQuestionsAnnoyed(event.target.value)}
            rows={2}
            placeholder="Annoyed — or none asked"
          />
        </label>
        <label>
          Time to open target
          <input
            value={timeToTarget}
            onChange={(event) => setTimeToTarget(event.target.value)}
            placeholder="Seconds, or not timed"
          />
        </label>
        <label>
          One change for the next person (required to count)
          <textarea value={nextIteration} onChange={(event) => setNextIteration(event.target.value)} rows={2} required />
        </label>
        <div className="chips">
          <button type="submit" className="primary">
            Save session
          </button>
        </div>
        {status && <p className="hint">{status}</p>}
      </form>

      {counted.length > 0 && (
        <>
          <h2 className="day-title">Counted sessions</h2>
          <div className="reject-list">
            {counted.map((row) => (
              <article key={row.id}>
                <b>
                  {row.id} · {row.taskId}
                </b>
                <p>
                  Keyword {row.baselineOutcome}. Remember {row.mvpOutcome}
                  {row.representative ? " · representative" : ""}. Next: {row.nextIteration}
                </p>
              </article>
            ))}
          </div>
        </>
      )}

      <h2 className="day-title">What to change next</h2>
      <div className="reject-list">
        {(data?.report.learnings.changeNext ?? []).map((row) => (
          <article key={row}>
            <p>{row}</p>
          </article>
        ))}
      </div>

      <h2 className="day-title">Gates</h2>
      <div className="reject-list">
        {(data?.report.gates ?? []).map((gate) => (
          <article key={gate.id}>
            <b>
              {gate.pass ? "Pass" : "Hold"} · {gate.id}
            </b>
            <p>{gate.detail}</p>
          </article>
        ))}
      </div>
    </>
  );
}
