import { elicit, type ElicitTurn } from "./elicit";
import { emptyQuery, parseMemoryClue, type MemoryQuery } from "./memoryQuery";

export async function converseClue(
  clue: string,
  questionsAsked: number,
  previous?: MemoryQuery,
  taskId?: string
): Promise<{ query: MemoryQuery; turn: ElicitTurn; provider: string }> {
  const local = parseMemoryClue(clue, previous ?? emptyQuery());
  try {
    const res = await fetch("/api/retrieve/converse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clue, questionsAsked, previous, taskId }),
      signal: AbortSignal.timeout(14_000)
    });
    if (!res.ok) return { query: local, turn: elicit(local, questionsAsked), provider: "rule-based" };
    const data = (await res.json()) as { query?: MemoryQuery; turn?: ElicitTurn; provider?: string };
    const query = data.query ?? local;
    return {
      query,
      turn: data.turn ?? elicit(query, questionsAsked),
      provider: typeof data.provider === "string" ? data.provider : "rule-based"
    };
  } catch {
    return { query: local, turn: elicit(local, questionsAsked), provider: "rule-based" };
  }
}
