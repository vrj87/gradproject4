import type { RetrievalTask } from "../data/tasks";

/** Phase 4 lock implemented here (architecture: eligibility drafted in Phase 4, coded in Phase 5). */
export const LOCKED_SEGMENT = {
  code: "S2" as const,
  label: "Trip / event rememberer",
  locked: true,
  node: "understand" as const,
  mvpTaskIds: ["task-goa-cafe", "task-goa-trip", "task-concert-lights", "task-houseboat"],
  controlTaskId: "task-control-date",
  job: "Accept place-vibe language so trip rememberers can retrieve a photo they still picture but cannot date or name."
};

export function isHeroTask(taskId: string): boolean {
  return LOCKED_SEGMENT.mvpTaskIds.includes(taskId);
}

export function isControlTask(taskId: string): boolean {
  return taskId === LOCKED_SEGMENT.controlTaskId;
}

export function isLockedSegmentTask(task: RetrievalTask): boolean {
  return task.segmentCode === LOCKED_SEGMENT.code && !task.control;
}

export function rememberAllowed(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("optout") === "1") return false;
    return window.localStorage.getItem("photos-opt-out") !== "1";
  } catch {
    return true;
  }
}
