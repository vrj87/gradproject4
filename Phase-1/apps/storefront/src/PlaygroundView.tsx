import { TASKS } from "./data/tasks";
import { isControlTask, isLockedSegmentTask, LOCKED_SEGMENT } from "./lib/segment";

export function PlaygroundView({
  onRememberTask,
  onKeywordTask,
  onTestTask
}: {
  onRememberTask: (taskId: string) => void;
  onKeywordTask: (clue: string) => void;
  onTestTask?: (taskId: string) => void;
}) {
  const primary = TASKS.filter((task) => isLockedSegmentTask(task));
  const control = TASKS.filter((task) => isControlTask(task.id));
  const other = TASKS.filter((task) => !isLockedSegmentTask(task) && !task.control);

  return (
    <>
      <h1 className="page-title">Playground</h1>
      <p className="page-lede">
        Locked job: {LOCKED_SEGMENT.job} Remember is the job. Keyword Search is the baseline to beat. Prototype
        library — not your Google Photos.
      </p>

      <h2 className="day-title">Trip rememberer</h2>
      <div className="task-grid">
        {primary.map((task) => (
          <article key={task.id} className="question-card">
            <h2>{task.prompt}</h2>
            <p>
              Remembers {task.remembered}. Forgot {task.forgotten}.
            </p>
            <div className="chips">
              <button type="button" className="primary" onClick={() => onRememberTask(task.id)}>
                Remember
              </button>
              <button type="button" onClick={() => onKeywordTask(task.starterClue)}>
                Try keywords
              </button>
              {onTestTask && (
                <button type="button" onClick={() => onTestTask(task.id)}>
                  Test this
                </button>
              )}
            </div>
          </article>
        ))}
      </div>

      <h2 className="day-title">Control (known date)</h2>
      <div className="task-grid">
        {control.map((task) => (
          <article key={task.id} className="question-card">
            <h2>{task.prompt}</h2>
            <p>Guardrail — keyword search should still work.</p>
            <div className="chips">
              <button type="button" className="primary" onClick={() => onKeywordTask(task.starterClue)}>
                Search
              </button>
            </div>
          </article>
        ))}
      </div>

      {other.length > 0 && (
        <>
          <h2 className="day-title">Not this study</h2>
          <p className="hint">Object and screenshot tasks exist so the library has near-misses. They are not the lock.</p>
          <div className="task-grid">
            {other.map((task) => (
              <article key={task.id} className="question-card">
                <h2>{task.prompt}</h2>
                <p>
                  {task.persona}
                </p>
                <div className="chips">
                  <button type="button" onClick={() => onRememberTask(task.id)}>
                    Remember
                  </button>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </>
  );
}
