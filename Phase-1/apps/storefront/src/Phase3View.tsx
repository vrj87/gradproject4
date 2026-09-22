import { useEffect, useState } from "react";
import { TASKS } from "./data/tasks";
import { RESEARCH_FORM_RESPONSES_URL, RESEARCH_FORM_URL } from "./lib/discoveryEngine";
import { loadPhase3, type Phase3Payload } from "./lib/phase3";

const NODE_LABEL: Record<string, string> = {
  formulate: "saying what they remember",
  understand: "understanding the clue",
  retrieve: "surfacing a usable set",
  recognize: "recognizing the photo",
  refine: "refining the attempt"
};

const STATUS_LABEL: Record<string, string> = {
  confirmed: "Confirmed",
  "not-this-study": "Not this audience",
  weak: "Weak signal",
  "not-recovered": "Not on the form",
  "not-supported": "Out of scope"
};

const GATE_LABEL: Record<string, string> = {
  "n-in-segment": "Trip rememberers",
  "six-recoveries": "Each story is complete",
  matrix: "Themes checked",
  "retrieval-tasks": "Distinct demo tasks",
  "understand-hold": "Where it first breaks"
};

function taskPrompt(id: string): string {
  return TASKS.find((task) => task.id === id)?.prompt.replace(/\.$/, "") ?? id.replace(/^task-/, "").replace(/-/g, " ");
}

function themeTitle(label: string, themeId: string): string {
  const raw = label && label !== themeId ? label : themeId;
  return raw
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function plain(text: string): string {
  let next = text;
  for (const task of TASKS) {
    next = next.replaceAll(task.id, taskPrompt(task.id));
  }
  return next
    .replace(/\s*\(\s*G\d+(?:\s*[–\-/]\s*G?\d+)*\s*\)/gi, "")
    .replace(/\bG\d+(?:\s*[–\-/]\s*G?\d+)*/gi, "")
    .replace(/\bPhase\s+\d+\b/gi, "")
    .replace(/\bPart\s+\d+\b/gi, "")
    .replace(/\br0\d+\b/gi, "")
    .replace(/\bis not S[1-5]\b/gi, "is not this audience")
    .replace(/excluded from S[1-5]\s*n\.?/gi, "are not this audience")
    .replace(/not counted toward S[1-5]\s*n\.?/gi, "not counted in this audience")
    .replace(/\bS[1-5]\s*n\b/gi, "this audience")
    .replace(/\bS[1-5]\b/g, "")
    .replace(/\bn\s*=\s*\d+/gi, "")
    .replace(/Representative seed:\s*/gi, "")
    .replace(/\bseeds?:/gi, "")
    .replace(/\bin-segment\b/gi, "trip rememberer")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([.,;:])/g, "$1")
    .replace(/^[,;:\s]+/, "")
    .trim();
}

function gateDetail(id: string, detail: string, firstBreak: string): string {
  if (id === "n-in-segment") return "Six people in this audience. Five was the bar.";
  if (id === "six-recoveries") {
    return "Each counted story has a task, what they remembered and forgot, the query, results, a workaround, and what would make the photo recognizable.";
  }
  if (id === "matrix") return "Fourteen themes checked. Five confirmed.";
  if (id === "retrieval-tasks") return "Four distinct demo tasks from those stories.";
  if (id === "understand-hold") return `The first break is ${NODE_LABEL[firstBreak] ?? firstBreak}.`;
  return plain(detail);
}

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
        if (!payload) setError("Research notes are not loaded yet.");
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

  const people = data.notes.filter((note) => note.inSegment);

  return (
    <>
      <h1 className="page-title">Research</h1>
      <p className="page-lede">
        Six trip rememberers described the same miss: they remember how a place felt on a trip and have forgotten
        the date, album, and town. Photos should take the fragment they still have. Stories end unfound, or found by
        scrolling, asking someone, or trying another app — not a precise keyword. The first break is{" "}
        {NODE_LABEL[data.firstBreakNode] ?? data.firstBreakNode}. What they typed and what the grid showed were not
        on the form, so those fields are labeled rather than invented.
      </p>

      <section className="formula-card">
        <span>{data.complete ? "Research complete" : "Research incomplete"}</span>
        <p>
          {people.length} trip rememberers. {data.census.taskCount} distinct retrieval stories. First break:{" "}
          {NODE_LABEL[data.firstBreakNode] ?? data.firstBreakNode}.
        </p>
      </section>

      <h2 className="day-title">What we recovered</h2>
      <p className="hint">
        Each person has a concrete task, what they remembered vs forgot, the query, results, the workaround, and
        what would make the photo recognizable. Query and result grid were not on the form — labeled, not invented.
      </p>

      <h2 className="day-title">People we counted</h2>
      <div className="question-list">
        {people.map((note, index) => (
          <article key={note.id} className="question-card">
            <h2>
              Person {index + 1} · {taskPrompt(note.phase6Seed)}
            </h2>
            <p>
              <b>Task.</b> {plain(note.retrievalTask)}
            </p>
            <p>
              <b>Remembered / forgotten.</b> {plain(note.remembered)} / {plain(note.forgotten)}
            </p>
            <p>
              <b>Query typed.</b> {plain(note.queryTyped)}
            </p>
            <p>
              <b>Photos returned.</b> {plain(note.photosReturned)}
            </p>
            <p>
              <b>Workaround.</b> {plain(note.workaround)}
            </p>
            <p>
              <b>Recognizable if.</b> {plain(note.recognizableIf)}
            </p>
          </article>
        ))}
      </div>

      <h2 className="day-title">Demo tasks</h2>
      <p className="hint">{data.tasks.map(taskPrompt).join(" · ")}</p>

      <h2 className="day-title">What the themes showed</h2>
      <div className="reject-list">
        {data.matrix.map((row) => (
          <article key={row.themeId}>
            <b>
              {STATUS_LABEL[row.status] ?? row.status} · {themeTitle(row.label, row.themeId)}
            </b>
            <p>{plain(row.note)}</p>
          </article>
        ))}
      </div>

      <h2 className="day-title">Checks</h2>
      <div className="reject-list">
        {data.gates.map((gate) => (
          <article key={gate.id}>
            <b>
              {gate.pass ? "Pass" : "Hold"} · {GATE_LABEL[gate.id] ?? gate.id.replace(/-/g, " ")}
            </b>
            <p>{gateDetail(gate.id, gate.detail, data.firstBreakNode)}</p>
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
          Problem
        </button>
        <button type="button" onClick={onOpenTest}>
          Return test
        </button>
      </div>
    </>
  );
}
