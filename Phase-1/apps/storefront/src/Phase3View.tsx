import { useEffect, useState } from "react";
import { RESEARCH_FORM_RESPONSES_URL, RESEARCH_FORM_URL } from "./lib/discoveryEngine";
import { loadPhase3, type Phase3Payload } from "./lib/phase3";

export function Phase3View({
  onOpenProblem,
  onOpenTest
}: {
  onOpenProblem: () => void;
  onOpenTest: () => void;
}) {
  const [data, setData] = useState<Phase3Payload | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    loadPhase3()
      .then((payload) => {
        setData(payload);
        if (!payload) setError("Run `npm run phase3:synthesize` from the repo root.");
      })
      .catch(() => setError("Could not load research."));
  }, []);

  if (error) {
    return (
      <>
        <h1 className="page-title">Research</h1>
        <p className="page-lede">{error}</p>
      </>
    );
  }
  if (!data) return <p className="boot">Loading research…</p>;

  const n = data.census.inSegmentCount;

  return (
    <>
      <h1 className="page-title">Research</h1>
      <p className="page-lede">{data.synthesis}</p>

      <section className="formula-card">
        <span>{data.complete ? "Research complete" : "Research incomplete"}</span>
        <p>
          {n} of 5 trip rememberers. Distinct retrieval tasks: {data.census.taskCount}. First break:{" "}
          {data.firstBreakNode}.
        </p>
      </section>

      <h2 className="day-title">The six recoveries</h2>
      <p className="hint">
        Each note needs a concrete task, what they remembered vs forgot, the query, results, the workaround, and
        what would make the photo recognizable. Query typed and result grid were not on the form — labeled, not
        invented.
      </p>

      <h2 className="day-title">Counted notes</h2>
      <div className="question-list">
        {data.notes
          .filter((note) => note.inSegment)
          .map((note) => (
            <article key={note.id} className="question-card">
              <h2>
                {note.id} · {note.phase6Seed}
              </h2>
              <p>
                <b>Task.</b> {note.retrievalTask}
              </p>
              <p>
                <b>Remembered / forgotten.</b> {note.remembered} / {note.forgotten}
              </p>
              <p>
                <b>Query typed.</b> {note.queryTyped}
              </p>
              <p>
                <b>Photos returned.</b> {note.photosReturned}
              </p>
              <p>
                <b>Workaround.</b> {note.workaround}
              </p>
              <p>
                <b>Recognizable if.</b> {note.recognizableIf}
              </p>
            </article>
          ))}
      </div>

      <h2 className="day-title">Demo tasks</h2>
      <p className="hint">{data.tasks.join(" · ")}</p>

      <h2 className="day-title">Validation matrix</h2>
      <div className="reject-list">
        {data.matrix.map((row) => (
          <article key={row.themeId}>
            <b>
              {row.status} · {row.themeId}
            </b>
            <p>{row.note}</p>
          </article>
        ))}
      </div>

      <h2 className="day-title">Gates</h2>
      <div className="reject-list">
        {data.gates.map((gate) => (
          <article key={gate.id}>
            <b>
              {gate.pass ? "Pass" : "Hold"} · {gate.id}
            </b>
            <p>{gate.detail}</p>
          </article>
        ))}
      </div>

      <div className="chips">
        <a className="primary" href={RESEARCH_FORM_URL} target="_blank" rel="noreferrer">
          Open form
        </a>
        <a className="text-btn" href={RESEARCH_FORM_RESPONSES_URL} target="_blank" rel="noreferrer">
          Responses
        </a>
        <button type="button" onClick={onOpenProblem}>
          Problem lock
        </button>
        <button type="button" onClick={onOpenTest}>
          Return test
        </button>
      </div>
    </>
  );
}
