import type { SegmentContract } from "./types";

/** Drafted here; Phase 5 implements eligibility. `locked` is true only after the tree proceeds or forks. */
export const SEGMENT_CONTRACT_ID = "S2" as const;

export function assertSegmentContract(contract: SegmentContract): SegmentContract {
  if (contract.code !== SEGMENT_CONTRACT_ID) {
    throw new Error(`Expected segment ${SEGMENT_CONTRACT_ID}, got ${contract.code}`);
  }
  if (contract.locked && contract.mvpTaskIds.length === 0) {
    throw new Error("A locked segment contract must name MVP tasks.");
  }
  return contract;
}
