export type EventName =
  | "task_started"
  | "clue_submitted"
  | "cue_answered"
  | "search_run"
  | "target_shown"
  | "photo_opened"
  | "task_success"
  | "task_abandoned"
  | "refine_used";

export interface RetrievalEvent {
  name: EventName;
  at: string;
  taskId?: string;
  photoId?: string;
  sessionId?: string;
  surface?: "keywords" | "remember" | "test";
}

const KEY = "photos-mvp-events";

export function track(name: EventName, extra: Partial<RetrievalEvent> = {}): void {
  try {
    const event: RetrievalEvent = { name, at: new Date().toISOString(), ...extra };
    const all = loadEvents();
    all.push(event);
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* private mode / quota — retrieval must still run */
  }
}

export function loadEvents(): RetrievalEvent[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as RetrievalEvent[];
  } catch {
    return [];
  }
}

export function clearEvents(): void {
  localStorage.removeItem(KEY);
}

export function dashboardStats() {
  const events = loadEvents();
  const vague = (event: RetrievalEvent) => event.taskId !== "task-control-date";
  const started = events.filter((event) => event.name === "task_started" && vague(event)).length;
  const formulated = events.filter((event) => event.name === "clue_submitted" && vague(event)).length;
  const targetInView = events.filter((event) => event.name === "target_shown" && vague(event)).length;
  const success = events.filter((event) => event.name === "task_success" && vague(event)).length;
  const refined = events.filter((event) => event.name === "refine_used" && vague(event)).length;
  const opened = events.filter((event) => event.name === "photo_opened" && vague(event)).length;
  const denom = Math.max(started, 1);
  return {
    started,
    formulated,
    targetInView,
    success,
    refined,
    opened,
    formulateRate: formulated / denom,
    successRate: success / denom
  };
}
